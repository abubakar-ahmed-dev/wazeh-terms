# Phase 06 — testing log

Environment: Windows 10 Pro, bash (Git Bash), Node v22.16.0, vitest 5.0.2.
Date: 2026-09-29. All suites offline; the end-to-end test runs the real HTTP
two-step flow with the fake Gemini service and no Sanity (per plan).

| # | Check (plan §Tests) | File | Result |
| --- | --- | --- | --- |
| 1 | Proof verification (§8-2) | `proof.test.ts` | Pass — valid signed review ⇒ 200 + `no-store`; tampered field/scope/digest/expiry each ⇒ `422 REVIEW_INVALID` with a fixed message containing no key/HMAC/signature detail; unknown keyId ⇒ `422` (message leak-checked); malformed proof shapes ⇒ `422`; signed `schemaVersion: 2` ⇒ `409 REVIEW_VERSION_UNSUPPORTED`; expired proof ⇒ `410 REVIEW_EXPIRED`; malformed body ⇒ `400`. |
| 2 | Corrections (§8-2) | `corrections.test.ts` | Pass — unknown document/field/instance ⇒ `422 INVALID_CORRECTION`; duplicate target ⇒ `422`; invalid shape (`absent` with value) ⇒ `422`; 101 corrections ⇒ `422` (cap lives in `CorrectionsSchema` so overflow answers the documented code, not a generic 400); valid correction ⇒ 200 and the report never echoes the proof. |
| 3 | Flow (§8-1) | `flow.test.ts` | Pass — single document ⇒ no comparison findings, `comparison: not_applicable`, `scopeApplicability: supported`, `partial`; two explicit different salary passages ⇒ exactly one `document_mismatch` (`money_equality`, two passages, offer-first pages, `valueOrigins: ["document","document"]`), `comparison: completed`. |
| 4 | Flow (§8-3) | `flow.test.ts` | Pass — user-corrected side ⇒ **never** a mismatch: correction equalizing the documents surfaces a synthesized `needs_clarification` with `user_reported_difference`, `valueOrigins: ["document","user"]` (offer-first), both original passages, no `comparisonRuleKey`; a correction keeping the difference is likewise downgraded, never confirmed. |
| 5 | Flow (§8-5) | `flow.test.ts` + `report-shape.test.ts` | Pass — simulated retrieval absence ⇒ `retrieval: not_started`, `applicability: partial`, top-level `partial`, document findings intact, source-review limitation + `omittedChecks` present (D8). |
| 6 | Summary rules | `flow.test.ts` | Pass — the all-clear sentence never appears on a partial report (single-document and mismatch cases both assert `PARTIAL_SUMMARY`). Test caught an initial leak where a findings-free single-document review printed the all-clear line despite the partial status; assembly now reserves that sentence for completed reviews (future phases). |
| 7 | Scope applicability | `flow.test.ts` | Pass — declared supported route ⇒ `supported`; declared `unknown` ⇒ `unknown` + withheld-rules limitation; explicit contrary clue text (`domestic worker`) in extracted rawText ⇒ `conflicting`. |
| 8 | Coverage | `flow.test.ts` | Pass — `unreadable` field surfaces in `unreadableFieldKeys`; documentIds match the issued payload. |
| 9 | Report shape | `report-shape.test.ts` | Pass — every 200 response parses `AnalysisResponseSchema`; stages carry exactly the six documented keys; `officialNextSteps` ⊆ server allowlist; partial reports always include the D8 disclosure. |
| 10 | End-to-end HTTP | `end-to-end.test.ts` | Pass — `POST /extractions` (TC-TEXT temp fixture, fake Gemini, matched-text evidence) → echo returned payload+proof into `POST /analyses` ⇒ `200 partial`, `no-store`, comparison not applicable, coverage matches, no proof/payload echo in the report. |
| 11 | Regression | full suite | Pass — **31 files, 166/166 tests** (26 new); root `lint` 0 issues, `typecheck` clean, `build` green. |

Notes:

- Two issues caught by the suite and fixed: (1) a correction that *equalizes* the documents went silent — synthesis pass now emits one labelled user-reported difference per applied correction, skipped when the downgrade pass already reported the field; (2) the all-clear summary line appeared on a findings-free partial report — reserved strictly for completed reviews (unreachable while retrieval is absent).
- `valueOrigins` ordering follows offer-first evidence order so the UI can pair passages (implementation choice; test asserts the documented pair set and order).

No live-provider testing (owner instruction — quota conservation).
