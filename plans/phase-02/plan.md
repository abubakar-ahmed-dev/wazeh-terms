# Phase 02 — Code-level contracts: field registry, runtime schemas, HMAC proof — plan

**Depends on:** Phase 01 (`api` workspace exists). Branch created stacked on
`phase-01-foundation` because PR #3 is not merged yet; retarget the PR to `dev`
once #3 merges. No new dependencies — `zod` (already in `api`) is the only
schema library.

**Re-planning check:** contracts re-read from `docs/API.md` §4–§7 and
`docs/DATABASE_SCHEMA.md` §2/§7; `docs/SECURITY.md` §3. No prior implementation
exists. Pre-plan prototype is gone (verified Phase 01).

**Goal (master-plan):** the documented data model exists as code before any
endpoint uses it. No routes, no server, no config loader (Phase 03).

## Files to create

| File (`api/src/contracts/`) | Content |
| --- | --- |
| `field-registry.ts` | Code-owned registry: 12 `groupKey`s → 33 `fieldKey` components (exact set below), each with `label`, `valueKind`, `repeatable` flag, `comparisonStrategyKey` (union of 7 strategy names — **placeholder values now**, strategies implemented Phase 05), and for money keys the expected `component` value. Zod enum `FieldKeySchema` derived from the registry so Studio/content can never add keys. |
| `normalized-value.ts` | Zod discriminated union per `docs/API.md` §4.2: `text`/`reference_text`, `money` (decimal **string**, currency/frequency/payer nullable), `date` (ISO `YYYY-MM-DD`, calendar-valid), `duration`, `benefit_state`, `boolean`. Exported TS types. |
| `evidence.ts` | `Evidence` zod: `documentId`, one-based `page`, bounded `quote`, `verification: matched_text \| model_transcription`. |
| `extracted-field.ts` | `ExtractedField` zod + `FieldState`; state invariants enforced via `superRefine` (below). |
| `issued-extraction.ts` | `IssuedExtractionV1` zod: `schemaVersion: 1`, ISO `issuedAt`/`expiresAt` (`expiresAt` ≥ `issuedAt`), `scope` (literal `origin: "PK"`, `destination: "AE"`; regime/category enums), `sourceMode`, `documents` (1–2; role/mime/pageCount/sha256/extractionStatus/fields/unreadablePages) + document-level refinement: every evidence `page` ≤ its document `pageCount`, `documentId`s unique. |
| `stage-status.ts` | `StageStatus` enum (`not_started/completed/partial/failed/not_applicable`) + six-stage record (`extraction/review/comparison/retrieval/applicability/explanation`). |
| `correction.ts` | Correction delta zod: existing-identity triple (`documentId`+`fieldKey`+`instanceId`), `state`, `value`; `corrections` array bounded. Existence matching is Phase 06; here only shape + bounds. |
| `finding.ts` | `FindingCategory`, `SourceCitation`, `Finding` zod per `docs/API.md` §6 (source required exactly for `source_backed_concern`; `document_mismatch` requires `comparisonRuleKey`). |
| `analysis-report.ts` | `AnalysisResponse` zod: status/scopeApplicability/stages/coverage/findings/summary/limitations/officialNextSteps. |
| `error-envelope.ts` | Error code union (all 17 codes from `docs/API.md` §7 table), error envelope zod (`code/message/stage?/retryable` + `requestId`), `newRequestId()` (`crypto.randomUUID()`). |
| `canonical-json.ts` | Canonical JSON serializer (spec below) shared by sign/verify; rejects `NaN`/`Infinity`/undefined, cycles. TSDoc = the serializer spec. |
| `hmac-proof.ts` | `signIssuedExtraction(payload, {keyId, secret})` → `{keyId, signature}`; `verifyIssuedExtraction(payload, proof, {keys, nowMs})` → discriminated result `valid` \| `unknown_key` \| `malformed` \| `signature_mismatch` \| `expired` \| `unsupported_schema_version` (endpoint maps to 422/410/409 in Phase 06). Key material injected by caller — no env reads in contracts. `crypto.timingSafeEqual`. |
| `index.ts` | Barrel export. |

Tests under `api/test/contracts/`: `field-registry.test.ts`,
`normalized-value.test.ts`, `evidence-extracted-field.test.ts`,
`issued-extraction.test.ts`, `correction.test.ts`, `finding-report.test.ts`,
`canonical-json.test.ts`, `hmac-proof.test.ts`.

