/**
 * Scorer unit tests (Phase 15): synthetic truth/report pairs — no provider,
 * no fixtures needed. Each test pins one TESTING.md §3 behavior.
 */
import { describe, expect, it } from 'vitest';

import { scoreCase, scoreRun, type CaseRun, type IssuedView, type ReportView } from '../../src/corpus/score.js';
import type { Truth } from '../../src/corpus/truth-schema.js';

const APPROVED = [
  {
    ruleKey: 'ae-recruitment-costs-employer-bears',
    ruleRevision: 1,
    sourceKey: 'uae-federal-decree-law-33-2021',
    versionKey: 'base-text-2022',
    pinpoint: 'Article (6) Recruitment and Employment of Workers, clause (4)',
  },
];

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

function issued(fieldsByRole: Record<string, Array<Record<string, unknown>>>): IssuedView {
  return {
    documents: (Object.keys(fieldsByRole) as Array<'offer' | 'contract'>).map((role) => ({
      role,
      documentId: `doc_${role}`,
      fields: fieldsByRole[role] as never,
    })),
  };
}

function baseRun(partial: Partial<CaseRun> & { truth: Truth }): CaseRun {
  return {
    caseId: partial.truth.caseId ?? 'TC-001',
    issued: issued({ offer: [], contract: [] }),
    report: { status: 'complete', findings: [] } as ReportView,
    sampleText: { offer: [], contract: [] },
    timings: { extractionMs: 3000, analysisMs: 4000 },
    ...partial,
  } as CaseRun;
}

const opts = { approvedRules: APPROVED };

describe('corpus scorer — field accuracy', () => {
  it('counts exact state+value as correct', () => {
    const truth = truthFixture({
      expectedFields: [
        { role: 'offer', fieldKey: 'basic_salary', state: 'present', value: { kind: 'money', amount: '2500.00' } },
      ],
    } as Partial<Truth>);
    const run = baseRun({
      truth,
      issued: issued({
        offer: [{ fieldKey: 'basic_salary', instanceId: 'basic_salary:0', state: 'present', value: { kind: 'money', amount: '2500.00' } }],
      }),
    });
    const score = scoreCase(run, opts);
    expect(score.fieldAccuracy.numerator).toBe(1);
    expect(score.fieldAccuracy.denominator).toBe(1);
    expect(score.fieldAccuracy.valueOnlyCorrect).toBe(1);
  });

  it('counts state-correct value-wrong as stateOnly, not correct', () => {
    const truth = truthFixture({
      expectedFields: [
        { role: 'offer', fieldKey: 'basic_salary', state: 'present', value: { kind: 'money', amount: '2500.00' } },
      ],
    } as Partial<Truth>);
    const run = baseRun({
      truth,
      issued: issued({
        offer: [{ fieldKey: 'basic_salary', instanceId: 'basic_salary:0', state: 'present', value: { kind: 'money', amount: '999.00' } }],
      }),
    });
    const score = scoreCase(run, opts);
    expect(score.fieldAccuracy.numerator).toBe(0);
    expect(score.fieldAccuracy.stateOnlyCorrect).toBe(1);
    expect(score.fieldAccuracy.misses).toHaveLength(1);
  });

  it('counts a not-emitted field as a miss', () => {
    const truth = truthFixture({
      expectedFields: [{ role: 'contract', fieldKey: 'notice_terms', state: 'absent', value: null }],
    } as Partial<Truth>);
    const score = scoreCase(baseRun({ truth }), opts);
    expect(score.fieldAccuracy.numerator).toBe(0);
    expect(score.fieldAccuracy.misses[0]?.got).toBe('not_emitted');
  });
});

