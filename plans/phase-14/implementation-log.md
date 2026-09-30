# Phase 14 — Implementation Log

Branch: `security-hardening` (Phase 14 files written on this branch because
the security tree was in progress; see commit-splitting note at the end).
Date: 2026-09-30.

## What changed

- `Dockerfile` (new, repo root) — three stages: build (full toolchain,
  both workspaces), runtime-deps (`npm ci --omit=dev --workspace api`),
  runtime (node:22-bookworm-slim, non-root `USER node`, `WORKDIR /app/api`,
  `CMD node dist/server/index.js`, Cloud Run `PORT` contract). Image layout
  preserves the manifest's `../../../fixtures/samples` resolution and the
  app's `../web/dist` static candidate.
- `.dockerignore` (new) — bars `node_modules`, `dist`, `.env`, `.git`,
  `test-corpus`, `sources`, `docs`, `plans`, `sanity-studio`, web e2e
  artifacts, logs.
- `deploy/env.staging.yaml` (new) — nonsecret Cloud Run env: sample-only
  flags (upload/image/Urdu off), Sanity MCP/project/dataset/KB, model,
  key id, honest draft notice version, provisional limits + admission
  knobs (replaced by staging measurements later). No secrets.
- `deploy/deploy.sh` (new) — the full procedure with real MT-7 values:
  build + push to `asia-south1-docker.pkg.dev/wazeh-terms/wazehterms`,
  first deploy `--no-traffic --tag staging` with pinned secret versions
  (`gemini-api-key:1`, `sanity-organization-token:1`,
  `review-hmac-secret:1`, `sanity-read-token:1`), provisional resources
  (512Mi/1 vCPU, concurrency 40, timeout 120s, max-instances 4), promotion
  and rollback commands. Push/deploy lines **not executed** (owner gate).
- `docs/DEPLOYMENT.md` §3 — template replaced with verified-local status +
  pointer to `deploy/deploy.sh`.
- `api/test/security/cancellation.test.ts` — flake fix only: abort-wait
  bound 1 s → 5 s (suite runs 51 files in parallel; test passed in
  isolation but raced under load). No production code touched.

## Cloud-side setup performed (setup only, no deploy)

- Secret Manager: `gemini-api-key`, `review-hmac-secret`,
  `sanity-organization-token`, `sanity-read-token` — version 1 each,
  values piped from git-ignored `api/.env` (never echoed; CRLF stripped).
- IAM: `wazehterms-runtime` granted `roles/secretmanager.secretAccessor`
  on the four secrets and `roles/artifactregistry.reader` on `wazehterms`.

## Verification performed (results in testing-log.md)

- Local runtime gate on `node api/dist/server/index.js` (no tsx).
- Docker image build + container probes + image policy check.
- Full regression across the working tree (includes the uncommitted
  security-hardening work).

## Decisions

- Image builds from the working tree for the local check; **the promoted
  release image must be rebuilt from the merged commit** after the
  security work lands (deploy.sh tags with the commit SHA, so this is
  enforced by procedure).
- Cloud env pins `CUSTOM_UPLOAD_ENABLED=false` (MT-10 still open) even
  though the owner's local `api/.env` has it `true` for local testing —
  the committed defaults and the deploy env file stay closed.

## Remaining for a real deploy (owner-run)

1. Merge/commit the security work; rebuild + push from that commit
   (`deploy/deploy.sh` steps 1–2).
2. Staging smoke at the tag URL (plan deliverable 6), measured limits
   (deliverable 7), promotion, rollback drill, release record
   (`docs/DEPLOYMENT.md` §4), production smoke.
