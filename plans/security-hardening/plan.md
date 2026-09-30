# Phase 13 — Security hardening + abuse-focused tests

Branch: `phase-13-custom-uploads` from `dev`. Authority: `docs/SECURITY.md`
(§3–§7), `docs/API.md` §7, `plans/master-plan.md` Phase 13.

**Already delivered on this branch (logged in `implementation-log.md`):**
streaming multipart pipeline (`busboy`, magic/MIME, size/page limits, scope
validation, `403 CUSTOM_UPLOAD_DISABLED` gate at `routes/extractions.ts`),
`Upload.tsx` with in-memory blob previews, `custom-upload.test.ts`, request
deadline in the extraction route, Gemini hard-abort at deadline
(`gemini-http.ts` AbortController). Zero-disk design: no temp files anywhere
in `api/src`. **This plan covers the remaining master-plan scope only.**
The upload capability flag stays `false` in every committed/default config
until MT-10 passes — UI must stay capabilities-driven (nav shows Upload only
when `/capabilities` says `customUploadEnabled: true`).

## Deliverables

1. **Admission control (rate + concurrency).** Per-instance middleware on
   `POST /api/v1/extractions` and `POST /api/v1/analyses`:
   - Fixed-window or token-bucket request cap (config via env, e.g.
     `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS`, sensible sample-mode default)
     → `429 RATE_LIMITED` + `Retry-After`.
   - In-flight extraction concurrency cap (`MAX_CONCURRENT_EXTRACTIONS`) →
     `503 SERVICE_BUSY` + `Retry-After` when saturated.
   - Both errors use the documented envelope; counts are coarse (no IDs).
   - Document the fleet-wide limitation: per-instance only, shared/edge
     control deferred until custom uploads open (`SECURITY.md` §6).
2. **Disconnect cancellation.** Wire `req.on('close')`/`aborted` so an
   abandoned request aborts the in-flight Gemini call (extend the existing
   AbortController path) and skips further work; test that a disconnected
   request stops provider work and releases buffers.
3. **Zero-retention proof.** Component test asserting no temp files are
   created during extraction (success, failure, disconnect, deadline) —
   the design is memory-only; keep it that way (`SECURITY.md` §2).
4. **Security headers middleware** (API + SPA responses):
   `Content-Security-Policy` (`default-src 'self'`; PDF preview needs
   `frame-src 'self'`; no `unsafe-inline` scripts — verify the Vite build
   emits no inline scripts), `X-Frame-Options: DENY` or CSP
   `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`,
   `X-Content-Type-Options: nosniff`. Existing `Cache-Control: no-store`
   stays; static hashed assets keep their 1h max-age. Verify CSP does not
   break the SPA, sample PDF iframes, or self-hosted fonts; add a test.
5. **Logging redaction tests.** Assertions that structured logs (happy path
   + each error class + malformed/oversized requests + crafted hostile
   inputs) contain: request ID, route, status, timing, coarse codes only —
   never request bodies, raw quotes/passages, filenames, prompts, signed
   extractions, proof values, or secrets (`SECURITY.md` §6). Fix any leak
   the tests find.
6. **Parser hardening tests** (extend `custom-upload.test.ts` + new
   `security-parser.test.ts`):
   - MIME/magic mismatch, fake `%PDF-` header on a non-PDF body.
   - Page bomb: PDF engineered for pathological page/text explosion must
     hit `TOO_MANY_PAGES`/deadline, not exhaust memory (bound pdfjs
     resources if the current path lacks limits).
   - Oversized stream: bytes beyond `MAX_TOTAL_BYTES` rejected mid-stream
     before full buffering.
   - Hostile filename field (path/control characters) treated as inert —
     never joined into a path, never logged.
   - Embedded instructions (`ignore previous instructions…`) in PDF text
     treated as data: extraction output still passes schema + evidence
     verification; corpus case **TC-015** asserted end-to-end (e2e-server
     fixture path) to produce data-only treatment, no instruction effect.
