# Phase 05 — testing log

Environment: Windows 10 Pro, bash (Git Bash), Node v22.16.0, vitest 5.0.2.
Date: 2026-09-29. All suites pure/offline — no provider, no network, no fs in
the module under test (purity asserted by a test).

| # | Check (plan §Tests) | File | Result |
| --- | --- | --- | --- |
| 1 | Money | `money.test.ts` | Pass — decimal strings parse to exact integer minor units (`2500`≡`2500.00`, `0.99`→99, `123456789012.34` in safe-integer range; negatives/3-decimals rejected); different amounts ⇒ `document_mismatch` with exactly two passages + `money_equality` + `high` importance; AED vs USD never equal at any amount; null vs stated currency never coerced; frequency compared only when both sides state it (otherwise deferred); `payer`/`component` never coerced for equality — same-amount deduction entries with different stated payers produce no false mismatch. |
| 2 | Text / date / duration / boolean | `text-duration-date.test.ts` | Pass — case/whitespace-only text differences equal; real wording differences ⇒ mismatch (`text_equality`, `medium`); exact date equality both ways; `6 month` ≡ `6 month`, `6 month` ≠ `180 day` (no unit conversion); strict boolean equality. |
| 3 | Benefit states | `benefit.test.ts` | Pass — `provided` vs `not_provided` ⇒ mismatch; `provided` vs `conditional` ⇒ mismatch; `allowance` vs `provided` ⇒ mismatch; `conditional` vs `conditional` with different condition text ⇒ `needs_clarification` + `conditional_wording_differs`; identical wording ⇒ nothing. |
| 4 | Category matrix | `category-matrix.test.ts` | Pass — full 4×4 state matrix asserted per pair: present+absent ⇒ `missing_information` (absent ≠ denied, side named in explanation/question); present+unclear ⇒ clarification; present+unreadable ⇒ `unable_to_determine`; absent+absent ⇒ finding only for `importantIfAbsent` keys (`basic_salary`/`notice_terms` yes; `employer_name`/`document_date` no); unclear+unclear ⇒ clarification; absent+unclear ⇒ clarification; absent/unreadable combos ⇒ `unable_to_determine`; mismatches always carry exactly two passages + comparisonRuleKey; omission (key missing from a document) ⇒ finding + `field_not_returned_by_extraction_contract`; all 16 pairs execute without error. |
| 5 | Repeated items | `repeated.test.ts` | Pass — equal-count lists pair by ordinal (only the differing entry mismatches, `entry 2 of 2`, each side's own evidence); unequal counts ⇒ one `needs_clarification` + `repeated_items_count_mismatch`; repeated-vs-missing ⇒ `missing_information` with empty evidence; identical lists ⇒ nothing. |
| 6 | Single document + purity | `single-document.test.ts` | Pass — one side/none ⇒ `comparisonApplicable: false`, zero findings, zero checked keys; static import scan proves `compare/` imports nothing but `../contracts/` and siblings (no fs/env/http/net/genai/dotenv/express/pdf-lib/pdfjs-dist). |
| 7 | Findings shape | `findings-shape.test.ts` | Pass — every draft validates against the Phase 02 `FindingSchema` (API.md §6); mismatches carry `comparisonRuleKey` + exactly two passages, non-mismatch categories never do; coverage lists all 33 keys when comparison applies. |
| 8 | Regression | full suite | Pass — **26 files, 140/140 tests** (39 new); registry suite extended: exactly 8 `importantIfAbsent` keys; root `lint` 0 issues, `typecheck` clean, `build` green. |

Fixture note: helpers build **full 33-key documents** (`fullDocument` fills
unmentioned keys as explicit `absent`), mirroring what the extraction prompt
requires; per-key assertions filter with `findingsFor`. The first run caught
the reverse: one-field fixtures tripped every `importantIfAbsent` key — the
engine was right, the fixtures were incomplete.

No live-provider testing (owner instruction — quota conservation); nothing in
this phase touches the provider path.