Docs: `docs/SECURITY.md` §3 gains the canonical-serialization subsection
(contract update required by API.md §5 "specified in SECURITY.md").

## Field registry (33 keys, exact)

| `groupKey` | `fieldKey` | `valueKind` | `comparisonStrategyKey` | money `component` | repeatable |
| --- | --- | --- | --- | --- | --- |
| `employer` | `employer_name` | `text` | `text_equality` | — | — |
| `occupation` | `job_title` | `text` | `text_equality` | — | — |
| `location` | `work_location` | `text` | `text_equality` | — | — |
| `pay` | `basic_salary` | `money` | `money_equality` | `basic_salary` | — |
| `pay` | `allowance_item` | `money` | `money_equality` | `allowance` | **yes** |
| `pay` | `stated_total_pay` | `money` | `money_equality` | `stated_total` | — |
| `pay` | `payment_frequency` | `text` | `text_equality` | — | — |
| `term` | `start_date` | `date` | `date_equality` | — | — |
| `term` | `contract_duration` | `duration` | `duration_equality` | — | — |
| `term` | `renewal_terms` | `text` | `text_equality` | — | — |
| `probation` | `probation_period` | `duration` | `duration_equality` | — | — |
| `working_time` | `ordinary_hours` | `text` | `text_equality` | — | — |
| `working_time` | `overtime_terms` | `text` | `text_equality` | — | — |
| `ending_terms` | `notice_terms` | `text` | `text_equality` | — | — |
| `ending_terms` | `termination_terms` | `text` | `text_equality` | — | — |
| `deductions` | `deduction_item` | `money` | `money_equality` | `worker_charge` | **yes** |
| `deductions` | `other_worker_charge` | `money` | `money_equality` | `worker_charge` | — |
| `recruitment_and_travel_costs` | `recruitment_cost` | `money` | `money_equality` | `worker_charge` | — |
| `recruitment_and_travel_costs` | `visa_cost` | `money` | `money_equality` | `worker_charge` | — |
| `recruitment_and_travel_costs` | `residency_cost` | `money` | `money_equality` | `worker_charge` | — |
| `recruitment_and_travel_costs` | `medical_cost` | `money` | `money_equality` | `worker_charge` | — |
| `recruitment_and_travel_costs` | `travel_cost` | `money` | `money_equality` | `worker_charge` | — |
| `benefits` | `accommodation_benefit` | `benefit_state` | `benefit_state_equality` | — | — |
| `benefits` | `food_benefit` | `benefit_state` | `benefit_state_equality` | — | — |
| `benefits` | `transport_benefit` | `benefit_state` | `benefit_state_equality` | — | — |
| `benefits` | `medical_benefit` | `benefit_state` | `benefit_state_equality` | — | — |
| `benefits` | `return_ticket_benefit` | `benefit_state` | `benefit_state_equality` | — | — |
| `document_details` | `document_language` | `text` | `text_equality` | — | — |
| `document_details` | `signature_presence` | `boolean` | `boolean_equality` | — | — |
| `document_details` | `document_date` | `date` | `date_equality` | — | — |
| `document_details` | `document_reference` | `reference_text` | `reference_text_equality` | — | — |
| `document_details` | `verification_reference` | `reference_text` | `reference_text_equality` | — | — |
| `document_details` | `annex_reference` | `reference_text` | `reference_text_equality` | — | — |

Registry `valueKind: "charge"` from `docs/DATABASE_SCHEMA.md` §7 maps to the
`money` union with `component: "worker_charge"` (documented mapping, master-plan
Phase 05 note). Repeatable keys: `allowance_item`, `deduction_item` only.

## Schema bounds (hard ceilings; measured runtime limits come from config in Phase 03)

