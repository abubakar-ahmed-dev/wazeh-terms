/**
 * Draft-import preparation. Sanity strong references require their target to
 * exist as a PUBLISHED document, so a draft-only import (owner authorization:
 * drafts for Studio review, nothing published) uses weak references. The
 * authored seed keeps strong refs as the contract truth; the publish step
 * re-creates the records with strong refs in dependency order.
 *
 * Run: npm run seed:prep-drafts -w api   → content/seed/drafts.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(here, '..', 'content', 'seed', 'records.json');

const weaken = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(weaken);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(record)) {
      out[key] = key === '_ref' && !record._weak ? child : weaken(child);
    }
    if ('_ref' in out) out._weak = true;
    return out;
  }
  return value;
};

const records = JSON.parse(readFileSync(seedPath, 'utf8')) as Array<Record<string, unknown>>;
const drafts = records.map((record) => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    out[key] = key === 'issuer' || key === 'primarySource' || key === 'supersededBy' || key === 'affectedRules' || key === 'affectedSources'
      ? weaken(value)
      : value;
  }
  return out;
});

const outPath = path.join(here, '..', 'content', 'seed', 'drafts.json');
writeFileSync(outPath, `${JSON.stringify(drafts, null, 2)}\n`);
console.log(`wrote ${drafts.length} draft-import records (weak refs) → ${path.relative(process.cwd(), outPath)}`);
