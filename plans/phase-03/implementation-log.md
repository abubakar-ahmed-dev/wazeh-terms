# Phase 03 — implementation log

Branch: `phase-03-extraction` (from `dev` @ `1ce57f4`; plan committed first per
the plan-on-branch workflow). Dates: 2026-09-28 → 2026-09-29.

## What was changed

`POST /api/v1/extractions` works end to end for the allowlisted sample
(fail-closed when the provider is unavailable), plus `GET /api/v1/capabilities`,
`GET /api/v1/samples`, `GET /health`, and fixed same-origin sample previews.
No analysis endpoint, no comparison logic.

- **Config** (`config.ts`): centralized zod-checked env loader for the
  DEPLOYMENT.md §2 names; empty template fields count as unset; optional-with-
  degradation semantics (missing key/secret ⇒ fail-closed `503`); nonsecret
  additions `REVIEW_HMAC_KEY_ID` (default `key-1`), `REVIEW_TTL_MS`
  (default 30 min), `GEMINI_MODEL` (owner directive: `gemini-3.5-flash`).
  `configSourceSummary()` reports which variables are SET, never values.
- **Logging** (`logging.ts`): one coarse JSON line per request (requestId,
  route, outcome, status, duration, errorClass) — the only `console` module
  (eslint override); redaction suite asserts no content leaks.
- **Server** (`server/app.ts`, `server/index.ts`): DI app factory (tests use
  fakes), bounded JSON body, `no-store` on `/api/*` + `/health`, request IDs,
  error envelope mapper with `INTERNAL_ERROR` fallback, real bootstrap with
  fail-closed placeholder service when the key is absent. Replaces the
  Phase 01 placeholder dev script target.
- **Sample manifest** (`content/samples-manifest.ts`): server-side allowlist,
  `sampleCaseId` = manifest key (regex-checked, never a path); TC-002 with
  declared scope + fixed preview URLs.
- **Admission** (`routes/extractions.ts`, `services/pdf-structure.ts`):
  multipart ⇒ `403 CUSTOM_UPLOAD_DISABLED` before any read; unknown id ⇒ 400;
  size/total limits, `%PDF-` magic bytes, pdf-lib parse + page count +
  encryption detection all before any provider call (`413/415/422` mapping).
- **Gemini client** (`services/gemini/*`): interface + `@google/genai` HTTP
  impl — inline base64 PDFs, JSON response mime, temperature 0, two-attempt
  budget on schema-invalid/malformed output, deadline abort, typed
  unavailable/timeout outcomes with coarse `errorClass`; registry-driven
  prompt with untrusted-document-text and verbatim-quote rules. Provider
  request/response content never logged.
- **Mapper** (`services/extraction/*`): model-output schema (untrusted,
  non-strict) → Phase 02 contracts: unknown fieldKeys dropped, invalid values
  downgraded (never rewritten), present-without-evidence → `unclear`, honest
  `model_transcription` verification everywhere (Phase 04 adds text matching),
  opaque document IDs, server-assigned instanceIds, sha256 digests,
  per-document extractionStatus, `NothingUsableError` ⇒ `422` with no proof.
- **Read-only routes** (`routes/read-only.ts`) + static previews from the
  manifest only (traversal-safe).
- **Live script** (`scripts/live-extraction.ts`): boots the app, runs TC-002
  against the real provider, prints coarse counts/timings only.
- `.env.example`: added the three nonsecret config names above.
- Dependencies: `pdf-lib`, `@google/genai` (runtime), `supertest` (dev).

## Decisions / deviations

- **`INTERNAL_ERROR` code added** to the Phase 02 `ErrorCodeSchema`: API.md §7
  lists *example* codes; unexpected failures still need a safe envelope.
  Documented here; fold into `docs/API.md` at the documentation-alignment
  phase if accepted.
- **Envelope `stage` semantics corrected** to stage *names* (API.md §7 example
  `"stage": "review"`); Phase 02 had used `StageStatus` values.
- **Error outcomes carry `errorClass`** (e.g. `ApiError:402`) — API.md/SECURITY
  permit coarse provider error classes; message bodies stay out of logs.
- **All evidence is `model_transcription` in this phase** by design; the
  text-layer match upgrade is Phase 04's scope.
- **Model default `gemini-3.5-flash`** per owner instruction; verified as a
  valid model id against the live API.
- Retry budget (2 attempts) covers schema-invalid/malformed output only;
  provider/network errors fail closed immediately (bounded cost).

## Files/components affected

New: `api/src/{config,errors,logging}.ts`, `api/src/server/*` (2),
`api/src/routes/*` (3), `api/src/content/*` (1), `api/src/services/*` (6),
`api/src/scripts/live-extraction.ts`, `api/test/phase-03/*` (7).
Changed: `api/package.json` (scripts + deps), `api/eslint.config.mjs`
(console overrides), `.env.example` (3 nonsecret names), root
`package-lock.json`.

## Validation

See `testing-log.md`: offline suites 83/83 api + 1/1 web, lint/typecheck/build
green, redaction and D2 assertions included. **Live run blocked**:
`ApiError:402` — AI Studio prepayment credits depleted on the owner's
GCP-linked project. Owner action: add credits at ai.studio/projects; rerun
`npm run live:sample -w api` and update the testing log. Model id itself
verified valid. No content was printed or logged during diagnosis.

## Remaining issues

- Live extraction gate pending owner credits (only unmet exit criterion).
- Open owner items: MT-2 dataset decision (Phase 08), MT-4 source verification
  (09), MT-5 KB endpoint (10), MT-7 GCP deploy pieces (14) — GCP project +
  billing now exist (owner confirmed 2026-09-29); provider account statement
  for the notice: "Google AI Studio standard tier, key imported from GCP
  project" recorded for Phases 13–14 notice work.