| Path | Bound |
| --- | --- |
| `documents` | 1–2 |
| `fields` per document | ≤ 200 |
| `evidence` per field | ≤ 20 |
| `quote`, `rawText`, `text` members | ≤ 2000 chars |
| `qualityNotes` | ≤ 20 entries × 500 chars |
| `conditions` (benefit) | ≤ 1000 chars |
| `pageCount` | 1–1000; `page` 1…`pageCount` (refined at document level) |
| `unreadablePages` | ints ≥ 1, unique ascending, ≤ pageCount |
| `documentId`, `instanceId` | 1–64 chars; `documentId` opaque, `instanceId` `^[A-Za-z0-9_:-]{1,64}$` (convention `fieldKey:ordinal`, not enforced beyond pattern) |
| `sha256` | `^[0-9a-f]{64}$` |
| money/duration `amount` | `^\d{1,12}(\.\d{1,2})?$` (non-negative; a deduction is a positive amount with `component: "worker_charge"`) |
| `currency` | `^[A-Z]{3}$` or null |
| `frequency` | `hourly/daily/weekly/monthly/yearly/per_contract` or null |
| `keyId` | `^[a-z0-9][a-z0-9-]{0,31}$` |
| `corrections` | ≤ 100 (matches `docs/API.md` §3 example) |

## State invariants (zod `superRefine`)

1. `state: "present"` ⇒ `value !== null` **and** `evidence.length ≥ 1`.
2. `state ∈ {absent, unclear, unreadable}` ⇒ `value === null`.
3. Document-level: `state: "absent"` requires the owning document's
   `extractionStatus ∈ {completed, partial}` (failed documents cannot claim
   readable-page coverage). Enforced in the `IssuedExtractionV1` document
   refinement, since the field schema alone lacks document context.

## Canonical serialization spec (TSDoc in `canonical-json.ts`; copied into `docs/SECURITY.md` §3)

1. Input must be plain JSON data: string/number/boolean/null/array/object.
   `undefined`, functions, `NaN`, `Infinity`, cycles ⇒ throw.
2. Object keys sorted lexicographically by UTF-16 code unit, applied recursively.
3. No whitespace; separators `,` and `:`; `JSON.stringify` escaping for strings; `null` literal.
4. Array element order preserved (order is significant).
5. Numbers must be safe integers (payload data is strings by design); reject others.
6. Signature input: canonical JSON of the two-key envelope
   `{ "issuedExtraction": <payload>, "keyId": <keyId> }`.
7. `signature` = base64url(`HMAC-SHA256(secret, UTF-8(canonical bytes))`).
8. Verification re-canonicalizes the **received** payload object (never trusts
   client byte order), resolves `keyId` against the allowlist map, compares with
   `timingSafeEqual`, then checks `expiresAt > nowMs` and `schemaVersion === 1`.

## Tests (acceptance)

1. **Registry:** exactly 33 keys across exactly 12 groups; the key list equals `docs/DATABASE_SCHEMA.md` §7 verbatim; only `allowance_item`/`deduction_item` repeatable; every `comparisonStrategyKey` ∈ the 7-name set; money keys carry a valid `component`; registry-derived `FieldKeySchema` rejects unknown keys.
2. **NormalizedValue:** money rejects number amounts (string only), accepts `null` currency/frequency/payer, rejects bad enums; date rejects `2026-02-30` and non-ISO; duration unit enum; benefit_state status enum; boolean.
3. **ExtractedField invariants:** present without value → reject; present without evidence → reject; absent/unclear/unreadable with value → reject; absent under a `failed` document → reject at issued level; valid present field passes.
4. **IssuedExtraction:** `schemaVersion` must be 1; scope literals (`origin:"PK"`); pageCount bounds; sha256 format; evidence page > pageCount → reject; duplicate documentId → reject; expiresAt < issuedAt → reject.
5. **Correction/report shapes:** correction triple + bounds; finding without source for `source_backed_concern` → reject; `document_mismatch` without `comparisonRuleKey` → reject; six-stage record keys.
6. **Canonical JSON:** key-order independence (two orderings → same bytes); array order significance (different order → different bytes); nested objects; rejects `NaN`/cycles; stable across runs.
7. **HMAC proof:** sign→verify round trip valid; tamper vectors each fail with the right reason — changed field value, changed scope, changed sha256, changed expiresAt, changed keyId; unknown keyId; expired proof (fake clock); wrong `schemaVersion` → `unsupported_schema_version`; signature not valid base64url → `malformed`.
8. Whole suite green offline; `npm run lint`, `typecheck`, `test`, `build` green at root.

## Out of scope

HTTP endpoints, Express wiring, config/env loader, sample manifest, Gemini/Sanity anything, comparison strategies (Phase 05), Studio schema (Phase 08).