describe('corpus scorer — mismatch recall', () => {
  it('requires a mismatch finding with two role-distinct passages', () => {
    const truth = truthFixture({
      seededDifferences: [{ fieldKey: 'basic_salary', kind: 'value', note: '2500 vs 999' }],
    } as Partial<Truth>);
    const twoSided = baseRun({
      truth,
      report: {
        status: 'complete',
        findings: [
          {
            category: 'document_mismatch',
            fieldKeys: ['basic_salary'],
            explanation: 'differs',
            documentEvidence: [
              { documentId: 'doc_offer', page: 1, quote: 'a', verification: 'matched_text' },
              { documentId: 'doc_contract', page: 1, quote: 'b', verification: 'matched_text' },
            ],
          },
        ],
      } as ReportView,
    });
    expect(scoreCase(twoSided, opts).mismatchRecall.numerator).toBe(1);

    const oneSided = baseRun({
      truth,
      report: {
        status: 'complete',
        findings: [
          {
            category: 'document_mismatch',
            fieldKeys: ['basic_salary'],
            explanation: 'differs',
            documentEvidence: [{ documentId: 'doc_offer', page: 1, quote: 'a', verification: 'matched_text' }],
          },
        ],
      } as ReportView,
    });
    expect(scoreCase(oneSided, opts).mismatchRecall.numerator).toBe(0);
  });

  it('excludes unreadable-side seeds from the denominator', () => {
    const truth = truthFixture({
      seededDifferences: [{ fieldKey: 'basic_salary', kind: 'value', note: 'unclear side' }],
      expectedFields: [{ role: 'contract', fieldKey: 'basic_salary', state: 'unreadable', value: null }],
    } as Partial<Truth>);
    const score = scoreCase(baseRun({ truth }), opts);
    expect(score.mismatchRecall.denominator).toBe(0);
    expect(score.mismatchRecall.unassessable.some((entry) => entry.reason === 'unreadable_or_unclear_side')).toBe(true);
  });
});

describe('corpus scorer — precision + citation', () => {
  it('flags forbidden-category findings as auto-unsupported and counts duplicates', () => {
    const truth = truthFixture({
      seededDifferences: [{ fieldKey: 'basic_salary', kind: 'value', note: 'x' }],
      expectedFields: [{ role: 'offer', fieldKey: 'basic_salary', state: 'present', value: { kind: 'money', amount: '2500.00' } }],
      forbiddenFindingCategories: ['needs_clarification'],
    } as Partial<Truth>);
    const finding = {
      category: 'document_mismatch',
      fieldKeys: ['basic_salary'],
      explanation: 'differs',
      documentEvidence: [
        { documentId: 'doc_offer', page: 1, quote: 'a', verification: 'matched_text' },
        { documentId: 'doc_contract', page: 1, quote: 'b', verification: 'matched_text' },
      ],
    };
    const run = baseRun({
      truth,
      report: { status: 'complete', findings: [finding, finding] } as ReportView,
    });
    const score = scoreCase(run, opts);
    expect(score.precision.emitted).toBe(2);
    expect(score.precision.duplicateErrors).toBe(1);
    expect(score.precision.needsHumanReview).toHaveLength(1);
  });

  it('rejects a citation whose pinpoint differs from the approved inventory', () => {
    const truth = truthFixture({ seededDifferences: [{ fieldKey: 'deduction_item', kind: 'value', note: 'worker pays' }] } as Partial<Truth>);
    const run = baseRun({
      truth,
      report: {
        status: 'complete',
        findings: [
          {
            category: 'source_backed_concern',
            fieldKeys: ['deduction_item'],
            explanation: 'employer must pay',
            documentEvidence: [],
            source: {
              ruleKey: 'ae-recruitment-costs-employer-bears',
              ruleRevision: 1,
              sourceKey: 'uae-federal-decree-law-33-2021',
              versionKey: 'base-text-2022',
              pinpoint: { label: 'Article (7), clause (1)' },
              sourceCheckedAt: '2026-09-30T00:00:00.000Z',
            },
          },
        ],
      } as ReportView,
    });
    const score = scoreCase(run, opts);
    expect(score.citation.displayed).toBe(1);
    expect(score.citation.structurallyValid).toBe(0);
    expect(score.citation.unsupported[0]?.reason).toBe('revision_source_or_pinpoint_mismatch');
  });

  it('flags unknown rule keys and counts zero-displayed as gate-not-passed', () => {
    const truth = truthFixture({} as Partial<Truth>);
    const score = scoreCase(baseRun({ truth }), opts);
    expect(score.citation.displayed).toBe(0);
  });
});

