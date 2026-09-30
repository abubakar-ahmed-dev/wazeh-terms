# Phase 02 — testing log

Environment: Windows 10 Pro, bash (Git Bash), Node v22.16.0, vitest 5.0.2.
Date: 2026-09-28. All root commands run at repository root, `api` commands in `api/`.
All suites run offline — no provider, Sanity, or network access, per plan.

| # | Check (plan §Tests) | Command | Result |
| --- | --- | --- | --- |
| 1 | Registry suite (8 assertions) | `npx vitest run test/contracts/field-registry.test.ts` | Pass — 33 keys / 12 groups / documented order; only `allowance_item`+`deduction_item` repeatable; known value kinds + 7 strategy keys; money component mappings; unknown keys rejected. |
| 2 | NormalizedValue suite | `normalized-value.test.ts` | Pass — numeric amount rejected (string only); decimal-format cases; null currency/frequency/payer allowed, bad enums rejected; ISO calendar dates (2026-02-30, 2026-13-01 rejected; 2024-02-29 accepted); duration/benefit_state/boolean/text/reference_text; unknown kinds + strict unknown members rejected. |
| 3 | Evidence + ExtractedField invariants | `evidence-extracted-field.test.ts` | Pass — page bounds, quote/verification enums; present without value/evidence rejected; absent/unclear/unreadable with value rejected; unknown fieldKey rejected; kind mismatch rejected (`employer_name` + money); component mismatch rejected (`basic_salary` + `worker_charge`) and valid mapping accepted (`deduction_item` + `worker_charge`); instanceId pattern; qualityNotes cap. |
| 4 | IssuedExtraction suite | `issued-extraction.test.ts` | Pass — schemaVersion pinned to 1; scope literals (`origin: "PK"`, regime enum); 1–2 documents, duplicate documentId rejected; `expiresAt < issuedAt` rejected; evidence page > pageCount rejected; `absent` on `failed` document rejected (accepted on `completed`); unreadablePages unique ascending ≤ pageCount; sha256/mimeType formats. |
| 5 | Correction + report shapes | `correction.test.ts`, `finding-report.test.ts` | Pass — present correction needs no evidence of its own (distinct from extracted fields); value invariants + registry kind consistency applied; corrections capped at 100; `document_mismatch` requires comparisonRuleKey + exactly 2 passages; `source` required exactly for `source_backed_concern` and forbidden elsewhere; SourceCitation fields validated; AnalysisResponse stages/strict keys/status/scopeApplicability validated. |
| 6 | Canonical JSON suite | `canonical-json.test.ts` | Pass — key-order independence at every nesting level; exact documented byte form; UTF-16 code-unit key order ('A' before 'a'); array order significant; standard string escaping; JSON.parse round trip; rejects NaN/±Infinity/1.5/undefined members/functions/Date/cycles. |
| 7 | HMAC proof suite | `hmac-proof.test.ts` | Pass — base64url signature bound to keyId; invalid keyId/short secret rejected at issuance; deterministic for identical input, differs across payloads; all tamper vectors (`rawText` value, scope, sha256 digest, expiresAt) → `signature_mismatch`; unknown keyId → `unknown_key`; rotation with 2-key allowlist works; expiry → `expired` (separate from integrity); `schemaVersion: 2` → `unsupported_schema_version`; malformed proof/payload → `malformed`; different secret → `signature_mismatch`. |
| 8 | Whole-workspace + root gates | root `npm run lint` / `typecheck` / `test` / `build` | Pass — lint clean (0 errors/warnings); typecheck 0 errors; **api 60/60, web 1/1 tests** (58 phase-02 assertions in 8 suites + 2 phase-01 smoke); build green (api `tsc` emit + web vite build). |

Notes:

- Two issues found by the suites and fixed in code before commit: (1) canonical serializer rejected arrays because the plain-object prototype check ran before the `Array.isArray` branch; (2) `unreadablePages` entries were bounded by `PAGE_MAX` but not by the document's own `pageCount` — bound added in the payload refine. Both now asserted by tests.
- Coverage vs plan: every item in the plan's 8-point test matrix is represented above; no planned check was skipped.

Not run (out of phase scope): HTTP contract tests (no endpoints yet), Gemini/Sanity live checks, corpus, browser tests.
