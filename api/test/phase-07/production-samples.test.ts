import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { CASE_IDS, CORPUS_ROOT, loadText, loadTruth } from './truth-schema.test.js';

const DEMO_ROOT = path.resolve(__dirname, '../../../fixtures/samples');

/** Five production demo cases (docs/TESTING.md §1). */
const PRODUCTION_SAMPLES = ['TC-001', 'TC-002', 'TC-012', 'TC-013', 'TC-014'];

describe('production sample set', () => {
  it('is fixed: exactly the five documented demo cases exist in the corpus', () => {
    for (const caseId of PRODUCTION_SAMPLES) {
      expect(CASE_IDS, caseId).toContain(caseId);
    }
  });

  it('every production case carries truth + text + generated documents', () => {
    for (const caseId of PRODUCTION_SAMPLES) {
      const truth = loadTruth(caseId);
      expect(truth.schemaVersion).toBe(1);
      for (const document of truth.documents) {
        expect(existsSync(path.join(CORPUS_ROOT, caseId, document.file)), `${caseId}/${document.file}`).toBe(true);
      }
      expect(existsSync(path.join(CORPUS_ROOT, caseId, 'extracted.json')), `${caseId}/extracted.json`).toBe(true);
    }
  });

  it('TC-002 corpus copy mirrors the preserved demo fixture text exactly', () => {
    const demo = JSON.parse(readFileSync(path.join(DEMO_ROOT, 'TC-002', 'sample-text.json'), 'utf8'));
    const corpus = loadText('TC-002');
    expect(corpus.offer).toEqual(demo.offer);
    expect(corpus.contract).toEqual(demo.contract);
  });

  it('demo fixture PDFs (fixtures/samples/TC-002) still parse as PDFs', () => {
    for (const file of ['sample-offer.pdf', 'sample-contract.pdf']) {
      const bytes = readFileSync(path.join(DEMO_ROOT, 'TC-002', file));
      expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    }
  });

  it('covers the five required demo emphases', () => {
    const emphases: Record<string, (truth: ReturnType<typeof loadTruth>) => boolean> = {
      'TC-001': (truth) => truth.forbiddenFindingCategories.includes('document_mismatch'),
      'TC-002': (truth) => truth.allowedFindingCategories.includes('document_mismatch'),
      'TC-012': (truth) => truth.seededDifferences.some((s) => s.fieldKey === 'recruitment_cost'),
      'TC-013': (truth) => truth.allowedFindingCategories.includes('missing_information'),
      'TC-014': (truth) => truth.documents.length === 1,
    };
    for (const [caseId, matches] of Object.entries(emphases)) {
      expect(matches(loadTruth(caseId)), caseId).toBe(true);
    }
  });
});
