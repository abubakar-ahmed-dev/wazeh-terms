# Security hardening — Implementation Log

Branch: `security-hardening` (deliberately off `dev` without a phase number per user direction).
Authority: `docs/SECURITY.md` (§3–§7), `docs/API.md` §7, `plans/master-plan.md` Phase 13.
Date: 2026-09-30
Status: Complete

## What changed (files)

- `api/src/config.ts` — Added `security: { rateLimitMax, rateLimitWindowMs, maxConcurrentExtractions }` to `AppConfig`, `loadConfig`, and `configSourceSummary`.
- `api/src/errors.ts` — Added `retryAfterSeconds?: number` property and constructor option to `HttpError`.
- `api/src/server/admission.ts` (new) — Per-instance in-memory rate limiter (`429 RATE_LIMITED` + `Retry-After`) and concurrency limiter (`503 SERVICE_BUSY` + `Retry-After`).
- `api/src/server/security-headers.ts` (new) — CSP (`default-src 'self'`, `frame-src 'self' blob:`, no unsafe-inline scripts), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and explicit removal of CORS headers.
- `api/src/server/app.ts` — Mounted security headers middleware, mounted rate limiter on `/api/v1/extractions` and `/api/v1/analyses`, mounted concurrency limiter on `/api/v1/extractions`, added `Retry-After` header propagation, and mapped Express body-parser 413 to `413 REQUEST_TOO_LARGE`.
- `api/src/services/gemini/types.ts` — Added optional `signal?: AbortSignal` to `GeminiExtractionRequest`.
- `api/src/services/gemini/gemini-http.ts` — Wired `request.signal` listener to internal `AbortController` to abort provider call on client disconnect.
- `api/src/routes/extractions.ts` — Wired `req.on('close')`/`res.on('close')` disconnect cancellation; if client socket terminates before extraction finishes, skips downstream mapping, signing, and response.
- `api/src/routes/analyses.ts` — Wired client disconnect detection to halt work before response dispatch.
- `web/vite.config.ts` — Added dev server proxy (`/api`, `/samples`, `/health` → `http://localhost:3000`) for zero-CORS local development without adding permissive headers in Express.
- `api/test/security/admission.test.ts` (new) — Rate limit and concurrency admission tests.
- `api/test/security/cancellation.test.ts` (new) — Abort signal and client disconnect tests.
- `api/test/security/zero-retention.test.ts` (new) — Zero filesystem artifact assertions.
- `api/test/security/security-headers.test.ts` (new) — CSP, frame options, and zero-CORS header assertions.
- `api/test/security/logging-redaction.test.ts` (new) — Structured logging redaction assertions.
- `api/test/security/security-parser.test.ts` (new) — Pathological inputs, MIME mismatch, page bomb, and TC-015 prompt injection tests.
- `api/test/security/hmac-abuse.test.ts` (new) — Replay, expiry, keyId, and payload tampering tests.
- `plans/security-hardening/testing-log.md` — Test evidence and `SECURITY.md §7` checklist mapping.

## Key Decisions

1. **In-Memory Rate & Concurrency Limiting**: Implemented hand-rolled in-memory counters per instance without Redis or external dependencies, adhering strictly to ADR-008 and keeping dependencies minimal. Documented per-instance fleet limitation.
2. **Disconnect Detection**: Node's `req.destroyed` is set to `true` when request streaming completes normally, so disconnect detection checks `res.destroyed && !res.writableFinished` and listens on `res.on('close')` / `req.on('close')`.
3. **Same-Origin Dev Proxy**: Adhering to ADR-008 (no CORS middleware on Cloud Run), added Vite dev proxy so local development on port 5173 communicates with port 3000 without CORS friction while maintaining identical production security posture.
4. **Body-Parser 413 Mapping**: Standardized Express `entity.too.large` error mapping to the documented `413 REQUEST_TOO_LARGE` envelope.

## Validation Performed

- `npm run lint`: 0 errors, 0 warnings across all workspaces.
- `npm run typecheck`: 0 errors across `api`, `web`, and `sanity-studio`.
- `npm run test`: 51 API test files (314 tests) and 2 Web test files (5 tests) passed (100% green).
- `npm run build`: Production builds succeeded; verified `index.html` has zero inline scripts.
