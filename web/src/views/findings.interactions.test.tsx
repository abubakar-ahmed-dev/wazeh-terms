/**
 * Findings interaction tests (P4 §7): priority-first ordering across
 * categories, search/filter/reset with counts (plan §8.12), three
 * zero-states (R20), citation range (issue 11), unknown-priority suppression
 * (issue 10), absent-category line (issue 17). @vitest-environment jsdom
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Findings } from './Findings';
import type { AnalysisResponse, Finding } from '../lib/types';

afterEach(cleanup);

const evidence = (page: number, quote: string, documentId = 'doc-offer') => ({
  documentId,
  page,
  quote,
  verification: 'matched_text' as const,
});

const findings: Finding[] = [
  {
    id: 'f-mismatch',
    category: 'document_mismatch',
    fieldKeys: ['recruitment_cost'],
    importance: 'medium',
    explanation: 'The offer and the contract state different recruitment cost values.',
    documentEvidence: [evidence(2, 'Recruitment fee: AED 3,100'), evidence(2, 'Recruitment fee: AED 3,500', 'doc-contract')],
    valueOrigins: ['document'],
    comparisonRuleKey: 'money_equal',
    uncertaintyReasons: [],
    suggestedQuestionOrStep: 'Ask the employer which recruitment cost applies before you sign.',
  },
  {
    id: 'f-missing',
    category: 'missing_information',
    fieldKeys: ['payment_frequency'],
    importance: 'high',
    explanation: 'No payment frequency was found in either document.',
    documentEvidence: [],
    valueOrigins: ['document'],
    uncertaintyReasons: [],
    suggestedQuestionOrStep: 'Ask how often wages are paid.',
  },
  {
    id: 'f-concern',
    category: 'source_backed_concern',
    fieldKeys: ['recruitment_cost'],
    importance: 'high',
    explanation: 'What the official source says: a UAE employer is prohibited from charging a worker recruitment fees.',
    documentEvidence: [evidence(2, 'the Worker shall bear the recruitment fee')],
    valueOrigins: ['document'],
    uncertaintyReasons: ['attribution_unknown'],
    suggestedQuestionOrStep: 'Ask the employer to confirm, in writing, how the worker-paid costs align with the cited official passage.',
    source: {
      ruleKey: 'ae-recruitment-costs-employer-bears',
      ruleRevision: 1,
      sourceKey: 'uae-federal-decree-law-33-2021',
      versionKey: 'base-text-2022',
      issuingAuthority: 'UAE Government',
      officialUrl: 'https://example.org/decree33',
      pinpoint: { label: 'Article 6(4)', quote: 'The Employer is prohibited from charging the Worker the fees of recruitment.' },
      jurisdiction: 'AE',
      responsibleParty: 'uae_employer',
      effectiveFrom: '2022-02-02',
      effectiveTo: null,
      sourceCheckedAt: '2026-10-03T00:00:00Z',
      evidenceClass: 'binding_official_rule',
    },
  },
  {
    id: 'f-unknown',
    category: 'unable_to_determine',
    fieldKeys: ['visa_cost'],
    importance: 'unknown',
    explanation: 'The visa cost clause could not be read.',
    documentEvidence: [],
    valueOrigins: ['document'],
    uncertaintyReasons: ['unreadable_page'],
    suggestedQuestionOrStep: 'Check the unreadable page yourself.',
  },
];

const report: AnalysisResponse = {
  requestId: 'r1',
  status: 'partial',
  reviewedAsOf: '2026-10-04T10:00:00Z',
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
    checkedFieldKeys: ['recruitment_cost', 'payment_frequency'],
    unreadableFieldKeys: ['visa_cost'],
    omittedChecks: [],
  },
  findings,
  summary: 'Partial review: the document comparison finished; the official-source check ran, but some candidates were withheld.',
  limitations: ['2 possible official-source concerns were withheld because the cited rule could not be fully verified against its approved source.'],
  officialNextSteps: [{ label: 'BEOE: how to get an emigrant\'s protection (Pakistan)', url: 'https://beoe.gov.pk/how-to-get-emigrants-protection' }],
};

function setup(overrides?: { report?: AnalysisResponse }) {
  const onReviewAnother = vi.fn();
  const onReset = vi.fn();
  render(<Findings report={overrides?.report ?? report} issued={null} onReviewAnother={onReviewAnother} onReset={onReset} />);
  return { onReviewAnother, onReset };
}

describe('priority-first ordering (P4 §7.2)', () => {
  it('lists high-priority items before medium across categories; suppresses unknown chips', () => {
    setup();
    const list = document.querySelector('ol.findings-list') as HTMLElement;
    const titles = within(list).getAllByRole('heading', { level: 3 }).map((node) => node.textContent);
    expect(titles?.[0]).toContain('Charge to question'); // high
    expect(titles?.[1]).toContain('Not stated'); // high
    expect(titles?.[2]).toContain('Different wording'); // medium
    expect(titles?.[3]).toContain('Could not determine'); // unknown last
    expect(screen.queryByText('unknown priority')).toBeNull();
  });
});

describe('search, filters, reset (plan §8.12)', () => {
  it('category filter narrows with a live count; reset restores', async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.getByText(/4 of 4 findings shown/)).toBeTruthy();
    await user.selectOptions(screen.getByLabelText('Filter by category'), 'source_backed_concern');
    expect(screen.getByText(/1 of 4 findings shown/)).toBeTruthy();
    expect(screen.getByText(/Charge to question/)).toBeTruthy();
    expect(screen.queryByText(/Not stated/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByText(/4 of 4 findings shown/)).toBeTruthy();
  });

  it('search matches explanations and quotes; zero matches is a filtered view, never a clean result (R20)', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText('Search findings'), 'probation');
    expect(screen.getByText(/No findings match the current filters/)).toBeTruthy();
    expect(screen.queryByText(/No concern detected/)).toBeNull();
    await user.click(screen.getByRole('button', { name: /Reset filters to see all 4 findings/ }));
    expect(screen.getByText(/4 of 4 findings shown/)).toBeTruthy();

    await user.clear(screen.getByLabelText('Search findings'));
    await user.type(screen.getByLabelText('Search findings'), 'recruitment');
    expect(screen.getByText(/2 of 4 findings shown/)).toBeTruthy();
  });
});

describe('banner, coverage link, absent categories, citation (issues 11/17)', () => {
  it('renders one slim partial banner with the withheld limitation', () => {
    setup();
    expect(screen.getAllByText(/Partial review/).length).toBeGreaterThan(0);
    expect(screen.getByText(/2 possible official-source concerns were withheld/)).toBeTruthy();
    expect(screen.getByText(/Not flagged by finished checks: Question to clarify/)).toBeTruthy();
  });

  it('citation shows the in-force range when effectiveTo exists (issue 11)', () => {
    setup({
      report: {
        ...report,
        findings: findings.filter((f) => f.id === 'f-concern'),
        limitations: [],
        status: 'complete',
      },
    });
    expect(screen.getByText(/In force from 2022-02-02 · source checked/)).toBeTruthy();
  });

  it('shows correction attribution when a finding involves a user value', () => {
    setup({
      report: {
        ...report,
        findings: findings.filter((f) => f.id === 'f-mismatch').map((f) => ({ ...f, valueOrigins: ['document', 'user'] as const })),
      },
    });
    expect(screen.getByText(/comes from your correction/)).toBeTruthy();
  });
});

describe('three zero-states (R20)', () => {
  const base = { ...report, findings: [], limitations: [] };

  it('partial coverage → never the all-clear sentence', () => {
    setup({ report: { ...base, status: 'partial', stages: { ...report.stages, retrieval: 'failed' } } });
    expect(screen.getByText(/No findings were displayed because not all checks finished/)).toBeTruthy();
    expect(screen.queryByText(/No concern detected in the fields checked/)).toBeNull();
  });

  it('complete coverage → the scoped spec sentence', () => {
    setup({ report: { ...base, status: 'complete' } });
    expect(screen.getByText('No concern detected in the fields checked')).toBeTruthy();
    expect(screen.getByText(/not a statement that the documents are good, safe, or compliant/)).toBeTruthy();
  });

  it('filtered-empty → filter panel with reset (not the clean sentence)', async () => {
    setup();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Search findings'), 'zzz-no-match');
    expect(screen.getByText(/No findings match the current filters/)).toBeTruthy();
    expect(screen.queryByText(/No concern detected in the fields checked/)).toBeNull();
  });
});
