# Phase 06 — Analysis step: corrections, report assembly, `POST /api/v1/analyses` — plan

**Depends on:** Phases 04 (verified evidence) + 05 (comparison engine). Branch
`phase-06-analysis` stacked on `phase-05-comparison` until PR #8 merges;
retarget to `dev` then. **Owner inputs needed: none** (offline, fake-based).

**Re-planning check:** `docs/API.md` §5–§8, `docs/SECURITY.md` §3, `docs/ADR-002/010`,
`docs/TECHNICAL_ARCHITECTURE.md` §3.2/§6 re-read. Compare engine (Phase 05) and
HMAC verify (Phase 02) exist and are tested; nothing analysis-shaped exists.

**Goal (master-plan):** second step of the documented flow — verify proof,
reconcile corrections, compare, assemble the structured report with honest
stage/coverage states. `API.md` §8 contract checks 1–3 + 5 green; end-to-end
HTTP demonstrable with fake Gemini and no Sanity.

## Behavior contract (from docs; implementation maps 1:1)

| Concern | Behavior |
| --- | --- |
| Size bound | Bounded JSON body before work (app limit raised 64kb → 512kb; measured later per TESTING.md). |
| Proof order | shape/malformed → `422 REVIEW_INVALID`; `schemaVersion ≠ 1` → `409 REVIEW_VERSION_UNSUPPORTED`; unknown keyId → `422`; signature mismatch → `422` (no HMAC/key detail in any message); expired → `410 REVIEW_EXPIRED`. Verify runs on the raw payload object (re-canonicalized), then full `IssuedExtractionV1Schema`. |
| Corrections | Each references an existing `documentId`+`fieldKey`+`instanceId` in the issued payload (else `422 INVALID_CORRECTION`); schema validation + ≤100 + duplicate-target rejection; corrections never touch original evidence. |
| Reconciliation | Original immutable; effective value = correction's state/value with `suppliedBy: user`; original rawText/evidence kept visible in findings. |
| Mismatch integrity | A `document_mismatch` where either side is user-corrected is **downgraded** to `needs_clarification` with `user_reported_difference` — never a confirmed mismatch; both passages kept for transparency; `valueOrigins` reflect sides (`user` where corrected). |
| Comparison | Phase 05 `compareDocuments`; single document ⇒ `comparison: not_applicable`, no comparison findings. |
| scopeApplicability | Declared `uae_mainland_private`+`non_domestic` with no contrary document clue ⇒ `supported`; explicit contrary clue in extracted text (deterministic `domestic worker` phrase scan) ⇒ `conflicting`; `unknown`/`other` declarations ⇒ `unknown`. Regime never inferred from logo/address (no such inference code at all). |
| Stages | extraction mirrors issued doc statuses; review = `completed` (accepted request ⇒ user advanced past review, API.md §6 wording); comparison per above; retrieval = `not_started` (no MCP configured); applicability = `partial` (declaration-based + minimal clue scan only); explanation = `completed` (deterministic templates). |
| Report status | `partial` while retrieval is not performed (D8) — the sample-only deployment never returns `complete`. |
| Summary | `"No concern detected in the fields checked."` only when relevant checks completed **and** no findings; partial reports use an explicitly partial summary sentence. |
| Coverage | documentIds, checkedFieldKeys (compare stats or union of issued fields for single doc), unreadableFieldKeys, omittedChecks (source review omission named). |
| Limitations | Source-review disclosure (D8) + scope-applicability wording when `conflicting`/`unknown` + extraction-partial note when applicable. |
| officialNextSteps | Server-side allowlist only (constants from reviewed SOURCES.md candidates: BEOE protection page, u.ae labour rights). |

## Files to create/change (`api/src/`)

