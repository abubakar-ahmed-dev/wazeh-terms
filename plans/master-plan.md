# WazehTerms — master implementation plan

**Status:** Approved planning baseline. Phase sequencing authority. Re-planned per phase (see `plans/README.md` protocol).
**Contracts:** `docs/PRD.md`, `docs/ADR.md`, `docs/TECHNICAL_ARCHITECTURE.md`, `docs/API.md`, `docs/DATABASE_SCHEMA.md`, `docs/SOURCES.md`, `docs/SECURITY.md`, `docs/TESTING.md`, `docs/DEPLOYMENT.md`, `docs/FRONTEND_SPECIFICATION.md`. Root `README.md` orients and is not authority over the exact API/schema.

---

## 1. Owner decisions this plan implements

| # | Decision |
| --- | --- |
| D1 | **Fresh repository, build from contracts.** The repository starts clean: no legacy application code, no legacy history. All implementation is built from `docs/` contracts through the phases below. The documented two-step signed flow (`POST /api/v1/extractions` → `IssuedExtractionV1` + HMAC proof → `POST /api/v1/analyses` + corrections) is the only runtime API; no one-shot analysis endpoint ever exists. |
| D2 | **Fixtures, not fallback.** Sample text/PDF fixtures are deterministic test inputs. Runtime sample extraction always calls Gemini; provider unavailable returns the documented error. No silently served prewritten extraction. |
| D3 | **Full MVP in dependency order.** Plans are milestone-based and challenge-neutral: no delivery-date pressure, no competition references. Product-required dates (source-checked, effective periods, document dates, timeouts) still recorded where the product needs them. |
| D4 | **Web stack.** Vite + React + TypeScript in `web/`; Express serves the built frontend and API from one Cloud Run service (ADR-008). |
| D5 | **Testing.** Vitest unit + API contract tests; Playwright coverage of the five-sample user journey; focused security tests and source-validation tests for their specific risks. |
| D6 | **CI.** GitHub Actions for lint, typecheck, build, and tests on pushes and PRs. Deterministic; no live provider credentials in CI. |
| D7 | **Git.** One coherent commit at the end of each completed phase; push after required validation passes; review status and diff before committing. |
| D8 | **Credentials.** Owner supplies the Gemini key; GCP project/billing; Sanity project with Context enabled on the org; remaining Sanity/official-source setup in parallel. Nonsecret IDs/URLs requested per phase (`needs-and-requirements.md`); secrets only via git-ignored local `.env` or platform secret bindings. Source-backed findings stay incomplete until KB + runtime MCP endpoint + official-source review + canonical rule checks demonstrably work; document-check-only milestones disclose the limitation. |

## 2. Target architecture (summary; authority = docs)

One Cloud Run service: built React assets + Express API under one origin, `/api/*` reserved for the API, `GET /health` at root, SPA fallback for client routes. Two-step stateless flow: `POST /api/v1/extractions` (allowlisted sample or gated upload) validates bounded PDF bytes, calls Gemini inline, runtime-validates output against the 33-key field model, verifies reported passages against the PDF text layer where possible, returns `IssuedExtractionV1` + HMAC proof + expiry. Browser holds payload, proof, and file preview in memory only. `POST /api/v1/analyses` verifies proof/expiry/schema, applies corrections as separately attributed deltas, normalizes and compares in deterministic code, retrieves candidates via a Knowledge Base-only Sanity Context MCP endpoint, gates every candidate against the canonical approved rule + exact source version/pinpoint, assembles the report server-side with stage statuses and honest partial states. Sanity Studio (separate) edits five versioned reference record types. Monorepo workspaces: `api/`, `web/`.

## 3. Repository baseline (initial state)

The first commit contains only intentional, contract-aligned content:

