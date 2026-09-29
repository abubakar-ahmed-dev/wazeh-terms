# Phase 06 — implementation log

Branch: `phase-06-analysis` (stacked on `phase-05-comparison`; retarget/rebase
onto `dev` after PR #8 merges). Date: 2026-09-29.

## What was changed

`POST /api/v1/analyses` — the second step of the documented flow — works end
to end over HTTP with the fake Gemini and no Sanity. No retrieval, no
model-phrased explanations.

- **`routes/analyses.ts`**: bounded body → outer schema → proof verification
  on the raw object (order: malformed/unknown_key/mismatch ⇒ `422 REVIEW_INVALID`,
  `schemaVersion ≠ 1` ⇒ `409`, expired ⇒ `410`; messages are fixed text with no
  key/HMAC detail) → full `IssuedExtractionV1Schema` → corrections schema
  (`422 INVALID_CORRECTION` incl. the 100-cap, so overflow answers the
  documented code) → reconciliation → compare (Phase 05) → assembly →
  `AnalysisResponseSchema.parse` self-check → `200 partial`.
- **`services/analysis/reconcile.ts`**: corrections resolve against existing
  `documentId+fieldKey+instanceId` triples only; duplicates rejected; effective
  fields carry the corrected state/value with a `corrected_by_user` note while
  the original evidence object stays untouched; `correctedKeys` set exported.
- **`services/analysis/scope.ts`**: `supported` only for the declared
  mainland+non-domestic route with no contrary clue; deterministic
  contrary-phrase scan (`domestic worker`, `household worker`, `free zone`)
  over extracted rawText ⇒ `conflicting`; `unknown`/`other` declarations ⇒
  `unknown`. No logo/address inference exists.
- **`services/analysis/report.ts`**: stage statuses (extraction mirrors issued
  docs; review `completed` on accepted request; comparison
  `completed|not_applicable`; retrieval `not_started`; applicability `partial`;
  explanation `completed` from deterministic templates); coverage
  (documentIds/checked/unreadable/omitted); limitations (D8 disclosure, scope
  wording, extraction-partial note); `officialNextSteps` from a server-side
  allowlist (BEOE protection page, u.ae labour rights — SOURCES.md candidates).
  Two correction-integrity passes:
  1. `downgradeUserCorrectedMismatches` — any mismatch with a corrected side
     becomes `needs_clarification` + `user_reported_difference`, both passages
     kept, `comparisonRuleKey` dropped, `valueOrigins` per side;
  2. `synthesizeCorrectionClarifications` — every applied correction also
     surfaces exactly once as a labelled user-reported difference (even when it
     equalizes the documents), offer-first evidence order, skipped when pass 1
     already reported the field and when the correction restates the original.
- **`server/app.ts`**: analyses router mounted; JSON body limit 64kb → 512kb
  (coarse ceiling; measured limits replace it in Phase 13/14).
- **`compare/compare.ts`**: comparison input narrowed to
  `CompareDocumentInput { role, fields }` (engine reads only effective fields).
- **Tests**: `api/test/phase-06/` — 5 suites + helpers, 26 new tests (api now 166).

## Decisions / deviations

- **Summary rule hardened beyond the plan:** the all-clear sentence requires a
  *completed* report; with retrieval absent the report is always `partial`, so
  the sentence is unreachable this phase (test asserted the exact leak first).
- **Correction synthesis pass added** (not in plan): a correction that
  equalizes the documents otherwise disappears silently; API.md §8-3's intent
  is that user-reported differences always surface labelled. Plan's
  "downgrade pass" implemented as stated, synthesis added beside it.
- **`review: completed` on every accepted request** per plan (API.md wording).
- **Outer body schema carries no corrections cap** so overflow answers
  `422 INVALID_CORRECTION` rather than a generic `400` (API.md §7 mapping).
- **Evidence order offer-first** in synthesized findings; `valueOrigins`
  follows the same order (UI pairing assumption, logged).
- No new dependencies. No contract-shape changes (new `ScopeApplicability`
  type export is infer-only).

## Files/components affected

New: `api/src/services/analysis/` (4), `api/src/routes/analyses.ts`,
`api/test/phase-06/` (6).
Changed: `api/src/server/app.ts` (mount + limit), `api/src/compare/compare.ts`
(input type), `api/src/contracts/analysis-report.ts` (type export only).

## Validation

See `testing-log.md`: 31 files / **166/166 tests**, lint 0 issues, typecheck
clean, build green. `API.md` §8 checks 1–3 and 5 green; the two-step flow runs
over real HTTP with the fake provider. Live provider run remains pending
(owner quota) and is not exercised by this phase.

## Remaining issues

- Retrieval/applicability stages intentionally `not_started`/`partial` until Phase 10.
- Next: Phase 07 (synthetic corpus) or Phase 08 (Studio schema) per the
  master-plan dependency graph; both parallel-friendly with Phases 11+.
