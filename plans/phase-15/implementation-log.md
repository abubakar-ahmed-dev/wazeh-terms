# Phase 15 — Implementation Log

Branch: `phase-15-eval` from `main`. Date: 2026-10-02.

## What was built

- `api/src/corpus/score.ts` — TESTING.md §3 scorer: field accuracy (state +
  value, subtotals), seeded-mismatch recall (two role-distinct passages),
  finding precision (auto-unsupported + human-review split, duplicates,
  per-category), citation support against the frozen approved-rule
  inventory (pinpoint label identity), abstention safety with per-case
  superseded labels, hallucinated quotes vs flattened sample text, TC-015
  injection hold, machine latency p50/p95 aggregation. 13 unit tests.
- `api/scripts/run-eval.ts` — dry/production/local/score modes; production
  path = deployed demo-upload route; 13 s Free-tier pacing; JSONL per-case
  resume; 429/503 Retry-After retry; score mode → `eval-<date>.json` +
  human-review bundles.
- `api/scripts/e2e-server.ts` (test path only) — corpus-tree indexing so
  dry runs match corpus bytes.
- `test-corpus/eval/` — `freeze-2026-10-02.json` (with recorded amendment),
  `results-dryrun.jsonl` + `eval-dryrun.json` (harness proof), 
  `results-2026-10-02.jsonl` + `eval-2026-10-02.json` (production run),
  `eval-2026-10-02-review.md` (human first-pass verdicts + sign-offs).
- `plans/phase-15/replanning-items.md` — six contract/engine items.

## Key decisions

- Citation gate scored against a frozen approved-rule snapshot in the
  freeze manifest (truth `requiredRuleRefs` is schema-frozen empty).
- TC-012 `no_rule_claims` treated as superseded by approved content —
  recorded with rationale, owner sign-off requested.
- Scoring fixed three harness bugs found by the dry run (path depth, spawn
  on Windows, pinpoint object shape, line-wrap quote matching) before the
  production run; production run itself needed no reruns.
- API.md drift check: `category` naming and `sourceBackedChecks` already
  match the contract — no drift found on the suspected candidates; no
  contract changes made this phase.

## Validation

- Scorer 13/13; api 327 (314 + 13) + web 5; lint 0; typecheck clean.
- Dry run 15/15 (fixture provider); production run 15/15 (live stack),
  zero quota failures.

## Remaining (blockers)

- Owner sign-offs listed in the review record (citation support, TC-012
  supersession, replanning disposition, README wording).
- Replanning items 1–6 are future engine/contract work, not this phase.