| Path | Role |
| --- | --- |
| `docs/` | Ten authoritative contract documents. |
| `plans/` | This plan, protocol, manual tasks, owner needs, per-phase folders. |
| `CLAUDE.md`, `README.md` | Agent instructions and orientation. |
| `sanity-studio/` | Studio shell for project `8g0kllu0` (schema types arrive in the content-schema phase). |
| `sources/` | Curation input. Committed: link lists, inventory/provenance metadata, reviewed documentation. Local-only (git-ignored): downloaded official PDFs, browser captures, transcriptions (`sources/README.md`). |
| `fixtures/samples/TC-002/` | Fictional sample text + PDFs, test fixtures only (see that folder's README). |

Excluded and never committed: secrets/`.env`, `node_modules`, build output, uploaded documents, corpus truth files (they arrive with the corpus phase), generated artifacts.

## 4. Phase map and dependency graph

| Phase | Title | Depends on |
| --- | --- | --- |
| 01 | Monorepo foundation + CI | — |
| 02 | Code-level contracts: field registry, runtime schemas, HMAC proof | 01 |
| 03 | Extraction step: sample mode, Gemini client, admission, capabilities | 02, Gemini key |
| 04 | Evidence verification (PDF text-layer matching) | 03 |
| 05 | Normalization + deterministic comparison engine | 02 |
| 06 | Analysis step: corrections, report assembly, `POST /api/v1/analyses` | 04, 05 |
| 07 | Synthetic corpus: 15 cases, `truth.json`, five production samples | 03, 05, 06 |
| 08 | Sanity Studio content schema + programmatic content gate | 01 |
| 09 | Canonical content seed (reviewed sources + rules) | 08, manual source verification |
| 10 | Context MCP retrieval + rule eligibility/citation gate | 06, 09, KB endpoint + org token |
| 11 | React web app: sample-only core flow | 03, 06 |
| 12 | UI/UX polish (optional phase) | 11 |
| 13 | Security hardening + abuse-focused tests | 06 |
| 14 | Deployment: container, Cloud Run, smoke, release record | 13, 11; rule-backed activation also needs 10 |
| 15 | Corpus evaluation, evidence ledger, documentation alignment | 07, 14 |

Parallel-friendly groups: (08 → 09) runs alongside 03–07; 13 can start after 06; 11 can start UI scaffolding after 03 but completes only after 06.

---

## Phase 01 — Monorepo foundation + CI

**Goal:** Clean, buildable monorepo skeleton (api + web), tooling, lint, CI, and documented environment template. No product endpoints yet.

**Depends on:** nothing.

**Adds/changes:**
- Root `package.json`: npm workspaces `api`, `web`; scripts `dev`, `build`, `test`, `typecheck`, `lint` delegating per workspace.
- `api/`: `package.json` (express, zod, dotenv; dev: typescript, tsx, vitest, eslint, @types/*), strict `tsconfig.json`, empty `src/` + `test/`.
- `web/`: Vite React-TS scaffold placeholder (buildable, trivial home) so CI build and the web-app phase have a base.
- ESLint flat config for api + web; formatting consistent with existing files.
- GitHub Actions: `.github/workflows/ci.yml` — lint, typecheck, build, test on push/PR; Node 22; deterministic (no provider calls; suites needing live services skip when their env is absent).
- `.env.example`: documented names from `docs/DEPLOYMENT.md` §2 (`GEMINI_API_KEY`, `SANITY_ORGANIZATION_TOKEN`, `SANITY_READ_TOKEN`, `REVIEW_HMAC_SECRET`, `SANITY_CONTEXT_MCP_URL`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SAMPLE_MODE_ENABLED`, `CUSTOM_UPLOAD_ENABLED`, limit/deadline vars), each marked optional-with-degradation. No real values.

**Tests:** each workspace typechecks, lints, builds; one trivial vitest per workspace runs green; CI green on push.

**Exit criteria:** `npm install && npm run typecheck && npm run test && npm run build` green at root; CI green; logs written per protocol.

---

## Phase 02 — Code-level contracts: field registry, runtime schemas, HMAC proof

**Goal:** The documented data model exists as code before any endpoint uses it.

**Depends on:** 01.

**Adds/changes (`api/src/contracts/`):**
- Field registry: 12 groups / 33 `fieldKey` components from `docs/DATABASE_SCHEMA.md` §7, with `valueKind`, labels, `comparisonStrategyKey` placeholders, repeatable keys (`allowance_item`, `deduction_item`) flagged. Code-owned; Studio content cannot add keys.
- Runtime zod schemas for: `NormalizedValue` discriminated union (money amount as decimal string; currency/frequency/payer nullability per `docs/API.md` §4.2), `Evidence` (`documentId`, one-based `page`, bounded `quote`, `verification: matched_text | model_transcription`), `ExtractedField` (`fieldKey`, `instanceId`, `state`, `rawText`, `value`, `evidence[]`, `qualityNotes[]`), `IssuedExtractionV1` (schemaVersion, issuedAt/expiresAt, scope, sourceMode, documents with role/mime/pageCount/sha256/extractionStatus/fields/unreadablePages), correction delta shapes, `StageStatus`, finding/report shapes from `docs/API.md` §6.
- State invariants enforced: `present` requires typed value + ≥1 evidence passage; non-present states force `value: null`; `absent` only with readable-page coverage recorded.
- HMAC proof module: canonical JSON serialization (stable key order, shared by sign/verify), HMAC-SHA256, `keyId` allowlist, constant-time compare, expiry check. Key material from env only.
- Shared error envelope + `requestId` generation; stage-status type.

**Tests:** schema unit suite (valid/invalid unions, money-as-string, enum boundaries, state invariants, page bounds); canonical serializer round-trip + tamper vectors (value/scope/digest/expiry/key changes all fail verification); proof expiry + unknown keyId rejection.

**Exit criteria:** `docs/API.md` §4–§7 shapes have passing schema tests; serializer spec written down in code docs for the analyses-phase reuse.

---

## Phase 03 — Extraction step: sample mode, Gemini client, admission, capabilities

**Goal:** `POST /api/v1/extractions` works for allowlisted samples end to end, returning a signed `IssuedExtractionV1`. Custom upload rejected per gate.

**Depends on:** 02; needs Gemini API key (owner).

**Adds/changes:**
- Config loader (centralized, `docs/DEPLOYMENT.md` names), capability flags wired to behavior.
- Sample manifest: server-side allowlist mapping `sampleCaseId` → fixture files + declared scope. Never a client-supplied path. Initial entry: the TC-002 salary-change pair.
- Admission validation: content-type, magic bytes, size/page limits (values from config; final numbers measured per `docs/TESTING.md` §4), PDF parseability (page count), rejection **before** any provider call; error codes per `docs/API.md` §7 (`400/403/413/415/422`).
- Gemini client service interface (root `CLAUDE.md`: keep behind service interface): inline base64 PDF, JSON response mime, prompt enforcing verbatim passages / field states / untrusted-document-text rule, temperature 0, bounded retry-on-validation-error, timeout via abort signal; runtime zod validation; `503 EXTRACTION_UNAVAILABLE` when key missing or provider fails; `422` with no proof when nothing usable. Instance IDs assigned server-side; opaque per-request document IDs (not filenames).
- HMAC issuance on the response (`proof.keyId`, expiry).
- `GET /api/v1/capabilities` (real flags + configured limits + `privacyNoticeVersion` placeholder), `GET /api/v1/samples` (manifest metadata + same-origin preview paths), `GET /health` (minimal), `Cache-Control: no-store` on API responses.
- Request ID + coarse operational logging (stage, duration, error class — no bodies, quotes, filenames, prompts).

**Tests:** contract tests with a fake Gemini service (success, malformed JSON, schema-invalid, timeout, 5xx → mapped errors; no proof on 422); admission tests (non-PDF, oversized, encrypted/corrupt, duplicate roles, unknown fields → 403 for arbitrary uploads while gate closed); HMAC issuance round trip; capabilities/samples shapes.

**Exit criteria:** sample TC-002 extracts through live Gemini (manual run recorded in testing log with provider latency); all contract tests green without network.

---

## Phase 04 — Evidence verification (PDF text-layer matching)

**Goal:** Reported passages are corroborated against the actual PDF text layer where possible; uncorroborated passages are labeled honestly.

**Depends on:** 03.

**Adds/changes:**
- PDF text-layer extraction dependency (chosen at re-planning; e.g. pdfjs-dist or pdf-parse) with bounded memory/time; treat extracted text as untrusted data.
- Page-matching service: normalize whitespace, locate reported quote on claimed page → `matched_text`; not found → `model_transcription` + quality note. Never rewrite a quote to force a match.
- Scan/unreadable-page detection basics: no text layer → page marked unreadable-prone, fields on it lean `unclear`/`unreadable` per `docs/API.md` §4.2 rules; no fabricated absence.
- Wiring into the extraction pipeline (verification runs before signing).

**Tests:** fixture-based matching (exact quote, reformatted quote, wrong page, invented quote, empty text layer); bounded-resource smoke; quality-note presence assertions.

**Exit criteria:** TC-002 live run shows `matched_text` on text-layer quotes; invented-quote fake yields `model_transcription`; wrong-page rejection tested.

---

## Phase 05 — Normalization + deterministic comparison engine

**Goal:** Pure, fully unit-tested module that normalizes issued fields and compares offer vs contract per `docs/TECHNICAL_ARCHITECTURE.md` §5.

**Depends on:** 02 (can start in parallel with 03/04; blocks 06).

**Adds/changes (`api/src/compare/`):**
- Normalizers per `valueKind`: text, money (decimal-string math — no floats, no currency conversion), date (ISO only when unambiguous), duration (no unit conversion), benefit_state, boolean; original `rawText` always preserved.
- Comparison strategies (code-owned, keyed by registry `comparisonStrategyKey`): component equality for text/date/duration; money compares amount+currency+frequency separately (never equates unlike currencies); benefit state compares status incl. `conditional`; repeated items matched by stable instance identity/label only when unambiguous.
- Category resolution per `docs/PRD.md` §6 + `docs/API.md` §6: `document_mismatch` needs two readable explicit passages; missing vs absent vs unclear vs unreadable distinctions (`absent` ≠ denied; `unreadable` ≠ absent); single document → comparison not applicable; conditional wording and unseen annex references → clarification; every finding carries `comparisonRuleKey`, both evidence sets, `valueOrigins`.
- Money mapping note implemented: `deduction_item`/`other_worker_charge` carry `money.component: "worker_charge"` (documented mapping for the enum gap flagged in review).

**Tests:** unit suite from `docs/TESTING.md` §2 comparison layer: unequal salary → mismatch with two passages; equal/missing/one-document/unreadable → correct non-mismatch categories; currency/frequency divergence; conditional benefit; no inferred denial from silence; deduction vs UAE employer cost kept distinct.

**Exit criteria:** comparison layer of the test matrix green; module has zero I/O dependencies.

---

## Phase 06 — Analysis step: corrections, report assembly, `POST /api/v1/analyses`

**Goal:** Second step of the documented flow: verify proof, reconcile corrections, compare, assemble the structured report with honest stage/coverage states.

**Depends on:** 04, 05.

**Adds/changes:**
- Proof verification middleware (size bound first, keyId allowlist, constant-time compare, expiry → `410 REVIEW_EXPIRED`, schema version → `409 REVIEW_VERSION_UNSUPPORTED`, integrity failure → `422 REVIEW_INVALID` without HMAC detail).
- Correction validation: existing `documentId`+`fieldKey`+`instanceId` only; type/enum/count/length/duplicate checks → `422 INVALID_CORRECTION`; corrections never modify original evidence; uncorroborated correction yields `needs_clarification` with `user_reported_difference`, never a confirmed mismatch.
- Reconciliation: original immutable; effective comparison values labeled; `valueOrigins` tracked.
- Coverage classification: `scopeApplicability` supported/conflicting/unknown from declared scope + document clues (regime never inferred from logo/address); missing pages/annexes explicit.
- Report assembly: five finding categories, `suggestedQuestionOrStep` templates, `stages` (extraction from issued payload; review from client progression; comparison not_applicable for one document; retrieval/applicability/explanation honestly `not_started`/`partial` until the MCP phase), `coverage` (checked/unreadable/omitted), `limitations`, `officialNextSteps` (server allowlist only), summary line only when checks completed ("No concern detected in the fields checked" rule).
- Retrieval stage stub: with no MCP configuration, report is `partial` with explicit source-review limitation disclosure (D8).

**Tests:** contract suite per `docs/API.md` §8 checks 1–3 + 5 (tamper/expiry/version/duplicate/invented rejection; single-document no-false-comparison; partial retention on simulated retrieval/explanation failure); correction-integrity tests; summary-line rules.

**Exit criteria:** two-step flow demonstrable locally end to end via HTTP with fake Gemini + no Sanity; §8 checks 1–3, 5 green.

---

## Phase 07 — Synthetic corpus: 15 cases, `truth.json`, five production samples

**Goal:** The labelled corpus and the five public demo samples exist with versioned truth files and generators.

**Depends on:** 03, 05, 06 (fixtures authored earlier where useful).

**Adds/changes:**
- Final corpus layout decided during this phase's re-planning — the `test-corpus/` path in `docs/TESTING.md` §1 is proposed, not fixed; any decision updates the affected docs together. Layout candidates: `test-corpus/TC-001…TC-015/` with `offer.pdf`/`contract.pdf` where relevant, `truth.json` (versioned annotation schema: route/category, documents + readable pages, expected field components/states, evidence locations, seeded differences, allowed finding categories, required ruleKey/revision/source version where applicable, expected abstentions), notes file.
- Distribution: 4 consistent pairs, 6 mismatch pairs, 3 cost/deduction or missing-term cases, 2 incomplete/low-quality/adversarial (incl. the embedded-instructions case). One single-document case. TC-002 = the preserved salary-change fixture pair.
- PDF generator tooling rendering `fixtures/samples/TC-002/sample-text.json` and all other cases deterministically; every case visibly marked fictional; per-case extraction fixtures regenerated against the documented schema for fixture-mode tests.
- `test-corpus/source-catalog.csv` scaffold (listing-informed attributes recorded when used).
- Five production samples manifest finalized (consistent pair; salary/benefit change; worker-charge question; missing/conditional term; abstention) + same-origin preview assets packaging.
- Corpus-driven test runner: fixtures → comparison engine → truth assertions (extraction assertions via regenerated fixture extractions; live-Gemini scoring deferred to the evaluation phase).

**Tests:** every case's truth file validates against the truth schema; comparison runner green on all 15; abstention cases produce zero definitive claims; five production samples reproduce via manifest.

**Exit criteria:** 15/15 cases green in fixture mode; production sample set fixed and committed.

---

## Phase 08 — Sanity Studio content schema + programmatic content gate

**Goal:** Studio edits the five documented record types; programmatic validation enforces what Studio cannot.

**Depends on:** 01 (parallel track).

**Adds/changes (`sanity-studio/`):**
- Schema types per `docs/DATABASE_SCHEMA.md` §2–§8: `authority`, versioned `sourceDocument`, `rule` (revision documents, `triggerKey` restricted to code-defined list, `machineConditionKeys` mapping to code predicates), `contractFieldDefinition` (33-key registry alignment), `resolutionNote`; controlled enums (jurisdiction, regime, category, party, reviewStatus, recordStatus, evidenceClass), `schemaVersion` everywhere.
- Content-validation script (runnable + CI-safe in offline mode): unique natural keys, exactly one approved current revision per `ruleKey`, reference integrity, evidence-class compatibility, required pinpoint objects, enum containment.
- Studio build passes; no documents created yet (content is the next phase).

**Tests:** validation script against deliberate invalid fixtures (duplicate key+version, two approved revisions, broken reference, guidance-classed rule with binding trigger, missing pinpoint) — all caught; valid seed set passes.

**Exit criteria:** `sanity build` green; validation gate green; schema matches `docs/DATABASE_SCHEMA.md` field tables. Manual: Studio deploy (see `manual-tasks.md`).

---

## Phase 09 — Canonical content seed (reviewed sources + rules)

**Goal:** Real reviewed reference records exist: at least one Pakistan and one UAE source per the minimum curation gate, with initial rules backing the demo's worker-charge/salary topics.

**Depends on:** 08 + manual source verification (owner browser access to blocked BEOE/MOHRE material).

**Adds/changes:**
- Content creation per `docs/SOURCES.md` §4 workflow: acquire → pinpoint → applicability → classify → review/approve → version. Records carry `sourceKey`/`versionKey`, `contentHash` where a stable PDF exists, `retrievedAt`/`lastVerifiedAt`, effective periods, reviewer codes (public-safe).
- Initial rule set: narrow claims with `triggerKey` for the five demo topics; international material only as labelled guidance records; `resolutionNote` for any conflict encountered.
- Programmatic import performs the same content gate (previous phase's script) before publish; post-import validation pass recorded.
- Dated export/catalog of approved records committed with the project (per `docs/SOURCES.md` §1).

**Tests:** content gate green on the seed; every demo rule resolves to an approved current revision + exact source version + pinpoint; negative check — superseded/draft record excluded by the gate.

**Exit criteria:** minimum curation gate items satisfied and recorded. No rule text without a verified passage; blocked sources stay `candidate` until the owner verifies them in a browser.

---

## Phase 10 — Context MCP retrieval + rule eligibility/citation gate

**Goal:** Candidate discovery through the runtime Knowledge Base-only MCP endpoint, and a hard deterministic gate between candidates and displayed `source_backed_concern` findings.

**Depends on:** 06, 09; needs KB + endpoint URL + `SANITY_ORGANIZATION_TOKEN` (owner, see `manual-tasks.md`).

**Adds/changes:**
- MCP client service: initialize → tools/list (require Knowledge Base tools; dataset-backed GROQ mode fails verification) → known-answer read on startup/deploy check → bounded tool loop with capped calls; queries carry topic + applicability facts only (no names, clauses, images, identifiers). Retrieved text treated as untrusted data.
- Canonical record reader: separate narrowly scoped read of approved rules/source versions (public dataset read or `SANITY_READ_TOKEN` per least privilege).
- Eligibility gate: candidate → exactly one approved current `ruleKey`/revision or unambiguous source/pinpoint mapping; then claim, actor, jurisdiction, regime, category, conditions/exceptions, evidence class, temporal validity (effectiveFrom/To vs analysis/document dates), recordStatus, source-check freshness, pinpoint quote actually supporting the claim. Any failure → withhold claim, keep document findings, mark `retrieval`/`applicability` stage honestly.
- `source_backed_concern` findings assembled server-side with the `SourceCitation` shape from `docs/API.md` §6; KB entry IDs never treated as rule IDs.
- Capabilities/report wiring: retrieval unavailable/misconfigured → explicit partial states; document-check-only milestone discloses the limitation (D8).

**Tests:** fake-MCP contract tests (tools missing, known-answer mismatch, unmappable candidate, stale revision, superseded source, temporal mismatch, exception trigger → all suppressed with recorded reason); source-validation tests for the specific risk class (stale KB entry serving old revision; refreshed-but-unapplied KB state). Live verification checklist recorded against the real endpoint (tools/list + known-answer + one demo citation) before any claim of operation.

**Exit criteria:** with live endpoint: `tools/list` verified, known-answer read passes, one demo case yields a gated `source_backed_concern` whose pinpoint opens to supporting text. Without endpoint configured: honest partial states (already proven in the analyses-phase tests). Source-backed findings are "complete" only after the live checklist passes.

---

## Phase 11 — React web app: sample-only core flow

**Goal:** Public sample-only experience per `docs/FRONTEND_SPECIFICATION.md`: choose fictional sample → extract → review/correct → analyze → findings, with capability gating and truthful states.

**Depends on:** 03, 06 (scaffolding can begin after 03).

**Adds/changes (`web/`):**
- Vite + React + TS; API client typed from the contracts phase; capability gate from `GET /api/v1/capabilities` on each load (no visible upload affordance while `customUploadEnabled:false`; direct `/start` visit explains the gate).
- Views: Home (scope, privacy/provider notice, sample CTA), Sample chooser (manifest-driven cards + fixed preview URLs), Extraction pending (honest pending state — no fabricated progress), Review (12 groups / 33 components, state labels, page evidence with `matched_text`/`model_transcription` quality labels, correction editor producing validated deltas, expiry warning), Analysis pending, Findings report (category cards, evidence pairs for mismatches, source citation block when present, coverage/limitations, no global verdict, partial-report framing).
- Client state rules: issued payload/proof/report/file preview in memory only; no URLs/storage/analytics leakage; Blob URL revocation; refresh loses review with explanation.
- Escaped-text rendering everywhere; no MCP/HMAC jargon in copy; plain-English states.
- Express static serving of `web/dist` + SPA fallback (reserved `/api/*` + `/health`).

**Tests:** Vitest + React Testing Library component tests per view (capability-gated rendering, correction delta shape, evidence quality labels, partial-report banner, error states table from spec §6); Playwright journey covering the **five-sample user journey** (happy paths + one partial state + expiry recovery), run against the local stack with fake Gemini; axe accessibility smoke on core views.

**Exit criteria:** five-sample journey green in Playwright against local dev server with fakes; spec §8 checklist items 1–4, 6 verified (item 5 needs the MCP phase; item 7 needs deployment).

---

## Phase 12 — UI/UX polish (optional phase)

**Goal:** Visual/design refinement. Explicitly optional and separable; core flow must not depend on it.

**Depends on:** 11.

**Scope (selected at re-planning):** design tokens per spec §3 (color/type/spacing), responsive breakpoints, WCAG 2.2 AA pass (contrast, focus, target size, live regions), document preview pane with page navigation + highlight attempt, illustration, mobile review layout. Any change stays within spec boundaries; larger redesigns require updating `docs/FRONTEND_SPECIFICATION.md` first.

**Tests:** Playwright visual/responsive checks; axe full pass; keyboard-only journey; zoom/reflow check.

**Exit criteria:** spec §7 accessibility items verified; no core-flow regressions (web-app suite still green).

---

## Phase 13 — Security hardening + abuse-focused tests

**Goal:** The `docs/SECURITY.md` controls exist in code with focused tests for their specific risks.

**Depends on:** 06 (parallel with content phases; must precede deployment).

**Adds/changes:**
- Rate/concurrency admission (`429 RATE_LIMITED`/`SERVICE_BUSY`, `Retry-After`), per-request deadline shorter than platform timeout, upstream cancellation where supported, temp-byte cleanup on success/failure/cancel (tests assert cleanup).
- Logging audit: structured coarse logs only; redaction tests proving no bodies/quotes/filenames/prompts/proofs/secrets in log output or error envelopes.
- Response headers: `Cache-Control: no-store`, CSP, framing/referrer policies; escaped rendering verified.
- Parser hardening tests: MIME/magic mismatch, page bomb, oversized stream, malicious filename, adversarial instructions in PDF treated as data.
- Signed-payload abuse tests: replay-within-TTL acknowledged in docs, oversized payload, unknown keyId, cross-scope tamper.
- Prompt-injection corpus case (from the corpus phase) asserted to produce data-only treatment.

**Tests:** the above as a dedicated security suite; results summarized in testing log with the risk each test addresses.

**Exit criteria:** `docs/SECURITY.md` §7 checklist items 2–4 demonstrably pass at the component level (item 1 capability wording finalized at deployment; item 5 with the release).

---

## Phase 14 — Deployment: container, Cloud Run, smoke, release record

**Goal:** One public service per ADR-008, deployed from the verified Dockerfile, with measured limits and the documented release record. First production milestone is **document-check-only** with explicit source-review disclosure unless the MCP phase's live checklist has passed.

**Depends on:** 13, 11; rule-backed feature activation additionally requires Phase 10 live verification.

**Adds/changes:**
- `Dockerfile` (multi-stage: build web, install api prod deps, non-root runtime, `PORT` binding) + `.dockerignore`; image only ever contains the five allowlisted samples + manifest, never corpus truth files, `.env`, or source PDFs.
- Cloud Run staging → production procedure per `docs/DEPLOYMENT.md` §3 template filled with real commands/values; secrets via Secret Manager bindings (`GEMINI_API_KEY`, `SANITY_ORGANIZATION_TOKEN` when the MCP phase is reached, `REVIEW_HMAC_SECRET`); nonsecret flags via env file (`SAMPLE_MODE_ENABLED=true`, all other gates off).
- Staging checks per `docs/DEPLOYMENT.md` §4: health, capabilities vs actual flags/limits, five samples, single-doc + partial paths, `403 CUSTOM_UPLOAD_DISABLED` under crafted upload, log audit.
- Measured limits (file/page/total bytes, deadline, concurrency) recorded from staging runs and reflected in `/capabilities`; `docs/DEPLOYMENT.md` release record filled.
- Rollback notes: revision traffic shift procedure verified once on staging.

**Tests:** smoke suite executed against staging then production (fictional samples only); results + URLs + revision + digest recorded in testing log and release record.

**Exit criteria:** public URL serves the sample-only experience with truthful capability flags and the source-review disclosure (or full rule-backed findings if Phase 10 live checks passed); release record complete; rollback demonstrated.

---

## Phase 15 — Corpus evaluation, evidence ledger, documentation alignment

**Goal:** Achieved-results measurement against the frozen corpus and final documentation alignment.

**Depends on:** 07, 14.

**Adds/changes:**
- Corpus run against the deployed stack (live Gemini; live retrieval where Phase 10 passed): record model/prompt versions, code commit, content release, config per `docs/TESTING.md` §1.
- Metrics with numerators/denominators per `docs/TESTING.md` §3 (field accuracy, mismatch recall, finding precision, citation support 100%-or-zero rule, abstention safety, latency p50/p95 machine-only); results into the evidence ledger in `docs/TESTING.md` + a dated machine-readable results file.
- Documentation alignment: README implementation status, `docs/TESTING.md` ledger, `docs/DEPLOYMENT.md` record, capability copy vs reality; any contract drift found during phases already folded back via re-planning.

**Tests:** this phase *is* measurement; targets reported as targets, achieved counts as achieved.

**Exit criteria:** evidence ledger no longer "Not run"; all docs state actual verified status; known gaps listed explicitly.

---

## 5. Cross-cutting rules

- **Re-planning gate:** no phase starts without its `plan.md` (protocol in `plans/README.md`).
- **Determinism boundary:** Gemini extracts and phrases; application code decides mismatches, categories, applicability, and citations (root `CLAUDE.md`).
- **Untrusted input:** document text, model output, MCP results are data, never instructions.
- **Honest states:** partial > invented completeness; withheld claims > plausible claims; documented errors > silent fallbacks.
- **Secrets:** only via owner-provided secure channel → local git-ignored `.env` (development) or platform secret bindings (deployment). Never in plans, logs, CI, client bundles, or source control.
- **Gates stay closed** until their evidence exists: custom upload, JPG/PNG, Urdu, source-backed findings (until Phase 10 live pass), production release claims.
