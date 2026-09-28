import { describe, expect, it } from 'vitest';

import { AnalysisResponseSchema, FindingSchema, type SourceCitation } from '../../src/contracts/index.js';

const passage = (id: string, page: number, quote: string) => ({
  documentId: id,
  page,
  quote,
  verification: 'matched_text',
});

const sourceCitation: SourceCitation = {
  ruleKey: 'ae-wage-frequency-monthly',
  ruleRevision: 1,
  sourceKey: 'ae-federal-decree-law-33-2021',
  versionKey: '2021-en',
  issuingAuthority: 'MOHRE',
  officialUrl: 'https://www.mohre.gov.ae/en/laws-and-regulations/laws.aspx',
  pinpoint: { label: 'Article 15', quote: 'Wages shall be paid on a monthly basis.' },
  jurisdiction: 'AE',
  responsibleParty: 'uae_employer',
  effectiveFrom: '2022-02-02',
  effectiveTo: null,
  sourceCheckedAt: '2026-09-20T08:00:00.000Z',
  evidenceClass: 'binding_official_rule',
};

const mismatchFinding = {
  id: 'finding-1',
  category: 'document_mismatch',
  fieldKeys: ['basic_salary'],
  importance: 'high',
  explanation: 'The offer and the contract state different basic salaries.',
  documentEvidence: [
    passage('doc-offer-1', 1, 'Basic salary: AED 2,500 per month'),
    passage('doc-contract-1', 1, 'Basic wage: AED 2,200 per month'),
  ],
  valueOrigins: ['document'],
  comparisonRuleKey: 'money_component_equality',
  uncertaintyReasons: [],
  suggestedQuestionOrStep: 'Ask which salary figure applies before signing.',
};

const baseReport = {
  requestId: 'req_test',
  status: 'partial',
  reviewedAsOf: '2026-09-28T10:30:00.000Z',
  scopeApplicability: 'unknown',
  stages: {
    extraction: 'completed',
    review: 'completed',
    comparison: 'completed',
    retrieval: 'not_started',
    applicability: 'not_started',
    explanation: 'not_started',
  },
  coverage: {
    documentIds: ['doc-offer-1', 'doc-contract-1'],
    checkedFieldKeys: ['basic_salary'],
    unreadableFieldKeys: [],
    omittedChecks: ['source review not performed: no Knowledge Base endpoint configured'],
  },
  findings: [],
  summary: '',
  limitations: ['Rule-backed review was not performed.'],
  officialNextSteps: [],
};

describe('Finding', () => {
  it('accepts a document mismatch with two passages and a comparisonRuleKey', () => {
    expect(FindingSchema.safeParse(mismatchFinding).success).toBe(true);
  });

  it('rejects a mismatch without two passages or without comparisonRuleKey', () => {
    expect(
      FindingSchema.safeParse({ ...mismatchFinding, documentEvidence: [passage('doc-offer-1', 1, 'x')] })
        .success,
    ).toBe(false);
    const noRule = { ...mismatchFinding };
    delete (noRule as { comparisonRuleKey?: string }).comparisonRuleKey;
    expect(FindingSchema.safeParse(noRule).success).toBe(false);
  });

  it('requires a source citation exactly for source_backed_concern', () => {
    expect(
      FindingSchema.safeParse({
        ...mismatchFinding,
        id: 'finding-2',
        category: 'source_backed_concern',
        comparisonRuleKey: undefined,
        documentEvidence: [passage('doc-offer-1', 1, 'Wages monthly')],
        source: sourceCitation,
      }).success,
    ).toBe(true);

    expect(
      FindingSchema.safeParse({
        ...mismatchFinding,
        id: 'finding-3',
        category: 'source_backed_concern',
        documentEvidence: [passage('doc-offer-1', 1, 'Wages monthly')],
      }).success,
    ).toBe(false);

    expect(
      FindingSchema.safeParse({ ...mismatchFinding, id: 'finding-4', source: sourceCitation }).success,
    ).toBe(false);
  });

  it('validates source citation fields', () => {
    expect(
      FindingSchema.safeParse({
        ...mismatchFinding,
        id: 'finding-5',
        category: 'source_backed_concern',
        comparisonRuleKey: undefined,
        documentEvidence: [passage('doc-offer-1', 1, 'Wages monthly')],
        source: { ...sourceCitation, jurisdiction: 'IN' },
      }).success,
    ).toBe(false);
    expect(
      FindingSchema.safeParse({
        ...mismatchFinding,
        id: 'finding-6',
        category: 'source_backed_concern',
        comparisonRuleKey: undefined,
        documentEvidence: [passage('doc-offer-1', 1, 'Wages monthly')],
        source: { ...sourceCitation, officialUrl: 'not-a-url' },
      }).success,
    ).toBe(false);
  });
});

describe('AnalysisResponse', () => {
  it('accepts a well-formed partial report', () => {
    expect(AnalysisResponseSchema.safeParse(baseReport).success).toBe(true);
  });

  it('rejects an invalid stage status or unknown stage key', () => {
    expect(
      AnalysisResponseSchema.safeParse({
        ...baseReport,
        stages: { ...baseReport.stages, retrieval: 'done' },
      }).success,
    ).toBe(false);
    expect(
      AnalysisResponseSchema.safeParse({
        ...baseReport,
        stages: { ...baseReport.stages, verdict: 'completed' },
      }).success,
    ).toBe(false);
  });

  it('rejects unknown scopeApplicability and status values', () => {
    expect(AnalysisResponseSchema.safeParse({ ...baseReport, scopeApplicability: 'verified' }).success).toBe(false);
    expect(AnalysisResponseSchema.safeParse({ ...baseReport, status: 'failed' }).success).toBe(false);
  });
});
