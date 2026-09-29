# Phase 05 — Normalization + deterministic comparison engine — plan

**Depends on:** Phase 02 (contracts, merged). Branch `phase-05-comparison` from
`dev` @ `1cda800` (Phases 03+04 merged; no conflicts occurred).
**Owner inputs needed:** none — pure, offline, zero-I/O module. Four design
decisions below use stated defaults; owner may override before implementation
starts, otherwise they stand.

**Re-planning check:** `docs/TECHNICAL_ARCHITECTURE.md` §5, `docs/ADR-005`,
`docs/PRD.md` §6, `docs/API.md` §6, `docs/TESTING.md` §2 comparison layer,
`docs/DATABASE_SCHEMA.md` §7 re-read. Phases 03–04 landed the signed
extraction with evidence verification; nothing comparison-shaped exists yet.
`deduction_item`/`other_worker_charge` already carry `component: "worker_charge"`
(Phase 02 registry mapping — documented money-mapping note satisfied).

**Goal (master-plan):** pure, fully unit-tested module that normalizes issued
fields and compares offer vs contract per TECHNICAL_ARCHITECTURE §5. Zero I/O
dependencies. Gemini does not decide mismatches — code does, deterministically.

## Architecture

```
api/src/compare/
  normalize.ts     raw NormalizedValue → ComparableTerm per valueKind (pure)
  money.ts         decimal-string → integer minor units (string slicing; no floats)
  strategies.ts    comparisonStrategyKey → predicate(text|money|date|duration|benefit|boolean|reference)
  category.ts      (sideA state, sideB state, comparability) → FindingCategory
  compare.ts       compareDocuments({offer?, contract?}) → { findings: FindingDraft[], stats }
  importance.ts    per-fieldKey default importance (pay/costs/benefits high, else medium)
  index.ts         barrel
```

Inputs are the already-validated `IssuedExtractionV1` documents (Phase 02
schemas) — the module re-verifies nothing about signatures or evidence
verification; it consumes what the pipeline produced. Corrections are **not**
an input here: reconciliation (original + deltas → effective values) happens in
Phase 06, which then calls this module with the effective field maps and passes
`valueOrigins` through.

## Normalization rules (per valueKind)

| Kind | Normalized form | Equality rule |
| --- | --- | --- |
| `text` | trimmed, whitespace-collapsed, casefolded copy + original kept | equal when normalized copies equal |
| `reference_text` | same as text (IDs never treated as verified) | equal when normalized copies equal |
| `money` | `{ minorUnits: int, currency, frequency, component, payer }` | amount **and** currency **and** frequency(when both non-null) must match; never converts currency; unlike currencies ⇒ always different |
| `date` | ISO `YYYY-MM-DD` as-is | string equality |
| `duration` | `{ amountMinor: int, unit }` (no unit conversion) | both must match |
| `benefit_state` | `{ status, conditions }` | status equality; `provided` ≠ `allowance` ≠ `conditional` ≠ `not_provided` |
| `boolean` | `value` | strict equality |

Original `rawText` and evidence always preserved untouched (ADR-004/005).

## Comparison semantics (per registry key, both documents present)

