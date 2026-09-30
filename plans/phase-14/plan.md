# Phase 14 — Deployment: container, Cloud Run, smoke, release record

Master plan Phase 14. One public Cloud Run service (ADR-008) serving built
React + Express from a verified Dockerfile, staging → production, Secret
Manager bindings, measured limits, five-sample smoke, release record,
rollback demonstrated once. No deploy happens before Phase 13 lands.

## Prerequisites (already satisfied / blocking)

- **Done:** MT-7 GCP setup (project `wazeh-terms`, region `asia-south1`,
  Artifact Registry `wazehterms`, runtime SA
  `wazehterms-runtime@wazeh-terms.iam.gserviceaccount.com`, deploy identity =
  owner account, $1 budget alert exists, sole release operator = owner,
  backup not assigned).
- **Done:** Phase 10 live retrieval checks passed → rule-backed findings may
  be active at first public deploy (with live `SANITY_ORGANIZATION_TOKEN`,
  `SANITY_KB_ID`, canonical read).
- **Blocking:** Phase 13 (security hardening) must merge before any public
  Cloud Run deploy — master plan dependency. This phase starts after that.
- MT-8 HMAC secret already exists locally (`api/.env`); at deploy time it
  moves to Secret Manager (pinned version) per MT-8 step 3.
- MT-10 stays open → `CUSTOM_UPLOAD_ENABLED=false` and stays false.

## Deliverables

1. **Local runtime gate (before Dockerfile).** Prove the built app runs
   without `tsx`: `npm run build -w api && npm run build -w web`, then
   `node api/dist/server/index.js` with a temporary `.env`; verify
   `/health`, `/api/v1/capabilities`, one sample extraction end-to-end,
   and static `web/dist` serving from the same process. This validates the
   layout the image will use (`/app/api/dist`, `/app/web/dist`,
   `/app/fixtures/samples` — the manifest resolves
   `../../../fixtures/samples` relative to `dist/content/`, so the image
   must keep that relative shape).
2. **`Dockerfile` + `.dockerignore` (repo root).** Multi-stage: web build
   stage; api prod-deps stage; runtime stage on `node:22-bookworm-slim`,
   non-root (`USER node`), `WORKDIR /app/api`, `CMD node dist/server/index.js`
   (reads injected `PORT`). Image contains only: built web assets, api
   `dist/` + prod `node_modules`, the five allowlisted sample fixture PDFs +
   manifest path. Never: `test-corpus/`, `sources/`, `.env`, Sanity studio,
   plans, docs, git. `.dockerignore` enforces the exclusion list.
3. **Secret Manager + runtime identity (gcloud, one-time).**
   - Create pinned-version secrets from git-ignored `api/.env` values via
     stdin/file redirects (values never echoed, never in shell history):
     `gemini-api-key`, `review-hmac-secret`, `sanity-organization-token`,
     `sanity-read-token`.
   - Grant `wazehterms-runtime` `roles/secretmanager.secretAccessor` on those
     four secrets and `roles/artifactregistry.reader` on the repo.
   - Record key id (`REVIEW_HMAC_KEY_ID=key-1`) in nonsecret env; rotation
     note per `docs/DEPLOYMENT.md` §5.
4. **Nonsecret env file** (`deploy/env.staging.yaml`, git-tracked, no
   secrets): `SAMPLE_MODE_ENABLED=true`; `CUSTOM_UPLOAD_ENABLED`,
   `IMAGE_INPUT_ENABLED`, `URDU_EXPLANATION_ENABLED` all `false`;
   `SANITY_CONTEXT_MCP_URL`, `SANITY_PROJECT_ID=8g0kllu0`,
   `SANITY_DATASET=production`, `SANITY_KB_ID`, `PRIVACY_NOTICE_VERSION`,
   `REVIEW_HMAC_KEY_ID`, `GEMINI_MODEL`; provisional limits (config.ts
   defaults) until staging measurement replaces them.
5. **Build + push.** `docker build` locally → push to
   `asia-south1-docker.pkg.dev/wazeh-terms/wazehterms/wazehterms:<git-sha>`;
   record image digest in the testing log. Docker Desktop must be running
   (owner machine) — a manual step only if the daemon is off.
