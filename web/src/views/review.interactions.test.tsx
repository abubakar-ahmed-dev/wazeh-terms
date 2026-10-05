/**
 * Review interaction tests (P6 preservation matrix): drafts survive help and
 * group switches without prompts (R17), continue-with-draft offers three
 * explicit choices (R18), corrected anatomy + count semantics (R22),
 * absent/unreadable/empty treatments (issues 7/9/28), navigator filter.
 * @vitest-environment jsdom
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Review } from './Review';
import type { CorrectionDelta, ExtractedField, IssuedDocument, IssuedExtraction, NormalizedValue } from '../lib/types';

afterEach(cleanup);

const money = (amount: string): NormalizedValue => ({
  kind: 'money',
  amount,
  currency: 'AED',
  frequency: 'monthly',
  component: 'basic_salary',
  payer: null,
});

const field = (overrides: Partial<ExtractedField>): ExtractedField => ({
  fieldKey: 'basic_salary',
  instanceId: 'basic_salary:0',
  state: 'present',
  rawText: 'Basic salary: AED 2,400 per month',
  value: money('2400.00'),
  evidence: [{ documentId: 'doc-offer', page: 1, quote: 'Basic salary: AED 2,400 per month', verification: 'matched_text' }],
  qualityNotes: [],
  ...overrides,
});

const doc = (role: 'offer' | 'contract', documentId: string, fields: ExtractedField[]): IssuedDocument => ({
  documentId,
  role,
  mimeType: 'application/pdf',
  pageCount: 2,
  sha256: 'abc',
  extractionStatus: 'completed',
  unreadablePages: [],
  fields,
});

const issued: IssuedExtraction = {
  schemaVersion: 1,
  issuedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  scope: { origin: 'PK', destination: 'AE', declaredRegime: 'uae_mainland_private', declaredWorkerCategory: 'non_domestic' },
  sourceMode: 'sample',
  documents: [
    doc('offer', 'doc-offer', [
      field({}),
      field({
        fieldKey: 'notice_terms',
        instanceId: 'notice_terms:0',
        state: 'absent',
        rawText: '',
        value: null,
        evidence: [],
      }),
    ]),
    doc('contract', 'doc-contract', [
      field({
        fieldKey: 'probation_period',
        instanceId: 'probation_period:0',
        state: 'unclear',
        rawText: 'Probation as per policy',
        value: null,
        evidence: [{ documentId: 'doc-contract', page: 2, quote: 'Probation as per policy', verification: 'model_transcription' }],
      }),
      field({
        fieldKey: 'visa_cost',
        instanceId: 'visa_cost:0',
        state: 'unreadable',
        rawText: '',
        value: null,
        evidence: [],
      }),
    ]),
  ],
};

function setup(overrides?: { corrections?: CorrectionDelta[] }) {
  const onCorrect = vi.fn();
  const onUndoCorrection = vi.fn();
  const onContinue = vi.fn();
  const onReset = vi.fn();
  render(
    <Review
      issued={issued}
      previewUrls={[
        { role: 'offer', url: 'blob:offer' },
        { role: 'contract', url: 'blob:contract' },
      ]}
      corrections={overrides?.corrections ?? []}
      onCorrect={onCorrect}
      onUndoCorrection={onUndoCorrection}
      onContinue={onContinue}
      onReset={onReset}
    />,
  );
  return { onCorrect, onUndoCorrection, onContinue, onReset };
}

describe('Review preservation (R17)', () => {
  it('draft survives a group switch and returns intact — no prompt anywhere', async () => {
    const user = userEvent.setup();
    setup();
    const nav0 = screen.getByRole('navigation', { name: 'Field groups' });
    await user.click(within(nav0).getByRole('button', { name: /Pay/ }));
    await user.click(screen.getByRole('button', { name: 'Correct value' }));
    const amount = screen.getByLabelText('Amount (decimal, e.g. 2500.00)');
    await user.clear(amount);
    await user.type(amount, '2500.55');

    // Switch to Term and back — no confirm dialog may appear.
    await user.click(within(nav0).getByRole('button', { name: /Term/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(within(nav0).getByRole('button', { name: /Pay/ }));

    expect((screen.getByLabelText('Amount (decimal, e.g. 2500.00)') as HTMLInputElement).value).toBe('2500.55');
    expect(screen.getByText(/unsaved edit/)).toBeTruthy();
  });

  it('opening help keeps the draft and the workspace mounted (R17)', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Correct value' }));
    await user.click(screen.getByRole('button', { name: 'Read the checking guide' }));
    expect(screen.getByRole('dialog', { name: /Checking terms/ })).toBeTruthy();
    expect(screen.getByText('Group 4 of 12 — Pay')).toBeTruthy();
    expect((screen.getByLabelText('Amount (decimal, e.g. 2500.00)') as HTMLInputElement).value).toBe('2400.00');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect((screen.getByLabelText('Amount (decimal, e.g. 2500.00)') as HTMLInputElement).value).toBe('2400.00');
  });

  it('continue with a draft offers three explicit choices; save commits and continues (R18)', async () => {
    const user = userEvent.setup();
    const { onCorrect, onContinue } = setup();
    const nav0 = screen.getByRole('navigation', { name: 'Field groups' });
    await user.click(within(nav0).getByRole('button', { name: /Pay/ }));
    await user.click(screen.getByRole('button', { name: 'Correct value' }));
    const amount = screen.getByLabelText('Amount (decimal, e.g. 2500.00)');
    await user.clear(amount);
    await user.type(amount, '2500.55');
    await user.click(screen.getByRole('button', { name: /Continue to findings/ }));

    const dialog = screen.getByRole('dialog', { name: /unsaved correction/i });
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Keep editing' })).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Save correction and continue' })).toBeTruthy();
    expect(within(dialog).getByRole('button', { name: 'Continue without saving' })).toBeTruthy();

    await user.click(within(dialog).getByRole('button', { name: 'Save correction and continue' }));
    expect(onCorrect).toHaveBeenCalledTimes(1);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('continue without saving discards the draft and continues', async () => {
    const user = userEvent.setup();
    const { onCorrect, onContinue } = setup();
    const nav0 = screen.getByRole('navigation', { name: 'Field groups' });
    await user.click(within(nav0).getByRole('button', { name: /Pay/ }));
    await user.click(screen.getByRole('button', { name: 'Correct value' }));
    const amount = screen.getByLabelText('Amount (decimal, e.g. 2500.00)');
    await user.clear(amount);
    await user.type(amount, '2500.55');
    await user.click(screen.getByRole('button', { name: /Continue to findings/ }));
    await user.click(screen.getByRole('button', { name: 'Continue without saving' }));
    expect(onCorrect).not.toHaveBeenCalled();
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/unsaved edit/)).toBeNull();
  });
});

describe('Review count semantics and card states (R22, issues 7/9/28)', () => {
  it('needs-check counts describe the original extraction and exclude corrected fields', async () => {
    const user = userEvent.setup();
    setup({
      corrections: [
        {
          documentId: 'doc-contract',
          fieldKey: 'probation_period',
          instanceId: 'probation_period:0',
          state: 'present',
          value: { kind: 'duration', amount: '6', unit: 'months' },
        },
      ],
    });
    // Navigate to Probation where the corrected unclear field lives.
    const nav = screen.getByRole('navigation', { name: 'Field groups' });
    await user.click(within(nav).getByRole('button', { name: /Probation/ }));
    // probation (unclear) is corrected → only visa_cost (unreadable) remains.
    expect(screen.getByText(/1 field needs your check/)).toBeTruthy();
    expect(screen.getAllByText(/Corrected by you/).length).toBe(1);
  });

  it('corrected card leads with the effective value and keeps the original', async () => {
    setup({
      corrections: [
        {
          documentId: 'doc-contract',
          fieldKey: 'probation_period',
          instanceId: 'probation_period:0',
          state: 'present',
          value: { kind: 'duration', amount: '6', unit: 'months' },
        },
      ],
    });
    // Navigate to the Probation group.
    const user = userEvent.setup();
    const nav = screen.getByRole('navigation', { name: 'Field groups' });
    await user.click(within(nav).getByRole('button', { name: /Probation/ }));
    expect(screen.getAllByText(/Your correction — used for analysis/).length).toBe(1);
    expect(screen.getByText(/As written/)).toBeTruthy();
  });

  it('unreadable fields show the public limitation and no Correct value control', async () => {
    const user = userEvent.setup();
    setup();
    const nav = screen.getByRole('navigation', { name: 'Field groups' });
    await user.click(within(nav).getByRole('button', { name: /Recruitment and travel costs/ }));
    expect(screen.getByText(/no trustworthy reading to correct against/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Correct value' })).toBeNull();
  });

  it('absent fields render the compact card with the not-proof hint', async () => {
    const user = userEvent.setup();
    setup();
    const nav = screen.getByRole('navigation', { name: 'Field groups' });
    await user.click(within(nav).getByRole('button', { name: /Ending terms/ }));
    expect(screen.getByText(/No readable wording to show/i)).toBeTruthy();
  });

  it('needs-attention filter shows only groups with unclear/unreadable originals', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /Needs attention \(2\)/ }));
    const nav = screen.getByRole('navigation', { name: 'Field groups' });
    expect(within(nav).getByRole('button', { name: /Probation/ })).toBeTruthy();
    expect(within(nav).queryByRole('button', { name: /Pay/ })).toBeNull();
  });

  it('empty group shows the state-specific message instead of vanishing (issue 9)', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /Working time/ }));
    expect(screen.getByText(/Nothing was located for this group/)).toBeTruthy();
  });
});

describe('Review navigator and viewer', () => {
  it('navigator numbers groups and marks the active one', () => {
    setup();
    const nav = screen.getByRole('navigation', { name: 'Field groups' });
    expect(within(nav).getByText('4')).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /Pay/ }).getAttribute('aria-current')).toBe('true');
  });

  it('View page opens the overlay viewer with the field page; close restores', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /View page 1/ }));
    const viewer = screen.getByRole('dialog', { name: 'Original document' });
    expect(within(viewer).getByTitle('Offer document, page 1')).toBeTruthy();
    await user.click(within(viewer).getByRole('button', { name: 'Close viewer' }));
    expect(screen.queryByRole('dialog', { name: 'Original document' })).toBeNull();
  });
});
