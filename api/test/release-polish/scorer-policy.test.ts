/**
 * Scorer policy tests (release-polish WI-1/WI-4): expectedToDiffer metadata
 * mismatches are policy-exempt (not precision errors, not in the
 * denominator); widened `requiredRuleRefs` truth shape parses; zero-seed
 * truth yields a zero denominator.
 */
import { describe, expect, it } from 'vitest';

import { scoreCase, type CaseRun, type ReportView } from '../../src/corpus/score.js';
import { TruthSchema, type Truth } from '../../src/corpus/truth-schema.js';

function truthFixture(overrides: Partial<Truth> = {}): Truth {
  return {
    schemaVersion: 1,
    caseId: 'TC-001',
    route: { origin: 'PK', destination: 'AE', declaredRegime: 'uae_mainland_private', declaredWorkerCategory: 'non_domestic' },
    documents: [
      { role: 'offer', file: 'offer.pdf', pageCount: 1, readablePages: [1] },
      { role: 'contract', file: 'contract.pdf', pageCount: 1, readablePages: [1] },
    ],
    expectedFields: [],
    seededDifferences: [],
    allowedFindingCategories: ['document_mismatch', 'missing_information'],
    forbiddenFindingCategories: [],
    requiredRuleRefs: [],
    expectedAbstentions: ['no_global_verdict'],
    notes: '',
    ...overrides,
  } as Truth;
}

function baseRun(partial: Partial<CaseRun> & { truth: Truth }): CaseRun {
  return {
    caseId: partial.truth.caseId ?? 'TC-001',
    issued: {
      documents: [
        { role: 'offer', documentId: 'doc_offer', fields: [] },
        { role: 'contract', documentId: 'doc_contract', fields: [] },
      ],
    },
    report: { status: 'complete', findings: [] } as ReportView,
    sampleText: { offer: [], contract: [] },
    timings: { extractionMs: 3000, analysisMs: 4000 },
    ...partial,
  } as CaseRun;
}

function mismatch(fieldKeys: string[]) {
  return {
    category: 'document_mismatch' as const,
    fieldKeys,
    explanation: 'The offer and the contract state different values.',
    documentEvidence: [
      { documentId: 'doc_offer', page: 1, quote: 'Offer line', verification: 'matched_text' },
      { documentId: 'doc_contract', page: 1, quote: 'Contract line', verification: 'matched_text' },
    ],
    source: undefined,
  };
}

describe('precision policy exemption (WI-1)', () => {
  it('excludes metadata-only mismatches from emitted and counts them policyExempt', () => {
    const run = baseRun({
      truth: truthFixture({
        expectedFields: [
          { role: 'offer', fieldKey: 'basic_salary', state: 'present', value: null },
        ],
        seededDifferences: [{ fieldKey: 'basic_salary', kind: 'value', note: 'seeded' }],
      }),
      report: {
        status: 'complete',
        findings: [mismatch(['document_reference']), mismatch(['verification_reference']), mismatch(['basic_salary'])],
      } as unknown as ReportView,
    });
    const score = scoreCase(run, { approvedRules: [] });
    expect(score.precision.policyExempt).toBe(2);
    expect(score.precision.emitted).toBe(1);
    expect(score.precision.supported).toBe(1);
    expect(score.precision.autoUnsupported).toEqual([]);
  });

  it('does not count metadata mismatches as abstention falseMismatches', () => {
    const run = baseRun({
      truth: truthFixture({
        caseId: 'TC-013',
        seededDifferences: [],
        expectedAbstentions: ['no_global_verdict'],
      }),
      report: {
        status: 'complete',
        findings: [mismatch(['document_reference'])],
      } as unknown as ReportView,
    });
    const score = scoreCase(run, { approvedRules: [] });
    expect(score.abstention.falseMismatches).toBe(0);
  });
});

describe('truth schema widening (WI-4)', () => {
  it('parses requiredRuleRefs with an approved rule revision', () => {
    const truth = TruthSchema.parse({
      ...truthFixture(),
      requiredRuleRefs: [{ ruleKey: 'ae-recruitment-costs-employer-bears', ruleRevision: 1 }],
    });
    expect(truth.requiredRuleRefs).toEqual([
      { ruleKey: 'ae-recruitment-costs-employer-bears', ruleRevision: 1 },
    ]);
  });

  it('yields a zero recall denominator for a consistent pair with no seeds', () => {
    const score = scoreCase(baseRun({ truth: truthFixture() }), { approvedRules: [] });
    expect(score.mismatchRecall.numerator).toBe(0);
    expect(score.mismatchRecall.denominator).toBe(0);
  });
});
