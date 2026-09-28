/**
 * Shared error envelope and request IDs from `docs/API.md` §7. Error
 * envelopes never echo raw document text, full filenames, original quotes,
 * signed extractions, provider responses, or credentials.
 */
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { StageStatusSchema } from './stage-status.js';

export const ErrorCodeSchema = z.enum([
  // 400
  'BAD_REQUEST',
  'DUPLICATE_DOCUMENT_ROLE',
  // 403
  'CUSTOM_UPLOAD_DISABLED',
  // 409
  'REVIEW_VERSION_UNSUPPORTED',
  // 410
  'REVIEW_EXPIRED',
  // 413
  'FILE_TOO_LARGE',
  'REQUEST_TOO_LARGE',
  'TOO_MANY_PAGES',
  // 415
  'UNSUPPORTED_MEDIA_TYPE',
  // 422
  'UNREADABLE_DOCUMENT',
  'INVALID_CORRECTION',
  'REVIEW_INVALID',
  // 429
  'RATE_LIMITED',
  'SERVICE_BUSY',
  // 502/503
  'EXTRACTION_UNAVAILABLE',
  'REFERENCE_UNAVAILABLE',
  // 504
  'ANALYSIS_TIMEOUT',
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ErrorEnvelopeSchema = z.strictObject({
  error: z.strictObject({
    code: ErrorCodeSchema,
    message: z.string().min(1).max(500),
    stage: StageStatusSchema.optional(),
    retryable: z.boolean(),
  }),
  requestId: z.string().min(1).max(64),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

/**
 * Public correlation ID for safe operations tracing — never a stored report
 * ID (docs/API.md §1).
 */
export function newRequestId(): string {
  return `req_${randomUUID()}`;
}
