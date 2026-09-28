# Phase 02 — implementation log

Branch: `phase-02-contracts` (from `dev` @ `0d04d10`, plan commit cherry-picked
from the closed plan-only PR #4 branch). Date: 2026-09-28.

## What was changed

The documented data model now exists as code — no endpoints, no config loader,
no provider code.

`api/src/contracts/` (12 modules + barrel):

- `field-registry.ts` — code-owned registry: 12 groups / 33 `fieldKey` components from `docs/DATABASE_SCHEMA.md` §7 with `label`, `valueKind`, `comparisonStrategyKey` (7-name placeholder union; strategies arrive Phase 05), `repeatable` flags, expected money `component`; `FieldKeySchema` zod enum derived from the registry so content can never add keys.
- `normalized-value.ts` — `NormalizedValue` discriminated union per `docs/API.md` §4.2; money amounts are decimal strings (`^\d{1,12}(\.\d{1,2})?$`, non-negative), currency/frequency/payer nullable; calendar-validated ISO dates.
- `evidence.ts` — opaque `documentId`, one-based bounded `page`, bounded `quote`, `matched_text | model_transcription`.
- `extracted-field.ts` — `ExtractedField` + state invariants: `present` ⇒ value + ≥1 evidence; non-present ⇒ `value: null`; value `kind` must match registry `valueKind`; money `component` must match the registry mapping (shared value-invariant refine reused by corrections).
- `issued-extraction.ts` — `IssuedExtractionV1`: schemaVersion pinned to 1, UTC datetimes (`expiresAt ≥ issuedAt`), literal PK→AE scope, regime/category enums, 1–2 documents; payload refine enforces unique documentIds, ascending unique `unreadablePages` within `pageCount`, evidence pages inside the owning document's `pageCount`, and `absent` only on documents with `extractionStatus ∈ {completed, partial}`.
- `stage-status.ts`, `correction.ts` (shape + bounds; no-evidence-by-design), `finding.ts` (mismatch ⇒ `comparisonRuleKey` + exactly 2 passages; `source` required exactly for `source_backed_concern`), `analysis-report.ts`, `error-envelope.ts` (17 codes from `docs/API.md` §7, `newRequestId()`).
- `canonical-json.ts` — canonical serializer (spec in TSDoc); `hmac-proof.ts` — sign/verify with keyId allowlist, base64url HMAC-SHA256 over the `{issuedExtraction, keyId}` envelope, `timingSafeEqual`, typed verify results (`malformed / unknown_key / unsupported_schema_version / signature_mismatch / expired`) for Phase 06 to map onto 422/409/410. Key material injected — no env reads in contracts.

Tests: `api/test/contracts/` — 8 suites + shared fixture helpers, 58 tests.
Docs: `docs/SECURITY.md` §3 gained the canonical-serialization subsection
(required by `docs/API.md` §5 "specified in SECURITY.md").

## Decisions / deviations from plan

- **Value-kind consistency invariant added beyond the plan's list:** the registry's `valueKind` also constrains which `NormalizedValue.kind` a field may carry (and money fields their expected `component`). Within the plan's stated registry purpose ("registry is the authority"); covered by tests.
- **`document_mismatch` requires exactly two evidence passages** (plan listed only the `comparisonRuleKey` check) — `docs/API.md` §6 states two readable passages; enforced.
- **Canonical serializer bug found by tests** and fixed: the plain-object prototype check rejected arrays; `Array.isArray` now runs first.
- **`unreadablePages` bounded by the document's own `pageCount`** (plan table implied it; explicit refine added after the test caught the gap).
- **Correction deltas carry no `evidence` field** — `docs/API.md` §5's example defines the delta by identity + state + value; only the shared value invariants apply. The plan's "reuse invariants" wording is satisfied via `refineFieldValueInvariants`.
- Everything else per plan: file layout, bounds table, strict objects, key injection, ESM/NodeNext.

## Files/components affected

New: `api/src/contracts/` (13 files), `api/test/contracts/` (9 files).
Changed: `docs/SECURITY.md` (§3 subsection only).
Unchanged: root scaffolding, `web/`, `sanity-studio/`.

## Validation

See `testing-log.md`: lint, typecheck, 60/60 api + 1/1 web tests, build — all green offline. No HTTP surface exists yet; endpoint mapping of verify reasons is Phase 06.

## Remaining issues

- None blocking. Phase 03 notes: config loader reads `REVIEW_HMAC_SECRET` + keyId from env; measured quote/field/page ceilings stay as coded schema bounds until staging measurement replaces them.
- Open owner items unchanged (MT-1/MT-8 needed for Phase 03 live runs).
