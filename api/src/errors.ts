/**
 * Application error carrying the documented envelope fields
 * (docs/API.md §7). Route handlers throw; the central error mapper in
 * `server/app.ts` converts to the envelope. `INTERNAL_ERROR` is the one
 * addition to the API.md example-code list, for unexpected failures that
 * must still answer with a safe envelope.
 */
import type { ErrorCode, StageName } from './contracts/index.js';

export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly retryable: boolean;
  readonly stage?: StageName;
  readonly retryAfterSeconds?: number;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    options: { retryable?: boolean; stage?: StageName; retryAfterSeconds?: number } = {},
  ) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.stage = options.stage;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}
