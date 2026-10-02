# Phase 15 — Corpus evaluation, evidence ledger, documentation alignment

Branch: from `main`. Authority: `plans/master-plan.md` Phase 15,
`docs/TESTING.md` §1/§3/§4 (metric definitions are binding), `docs/PRD.md`
targets, `docs/SOURCES.md`. Date: 2026-10-02.

**Goal:** Measure achieved results against the frozen 15-case corpus on the
live configuration, publish exact numerators/denominators in the evidence
ledger, and align every public document with what actually exists. Targets
in PRD/TESTING.md stay targets; this phase reports achieved numbers beside
them without relabelling.

## 1. Freeze manifest (record before any run)

One committed file `test-corpus/eval/freeze-<date>.json` recording:

- Corpus revision: git SHA of the last `test-corpus/` change.
- Code commit: main SHA evaluated.
- Model: `gemini-3.5-flash-lite`; prompt: file path + SHA of the extraction
  prompt source (`api/src/services/extraction/` — record exact file).
- Sanity content release: 44 approved published records, per-rule
  `reviewedAt` (Rule 1 = 2026-09-30 amendment check), dataset `production`.
- KB release: `kbynAP4r8P6m`, build date of last refresh.
- Deployed config: Cloud Run revision, flags (sample ON, demo upload ON,
  image/Urdu OFF), measured limits (8 MB / 16 MB / 15 pages / 100
  corrections / 45 s deadline / 15 s retrieval), notice
  `gemini-free-demo-v1`.
- Provider posture: Gemini API Free tier — quota-limited; pacing required.

## 2. Evaluation runner — `api/scripts/run-eval.ts`

- Drives all 15 corpus cases end-to-end: extraction → (deterministic
  compare inside analysis) → report. Primary evidence path = **production
  HTTP** via the demo-upload route (true deployed stack: multipart →
  extraction → analysis with live KB retrieval + canonical gate);
  TC-014 uses its single contract PDF.
- Iteration path = local runner with live Gemini + live MCP (same service
  functions, no redeploy); clearly labelled as such in results.
- **Pacing + resume:** Free-tier RPM/RPD limits — sleep between provider
  calls (~12–15 s), append one JSONL line per case to
  `test-corpus/eval/results-<date>.jsonl`, so an interrupted run resumes
  without duplicating completed cases. Splitting the run across hours/days
  is acceptable; record segment timestamps.
- **Artifact hygiene (SECURITY.md §6 applies):** results carry case IDs,
  metric booleans, counts, timings, sanitized error codes — never document
  text, quotes, prompts, signed payloads, or secrets.
- Dry-run mode: fixture Gemini + fake MCP through the same runner, zero
  provider cost — used to prove the harness before the live run.

## 3. Scorer — `api/src/corpus/score.ts` (+ unit tests)

Deterministic module consuming truth.json + report JSON; unit-tested with
synthetic outputs. Implements `docs/TESTING.md` §3 exactly:

| Measure | Implementation |
| --- | --- |
| Clean digital field accuracy | Correct `(case, document, fieldKey, instanceId, component)` state **and** normalized value vs `expectedFields`; denominators = labelled in-scope assessable components on readable pages; state-only and value-only subtotals reported separately. |
| Critical mismatch recall | Each `seededDifferences` entry → emitted `document_mismatch` carrying both source passages; separately counted: unreadable/out-of-scope seeded differences. |
| Finding precision | Emitted substantive `document_mismatch`/`source_backed_concern` judged fully supported (category + evidence) vs all emitted; per-category breakdown; duplicate unsupported findings counted as errors; clarification/missing-info scored separately. |
| Citation support (100%-or-zero) | Each displayed source-backed finding checked for correct approved rule revision, current official source version, actually supporting pinpoint, actor, category, conditions, temporal applicability vs truth `requiredRuleRefs`. Zero emitted findings = **gate not passed**, stated plainly. |
| Abstention safety | Abstention cases (per truth `expectedAbstentions`, incl. TC-013/TC-014) must show zero definitive rule/compliance claims; no global verdict anywhere; false document mismatches on abstention cases counted separately. |
| Latency (machine only) | Extraction + analysis wall time per case (response metadata/logs), p50/p95, with provider + size conditions; user think time excluded. Target p50 < 45 s reported as target vs achieved. |
| Absolute counts | present/absent/unclear/unreadable totals, partial/failure stages, wrong pinpoints, hallucinated quotations, unsupported law assertions. |