7. **Signed-payload abuse tests** (audit existing HMAC tests, add missing):
   replay-within-TTL (accepted — acknowledged limitation in docs, not
   silently "fixed"), expired proof → `410 REVIEW_EXPIRED`, unknown
   `keyId` → `REVIEW_INVALID` without key detail, tampered scope/field/
   evidence after signing → `REVIEW_INVALID`, oversized signed payload →
   size limit before signature work, wrong `schemaVersion` →
   `409 REVIEW_VERSION_UNSUPPORTED`, timing-safe comparison confirmed.
8. **SECURITY.md §7 mapping.** Testing log records each §7 item 2–4 with
   the test(s) that demonstrate it at component level; item 1 wording check
   and item 5 belong to Phase 14 deployment.
9. **CORS posture — same-origin by design (ADR-008); make it true in dev.**
   - Production needs no CORS: the Cloud Run service serves the SPA and
     `/api/v1` on one origin, and `web/src/lib/api.ts` uses relative paths,
     so the browser never issues a preflight. **Do not add `cors`
     middleware.** Absent `Access-Control-Allow-*` headers is the control:
     other origins' JavaScript cannot read API responses (protects provider
     spend). JSON `content-type` on `/analyses` forces preflight → blocked.
   - Dev friction fix: add a Vite dev proxy (`server.proxy`: `/api`,
     `/samples`, `/health` → `http://localhost:3000`) to
     `web/vite.config.ts` so `vite` + api run same-origin behind :5173 and
     no CORS error can appear in local development. Dev-only config, no
     runtime effect.
   - Tests: (a) API responses carry no `Access-Control-Allow-*` headers;
     (b) an `OPTIONS` preflight to `/api/v1/extractions` gets no permissive
     CORS response; (c) a hostile `Origin` header changes nothing server-side
     — `Origin`/`Referer` are never client authentication (`SECURITY.md`
     §4) — while browsers stay blocked by header absence; (d) residual risk
     documented: a cross-site no-preflight post (`multipart/form-data` is a
     "simple" request) reaches the API like any anonymous request — bounded
     by the closed custom-upload gate (MT-10) and item 1 admission control.
   - Any future cross-origin consumer (new frontend origin, partner) needs a
     superseding ADR with an explicit origin allowlist — never `*` with
     credentials.

## Non-goals

No custom-upload gate change (MT-10 open; flag stays false in defaults), no
JPG/PNG or Urdu path, no shared/edge rate limiting, no CORS middleware or
cross-origin grants, no new dependencies beyond what admission control needs
(prefer hand-rolled in-memory counters — no Redis), no WAF/DDoS posture
(Cloud Run + budget alert noted in Phase 14).

## Tests / validation

- New admission/cancellation/headers/redaction/parser/HMAC-abuse/CORS suites
  all green; full regression (`lint`, `typecheck`, unit/integration, web
  tests, builds) stays green.
- Manual probe: `curl` burst against local dev server shows `429`/`503`
  envelopes with `Retry-After`; CSP headers present on `/` and `/api/*`;
  `curl -i -X OPTIONS` shows no CORS grant.
- Dev check: `vite` + api via proxy completes a sample journey in the
  browser with zero console CORS errors.
- UI check: with flag false, nav does not advertise upload once capabilities
  load; upload API attempt gets the honest `403` panel.

## Exit criteria

`SECURITY.md` §7 items 2–4 demonstrably pass at component level with tests
recorded in the testing log; misleading UI states fixed; no sensitive data
in logs by test evidence; same-origin posture verified in dev and documented
for deployment; master-plan Phase 13 bullets all delivered.

## Owner decisions needed

- Rate/concurrency default numbers (plan proposes defaults; owner may set
  stricter values for the public Cloud Run env file in Phase 14).
- Whether upload nav stays visible during capabilities load (proposed: show
  Examples until capabilities confirm upload is enabled).
