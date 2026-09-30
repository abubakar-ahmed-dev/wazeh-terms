# Phase 14 — Testing Log

Date: 2026-09-30. Environment: Windows 10, Docker Desktop 29.8.0,
gcloud 583.0.0, node 22 (bookworm-slim in image).

## Local runtime gate (node dist, no tsx)

- `npm run build -w api && npm run build -w web` — clean.
- `node api/dist/server/index.js` (cwd `api/`, real `api/.env`):
  - `/health` 200, `/api/v1/capabilities` 200, SPA `/` 200,
    `/samples/TC-001/offer.pdf` 200.
  - `POST /api/v1/extractions {"sampleCaseId":"TC-001"}` → 200,
    `status: complete`, signed (`issuedExtraction` + `signature`) via real
    Gemini (`gemini-3.5-flash-lite`).

## Image build + policy check

- `docker build -t wazehterms:local .` — success (multi-stage; fixed one
  issue: api deps install unhoisted, added
  `COPY --from=runtime-deps /app/api/node_modules`).
- Container probes (port 8081): `/health` 200, capabilities 200, SPA 200,
  sample PDF 200.
- Fail-closed check: no `GEMINI_API_KEY` → `POST /extractions` →
  `503 {"code":"EXTRACTION_UNAVAILABLE"}`.
- Policy: `/app/fixtures/samples` contains exactly `TC-001, TC-002,
  TC-012, TC-013, TC-014`; no `.env` / `test-corpus` / `sources` /
  `docs` / `plans` / `sanity-studio` inside; runs as user `node`;
  `dist/server/index.js` + `web/dist/index.html` present.

## Secrets / IAM (setup verification)

- Four secrets created, version 1 (values never echoed).
- Runtime SA bindings returned `roles/secretmanager.secretAccessor` ×4 and
  `roles/artifactregistry.reader`.
- Not yet exercised end-to-end from a deployed revision (needs the deploy
  step; owner-run).

## Regression (working tree = security-hardening changes + Phase 14 files)

- `npm run lint` — clean (both workspaces).
- `npm run typecheck` — clean (both workspaces).
- `npm test` — **api 51 files / 314 tests passed** (after the cancellation
  flake fix); **web 2 files / 5 tests passed**.
- Builds: api tsc + web vite — clean.

## Not yet run (requires deploy — owner gate)

- Staging smoke at the tag URL (five samples, partial path,
  `403 CUSTOM_UPLOAD_DISABLED`, source-backed TC-012 citation, log audit,
  same-origin/CORS check).
- Secret resolution from a deployed revision.
- Measured limits, rollback drill, production smoke, release record.
