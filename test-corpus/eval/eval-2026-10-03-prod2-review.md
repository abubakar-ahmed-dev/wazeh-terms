# Eval review record — 2026-10-03 fresh production run (prod2)

**Label: NEW RUN on the corrected engine — distinct from the 2026-10-02 run
(`results-2026-10-02.jsonl`) and its retrospective rescore
(`eval-2026-10-02-revised.json`).** Run-1 artifacts and both earlier freeze
files stay byte-identical.

## Run identity

- Freeze: `freeze-2026-10-03-prod2.json` + dated correction
  `freeze-2026-10-03-prod2.correction-1.json` (owner run conditions
  recorded there; the correction fixes the wrong deployed.note and the
  call accounting).
- Code: dev @ `0917eb7` (runner); deployed runtime engine unchanged since
  `cc4d1e2` — `git diff cc4d1e2..0917eb7 -- api/src` is empty; revision
  `wazehterms-00016-run` at 100% traffic.
- Sanity: 44 approved records; rule `ae-recruitment-costs-employer-bears`
  r1 with the owner-approved narrowed `plainEnglish` (D8).
- Truth: D1–D7 accepted + PDF-verified; D10-A applied (TC-014 present);
  TC-012 evidence pages 2/2; all `pageCount` values = actual PDF pages.

## Execution

15/15 cases, single pass, **no HTTP retries, no quota failures, no
selective re-runs**. One scoring-side fix after the run (scorer now reads
the prod2 freeze's nested `approvedRules`); scoring is deterministic and
local — no additional provider calls.

## Provider-call accounting (measured)

15 extraction POST attempts charged (cap 22). Zero runner-level retries
observed; server retries only on malformed model JSON (none indicated) →
**15 provider calls, worst-case bound 15–30** (2 per attempt). Well inside
the owner-approved ≤44. Project `gen-lang-client-0448639879`, billing
disabled; 2 earlier smoke calls same day.

## Results (numerators / denominators)

| Measure | Achieved | PRD target |
| --- | --- | --- |
| Clean digital field accuracy | **53/53 (100%)** | ≥95% — met |
| Critical mismatch recall | **11/11 (100%)** | ≥90% — met |
| Finding precision (substantive) | **13/13 (100%)**, 0 policyExempt (engine no longer emits metadata), 0 duplicates | ≥85% — met |
| Source-backed citation support | 1 displayed, 1 structurally valid, 0 unsupported; **D8 semantic sign-off given by owner 2026-10-03** on the narrowed wording; whole-finding audit clean ("Charge to question: Recruitment cost" heading, no violation-established language) | 100% — met |
| Abstention safety | **0 violations**, 0 false mismatches, no global verdict, TC-015 injection held | met |
| Hallucinated quotations | **0** | — |
| Machine latency | extraction p50 14.9 s / p95 17.9 s; analysis p50 3.5 s / p95 4.4 s; **end-to-end p50 ≈ 18.4 s / p95 ≈ 22.2 s** | p50 <45 s — met |

## Caveats (unchanged posture)

Fifteen samples leave wide uncertainty; development check, not legal
validation. The corpus has **no validated unreadable-page case** (owner
decision D10-A, recorded in TC-014 truth). Precision/recall denominators
reflect the owner-ratified truth; the citation gate rests on one live
finding, reviewed by the owner.
