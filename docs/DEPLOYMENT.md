# WazehTerms — Deployment and Release Runbook

**Status:** Target runbook; no container, deployment, or measured production limits are asserted to exist yet  
**Authority:** ADR-008 selects one Cloud Run service for web and API; `API.md` defines the routes; `SECURITY.md` and `TESTING.md` define launch gates; `FRONTEND_SPECIFICATION.md` defines the agreed public interface design.

## 1. Intended layout and prerequisites

One public Cloud Run revision serves built React assets, the Express API under `/api/v1/*`, and minimal `GET /health`, all on one origin. The SPA fallback must exclude API paths. Sanity Studio is a separately deployed, editor-restricted surface; Sanity Content Lake and the Knowledge Base are managed content/services, not another application web tier. The runtime uses Gemini, a **Knowledge Base-only** Context MCP endpoint, and a separate narrowly scoped canonical Sanity read. There is no worker database or upload bucket.

Before deploying, record the GCP project, billing/budget owner, Artifact Registry repository, selected Cloud Run region, runtime service account, configured Gemini API/account tier and model, Sanity project/dataset/organization, Studio editor roles, and two release contacts. Enable only the GCP APIs actually used (typically Cloud Run, Artifact Registry, Cloud Build if building there, Secret Manager). Grant deploy/build identities only their needed roles; runtime needs access to its secret versions and any Google APIs it calls. Record data-region implications for each provider and public notice. Pick actual memory, CPU, concurrency, min/max instances, and timeouts from `TESTING.md` staging measurements, not the illustrative `API.md` capability values.

### Content prerequisites, in order

1. Populate `authority`, versioned `sourceDocument`, immutable approved `rule` revisions, `contractFieldDefinition`, and `resolutionNote` per `DATABASE_SCHEMA.md` with official/authorized material only. Apply programmatic validation in addition to Studio validation. No worker data.
2. Feed a **filtered approved-record projection** (and vetted authorized official files, if any) into the Sanity Knowledge Base. This dataset feed is an input to the KB, *not* a dataset source attached to the application MCP endpoint. Attach Knowledge Base sources only to that endpoint and verify `tools/list` returns the intended KB retrieval tools.
3. Build/refresh and apply issues or rebuild affected entries. Run known-answer queries and match results to the exact current approved `ruleKey`/revision, source version, and verified official pinpoint. An old KB entry can remain available after a refresh issue; merely starting refresh is not release evidence.
4. Confirm at least one approved Pakistan and one approved UAE reference where needed, and that demo rule claims pass actual applicability/actor/date checks. If not, ship only the supported document checks with explicit source-review limitation; do not seed fictional rules or imply legal coverage.

## 2. Container and configuration contract

The eventual Dockerfile should build the React app, copy only distributable client assets and production server dependencies to the runtime image, and start Express bound to `0.0.0.0` on Cloud Run's injected `PORT`. Serve static assets and the SPA from the same process, and reserve `/api/*` before fallback. Package only the five allowlisted fictional sample fixtures and manifest used by the public demo; exclude source test annotations, real uploads, `.env`, credentials, Studio write keys, and temporary output from the image. `GET /health` checks process readiness without revealing token, dataset details, or provider response text. A successful basic health check is not proof that Gemini/MCP are available; smoke test those paths separately.

