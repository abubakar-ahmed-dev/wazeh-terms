/**
 * CLI for the programmatic content gate. Offline mode (default): validates a
 * fixture file. `--from-dataset` (Phase 09): reads published records via
 * @sanity/client using SANITY_PROJECT_ID/SANITY_DATASET [+ token].
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';

import { validateContent } from './validate-content.ts';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const defaultFixture = path.join(here, 'fixtures/valid-seed.json');
const arg = process.argv[2];
const fixturePath = arg && !arg.startsWith('--') ? path.resolve(arg) : defaultFixture;

let documents;
if (arg === '--from-dataset') {
  const require_ = createRequire(import.meta.url);
  const { createClient } = require_('@sanity/client');
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET;
  if (!projectId || !dataset) {
    console.error('--from-dataset requires SANITY_PROJECT_ID and SANITY_DATASET');
    process.exit(2);
  }
  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-10-01',
    token: process.env.SANITY_READ_TOKEN,
    useCdn: false,
  });
  documents = await client.fetch(
    '*[_type in ["authority", "sourceDocument", "rule", "contractFieldDefinition", "resolutionNote"]]',
  );
  console.error(`fetched ${documents.length} records from ${projectId}/${dataset}`);
} else {
  documents = JSON.parse(readFileSync(fixturePath, 'utf8'));
  console.error(`validating ${fixturePath}`);
}

const result = validateContent(documents);
for (const finding of result.findings) {
  console.error(`[${finding.code}] ${finding.record}: ${finding.message}`);
}
console.error(result.ok ? 'content gate: PASS' : `content gate: FAIL (${result.findings.length} findings)`);
process.exit(result.ok ? 0 : 1);
