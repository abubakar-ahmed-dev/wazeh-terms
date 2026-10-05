/**
 * Journey-state contract tests (P6 §R30): stale responses never hijack
 * (issue 31), abort-on-leave, retry respects expiry + no duplicate submits
 * (issue 4), leave-confirm guards active work (issue 3).
 * Fake timers for the whole file; flush() pumps microtasks. Clicks use
 * fireEvent (RTL act-wrapped); typing is not needed in this suite.
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, analyze, extractSample } from './lib/api';
import { App } from './App';
import type { AnalysisResponse, ExtractionResponse } from './lib/types';

vi.mock('./lib/api', () => ({
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
      public retryAfterSeconds: number | null = null,
    ) {
      super(message);
    }
  },
  getCapabilities: vi.fn(() =>
    Promise.resolve({
      apiVersion: 'v1',
      sampleModeEnabled: true,
      customUploadEnabled: true,
      acceptedCustomMimeTypes: ['application/pdf'],
      supportedAnalysisLanguages: ['en'],
      maxDocuments: 2,
      maxBytesPerFile: 8388608,
      maxTotalBytes: 16777216,
      maxPagesPerPdf: 15,
      maxCorrections: 100,
      sourceBackedChecks: 'available',
      privacyNoticeVersion: 'test-v1',
    }),
  ),
  getSamples: vi.fn(() =>
    Promise.resolve({
      samples: [
        {
          sampleCaseId: 'TC-001',
          title: 'Fictional consistent pair',
          description: 'A pair.',
          documents: [
            { role: 'offer', previewUrl: '/s/o.pdf' },
            { role: 'contract', previewUrl: '/s/c.pdf' },
          ],
        },
      ],
    }),
  ),
  extractSample: vi.fn(),
  extractCustom: vi.fn(),
  analyze: vi.fn(),
}));

const extractMock = vi.mocked(extractSample);
const analyzeMock = vi.mocked(analyze);

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void } {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const extractionPayload: ExtractionResponse = {
  issuedExtraction: {
    schemaVersion: 1,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    scope: { origin: 'PK', destination: 'AE', declaredRegime: 'uae_mainland_private', declaredWorkerCategory: 'non_domestic' },
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
            rawText: 'Basic salary: AED 2,400',
            value: { kind: 'money', amount: '2400.00', currency: 'AED', frequency: 'monthly', component: 'basic_salary', payer: null },
            evidence: [{ documentId: 'doc-offer', page: 1, quote: 'Basic salary: AED 2,400', verification: 'matched_text' }],
            qualityNotes: [],
          },
        ],
      },
    ],
  },
  proof: { schemaVersion: 1, mac: 'mac', algorithm: 'HMAC-SHA256', keyId: 'k' },
  status: 'complete',
  notices: [],
} as unknown as ExtractionResponse;

const reportPayload = {
  requestId: 'r',
  status: 'complete',
  reviewedAsOf: '2026-10-04T10:00:00Z',
  scopeApplicability: 'supported',
  stages: { extraction: 'completed', review: 'completed', comparison: 'completed', retrieval: 'completed', applicability: 'completed', explanation: 'completed' },
  coverage: { documentIds: ['doc-offer'], checkedFieldKeys: ['basic_salary'], unreadableFieldKeys: [], omittedChecks: [] },
  findings: [],
  summary: 'done',
  limitations: [],
  officialNextSteps: [],
} as unknown as AnalysisResponse;

const flush = (ms = 10) => vi.advanceTimersByTimeAsync(ms);

async function startReview(): Promise<void> {
  render(<App />);
  await flush();
  await flush();
  fireEvent.click(screen.getByRole('button', { name: 'Fictional Samples' }));
  await flush();
  fireEvent.click(screen.getByRole('button', { name: /Review this sample/ }));
  await flush();
  await flush();
  screen.getByText('Check what we read', { selector: 'h1' });
}

beforeEach(() => {
  vi.useFakeTimers();
  extractMock.mockReset();
  analyzeMock.mockReset();
  window.history.pushState({}, '', '/');
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('journey contract (R30)', () => {
  it('a stale extraction response never hijacks a newer journey (issue 31)', async () => {
    const first = deferred<ExtractionResponse>();
    const second = deferred<ExtractionResponse>();
    extractMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    render(<App />);
    await flush();
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Fictional Samples' }));
    await flush();
    fireEvent.click(screen.getByRole('button', { name: /Review this sample/ }));
    await flush();
    expect(screen.getByText('Reading the documents')).toBeTruthy();

    // Leave the pending screen (no active work yet → abort quietly, no prompt).
    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    // The mocked fetch ignores the signal; emulate the abort rejection a real
    // fetch performs, then let the finally clear the busy flag.
    first.reject(new DOMException('Aborted.', 'AbortError'));
    await flush();
    expect(screen.queryByText('Reading the documents')).toBeNull();

    // Second journey starts; first response resolves late and must be ignored.
    fireEvent.click(screen.getByRole('button', { name: 'Fictional Samples' }));
    await flush();
    fireEvent.click(screen.getByRole('button', { name: /Review this sample/ }));
    await flush();
    first.resolve(extractionPayload);
    second.resolve(extractionPayload);
    await flush();
    await flush();
    // Exactly one review — the second journey's — and the stale first
    // response never hijacked it.
    expect(screen.getAllByText('Check what we read', { selector: 'h1' })).toHaveLength(1);
    expect(window.location.pathname).toBe('/review');
  });

  it('leaving an active review asks first; Stay keeps everything', async () => {
    extractMock.mockResolvedValue(extractionPayload);
    await startReview();

    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Stay' }));
    await flush();
    expect(screen.getByText('Check what we read', { selector: 'h1' })).toBeTruthy();
  });

  it('Leave confirms the full reset and lands on the destination', async () => {
    extractMock.mockResolvedValue(extractionPayload);
    await startReview();

    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    await flush();
    expect(screen.queryByText('Check what we read')).toBeNull();
  });

  it('analysis retry resends the same review, shows Retry-After, never double-submits (issue 4)', async () => {
    extractMock.mockResolvedValue(extractionPayload);
    await startReview();
    analyzeMock.mockRejectedValueOnce(new ApiError(429, 'RATE_LIMITED', 'The service is busy.', 3)).mockResolvedValueOnce(reportPayload);

    fireEvent.click(screen.getByRole('button', { name: /Continue to findings/ }));
    await flush();
    expect(screen.getByText('Comparing written terms and checking sources')).toBeTruthy();

    await flush(100);
    const retryButton = screen.getByRole('button', { name: /Try again available in 3s/ }) as HTMLButtonElement;
    expect(retryButton.disabled).toBe(true);

    fireEvent.click(retryButton);
    await flush();
    expect(analyzeMock).toHaveBeenCalledTimes(1);

    await flush(3000);
    const enabled = screen.getByRole('button', { name: 'Try again' }) as HTMLButtonElement;
    expect(enabled.disabled).toBe(false);
    fireEvent.click(enabled);
    await flush();
    expect(screen.getByText('Your document review')).toBeTruthy();
    expect(analyzeMock).toHaveBeenCalledTimes(2);
  });
});