| Setting / secret | Owner | Rule |
| --- | --- | --- |
| `GEMINI_API_KEY` (or chosen server credential) | Secret Manager | Server only; confirm actual model/API behavior and provider terms. |
| `SANITY_ORGANIZATION_TOKEN` | Secret Manager | Sanity Context Viewer organization token for the KB-only MCP endpoint, never a client token. |
| `SANITY_READ_TOKEN` (if required) | Secret Manager | Separate minimum read privilege for canonical approved records; omit if the planned public read path is reviewed and adequate. |
| `REVIEW_HMAC_SECRET` | Secret Manager | High-entropy signing key, pinned secret version, explicit `keyId` rotation plan. |
| `SANITY_CONTEXT_MCP_URL`, `SANITY_PROJECT_ID`, `SANITY_DATASET` | Nonsecret server config | Select the approved endpoint and canonical dataset; no worker identifier in MCP query. |
| `SAMPLE_MODE_ENABLED`, `CUSTOM_UPLOAD_ENABLED`, `IMAGE_INPUT_ENABLED`, `URDU_EXPLANATION_ENABLED` | Release config | Initial public posture: sample on, remaining flags off until their independent gates pass. Map these to `/capabilities` and actual enforcement. |
| Limits and deadline (`MAX_BYTES_PER_FILE`, `MAX_TOTAL_BYTES`, `MAX_PAGES_PER_PDF`, `MAX_CORRECTIONS`, `APPLICATION_DEADLINE_MS`) | Release config | Choose after staging benchmarks. Keep app deadline below Cloud Run request timeout; `/capabilities` displays actual supported file/page/correction limits. |
| `PRIVACY_NOTICE_VERSION`, model/prompt and content release IDs | Release config | Version what the live app really uses; never put provider credentials into client build vars. |

These names describe a proposed deployment contract; implementation may choose different internal names, but must document their mapping here before release. Cloud Run env-bound secrets are resolved at instance startup, so pin numeric Secret Manager versions and deploy a new revision to rotate them. Grant `roles/secretmanager.secretAccessor` for the selected secrets to the runtime service account. Do not publish `.env` files or bind secrets into client-side Vite variables. Sample mode may still call Gemini for fictional documents and needs valid provider access.

## 3. Build and deploy procedure (template to fill with real commands)

The repository has not yet supplied a verified Dockerfile, package scripts, image location, or running project settings. The following is an operator **template**, not a command history or claim that it runs today. Use PowerShell with values supplied from the actual GCP project; never paste secret values into commands, shell history, or CI output.

1. Freeze the commit, sample manifest, model/prompt IDs, approved Sanity content revision, KB build, and notice version. Run the defined tests in `TESTING.md`; record achieved metrics and release gates.
2. Build the container using the repository's verified Dockerfile and publish an immutable image digest to its approved Artifact Registry location. Record digest and build provenance. Create/update the runtime service account, secret bindings, environment file of **nonsecret** flags, and budget/alert settings using reviewed infrastructure configuration.
3. Deploy a no-traffic or low-traffic revision to staging first. Validate same-origin frontend/API, `GET /health`, capabilities, five allowlisted samples, document comparison, KB tool list, known-answer retrieval, canonical source citation, partial failure behavior, and sensitive-log audit. Verify arbitrary multipart upload returns `403 CUSTOM_UPLOAD_DISABLED` in sample-only mode.
4. Promote the exact tested image/config/content combination to production, then repeat the five-case smoke test and record the live service URL, revision, limits, and date. Gradually allocate traffic if an earlier production revision exists and monitor stage errors and cost.

Example deployment shape **after values and CLI flags are confirmed for the implemented image**:

```powershell
$serviceName = '<cloud-run-service>'
$regionName = '<selected-region>'
$runtimeIdentity = '<runtime-service-account-email>'
$imageDigest = '<artifact-registry-image>@sha256:<verified-digest>'
$configFile = '<path-to-reviewed-nonsecret-env-yaml>'

gcloud run deploy $serviceName --region $regionName --image $imageDigest --service-account $runtimeIdentity --env-vars-file $configFile --update-secrets 'GEMINI_API_KEY=<secret-name>:<numeric-version>,SANITY_ORGANIZATION_TOKEN=<secret-name>:<numeric-version>,REVIEW_HMAC_SECRET=<secret-name>:<numeric-version>' --allow-unauthenticated
```

Supply `SANITY_READ_TOKEN` as an additional secret binding only when that private canonical-read path is required. Set measured resource, concurrency, instance, and timeout flags in the verified infrastructure config; never launch by accepting platform defaults accidentally. The command exposes a public service intentionally; do not use it before all relevant gates pass. Configure `/health` and traffic tags/revision rollout according to the final Cloud Run setup. Keep `.env` YAML strictly free of secrets. The exact image build and CI commands must be added once repository scripts exist.

