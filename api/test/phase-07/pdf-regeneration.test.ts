import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildCasePdf, buildExtractionFixture } from '../../src/corpus/generator.js';
import { extractPdfPageTexts } from '../../src/services/evidence/pdf-text.js';
import { normalizeForMatch } from '../../src/services/evidence/matcher.js';
import { CASE_IDS, CORPUS_ROOT, loadText, loadTruth } from './truth-schema.test.js';

describe('deterministic PDF regeneration', () => {
  it('committed PDFs are byte-identical to a fresh generation', async () => {
    for (const caseId of CASE_IDS) {
      const truth = loadTruth(caseId);
      const text = loadText(caseId);
      for (const document of truth.documents) {
        const lines = document.role === 'offer' ? text.offer : text.contract;
        const fresh = await buildCasePdf(lines);
        const committed = readFileSync(path.join(CORPUS_ROOT, caseId, document.file));
        expect(fresh.equals(committed), `${caseId}/${document.file} is stale — rerun npm run generate:corpus`).toBe(true);
      }
    }
  });

  it('committed extracted.json matches the generator output', () => {
    for (const caseId of CASE_IDS) {
      const truth = loadTruth(caseId);
      const text = loadText(caseId);
      const fresh = buildExtractionFixture(truth, text);
      const committed = JSON.parse(readFileSync(path.join(CORPUS_ROOT, caseId, 'extracted.json'), 'utf8'));
      expect(committed, caseId).toEqual(fresh);
    }
  });

  it('every PDF text layer carries its sample-text lines verbatim (normalized)', async () => {
    for (const caseId of CASE_IDS) {
      const truth = loadTruth(caseId);
      const text = loadText(caseId);
      for (const document of truth.documents) {
        const lines = document.role === 'offer' ? text.offer : text.contract;
        const pageTexts = await extractPdfPageTexts(
          readFileSync(path.join(CORPUS_ROOT, caseId, document.file)),
          { maxPages: 15 },
        );
        const flattened = pageTexts.map((page) => page ?? '').join('\n');
        for (const line of lines) {
          if (line.trim() === '') continue;
          expect(
            normalizeForMatch(flattened).includes(normalizeForMatch(line)),
            `${caseId}/${document.file} missing line: ${line}`,
          ).toBe(true);
        }
      }
    }
  });

  it('marks every document as synthetic', () => {
    for (const caseId of CASE_IDS) {
      const text = loadText(caseId);
      for (const role of ['offer', 'contract'] as const) {
        const lines = text[role];
        if (lines.length === 0) continue;
        expect(lines.some((line) => /SYNTHETIC SAMPLE|FICTIONAL/i.test(line)), `${caseId}/${role}`).toBe(true);
      }
    }
  });
});
