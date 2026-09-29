# Phase 10 — testing log

Environment: Windows 10 Pro, bash (Git Bash), Node v22.16.0, vitest 5.0.2.
Date: 2026-09-29. Fully offline (fake transport, injected fetch; no MCP, no
Content Lake, no provider calls).

| # | Check (plan §Test list) | Where | Result |
| --- | --- | --- | --- |
| 1 | Mode verification: GROQ-only toolset → `wrong_mode`; endpoint error → `unavailable`; report stays 200 partial with document findings | `retrieval.test.ts`, `report-wiring.test.ts` | Pass |
| 2 | Known-answer: matching seed passes; wrong key → `rule_key_missing`; wrong mode → `wrong_mode` | `retrieval.test.ts` | Pass |
| 3 | Query sanitization: allowlisted fact keys only; no document amounts/text in outgoing payload | `retrieval.test.ts` | Pass |
| 4 | Happy path: candidate → canonical rule + source → complete `SourceCitation`, field-by-field | `gate.test.ts`, `retrieval.test.ts`, `report-wiring.test.ts` | Pass |
| 5 | Withholding matrix: unmappable, revision mismatch, superseded, unapproved, non-current, class mismatch, unregistered trigger, unverifiable condition, scope, temporal (early/expired/undated-binding/guidance-unverified), pinpoint, stale check, schema version, ambiguous — each with its closed reason, document findings untouched, no `source` in response | `gate.test.ts`, `retrieval.test.ts`, `report-wiring.test.ts` | Pass (14 negative classes) |
| 6 | Boundedness: tool-call cap enforced (≤3 searches at budget 3); deadline abort mapped | `retrieval.test.ts` | Pass |
| 7 | Unconfigured regression: same partial shape/summary/limitation/omittedChecks as Phase 06 (byte-stable assertions) | `report-wiring.test.ts` + existing phase-06/07 suites | Pass |
| 8 | Determinism: same gate inputs → identical verdict/citation | `gate.test.ts` | Pass |
| 9 | Trigger predicates: payer variants (worker/null/unknown/other fire; uae_employer + pakistan_recruiter do not), frequency variants (non-monthly/absent fire; unreadable never), total-vs-components (gap fires, arithmetic holds doesn't, unlike currencies uncheckable) | `triggers.test.ts` | Pass |
| 10 | Reader: single hit, revision pin, empty → not_found, two approved → ambiguous, schemaVersion 2 → unsupported, malformed row, 401/bad-JSON/network → unavailable; read token only when configured | `reader.test.ts` | Pass |
| 11 | Trigger-key drift: api list equals Studio allowlist exactly (fs-read of `sanity-studio/schemaTypes/trigger-keys.ts`) | `drift.test.ts` | Pass |
| 12 | Full regression | root `lint` 0 issues; `typecheck` (api+web+studio) clean; `test` **42 files, 273/273** (59 new); `build` green (api + web) | Pass |

## Issues found and fixed during testing

1. Pakistan-recruiter payer fired the UAE-employer trigger — predicate
   narrowed (see implementation log); test now pins both exclusions.
2. Mixed-currency stated totals fired as arithmetic mismatches — uncheckable
   currency pairs are now skipped, not failures.
3. Query allowlist rejected the payload's own root keys — allowlist rewritten
   around the actual closed shape (`query` + `filters.*`).
4. A pinned-revision canonical miss mapped to `unmappable_candidate` — now
   `revision_mismatch` when the candidate pinned a revision.
5. Drift test resolved a wrong relative path to the Studio trigger-keys file.

## Live verification checklist (pending — recorded, not run)

Run only when MT-5 + Phase 09 seed exist, as part of real code work (owner's
standing rule: no ad-hoc live API runs):

1. `npm run live:retrieval -w api` with `SANITY_CONTEXT_MCP_URL`,
   `SANITY_ORGANIZATION_TOKEN`, `SANITY_PROJECT_ID=8g0kllu0`,
   `SANITY_DATASET=production`, `LIVE_KNOWN_ANSWER_QUERY`,
   `LIVE_KNOWN_ANSWER_RULE_KEY` set.
2. Expect: tools/list + KB-mode verified; known-answer read surfaces the
   seeded ruleKey; one canonical read gates to an eligible citation.
3. Until then `source_backed_concern` remains disclosed-partial (D8); the
   capability flag reports the real unconfigured state.
