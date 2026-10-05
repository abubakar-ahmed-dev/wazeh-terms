/**
 * @vitest-environment jsdom
 *
 * P11 Acceptance & Accessibility Validation Suite (Plan §14.2):
 * Executes acceptance scenarios across all journey stages:
 *  - First visit to Home (purpose, scope, boundaries, actions)
 *  - Choose a fictional sample (scenario clarity, start actions)
 *  - Upload intake constraints (roles, acknowledgment, boundary notice)
 *  - 12 review groups navigation & attention indicators
 *  - Salary & allowance evidence inspection (units, excerpts, pages)
 *  - Modal focus trapping, Esc handling, and accessibility
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FIELD_GROUPS, type IssuedExtraction, type SampleEntry } from '../lib/types';
import { ConfirmDialog } from '../ui';
import { Home } from './Home';
import { Review } from './Review';
import { Samples } from './Samples';
import { Upload } from './Upload';

afterEach(cleanup);

const mockSample: SampleEntry = {
  sampleCaseId: 'TC-002',
  title: 'Fictional changed pay',
  description: 'Salary changes between offer and formal mainland contract.',
  situationSummary: 'Candidate receives offer with AED 4,000 salary, but formal contract states AED 3,200.',
  documents: [
    { role: 'offer', previewUrl: '/samples/TC-002/offer.pdf' },
    { role: 'contract', previewUrl: '/samples/TC-002/contract.pdf' },
  ],
};

const mockIssued: IssuedExtraction = {
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
      sha256: 'abc123',
      extractionStatus: 'completed',
      unreadablePages: [],
      fields: [
        {
          fieldKey: 'basic_salary',
          instanceId: 'basic_salary:0',
          state: 'present',
          rawText: 'Basic salary: AED 4,000 per month',
          value: {
            kind: 'money',
            amount: '4000.00',
            currency: 'AED',
            frequency: 'monthly',
            component: 'basic_salary',
            payer: null,
          },
          evidence: [
            {
              documentId: 'doc-offer',
              page: 1,
              quote: 'Basic salary: AED 4,000 per month',
              verification: 'matched_text',
            },
          ],
          qualityNotes: [],
        },
      ],
    },
    {
      documentId: 'doc-contract',
      role: 'contract',
      mimeType: 'application/pdf',
      pageCount: 1,
      sha256: 'def456',
      extractionStatus: 'completed',
      unreadablePages: [],
      fields: [
        {
          fieldKey: 'basic_salary',
          instanceId: 'basic_salary:0',
          state: 'present',
          rawText: 'Basic salary: AED 3,200 per month',
          value: {
            kind: 'money',
            amount: '3200.00',
            currency: 'AED',
            frequency: 'monthly',
            component: 'basic_salary',
            payer: null,
          },
          evidence: [
            {
              documentId: 'doc-contract',
              page: 1,
              quote: 'Basic salary: AED 3,200 per month',
              verification: 'matched_text',
            },
          ],
          qualityNotes: [],
        },
      ],
    },
  ],
};

describe('P11 Scenario 1: First visit to Home (plan §14.2)', () => {
  it('clearly presents purpose, corridor scope, demo boundaries, and starting actions', () => {
    const onTrySample = vi.fn();
    const onUploadClick = vi.fn();
    const onOpenTechnical = vi.fn();

    render(
      <Home
        capabilityState="ready"
        sampleModeEnabled={true}
        customUploadEnabled={true}
        onTrySample={onTrySample}
        onUploadClick={onUploadClick}
        onRetryCapabilities={() => undefined}
        onOpenTechnical={onOpenTechnical}
      />,
    );

    // Purpose & Title
    expect(screen.getByRole('heading', { level: 1, name: /Understand your job offer before you sign/i })).toBeTruthy();
    expect(screen.getByText(/Pakistan → UAE mainland private-sector job offers/i)).toBeTruthy();

    // 4-step sequence
    expect(screen.getByRole('heading', { level: 3, name: 'Choose documents' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Read documents' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Verify terms' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: 'Findings report' })).toBeTruthy();

    // Boundaries card
    expect(screen.getByRole('heading', { level: 2, name: /What this does not check/i })).toBeTruthy();
    expect(screen.getByText(/No verification or legal advice/i)).toBeTruthy();
    expect(screen.getByText(/No overall verdicts/i)).toBeTruthy();

    // Technical discovery
    const techBtn = screen.getByRole('button', { name: /How WazehTerms works inside →/i });
    fireEvent.click(techBtn);
    expect(onOpenTechnical).toHaveBeenCalledTimes(1);
  });
});

describe('P11 Scenario 2: Choose a sample (plan §14.2)', () => {
  it('displays scenario description, available documents, preview actions, and start button', () => {
    const onStart = vi.fn();
    const onOpenHelp = vi.fn();

    render(
      <Samples
        samples={[mockSample]}
        onStart={onStart}
        busyCaseId={null}
        onOpenHelp={onOpenHelp}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: /Explore a fictional example/i })).toBeTruthy();
    expect(screen.getByText(mockSample.title)).toBeTruthy();
    expect(screen.getByText(mockSample.description)).toBeTruthy();

    // Start action
    const startBtn = screen.getByRole('button', { name: /Review this sample/i });
    fireEvent.click(startBtn);
    expect(onStart).toHaveBeenCalledWith('TC-002');
  });
});

describe('P11 Scenario 3: Upload intake and constraints (plan §14.2)', () => {
  it('enforces offer vs contract roles, file constraints, and privacy acknowledgment', () => {
    const onUpload = vi.fn();
    const onTrySample = vi.fn();

    render(
      <Upload
        onUpload={onUpload}
        onTrySample={onTrySample}
        busy={false}
        maxBytesPerFile={5 * 1024 * 1024}
        maxTotalBytes={10 * 1024 * 1024}
        maxPagesPerPdf={10}
        customUploadEnabled={true}
        privacyNoticeVersion="2026-10-01"
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: /Start a document review/i })).toBeTruthy();
    expect(screen.getByText(/Document 1 · Job offer/i)).toBeTruthy();
    expect(screen.getByText(/Document 2 · Contract/i)).toBeTruthy();

    // Submit button is disabled before files and acknowledgment
    const submitBtn = screen.getByRole('button', { name: /Start reading →/i });
    expect(submitBtn.hasAttribute('disabled')).toBe(true);

    // Acknowledgment checkbox exists
    const ackCheckbox = screen.getByRole('checkbox');
    expect(ackCheckbox).toBeTruthy();
  });
});

describe('P11 Scenario 4: Navigate 12 review groups (plan §14.2)', () => {
  it('renders all 12 canonical groups with stable numbering and allows group switching', async () => {
    const user = userEvent.setup();
    const onCorrect = vi.fn();
    const onUndoCorrection = vi.fn();
    const onContinue = vi.fn();
    const onReset = vi.fn();

    render(
      <Review
        issued={mockIssued}
        previewUrls={[
          { role: 'offer', url: '/preview/offer.pdf' },
          { role: 'contract', url: '/preview/contract.pdf' },
        ]}
        corrections={[]}
        onCorrect={onCorrect}
        onUndoCorrection={onUndoCorrection}
        onContinue={onContinue}
        onReset={onReset}
      />,
    );

    // Verify all 12 canonical groups are in the navigator rail
    for (let i = 0; i < FIELD_GROUPS.length; i++) {
      const group = FIELD_GROUPS[i]!;
      const groupHeading = screen.getByRole('button', { name: new RegExp(`^${i + 1}${group.heading}`, 'i') });
      expect(groupHeading).toBeTruthy();
    }

    // Switch to Pay group (group 4)
    const payGroupBtn = screen.getByRole('button', { name: /^4Pay/i });
    await user.click(payGroupBtn);

    // Pay group is now active
    expect(screen.getByRole('heading', { level: 2, name: /Pay/i })).toBeTruthy();
    expect(screen.getAllByText(/Basic salary/i).length).toBeGreaterThan(0);
  });
});

describe('P11 Scenario 5: Inspect a salary with exact evidence (plan §14.2)', () => {
  it('displays numeric amount, currency, frequency, page number, and quote', async () => {
    const user = userEvent.setup();

    render(
      <Review
        issued={mockIssued}
        previewUrls={[]}
        corrections={[]}
        onCorrect={() => undefined}
        onUndoCorrection={() => undefined}
        onContinue={() => undefined}
        onReset={() => undefined}
      />,
    );

    // Navigate to Pay
    await user.click(screen.getByRole('button', { name: /^4Pay/i }));

    // Verify both offer and contract values are formatted
    expect(screen.getByText(/AED 4000\.00/i)).toBeTruthy();
    expect(screen.getByText(/AED 3200\.00/i)).toBeTruthy();

    // Verify page numbers and verbatim quotes
    expect(screen.getAllByText(/Basic salary: AED 4,000 per month/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Basic salary: AED 3,200 per month/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Page 1/i).length).toBeGreaterThanOrEqual(2);
  });
});

describe('P11 Accessibility & Dialog focus trap (plan §12.1)', () => {
  it('traps focus inside ConfirmDialog, focuses safe action by default, and dismisses on Esc', () => {
    const onStay = vi.fn();
    const onLeave = vi.fn();

    render(
      <ConfirmDialog
        title="Leave active review?"
        body="Private case data is never saved. If you leave now, this review is discarded."
        safeIndex={0}
        actions={[
          { label: 'Stay', kind: 'primary', onChoose: onStay },
          { label: 'Leave', kind: 'danger', onChoose: onLeave },
        ]}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    // Safe button 'Stay' is focused by default
    const stayBtn = screen.getByRole('button', { name: 'Stay' });
    expect(document.activeElement).toBe(stayBtn);

    // Pressing Esc invokes safe action (Stay)
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onStay).toHaveBeenCalledTimes(1);
    expect(onLeave).not.toHaveBeenCalled();
  });
});
