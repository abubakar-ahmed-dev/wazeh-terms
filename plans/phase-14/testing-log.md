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

## Live deployment smoke (2026-09-30, owner-authorized)

- Deploys: `wazehterms-00001-zec` (first, 2593727) → `00002-t6q`/`00003-85h`
  (drain fix) → `00004-zvd` (measured limits) → **`00005-m7x`, image
  `sha256:a80d10eb…`, serving 100%**.
- Routes: health/capabilities/samples/SPA/PDF all 200.
- Headers: full CSP, `X-Frame-Options: DENY`, `nosniff`, `no-referrer`,
  `no-store`; zero `Access-Control-Allow-*`; OPTIONS preflight ungranted.
- Extractions: TC-001 (signed complete), TC-002/TC-013 200, TC-014 complete
  with `matched_text` evidence (Gemini read the synthetic "unreadable" page
  on the live path — the fixture `partial` path remains e2e-only; honest
  observation, not a defect), TC-012 200.
- TC-012 analysis: live `source_backed_concern` (category) — rule
  `ae-recruitment-costs-employer-bears` rev 1, source
  `uae-federal-decree-law-33-2021` `base-text-2022`, pinpoint Article (6)
  clause (4), official download URL. Phase 10 mapping verified in production.
- Upload gate: arbitrary multipart → clean `403 CUSTOM_UPLOAD_DISABLED`
  envelope. (Earlier curl 000s were a Windows-curl local-path issue,
  confirmed via `curl: (26)`, not a server defect; the drain-before-403
  hardening stays.)
- Withheld rules: 2 concerns withheld (`trigger_unregistered`,
  `unmappable_candidate`) — correct fail-closed; reasons now visible via the
  `retrieval_outcome` coarse log. First deploy attempt withheld Rule 1 too
  (retrieval fast-fail at 8 s budget; 15 s budget fixed it — but KB→rule
  mapping varies run to run; nondeterministic mapping is a known weakness
  recorded for Phase 15 evaluation).
- Rollback drill: traffic shifted to `00004-zvd` (health 200) and back to
  `00005-m7x` (health 200).
- Not yet run: full Playwright journey against the live URL (curl-level
  smoke only) — recorded as remaining evidence for the release.

## MT-10 demo-upload release verification (2026-10-02)

- Gemini key rotated by owner (prepayment credits exhausted on 2026-10-01 —
  all extraction 503'd locally and in production; `402 RESOURCE_EXHAUSTED`
  confirmed by direct API probe). New Free-tier key verified (`200` probe);
  Secret Manager `gemini-api-key` version 2 created, version 1 disabled;
  revision binds `gemini-api-key:2`.
- Local fictional-PDF upload e2e: multipart → 200, `status: complete`,
  signed, 33 fields, `sourceMode: custom`.
- Production: `/capabilities` reports `customUploadEnabled: true`,
  `privacyNoticeVersion: gemini-free-demo-v1`; fictional-PDF upload through
  the live URL → complete signed extraction; sample path 200.
- Upload UI: "Demo uploads only" warning, full Free-tier notice with
  unticked acknowledgment gating "Try with a fictional PDF", honest
  closed-state copy (no env-var instructions in public UI).
- **Ops incident recorded:** a second agent deployed revisions `00007`/
  `00008` concurrently without the env file while traffic stayed pinned to
  `00006` (bound to disabled secret v1) → 500s. Fixed by redeploying
  `00009-stc` with full config and forcing 100% traffic + re-pointing the
  `staging` tag. Rule going forward: one deploy actor at a time.
- Residual risk (accepted by owner, recorded in MT-10): the notice cannot
  guarantee users upload only fictional documents. Rollback: set
  `CUSTOM_UPLOAD_ENABLED: "false"` + redeploy.
