# Release-polish — testing log

All times local 2026-10-02. Branch `release-polish`, working tree only.

| # | Check | Command | Result |
| --- | --- | --- | --- |
| 1 | New policy tests | `npx vitest run test/release-polish/` | 15/15 passed |
| 2 | Full API suite (after WI-1–WI-4) | `npx vitest run` (api) | 54 files / **342 passed** |
| 3 | Corpus regeneration determinism | `npm run generate:corpus -w api` + Phase 07 suite | PDFs byte-identical; suite green |
| 4 | Affected suites after sample-set change | production-samples, five-sample-flow, phase-08, security | 52/52 passed |
| 5 | Dry eval, corrected engine + rebaselined truth | `run-eval.ts --mode=dry --date=rp-dryrun3` + `--mode=score` | 15/15 cases; **53/53** field, **11/11** recall, **12/12** precision, 0 abstention violations (`eval-rp-dryrun3.json`) |
| 6 | Production-run rescore (amended truth + policy) | `run-eval.ts --mode=score --results=results-2026-10-02.jsonl --date=2026-10-02-revised` | **52/53**, **11/11**, **13/13** substantive + 15 policyExempt; citation 1/1 structural; 0 violations, 0 false mismatches, 0 hallucinated quotes (`eval-2026-10-02-revised.json`) |
| 7 | API lint / typecheck | `npm run lint` / `npm run typecheck` | clean (one unused-import lint fix applied) |
| 8 | Web lint / typecheck / tests / build | `npm run lint\|typecheck\|test\|build` (web) | clean; 5/5 tests; build ok |
| 9 | Transient flake note | `security/zero-retention` under full parallel load | failed once, passed isolated rerun (known parallel-load pattern, matches the earlier cancellation-test fix) |

## Open items needing a deployed revision or owner action

- Live browser journey (WI-11): blocked this pass (no deploy). Local
  HTTP-level six-sample journey covered by check 2 (`five-sample-flow`).
- Fresh production eval re-run on the corrected engine: owner quota
  approval (Free tier). Rescore of existing outputs shown in check 6.
- Citation 100% gate: owner sign-off on the single TC-012 finding
  (`eval-2026-10-02-review.md` sign-off list, still open).
- Truth rebaseline ratification (WI-4) + README wording approval.
- TC-014 unreadable-page labeling: design decision (replanning item 5).
