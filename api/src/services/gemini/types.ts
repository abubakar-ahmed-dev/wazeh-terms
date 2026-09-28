/**
 * Gemini extraction service interface (root CLAUDE.md: provider calls live
 * behind service interfaces). Everything downstream depends on this type,
 * never on the SDK.
 */
export interface GeminiDocumentInput {
  readonly role: 'offer' | 'contract';
  /** Base64 of the PDF bytes. */
  readonly pdfBase64: string;
}

import type { ModelExtraction } from '../extraction/model-output.js';

export interface GeminiExtractionRequest {
  readonly documents: readonly GeminiDocumentInput[];
  /** Remaining application deadline in milliseconds. */
  readonly deadlineMs: number;
}

export type GeminiExtractionOutcome =
  | { readonly ok: true; readonly modelJson: ModelExtraction; readonly attempts: number; readonly providerMs: number }
  | {
      readonly ok: false;
      readonly reason: 'unavailable' | 'timeout';
      /** Coarse provider error class (e.g. `ApiError:402`) — never a message body. */
      readonly errorClass?: string;
      readonly attempts: number;
      readonly providerMs: number;
    };

export interface GeminiExtractionService {
  extract(request: GeminiExtractionRequest): Promise<GeminiExtractionOutcome>;
}
