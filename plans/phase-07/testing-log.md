# Phase 07 — testing log

Environment: Windows 10 Pro, bash (Git Bash), Node v22.16.0, vitest 5.0.2.
Date: 2026-09-29. Fully offline; fixture extractions are signed with the test
key and run through the real `POST /api/v1/analyses` (fake Gemini never
invoked on this path).

| # | Check (plan §Tests) | File | Result |
| --- | --- | --- | --- |
| 1 | Truth schema | `truth-schema.test.ts` | Pass — exactly 15 cases; every truth parses against schema v1; TC-002 preserved (basic_salary seeded); consistent pairs forbid `document_mismatch`; mismatch pairs allow it and forbid `source_backed_concern`; TC-012 abstains rule claims; TC-014 single-document; TC-015 `instructions_treated_as_data`; all `requiredRuleRefs` empty. |
| 2 | PDF regeneration determinism | `pdf-regeneration.test.ts` | Pass — committed PDFs byte-identical to `buildCasePdf` output (fixed timestamps); committed `extracted.json` equals generator output; every PDF text layer contains its `sample-text.json` lines (normalized substring via the Phase 04 extractor); every document carries the SYNTHETIC/FICTIONAL marker. |
| 3 | Corpus runner | `runner.test.ts` | Pass — all 15 fixture extractions signed and analyzed through HTTP (`200` each): findings stay inside per-truth allowed categories; forbidden categories never appear; every mismatch carries two passages + `comparisonRuleKey`; consistent pairs emit zero mismatches; every seeded value difference (9 field assertions across TC-002/006/007/008/009/010/012) yields its `document_mismatch`; TC-011 benefit mismatch/clarification present; TC-013 `missing_information` for `notice_terms`; TC-014 `comparison: not_applicable` + unreadable coverage + no fabricated absence; TC-015 no mismatch, no injected text ('9999', 'SYSTEM INSTRUCTION') anywhere in the report; all 15 reports `partial` with `retrieval: not_started`, D8 disclosure, and no all-clear line; TC-012 asserts the document-check layer only. |
| 4 | Production sample set | `production-samples.test.ts` | Pass — five demo cases fixed (TC-001/002/012/013/014) with truth + text + generated documents + `extracted.json`; TC-002 corpus copy mirrors `fixtures/samples/TC-002` text exactly; demo fixture PDFs still parse; the five emphases verified (consistent / salary mismatch / worker charge / missing term / single-doc abstention). |
| 5 | Regression | full suite | Pass — **35 files, 202/202 tests** (36 new); root `lint` 0 issues, `typecheck` clean, `build` green. |

## Issues found by the suite and fixed before commit

1. **Truth-authoring bug (contract-side expectations):** the pin helper reused the offer's value for both roles, so six mismatch cases (TC-006…TC-011) carried identical contract expectations and produced no mismatch. Contract-side values corrected per case; the runner caught every one.
2. **Unpinned `importantIfAbsent` keys produce real `missing_information` findings:** sparse truths must *allow* that category — added to every pair case's allowed list (engine behavior confirmed correct; the truths were incomplete).
3. **TC-015 assertion tightened differently than planned:** missing-information findings for unpinned keys are legitimate; the data-treatment assertion now targets what matters — no mismatch, no rule claim, no `9999`, no instruction text in the report.

## Not run

Live-Gemini corpus scoring (Phase 15 by design); no provider calls (owner instruction).
