import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Home } from './Home';
import { Samples } from './Samples';
import { Review } from './Review';
import { Findings } from './Findings';
import type { AnalysisResponse, IssuedExtraction, SampleEntry } from '../lib/types';

const samples: SampleEntry[] = [
  {
    sampleCaseId: 'TC-001',
    title: 'Fictional consistent pair',
    description: 'A fictional pair.',
    documents: [
      { role: 'offer', previewUrl: '/samples/TC-001/offer.pdf' },
      { role: 'contract', previewUrl: '/samples/TC-001/contract.pdf' },
    ],
  },
];

const issued: IssuedExtraction = {
  schemaVersion: 1,
  issuedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  scope: {
    origin: 'PK',
    destination: 'AE',
    declaredRegime: 'uae_mainland_private',
    declaredWorkerCategory: 'non_domestic',
  },
  sourceMode: 'sample',
  documents: [
    {
      documentId: 'doc-offer',
      role: 'offer',
      mimeType: 'application/pdf',
      pageCount: 1,
      sha256: 'abc',
      extractionStatus: 'completed',
      unreadablePages: [],
      fields: [
        {
          fieldKey: 'basic_salary',
          instanceId: 'basic_salary:0',
          state: 'present',
          rawText: 'Basic salary: AED 2,400 per month',
          value: {
            kind: 'money',
            amount: '2400.00',
            currency: 'AED',
            frequency: 'monthly',
            component: 'basic_salary',
            payer: null,
          },
          evidence: [
            {
              documentId: 'doc-offer',
              page: 1,
              quote: 'Basic salary: AED 2,400 per month',
              verification: 'matched_text',
            },
          ],
          qualityNotes: [],
        },
      ],
    },
  ],
};

const report: AnalysisResponse = {
  requestId: 'req-test',
  status: 'partial',
  reviewedAsOf: new Date('2026-09-30T10:05:00Z').toISOString(),
  scopeApplicability: 'supported',
  stages: {
    extraction: 'completed',
    review: 'completed',
    comparison: 'completed',
    retrieval: 'completed',
    applicability: 'completed',
    explanation: 'completed',
  },
  coverage: {
    documentIds: ['doc-offer', 'doc-contract'],
    checkedFieldKeys: ['basic_salary'],
    unreadableFieldKeys: [],
    omittedChecks: ['official-source rule review'],
  },
  summary: 'Partial review: source check incomplete.',
  limitations: ['We could not complete the source check.'],
  officialNextSteps: [{ label: 'MOHRE', url: 'https://www.mohre.gov.ae/' }],
  findings: [
    {
      id: 'finding-1',
      category: 'source_backed_concern',
      fieldKeys: ['visa_cost'],
      importance: 'high',
      explanation: 'A charge should be checked against the official source.',
      documentEvidence: [
        {
          documentId: 'doc-contract',
          page: 1,
          quote: 'Worker pays visa charges.',
          verification: 'matched_text',
        },
      ],
      valueOrigins: ['document'],
      uncertaintyReasons: [],
      suggestedQuestionOrStep: 'Ask who pays the charge.',
      source: {
        ruleKey: 'ae-worker-charge',
        ruleRevision: 1,
        sourceKey: 'uae-law',
        versionKey: 'base',
        issuingAuthority: 'MOHRE',
        officialUrl: 'https://www.mohre.gov.ae/',
        pinpoint: { label: 'Article 6(4)', quote: 'The employer shall bear recruitment costs.' },
        jurisdiction: 'AE',
        responsibleParty: 'uae_employer',
        effectiveFrom: '2022-02-02',
        effectiveTo: null,
        sourceCheckedAt: '2026-09-30T00:00:00Z',
        evidenceClass: 'binding_official_rule',
      },
    },
  ],
};

describe('Phase 11 rendered views', () => {
  it('home stays sample-only and exposes no upload action while the gate is closed', () => {
    const html = renderToStaticMarkup(
      <Home capabilityState="ready" sampleModeEnabled={true} onTrySample={() => undefined} onRetryCapabilities={() => undefined} />,
    );
    expect(html).toContain('Try a sample review');
    expect(html).toContain('Personal document upload is not available yet');
    expect(html).not.toContain('Review my documents');
    expect(html).not.toContain('type="file"');
  });

  it('sample cards use manifest preview URLs and fictional labels', () => {
    const html = renderToStaticMarkup(<Samples samples={samples} onStart={() => undefined} busyCaseId={null} />);
    expect(html).toContain('Fictional sample');
    expect(html).toContain('Preview files');
    expect(html).toContain('Review this sample');
  });

  it('review preserves original evidence and labels a correction separately', () => {
    const html = renderToStaticMarkup(
      <Review
        issued={issued}
        previewUrls={[{ role: 'offer', url: '/samples/TC-001/offer.pdf' }]}
        corrections={[
          {
            documentId: 'doc-offer',
            fieldKey: 'basic_salary',
            instanceId: 'basic_salary:0',
            state: 'present',
            value: {
              kind: 'money',
              amount: '2500.00',
              currency: 'AED',
              frequency: 'monthly',
              component: 'basic_salary',
              payer: null,
            },
          },
        ]}
        onCorrect={() => undefined}
        onUndoCorrection={() => undefined}
        onContinue={() => undefined}
        onReset={() => undefined}
      />,
    );
    expect(html).toContain('Original wording');
    expect(html).toContain('Text matched to PDF');
    expect(html).toContain('Your correction');
    expect(html).toContain('used for analysis, not a page quote');
  });

  it('findings place partial limitations and official citations above next actions', () => {
    const html = renderToStaticMarkup(<Findings report={report} onReviewAnother={() => undefined} onReset={() => undefined} />);
    expect(html).toContain('Partial review');
    expect(html).toContain('Concern to check against an official source');
    expect(html).toContain('Official rule');
    expect(html).toContain('Article 6(4)');
    expect(html).toContain('What we checked');
    expect(html).not.toContain('safe');
    expect(html).not.toContain('legal advice');
  });
});
