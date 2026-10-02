# Eval review record — 2026-10-02 production run

Run: 15/15 cases through the live deployment (`wazehterms-00009-stc`,
Free-tier Gemini `gemini-3.5-flash-lite`, live KB retrieval). No quota
failures, no retries. Machine output: `eval-2026-10-02.json`; raw per-case
lines: `results-2026-10-02.jsonl`. Freeze: `freeze-2026-10-02.json`
(amendment recorded: approved pinpoint label corrected before scoring).

First-pass human review: agent (2026-10-02). **Owner second-review and
sign-off pending** for items marked ⏳.

## Aggregate (numerators / denominators)

| Measure | Achieved | PRD target |
| --- | --- | --- |
| Field accuracy | **46/49 (94%)** — state-only 2, value-only 44 | ≥95% — 1 component short |
| Critical mismatch recall | **8/13 (62%)** | ≥90% — not met |
| Finding precision (before human pass) | 9 pending + 18 auto-unsupported of 28 emitted | ≥85% — not met (see verdicts) |
| Citation support | 1 displayed, 1 structurally valid, 0 unsupported; human pass below | 100% or zero |
| Abstention safety | **0 violations**; no global verdict anywhere; TC-015 injection held | zero definitive claims — met |
| Machine latency | extraction p50 16.5 s / p95 22.5 s; analysis p50 3.5 s / p95 4.6 s; **end-to-end p50 ≈ 20 s** | p50 < 45 s — met |
| Hallucinated quotations | 0 (after line-wrap-aware matching) | — |
| 15-sample caveat | wide uncertainty; development check, not legal validation | — |

## Human verdicts on pending findings (agent first pass)

| # | Case | Finding | Verdict |
| --- | --- | --- | --- |
| 1 | TC-002 | basic_salary mismatch, two matched passages | **Supported** |
| 2 | TC-002 | stated_total_pay mismatch, two matched passages | **Supported** |
| 3 | TC-006 | basic_salary mismatch, two matched passages | **Supported** |
| 4 | TC-007 | stated_total_pay mismatch, two matched passages | **Supported** |
| 5 | TC-008 | job_title mismatch, two matched passages | **Supported** |
| 6 | TC-009 | start_date finding with payment-frequency explanation, no evidence | **Unsupported** — explanation/evidence template bug |
| 7 | TC-009 | contract_duration finding with start-date explanation/evidence | **Unsupported** — mislabeled evidence |
| 8 | TC-010 | overtime_terms finding with payment-frequency explanation, no evidence | **Unsupported** |
| 9 | TC-011 | accommodation_benefit (seeded conditional) emitted as evidence-less mismatch | **Unsupported** — should be needs_clarification |
| ⏳ 10 | TC-012 | source_backed_concern, Rule 1 rev 1, Article (6)(4), official URL | **Supported (agent)** — claim matches approved wording; worker-charge facts in scope; ⏳ owner sign-off required |

**Human-adjusted precision: 6/28 (21%)** vs ≥85% target — driven by three
concrete causes below, not by random noise.

## Root causes found (→ replanning items)

1. **Comparison explanation/evidence template mismatch** (findings 6–8): a
   start_date mismatch carries a payment-frequency explanation; evidence
   attaches to the wrong field. Product bug in the compare draft assembly —
   affects real users, not just scores.
2. **`document_reference` over-firing**: 13 of 18 unsupported mismatches
   are document_reference — offer and contract reference numbers differ by
   design. Comparison policy must exempt expected-to-differ metadata fields
   (or truth must seed them).
3. **Conditional/missing seeds emitted as evidence-less mismatches**
   (TC-010/011): seeded `conditional` should route to needs_clarification.
4. **Field-mapping miss** (TC-012): truth labels `deduction_item`; model
   emitted `recruitment_cost` for the same clause — field-registry alignment
   item, costs 2 accuracy points.
5. **TC-014 "unreadable" page was read by Gemini** (1 accuracy point): the
   synthetic unreadable page is not unreadable to the model on the live
   path; abstention labeling vs live behavior needs a design decision.
6. Corpus drift note: bundled fixture PDFs differ from corpus PDFs (found
   by the dry run) — regenerate fixture copies from the corpus to restore
   the Phase 07 determinism claim, or document the drift.

## Sign-off requests (owner)

1. ⏳ Confirm TC-012 citation support (the 100% citation gate hinges on it).
2. ⏳ Confirm the TC-012 `no_rule_claims` abstention supersession (Rule 1
   now approved; truth predates Phase 09/10 content).
3. ⏳ Approve disposition of root causes 1–3 as Phase 15 replanning items
   (engine fixes) vs doc-only notes.
4. ⏳ Approve README achieved-results wording built from this record.
