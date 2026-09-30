/**
 * Typed client for the two-step /api/v1 flow (docs/API.md). Same-origin
 * fetch only; errors surface as ApiError with the documented envelope code.
 */
import type {
  AnalysisResponse,
  ApiErrorBody,
  Capabilities,
  CorrectionDelta,
  ExtractionResponse,
  IssuedExtraction,
  Proof,
  SampleEntry,
} from './types';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterSeconds: number | null;

  constructor(status: number, code: string, message: string, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'The service could not be reached.');
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => undefined)) as ApiErrorBody | undefined;
    const retryAfter = response.headers.get('Retry-After');
    throw new ApiError(
      response.status,
      body?.error.code ?? 'UNKNOWN',
      body?.error.message ?? 'The request did not succeed.',
      retryAfter !== null && !Number.isNaN(Number(retryAfter)) ? Number(retryAfter) : null,
    );
  }
  return (await response.json()) as T;
}

export function getCapabilities(): Promise<Capabilities> {
  return request<Capabilities>('/api/v1/capabilities');
}

export function getSamples(): Promise<{ samples: SampleEntry[] }> {
  return request<{ samples: SampleEntry[] }>('/api/v1/samples');
}

export function extractSample(sampleCaseId: string, signal?: AbortSignal): Promise<ExtractionResponse> {
  return request<ExtractionResponse>('/api/v1/extractions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sampleCaseId }),
    signal,
  });
}

export function extractCustom(
  files: { offer?: File | null; contract?: File | null },
  scope?: object,
  signal?: AbortSignal,
): Promise<ExtractionResponse> {
  const formData = new FormData();
  if (scope) {
    formData.append('scope', JSON.stringify(scope));
  }
  if (files.offer) {
    formData.append('offer', files.offer, files.offer.name);
  }
  if (files.contract) {
    formData.append('contract', files.contract, files.contract.name);
  }

  return request<ExtractionResponse>('/api/v1/extractions', {
    method: 'POST',
    body: formData,
    signal,
  });
}

export function analyze(
  issuedExtraction: IssuedExtraction,
  proof: Proof,
  corrections: CorrectionDelta[],
  signal?: AbortSignal,
): Promise<AnalysisResponse> {
  return request<AnalysisResponse>('/api/v1/analyses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ issuedExtraction, proof, corrections }),
    signal,
  });
}
