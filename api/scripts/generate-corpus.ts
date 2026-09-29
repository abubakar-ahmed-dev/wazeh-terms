/**
 * Regenerates every corpus case's PDFs and fixture extraction from the
 * authored `sample-text.json` + `truth.json` files (test-path artifacts
 * only — D2). Deterministic: fixed PDF timestamps, text-derived digests.
 */
import { readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCasePdf, buildExtractionFixture, loadCaseText, loadTruth } from '../src/corpus/generator.js';

const CORPUS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../test-corpus');

async function main(): Promise<void> {
  const caseDirs = readdirSync(CORPUS_ROOT)
    .filter((name) => /^TC-\d{3}$/.test(name))
    .sort();
  if (caseDirs.length !== 15) {
    throw new Error(`Expected 15 corpus cases, found ${caseDirs.length}`);
  }

  for (const caseId of caseDirs) {
    const caseDir = path.join(CORPUS_ROOT, caseId);
    const truth = loadTruth(caseDir);
    const text = loadCaseText(caseDir);

    for (const documentTruth of truth.documents) {
      const lines = documentTruth.role === 'offer' ? text.offer : text.contract;
      const pdf = await buildCasePdf(lines);
      writeFileSync(path.join(caseDir, documentTruth.file), pdf);
    }

    const extracted = buildExtractionFixture(truth, text);
    writeFileSync(path.join(caseDir, 'extracted.json'), JSON.stringify(extracted, null, 2) + '\n');
    console.log(`${caseId}: ${truth.documents.map((d) => d.file).join(', ')} + extracted.json`);
  }
}

main().catch((error: Error) => {
  console.error(String(error));
  process.exitCode = 1;
});