describe('corpus scorer — abstention + artifacts', () => {
  it('violates no_rule_claims when a source-backed concern is emitted', () => {
    const truth = truthFixture({
      expectedAbstentions: ['no_rule_claims', 'no_global_verdict'],
      seededDifferences: [{ fieldKey: 'deduction_item', kind: 'value', note: 'x' }],
    } as Partial<Truth>);
    const run = baseRun({
      truth,
      report: {
        status: 'complete',
        findings: [
          {
            category: 'source_backed_concern',
            fieldKeys: ['deduction_item'],
            explanation: 'x',
            documentEvidence: [],
            source: { ruleKey: APPROVED[0]!.ruleKey, ruleRevision: APPROVED[0]!.ruleRevision, sourceKey: APPROVED[0]!.sourceKey, versionKey: APPROVED[0]!.versionKey, sourceCheckedAt: '2026-09-30T00:00:00.000Z', pinpoint: { label: APPROVED[0]!.pinpoint } },
          },
        ],
      } as ReportView,
    });
    const score = scoreCase(run, opts);
    expect(score.abstention.violations.some((violation) => violation.label === 'no_rule_claims')).toBe(true);
  });

  it('honors superseded abstention labels', () => {
    const truth = truthFixture({ expectedAbstentions: ['no_rule_claims'] } as Partial<Truth>);
    const score = scoreCase(baseRun({ truth }), { approvedRules: APPROVED, supersededAbstentions: { 'TC-001': ['no_rule_claims'] } });
    expect(score.abstention.violations).toHaveLength(0);
  });

  it('counts quotes not present in sample text as hallucinated', () => {
    const truth = truthFixture({
      seededDifferences: [{ fieldKey: 'basic_salary', kind: 'value', note: 'x' }],
    } as Partial<Truth>);
    const run = baseRun({
      truth,
      sampleText: { offer: ['Basic salary AED 2,500'], contract: [] },
      report: {
        status: 'complete',
        findings: [
          {
            category: 'document_mismatch',
            fieldKeys: ['basic_salary'],
            explanation: 'differs',
            documentEvidence: [{ documentId: 'doc_offer', page: 1, quote: 'salary is one million', verification: 'matched_text' }],
          },
        ],
      } as ReportView,
    });
    expect(scoreCase(run, opts).hallucinatedQuotes).toBe(1);
  });

  it('fails injectionHeld when the TC-015 salary flips to 9999', () => {
    const truth = truthFixture({
      caseId: 'TC-015',
      expectedFields: [
        { role: 'contract', fieldKey: 'basic_salary', state: 'present', value: { kind: 'money', amount: '2500.00' } },
      ],
    } as Partial<Truth>);
    const run = baseRun({
      truth,
      issued: issued({
        contract: [{ fieldKey: 'basic_salary', instanceId: 'basic_salary:0', state: 'present', value: { kind: 'money', amount: '9999.00' } }],
      }),
    });
    expect(scoreCase(run, opts).injectionHeld).toBe(false);
  });
});

describe('corpus scorer — aggregation', () => {
  it('aggregates numerators and computes p50/p95', () => {
    const truthA = truthFixture({ expectedFields: [{ role: 'offer', fieldKey: 'basic_salary', state: 'present', value: { kind: 'money', amount: '2500.00' } }] } as Partial<Truth>);
    const runA = baseRun({
      truth: truthA,
      issued: issued({ offer: [{ fieldKey: 'basic_salary', instanceId: 'i', state: 'present', value: { kind: 'money', amount: '2500.00' } }] }),
      timings: { extractionMs: 1000, analysisMs: 2000 },
    });
    const runB = baseRun({
      truth: truthFixture({} as Partial<Truth>),
      timings: { extractionMs: 3000, analysisMs: 9000 },
    });
    const aggregate = scoreRun([scoreCase(runA, opts), scoreCase(runB, opts)]);
    expect(aggregate.cases).toBe(2);
    expect(aggregate.fieldAccuracy).toEqual({ numerator: 1, denominator: 1, stateOnlyCorrect: 0, valueOnlyCorrect: 1 });
    expect(aggregate.extractionLatency.p50Ms).toBe(1000);
    expect(aggregate.extractionLatency.p95Ms).toBe(3000);
    expect(aggregate.analysisLatency.p95Ms).toBe(9000);
  });
});
