/**
 * Generates `contractFieldDefinition` seed records straight from the code
 * registry (docs/DATABASE_SCHEMA.md §7: code owns semantics; content mirrors
 * display metadata). Output: `content/seed/field-definitions.json`.
 * Run: npm run seed:field-definitions -w api
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { FIELD_DEFINITIONS } from '../../api/src/contracts/field-registry.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(here, '..', 'content', 'seed', 'field-definitions.json');

const reviewedAt = '2026-09-29T00:00:00.000Z';

const records = FIELD_DEFINITIONS.map((field) => ({
  _id: `field.${field.fieldKey}`,
  _type: 'contractFieldDefinition',
  fieldKey: field.fieldKey,
  groupKey: field.groupKey,
  label: field.label,
  valueKind: field.valueKind,
  acceptedLabels: [],
  comparisonStrategyKey: field.comparisonStrategyKey,
  importantIfAbsent: field.importantIfAbsent,
  relatedRuleTopics: [],
  recordStatus: 'current',
  reviewStatus: 'approved',
  reviewedAt,
  reviewerCode: 'owner-1',
  schemaVersion: 1,
}));

writeFileSync(outPath, `${JSON.stringify(records, null, 2)}\n`);
console.log(`wrote ${records.length} contractFieldDefinition records → ${path.relative(process.cwd(), outPath)}`);
