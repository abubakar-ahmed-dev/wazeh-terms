import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { TruthSchema, type Truth } from '../../src/corpus/truth-schema.js';

const CORPUS_ROOT = path.resolve(__dirname, '../../../test-corpus');
export { CORPUS_ROOT };
export const CASE_IDS = readdirSync(CORPUS_ROOT).filter((name) => /^TC-\d{3}$/.test(name)).sort();

export function loadTruth(caseId: string): Truth {
  return TruthSchema.parse(JSON.parse(readFileSync(path.join(CORPUS_ROOT, caseId, 'truth.json'), 'utf8')));
}

export function loadText(caseId: string): { note: string; offer: string[]; contract: string[] } {
  return JSON.parse(readFileSync(path.join(CORPUS_ROOT, caseId, 'sample-text.json'), 'utf8'));
}

describe('corpus truth files', () => {
  it('contains exactly 15 versioned cases', () => {
    expect(CASE_IDS).toHaveLength(15);
    expect(CASE_IDS[0]).toBe('TC-001');
    expect(CASE_IDS[14]).toBe('TC-015');
  });

  it('every truth parses against schema v1', () => {
    for (const caseId of CASE_IDS) {
      const truth = loadTruth(caseId);
      expect(truth.schemaVersion, caseId).toBe(1);
      expect(truth.caseId, caseId).toBe(caseId);
    }
  });

  it('matches the planned distribution', () => {
    const truths = CASE_IDS.map(loadTruth);
    const byCase = new Map(truths.map((truth) => [truth.caseId, truth]));

    // TC-002 is the preserved salary-change pair.
    expect(byCase.get('TC-002')!.seededDifferences.map((s) => s.fieldKey)).toContain('basic_salary');

    // Consistent pairs forbid mismatches entirely.
    for (const consistent of ['TC-001', 'TC-003', 'TC-004', 'TC-005']) {
      expect(byCase.get(consistent)!.forbiddenFindingCategories, consistent).toContain('document_mismatch');
    }
    // Mismatch pairs allow exactly the mismatch category and forbid rule claims.
    for (const mismatch of ['TC-006', 'TC-007', 'TC-008', 'TC-009', 'TC-010', 'TC-011']) {
      const truth = byCase.get(mismatch)!;
      expect(truth.allowedFindingCategories, mismatch).toContain('document_mismatch');
      expect(truth.forbiddenFindingCategories, mismatch).toContain('source_backed_concern');
    }
    // Abstention/emphasis cases. TC-012's no_rule_claims abstention was
    // superseded when the worker-charge rule was approved (Phase 10) and the
    // truth was rebaselined (release-polish WI-4, owner ratification pending).
    expect(byCase.get('TC-012')!.expectedAbstentions).not.toContain('no_rule_claims');
    expect(byCase.get('TC-012')!.allowedFindingCategories).toContain('source_backed_concern');
    expect(byCase.get('TC-013')!.allowedFindingCategories).toContain('missing_information');
    expect(byCase.get('TC-014')!.documents).toHaveLength(1);
    expect(byCase.get('TC-015')!.expectedAbstentions).toContain('instructions_treated_as_data');
  });

  it('restricts rule references to cases allowed source-backed concerns', () => {
    // Approved content exists since Phases 09/10; truth files may cite only
    // approved, revisioned rules, and only where the category is allowed.
    for (const caseId of CASE_IDS) {
      const truth = loadTruth(caseId);
      const sbcAllowed = truth.allowedFindingCategories.includes('source_backed_concern');
      if (!sbcAllowed) {
        expect(truth.requiredRuleRefs, caseId).toEqual([]);
        continue;
      }
      for (const ref of truth.requiredRuleRefs) {
        expect(ref.ruleKey.length, caseId).toBeGreaterThan(0);
        expect(ref.ruleRevision, caseId).toBeGreaterThanOrEqual(1);
      }
    }
    expect(loadTruth('TC-012').requiredRuleRefs).toEqual([
      { ruleKey: 'ae-recruitment-costs-employer-bears', ruleRevision: 1 },
    ]);
  });
});