| File | Content |
| --- | --- |
| `services/analysis/reconcile.ts` | Corrections → effective per-document fields + `correctedKeys: Set<"documentId:fieldKey:instanceId">`; validates existence against the issued payload. |
| `services/analysis/scope.ts` | `scopeApplicability(declared scope, effective documents)` per table above. |
| `services/analysis/next-steps.ts` | Allowlisted official links (constants + provenance comment). |
| `services/analysis/report.ts` | Assembly: stage statuses, coverage, limitations, summary rule, downgrade pass over compare drafts (`FindingDraft` → schema-valid `AnalysisResponse` via `AnalysisResponseSchema.parse` self-check before send). |
| `routes/analyses.ts` | `POST /api/v1/analyses` orchestration: size/schema/proof/corrections → reconcile → compare → assemble; error mapping per table. |
| `server/app.ts` | Mount analyses router; body limit 512kb. |
| `api/test/phase-06/*` | Suites below. |

## Tests (`api/test/phase-06/`, offline; test key = server key so tests can sign arbitrary payloads)

1. **`proof.test.ts`** — tampered field/scope/digest/expiry ⇒ `422 REVIEW_INVALID` (message carries no key/HMAC detail); unknown keyId ⇒ `422`; malformed proof ⇒ `422`; `schemaVersion: 2` (signed) ⇒ `409`; expired (past `expiresAt`, signed) ⇒ `410`; valid round trip ⇒ accepted.
2. **`corrections.test.ts`** — unknown identity triple ⇒ `422 INVALID_CORRECTION`; duplicate target ⇒ `422`; >100 ⇒ `422`; wrong shape/state-with-null ⇒ `422`; valid correction accepted and reflected only as user-supplied.
3. **`flow.test.ts`** (§8 checks 1–3, 5) —
   a. single-document signed payload ⇒ no comparison findings, `comparison: not_applicable`, `partial` + source-review limitation, `scopeApplicability: supported`;
   b. pair with two explicit different salary passages ⇒ exactly one `document_mismatch` with both pages (`comparisonRuleKey: money_equality`);
   c. same pair + user-corrected salary on one side eliminating the difference ⇒ clarification with `user_reported_difference`, never a mismatch; correction keeping the difference ⇒ still downgraded (uncorroborated side present);
   d. §8 5: retrieval stub ⇒ `partial` with document findings intact and `retrieval: not_started`;
   e. duplicate-correction rejection; invented-field rejection (§8 2).
4. **`report-shape.test.ts`** — response parses `AnalysisResponseSchema`; stages key set; `officialNextSteps` ⊆ allowlist; summary rules: `partial` ⇒ never the all-clear sentence, findings-present ⇒ never the all-clear sentence; `scopeApplicability: unknown` for declared-unknown scope; `conflicting` when contrary clue text present.
5. **`end-to-end.test.ts`** — real two-step HTTP flow with fake Gemini: `POST /extractions` (temp fixture manifest, matched-text quotes) → echo returned payload+proof into `POST /analyses` ⇒ `200 partial`, mismatch present, proof not exposed in the report, `no-store` set.

## Decisions

- **`review: completed` on every accepted analyses request** — API.md defines it as "user advanced past the review screen"; the request's existence is that signal. No new request field invented.
- **`explanation: completed`** — Phase 06 uses deterministic templates only; the optional model-phrasing call arrives later (TECHNICAL_ARCHITECTURE §3.2 step 7) and will manage this stage then.
- **Downgrade rule location:** post-compare pass in report assembly (compare stays pure §5 semantics; correction awareness lives in the analysis layer).
- **Contrary-clue scan:** deterministic phrase check only; conservative, logged as a limitation of the `conflicting` detection until richer applicability rules arrive.
- **Body limit 512kb** app-level (single JSON parse); measured limit replaces it in Phase 13/14.

## Exit criteria (master-plan)

Two-step flow demonstrable locally end to end via HTTP with fake Gemini and no
Sanity; `API.md` §8 checks 1–3 and 5 green; whole suite + lint + typecheck +
build green; CI green.

## Out of scope

MCP retrieval/citation (Phase 10), model-phrased explanations, rate limiting
(13), UI (11), corpus scoring (07/15).