- **Both `present`** → strategy compare. Equal ⇒ no finding. Different ⇒
  `document_mismatch` with exactly two evidence passages (first of each side),
  `comparisonRuleKey` = the field's `comparisonStrategyKey`, `valueOrigins:
  ["document","document"]`.
- **Money frequency deferral:** when either side's `money.frequency` is null,
  frequency is ignored by the money strategy and judged via the separate
  `payment_frequency` field (single source of truth for frequency).
- **`present` vs `absent`** ⇒ `missing_information` (absent ≠ denied; only on
  the side that claims readable coverage).
- **`present` vs `unclear`** ⇒ `needs_clarification` (conditional/ambiguous
  wording — includes `benefit_state: conditional` vs `provided`).
- **`present` vs `unreadable`** ⇒ `unable_to_determine` (unreadable ≠ absent).
- **Both non-present** ⇒ `absent+absent` ⇒ `missing_information` **only** when
  the key is flagged `importantIfAbsent` (see below); `unclear+unclear` ⇒
  `needs_clarification`; any pair with `unreadable` ⇒ `unable_to_determine`;
  `absent`+`unclear` ⇒ `needs_clarification`; `absent`+`unreadable` ⇒
  `unable_to_determine`.
- **Repeated keys** (`allowance_item`, `deduction_item`): compared as lists.
  Counts equal ⇒ pairwise by ordinal (stable, unambiguous by construction of
  the server-assigned ordinals); counts differ ⇒ one `needs_clarification`
  ("cannot establish which entries correspond"). Pairwise mismatches behave as
  above with each side's own evidence.
- **Single document** ⇒ module returns `comparisonApplicable: false` with no
  findings (Phase 06 maps to `comparison: not_applicable`).
- A user correction (Phase 06) can at most produce
  `needs_clarification`/`user_reported_difference` — the mismatch categories
  here require document evidence on both sides, enforced by construction.

## `importantIfAbsent` registry addition

Phase 02's registry lacks the flag `docs/DATABASE_SCHEMA.md` §7 defines.
Add `importantIfAbsent: boolean` to `FieldDefinition` (additive, content can
still not add keys) with `true` for: `basic_salary`, `stated_total_pay`,
`payment_frequency`, `start_date`, `contract_duration`, `ordinary_hours`,
`notice_terms`, `signature_presence`. Default `false` elsewhere. Registry
tests extended (key count stays 33).

## Findings produced

`FindingDraft` objects carrying: category, `fieldKeys: [key]`, default
importance (`high`: pay group, deductions, recruitment/travel costs, benefits;
`medium`: rest; overridable later), `explanation` (deterministic template,
plain English, no legal wording), both sides' evidence (for mismatches),
`uncertaintyReasons` (e.g. `one_side_unclear`), `suggestedQuestionOrStep`
(template per category/field label), `comparisonRuleKey` (mismatches only).
Schema-parse at assembly time (Phase 06) — this module emits plain data.

## Tests (`api/test/phase-05/`, all pure/offline)

1. **`money.test.ts`** — decimal-string parsing (integer, 1–2 fraction digits, zero-padded) to exact minor units; `2500.00` vs `2500` equal; `2400.00` vs `1800.00` differ; AED vs USD ⇒ different even at equal amounts; differing `frequency` when both non-null ⇒ different; null frequency on one side ⇒ deferred (not a mismatch at money level); payer/component never coerced.
2. **`text-duration-date.test.ts`** — case/whitespace-only differences equal; real wording differences differ; dates equal/different; duration `6 month` vs `6 months`?? (unit enum identical only — `month` vs `month` equal; `6 month` vs `180 day` different, never converted); boolean.
3. **`benefit.test.ts`** — `provided` vs `not_provided` ⇒ mismatch; `provided` vs `conditional` ⇒ mismatch (conditional wording is a real difference); `conditional` vs `conditional` with different conditions text ⇒ `needs_clarification`; `allowance` vs `provided` ⇒ mismatch.
4. **`category-matrix.test.ts`** — the full present/absent/unclear/unreadable pair matrix (10 combinations × representative keys), asserting the exact category per the semantics table; absent+absent ⇒ finding only for `importantIfAbsent` keys; no mismatch ever emitted without two document evidence passages.
5. **`repeated.test.ts`** — equal-count lists pairwise (mismatch on ordinal 2 only ⇒ single mismatch finding with both passages); unequal counts ⇒ single `needs_clarification`; mismatch evidence carries each side's own instance evidence.
6. **`single-document.test.ts`** — one side only ⇒ `comparisonApplicable: false`, zero findings, zero I/O (module purity: no imports of fs/env/gemini — asserted by a static import scan test).
7. **`findings-shape.test.ts`** — every emitted draft parses as `docs/API.md` §6 `Finding` (schema reuse): category/fieldKeys/importance/explanation/evidence counts/comparisonRuleKey exactly for `document_mismatch`; valueOrigins `["document","document"]`; suggestedQuestionOrStep non-empty.
8. **Regression** — registry tests extended for `importantIfAbsent` (8 keys true); full suite + lint + typecheck + build green; **api ≥ 130 tests** total.

## Exit criteria (master-plan)

Comparison layer of `docs/TESTING.md` §2 green (rows: comparison unit — unequal
salary ⇒ mismatch with two passages; equal/missing/one-document/unreadable ⇒
correct non-mismatch categories; currency/frequency divergence; conditional
benefit; no inferred denial from silence; Pakistan-side vs UAE-side charge
distinction via `component`/`payer` untouched). Module has zero I/O
dependencies. Whole suite green; CI green.

## Out of scope

Corrections reconciliation + `POST /api/v1/analyses` + report assembly (Phase
06), retrieval/citation (Phase 10), corpus scoring (Phase 07/15), UI.

---

## Owner inputs

**Nothing required.** No secrets, no IDs, no provider access — the module is
pure and offline. Four defaults stand unless you override before implementation:

| # | Decision | Default chosen |
| --- | --- | --- |
| 1 | `importantIfAbsent` keys | basic_salary, stated_total_pay, payment_frequency, start_date, contract_duration, ordinary_hours, notice_terms, signature_presence |
| 2 | Repeated-item matching | pairwise by server-assigned ordinal when counts equal; counts differ ⇒ clarification |
| 3 | Money frequency | compared only when both sides state it; otherwise deferred to `payment_frequency` field |
| 4 | Text equality | whitespace/case-insensitive (wording differences still compared) |

Say "defaults fine" (or list changes) and I implement.
