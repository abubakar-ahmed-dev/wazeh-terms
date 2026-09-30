# Phase 05 — implementation log

Branch: `phase-05-comparison` (from `dev` @ `1cda800`, Phases 03+04 merged).
Date: 2026-09-29.

## What was changed

The deterministic comparison engine now exists as a pure, fully tested module
— the model never decides a mismatch.

- **`api/src/compare/`** (7 files): `money.ts` (decimal-string → integer minor units by string slicing; no floats/conversion), `normalize.ts` (per-`valueKind` `ComparableTerm`; self-contained text normalization mirroring the evidence matcher), `strategies.ts` (one predicate per registry `comparisonStrategyKey`; money compares amount+currency+stated frequency, deferring frequency to `payment_frequency` when either side omits it), `category.ts` (full present/absent/unclear/unreadable pair matrix; `absent` ≠ denied, `unreadable` ≠ absent), `importance.ts` (pay/costs/benefits ⇒ high, rest medium — ordering only, never a verdict), `compare.ts` (`compareDocuments({offer?, contract?})` → `{comparisonApplicable, findings, checkedFieldKeys}`; mismatches need both sides present with their own evidence, `comparisonRuleKey` = registry strategy; repeated keys pair by ordinal when counts match, unequal counts ⇒ one clarification; single document ⇒ not applicable; conditional-vs-conditional wording differences ⇒ clarification, not mismatch), `index.ts`.
- **Registry**: added `importantIfAbsent` (additive) — true for `basic_salary`, `stated_total_pay`, `payment_frequency`, `start_date`, `contract_duration`, `ordinary_hours`, `notice_terms`, `signature_presence`; all four plan defaults implemented unchanged.
- **Tests**: `api/test/phase-05/` — 7 suites + helpers, 39 new tests (api now 140).

## Decisions / deviations

- **All four plan defaults implemented as stated** (importantIfAbsent set, ordinal matching, frequency deferral, case/whitespace-insensitive text equality).
- **Missing field entry ≠ silent absent-by-coverage:** a key absent from an extraction's field list is treated as `absent` **and** carries `field_not_returned_by_extraction_<role>` in `uncertaintyReasons` — the corpus phase's full-coverage fixtures will keep this honest.
- **Verification metadata untouched:** comparison consumes field states/values only; `matched_text`/`model_transcription` labels never influence categories (plan silence resolved conservatively — evidence quality is report surface, not comparison input).
- **Model id changed by owner** (`GEMINI_MODEL=gemini-3.5-flash-lite` in `api/.env`); config default in code unchanged (env drives). Not tested per owner instruction — no provider calls made this phase.
- Test-fixture correction during development: initial one-field fixtures tripped every `importantIfAbsent` key; helpers now build full 33-key documents (`fullDocument`) matching the extraction contract.

## Files/components affected

New: `api/src/compare/` (7), `api/test/phase-05/` (8).
Changed: `api/src/contracts/field-registry.ts` (flag + constructors), `api/test/contracts/field-registry.test.ts` (8-key assertion).

## Validation

See `testing-log.md`: 26 files / **140/140 tests**, lint 0 issues, typecheck
clean, build green. Zero I/O proven by test. Every `docs/TESTING.md` §2
comparison-layer row is covered by an assertion.

## Remaining issues

- None blocking. Phase 06 (analyses endpoint) consumes this module after proof verification + correction reconciliation; report assembly maps `FindingDraft` → `Finding` and stage statuses.
- Live provider run remains pending (owner quota); unchanged from phases 03–04 and not exercised here.