6. **Staging deploy → checks → promote.** Single service `wazehterms`:
   first revision deployed with `--no-traffic` + revision tag `staging`;
   validate at the tag URL; then shift 100% traffic (`gcloud run services
   update-traffic`). Checks per `docs/DEPLOYMENT.md` §4:
   - `/health`, `/api/v1/capabilities` (flags/limits truthful),
     `/api/v1/samples` on the same origin.
   - Five-sample journey reusing the Phase 11 Playwright suite pointed at
     the staging URL (add a `SMOKE_BASE_URL` mode to the existing specs —
     no new browser framework).
   - TC-014 single-document partial path; crafted arbitrary upload returns
     `403 CUSTOM_UPLOAD_DISABLED`; disabled capabilities absent from UI.
   - Source-backed path (TC-012) shows the live Article 6(4) citation; a
     KB-unavailable run degrades to explicit partial, never a fake pass.
   - Log audit: Cloud Logging shows only coarse structured entries — no
     bodies, quotes, filenames, prompts, proofs, secrets.
   - **Same-origin/CORS check (ADR-008):** the SPA journey from the staging
     URL completes with zero console CORS errors — same origin, so no
     preflight occurs at all. `curl -i` confirms `/api/v1/*` responses
     carry no `Access-Control-Allow-*` headers and an `OPTIONS` preflight
     gets no CORS grant; sample PDFs load in iframes from the same origin
     (CSP `frame-src 'self'` satisfied). Any CORS error on Cloud Run means
     the one-origin topology was violated (split frontend/API hosts) —
     treat as an architecture defect to fix, never a header to patch on.
     Sanity Studio (separate origin) never calls the app API; cross-site
     no-preflight posts stay bounded by the closed upload gate + Phase 13
     admission control. Record the check in the release record.
7. **Measured limits.** From staging runs: per-sample latency, memory/CPU
   observed, worst-case request size/time; set final
   `MAX_BYTES_PER_FILE`, `MAX_TOTAL_BYTES`, `MAX_PAGES_PER_PDF`,
   `MAX_CORRECTIONS`, `APPLICATION_DEADLINE_MS` (below Cloud Run timeout),
   concurrency and memory flags; redeploy; `/capabilities` shows the
   measured values. Results recorded in the testing log.
8. **Rollback verification (staging).** With two revisions deployed, shift
   traffic to the previous revision, re-run smoke, shift back. Record the
   exact commands in `docs/DEPLOYMENT.md` §3/§5 (template → real commands).
9. **Release record.** Fill `docs/DEPLOYMENT.md` §4 production table
   (URL, revision, digest, commit, content/KB release, notice version,
   flags, limits, owner, date) after promotion. `README.md` implementation
   status updated.
10. **Phase logs:** `implementation-log.md`, `testing-log.md` created at
    implementation start, kept concise.

## Tests / validation

- Local runtime gate (deliverable 1) before any image work.
- Image policy check: `docker run ... ls` proves only the five sample
  fixture dirs exist; no `.env`, corpus, or source files inside.
- Full local suites stay green (`lint`, `typecheck`, unit/integration, web
  tests) — deployment changes must not alter API behavior.
- Staging smoke (deliverable 6 list) recorded with actual outputs.
- Production five-case smoke after promotion, recorded with URL/revision/date.
- Cost check: service idle at min-instances 0; note observed billing impact
  against the $1 alert.

## Exit criteria

Public URL serves the sample-only experience with truthful capability
flags; source-backed findings active with live citation (Phase 10 checks
passed) and honest partial degradation; measured limits in `/capabilities`;
release record complete; rollback demonstrated on staging; Phase 13
checklist items that belong to deployment wording verified live.

## Non-goals

No CI/CD pipeline (manual gcloud this phase), no Cloud Build, no custom
domain, no user analytics, no accounts/sessions/storage, no upload-gate
change (MT-10 open), no autoscaling tuning beyond measured defaults, no CORS
middleware or cross-origin API grant (same-origin topology; a cross-origin
consumer would need a superseding ADR with an explicit origin allowlist).

## Owner touchpoints (expected)

- Docker Desktop running for build/push (or approve `gcloud builds submit`
  fallback — would enable Cloud Build API).
- Confirm promotion of staging → public traffic after smoke results shown.
- Optional: refine the $1 budget to a realistic monthly amount.
