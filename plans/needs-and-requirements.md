# Needs and requirements from the repository owner

What the implementation needs from you, when, and how it is handled. Nonsecret
identifiers can be pasted in chat or committed as placeholders. Secrets must
arrive only through a secure channel (password manager, encrypted note) and land
in the git-ignored `api/.env` — never in chat, plans, logs, CI, or Git.

## Nonsecret IDs / URLs needed, by phase

| When | Item | Where it goes |
| --- | --- | --- |
| Phase 03 | Gemini key **exists** (secret); account tier / API path name (nonsecret description) | key → `.env`; tier → provider-notice work in Phase 13/14 |
| Phase 08 | Final Sanity `projectId` (currently `8g0kllu0`) + chosen dataset name | `sanity-studio/sanity.config.ts`, `api` config, `.env.example` placeholders |
| Phase 08 | Deployed Studio URL | documentation |
| Phase 09 | Verified official source files + retrieval dates (MT-4 results) | `sources/` + content records |
| Phase 10 | Knowledge Base name/ID + Context MCP endpoint URL (nonsecret) | `SANITY_CONTEXT_MCP_URL` in `.env.example` placeholder + config |
| Phase 14 | GCP project ID, Cloud Run region, Artifact Registry repo, runtime service account email | deployment config + `docs/DEPLOYMENT.md` release record |
| any | Decision on `sources/` Git inclusion + license choice | repo policy |

## Secrets needed, by phase (secure channel only)

| When | Secret | Handling |
| --- | --- | --- |
| Phase 03 | `GEMINI_API_KEY` | `api/.env` locally; Secret Manager at Phase 14 |
| Phase 03 | `REVIEW_HMAC_SECRET` (+ chosen `keyId` label, nonsecret) | same |
| Phase 10 | `SANITY_ORGANIZATION_TOKEN` (Context Viewer, org-level) | same |
| Phase 09/10 | `SANITY_READ_TOKEN` (project Viewer token — **required**: the API does not serve anonymous dataset queries, verified 2026-09-30) | same |

## Decisions requested (owner owns these)

1. Dataset choice for curated records (MT-2) — **DECIDED (2026-09-29): `production` in project `8g0kllu0`**; no dedicated dataset. Studio, Phase 09 import, canonical reader, and KB configuration stay aligned to `production`; visibility unchanged.
2. Whether `sources/` official PDFs stay in Git (MT-9).
3. License selection (MT-9).
4. Provider-processing notice text approval (MT-10) — blocks any future custom-upload gate, not the sample-only path.
5. Phase 12 (UI/UX polish) scope confirmation when Phase 11 completes — optional phase by your decision.

## Standing requirements the implementation commits to

- No unplanned implementation: every phase begins with a re-planned `plan.md`; deviations found mid-phase are either folded into scope with a log entry or deferred to a new plan revision.
- Fresh repository baseline (D1): only contract-aligned content is committed (`docs/`, `plans/`, `sanity-studio/`, `sources/`, `fixtures/`, README/CLAUDE); the documented two-step signed `/api/v1` flow is the only runtime API that will ever exist.
- Sample runtime extraction always calls Gemini; provider unavailable → `503 EXTRACTION_UNAVAILABLE` (D2). Fixture extractions exist only under test paths.
- No delivery dates, competition names, or challenge references in plans or phase scope (D3). Product dates (source-checked, effective periods, document dates, timeouts) still recorded where the product needs them.
- `source_backed_concern` reported complete only after live KB endpoint + tools verification + known-answer read + approved-rule/pinpoint gating pass (D8); otherwise explicit partial disclosure.
- Deterministic commit cadence (D7): review `git status`/`git diff`, validate, one coherent commit per phase, push after validation.
- Secrets, uploaded documents, extracted passages, and signed payloads never appear in plans, logs, client code, URLs, or Git.