## 4. Required staging and production checks

| Check | Expected observation |
| --- | --- |
| `/health`, `/api/v1/capabilities`, `/api/v1/samples` | HTTP routes respond on the same origin; capabilities show real flags, accepted MIME, versioned notice, and measured limits; sample manifest has only fictional fixed paths. |
| Browser mobile and desktop | Synthetic label and privacy notice clear; review shows pages and original/correction separation; responsive and accessibility checks follow `FRONTEND_SPECIFICATION.md`. |
| Five samples | Consistent pair, explicit salary/benefit change with two evidence passages, reviewed worker-charge question with official pinpoint/actor, missing/conditional term, and abstention; separately test a single-document and visible `partial` path. No positive whole-report message after incomplete checks. |
| Source retrieval | Real `tools/list` and known-answer MCP call use KB retrieval, then canonical rule/source version matches. Stale or conflicted entry fails closed. |
| Disabled features | Arbitrary uploads rejected at API even with a crafted request; JPG/PNG and Urdu absent from UI/capabilities while disabled. |
| Security/resources | No input/body/excerpt in logs, no upload in Sanity/storage, safe errors, cancellation cleanup, quotas and deadlines enforced, alerts and budget owner assigned. |

Record actual live outputs, links to sanitized logs, case IDs, run dates, and release approvers in a release record. If the 45-second median or other target fails, report the measured result, investigate, and adjust public promises/limits without relabelling the target as achieved. Do not use real worker documents for smoke tests.

### Production release record (fill only after deployment)

| Item | Actual value |
| --- | --- |
| Project, region, service URL, revision, image digest | Pending |
| Commit, model/prompt, Sanity source release, KB release | Pending |
| `privacyNoticeVersion`, provider account/API retention review | Pending |
| Public flags, exact limits, Cloud Run resources/deadline, abuse controls | Pending |
| Test report and five-case smoke run | Pending |
| On-call/rollback owner and date | Pending |

## 5. Rollback, content releases, and incident controls

Application revision and reference-content release have different rollback paths. For an app failure, shift Cloud Run traffic to the last known good revision by its recorded revision name and rerun the five synthetic samples; check whether old revisions still reference valid secret versions and the current API/content contract. Example shape: `gcloud run services update-traffic <service> --region <region> --to-revisions <known-good-revision>=100`. A previous binary cannot restore a changed Sanity KB or withdrawn official rule by itself.

For a source error, mark the offending rule/source ineligible (`recordStatus` as appropriate), stop the affected automated concern, inspect the official source, approve a new source version and rule revision where warranted, then refresh/rebuild the KB and verify the live mapping. If KB reconciliation cannot finish promptly, disable source-backed findings or the affected rule path while preserving substantiated document-only reports with an explicit partial state. Do not roll back curated content by republishing an obsolete rule as current. For a leaked secret, rotate/revoke the specific credential and deploy a new revision; a compromised HMAC key invalidates issued reviews and requires re-extraction. Recheck `/capabilities`, UI notice, logs, and costs after any emergency flag change.

## 6. Maintain this runbook

Replace placeholders with audited scripts, measured thresholds, image build steps, real URL, provider tier/API, IAM role bindings, region, release evidence, incident owner, and exact rollback revision before the first public launch. Update `PRD.md`, `API.md`, `SECURITY.md`, `TESTING.md`, and `FRONTEND_SPECIFICATION.md` whenever a feature gate, public promise, schema version, or deployment topology changes. A topology change away from the one-service design needs a new ADR.

**Platform references:** [Cloud Run container contract](https://cloud.google.com/run/docs/container-contract), [environment variables](https://cloud.google.com/run/docs/configuring/services/environment-variables), [Secret Manager bindings](https://cloud.google.com/run/docs/configuring/services/secrets), [request timeout](https://cloud.google.com/run/docs/configuring/request-timeout), [revision traffic changes](https://cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration), and [Sanity Context security](https://www.sanity.io/docs/ai/sanity-context-security).
