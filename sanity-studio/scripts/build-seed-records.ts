/**
 * Merges the authored seed files + generated field definitions into the
 * single record array the content gate and the import step consume:
 * `content/seed/records.json`. Run: npm run seed:build -w api
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const seedDir = path.join(here, '..', 'content', 'seed');

const files = ['authorities.json', 'sources.json', 'rules.json', 'field-definitions.json'];
const records = files.flatMap((file) =>
  JSON.parse(readFileSync(path.join(seedDir, file), 'utf8')),
);

const outPath = path.join(seedDir, 'records.json');
writeFileSync(outPath, `${JSON.stringify(records, null, 2)}\n`);

const byType = records.reduce<Record<string, number>>((counts, record) => {
  counts[record._type as string] = (counts[record._type as string] ?? 0) + 1;
  return counts;
}, {});
console.log(`wrote ${records.length} records → ${path.relative(process.cwd(), outPath)}`);
console.log(JSON.stringify(byType));