- TC-015 (prompt injection): assert end-to-end that no instruction-driven
  values appear (salary stays 2500.00; output passes schema/evidence checks)
  — complements the Phase 13 unit tests.
- Known KB→rule mapping nondeterminism (run-to-run variance observed in
  Phase 14): run ONCE for the record; do not re-run to cherry-pick; note
  observed variance qualitatively in the review record.
- Human-judged measures (citation support, finding precision): the runner
  emits an evidence bundle per finding (finding JSON + truth expectation +
  quoted passages) into the results file for review; agent performs first
  pass, **owner reviews contested items and signs the record** (two-person
  review per TESTING.md §1). Record reviewer names + date.
- Report a confidence statement: 15 samples → wide uncertainty; percentages
  are development checks, not legal-validation promises.

## 4. Evidence ledger + results artifacts

- Fill `docs/TESTING.md` §3 ledger row: release/build, corpus revision,
  provider/model, Sanity/KB release, passed/total **per measure**,
  p50/p95 + conditions, open failures.
- Commit `test-corpus/eval/eval-<date>.json` (machine-readable aggregate:
  all numerators/denominators, per-case rows, timings, conditions) +
  `eval-<date>-review.md` (concise human review: contested judgments,
  owner sign-off, quota interruptions).
- PRD targets (≥95% field accuracy, ≥90% mismatch recall, ≥85% precision,
  100% citation support, p50 < 45 s) reported **as targets**; achieved
  numbers stated beside them with denominators — never conflated.

## 5. Documentation alignment sweep (each with a commit)

1. `README.md` implementation status vs reality post-eval (incl. honest
   achieved-results wording; upload demo wording stays scoped to MT-10
   fictional-only).
2. `docs/TESTING.md` §4 gate table: clarify **"Real custom upload" gate ≠
   the MT-10 fictional-only demo upload** — demo scope recorded; real
   documents still gated on paid provider path + revised notice.
3. `docs/DEPLOYMENT.md`: append evaluation date + results pointer to the
   release record.
4. `docs/FRONTEND_SPECIFICATION.md` + live `/api/v1/capabilities` case
   check: sample count, limits, notice version, flags, language, MIME —
   UI copy vs API truth.
5. `docs/API.md` contract drift check against implementation. Known
   candidates from Phase 14 work: finding field naming (spec `kind` vs
   implementation `category`), withheld-reason visibility,
   `sourceBackedChecks` capability field. Each drift item is either (a)
   fixed as a doc correction with a note, or (b) logged in
   `plans/phase-15/replanning-items.md` for a superseding contract change —
   no silent extension.
6. Update `plans/master-plan.md` Phase 15 status and this folder's
   `implementation-log.md` / `testing-log.md`.

## 6. Non-goals

No model/prompt tuning to chase numbers (rebaseline requires documented
human review per TESTING.md §5); no new features; no JPG/PNG or Urdu work;
no real-document enablement; no CI pipeline; no corpus relabelling without
owner sign-off.

## 7. Tests / validation

- Scorer unit tests (synthetic truth/report pairs: exact match, state-only
  wrong value, missing field, duplicate finding, wrong pinpoint,
  abstention violation, injection case).
- Runner dry-run (fixture mode) produces a complete zero-cost report.
- Full regression (lint, typecheck, 314+ web suites) stays green.
- One recorded live production run (resumable) + optionally one local
  iteration run, both labelled in artifacts.

## 8. Exit criteria

Ledger row filled with exact numerators/denominators per measure; abstention
safety result stated (zero definitive claims on abstention cases — or an
explicit recorded failure); citation-support gate evaluated with the
100%-or-zero rule; latency p50/p95 recorded vs the 45 s target; artifacts
committed (freeze, results, aggregate, review); all five documentation
alignments done with drift dispositioned; README achieved-status wording
approved by owner. Phase complete only with owner sign-off on contested
judgments.

## 9. Risks

- Free-tier RPD quota may force multi-day runs (acceptable; segments
  recorded) — never bypass by key switching.
- KB mapping variance may produce run-to-run citation differences (known;
  documented, not tuned around).
- Provider latency variance; 45 s p50 target may miss — report measured.
- Scoring disputes on "fully supported" findings → owner second-review,
  contested items logged with rationale.

## 10. Owner touchpoints

- Approve run window (Free-tier quota spend ~50–70 provider calls).
- Second-review sign-off on contested citation/precision judgments.
- Approve final README achieved-results wording and any contract-drift
  disposition (docs fix vs re-planning item).
