/**
 * Dated export + Knowledge Base projection from PUBLISHED records
 * (docs/SOURCES.md §1, docs/DATABASE_SCHEMA.md §9). Reads the published
 * perspective (drafts excluded by design), re-runs the content gate on what
 * it read, then writes:
 *
 *   content/export-<date>.json        full public-safe record export
 *   content/kb-projection-<date>.json minimal approved/current KB input
 *
 * Run (repo root): node sanity-studio/scripts/export-approved.mjs
 * Requires SANITY_PROJECT_ID + SANITY_DATASET; token only if the dataset
 * becomes private (public per owner decision 2026-09-29).
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const { createClient } = require_('@sanity/client');

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET;
if (!projectId || !dataset) {
  console.error('export-approved requires SANITY_PROJECT_ID and SANITY_DATASET');
  process.exit(2);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const { validateContent } = await import('./validate-content.ts');

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-10-01',
  token: process.env.SANITY_READ_TOKEN,
  useCdn: false,
});

const records = await client.fetch(
  '*[_type in ["authority", "sourceDocument", "rule", "contractFieldDefinition", "resolutionNote"]]',
  {},
  { perspective: 'published' },
);
console.error(`fetched ${records.length} published records from ${projectId}/${dataset}`);

const gate = validateContent(records);
for (const finding of gate.findings) {
  console.error(`[${finding.code}] ${finding.record}: ${finding.message}`);
}
if (!gate.ok) {
  console.error(`content gate: FAIL (${gate.findings.length} findings) — export aborted`);
  process.exit(1);
}
console.error('content gate: PASS on published records');

const date = new Date().toISOString().slice(0, 10);
const publicSafe = records.map(({ _rev, _createdAt, _updatedAt, ...rest }) => rest);
const exportPath = path.join(here, '..', 'content', `export-${date}.json`);
writeFileSync(exportPath, `${JSON.stringify(publicSafe, null, 2)}\n`);

const sourceById = new Map(
  publicSafe.filter((record) => record._type === 'sourceDocument').map((record) => [record._id, record]),
);
const projection = publicSafe
  .filter((record) => record.reviewStatus === 'approved' && record.recordStatus === 'current')
  .map((record) => {
    if (record._type === 'rule') {
      const source = sourceById.get(record.primarySource?._ref);
      return {
        recordType: 'rule',
        ruleKey: record.ruleKey,
        revision: record.revision,
        title: record.title,
        claimText: record.claimText,
        topic: record.topic,
        conditions: record.conditions ?? [],
        exceptions: record.exceptions ?? [],
        triggerKey: record.triggerKey ?? null,
        primarySource: source
          ? {
              sourceKey: source.sourceKey,
              versionKey: source.versionKey,
              officialUrl: source.officialUrl,
              evidenceClass: source.evidenceClass,
            }
          : null,
        pinpoint: record.pinpoint,
      };
    }
    return {
      recordType: record._type,
      ...(record.authorityKey ? { authorityKey: record.authorityKey } : {}),
      ...(record.sourceKey
        ? { sourceKey: record.sourceKey, versionKey: record.versionKey, officialUrl: record.officialUrl }
        : {}),
      ...(record.fieldKey
        ? {
            fieldKey: record.fieldKey,
            groupKey: record.groupKey,
            label: record.label,
            valueKind: record.valueKind,
            comparisonStrategyKey: record.comparisonStrategyKey,
            importantIfAbsent: record.importantIfAbsent,
          }
        : {}),
    };
  });
const projectionPath = path.join(here, '..', 'content', `kb-projection-${date}.json`);
writeFileSync(
  projectionPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      basis: `published approved/current records from ${projectId}/${dataset}`,
      counts: projection.reduce((accumulator, record) => {
        accumulator[record.recordType] = (accumulator[record.recordType] ?? 0) + 1;
        return accumulator;
      }, {}),
      records: projection,
    },
    null,
    2,
  )}\n`,
);

console.log(`wrote ${path.relative(process.cwd(), exportPath)} (${publicSafe.length} records)`);
console.log(`wrote ${path.relative(process.cwd(), projectionPath)} (${projection.length} projection entries)`);
