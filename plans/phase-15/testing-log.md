# Phase 15 — Testing Log

## Live production evaluation (2026-10-02)

- 15/15 cases through `wazehterms-00009-stc` (production HTTP, demo-upload
  route), paced 13 s, zero retries, zero quota failures.
- Aggregate + per-case: `test-corpus/eval/eval-2026-10-02.json`; raw:
  `results-2026-10-02.jsonl`; freeze: `freeze-2026-10-02.json`.
- Achieved (numerators/denominators): field accuracy 46/49 (94%);
  mismatch recall 8/13 (62%); precision human-adjusted 6/28 (21%); citation
  1/1 structural (owner sign-off pending); abstention 0 violations;
  TC-015 injection held; hallucinated quotes 0; machine end-to-end p50
  ≈ 20 s / p95 ≈ 27 s (target p50 < 45 s met).
- Targets ≥95/≥90/≥85/100 reported as targets — recall and precision NOT
  met; causes documented in `plans/phase-15/replanning-items.md`.
- Human first-pass review (agent) in `eval-2026-10-02-review.md`; owner
  second-review pending on 4 sign-off items.
- Dry-run harness proof: 15/15 with fixture provider (49/49 field accuracy
  vs fixtures), artifacts kept as `results-dryrun.jsonl` / `eval-dryrun.json`.
