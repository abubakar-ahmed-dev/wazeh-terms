# Phase 03 — testing log

Environment: Windows 10 Pro, bash (Git Bash), Node v22.16.0, vitest 5.0.2,
Express 5, `@google/genai` 2.24.0, `pdf-lib` 1.17.1. Date: 2026-09-28/29.
Offline suites run without network and with a fake `GeminiExtractionService`;
the live run uses the owner's git-ignored `api/.env` credentials.

| # | Check (plan §Tests) | Command | Result |
| --- | --- | --- | --- |
| 1 | capabilities / samples / health | `read-only.test.ts` | Pass — `/health` minimal `{status, version}` + `no-store`; `/api/v1/capabilities` matches `docs/API.md` §3 shape from config (flags, MIME, limits, notice version); `/api/v1/samples` lists manifest metadata with fixed same-origin preview URLs and no internal paths. |
| 2 | Admission | `admission.test.ts` | Pass — unknown/malformed/path-like `sampleCaseId` → 400 with provider never called; multipart → `403 CUSTOM_UPLOAD_DISABLED` with provider never called; 20-page fixture → `413 TOO_MANY_PAGES`; garbage bytes → `422 UNREADABLE_DOCUMENT`; empty file → `415`; non-PDF magic → `415`; per-file byte limit from config → `413 FILE_TOO_LARGE`; sample mode off or missing key/secret → `503 EXTRACTION_UNAVAILABLE` fail-closed; error envelope + `no-store` + `requestId` shape verified. |
| 3 | Extraction contract | `extraction.test.ts` | Pass — valid pair → 200, one provider call carrying both inline PDFs (D2 asserted: sample runtime always calls Gemini); `IssuedExtractionV1` validates; instanceIds server-assigned (`basic_salary:0`); opaque distinct documentIds; sha256/pageCount from admission; evidence honestly `model_transcription` (Phase 04 upgrades to `matched_text`); missing role → `partial` + failed document; unknown fieldKey dropped and invalid model value (bad calendar date) downgraded to `unclear` with null value; nothing usable → `422` with no proof and no payload; provider failure → `503 EXTRACTION_UNAVAILABLE`; provider note → `partial` + notice. |
| 4 | Signing | in `extraction.test.ts` | Pass — response `proof` verifies against the exact returned payload via the Phase 02 `verifyIssuedExtraction` with the test key; `keyId` from config; route performs a self-check before responding. |
| 5 | Gemini client behavior | `gemini-http.test.ts` (fetch stubbed) | Pass — schema-invalid output retried within the two-attempt budget (third call never made); recovery on second attempt; provider/network error fails closed without retry; deadline abort → `timeout`. |
| 6 | Logging redaction | `logging.test.ts` | Pass — captured console lines parse as coarse JSON (`ts/level/event/requestId/route/status/durationMs`) and contain no fixture names, no `AED` values, no filenames, no base64 PDF (`JVBER`), no prompt text. |
| 7 | Static sample previews | `static-samples.test.ts` | Pass — manifest-listed fixture served as `application/pdf`; unknown case/file, traversal (`..%2F`), and empty path → 404. |
| 8 | Root gates | `npm run lint` / `typecheck` / `test` / `build` | Pass — lint 0 issues; typecheck clean; **api 83/83 tests (15 files), web 1/1**; build green. |

## Bugs found by tests during the phase (fixed before commit)

1. `inspectPdf` only wrapped `PDFDocument.load`; pdf-lib loads garbage bytes leniently and throws at `getPageCount()` — a raw `TypeError` escaped as 500. Page count moved inside the guarded block; garbage now correctly maps to `422`.
2. Phase 02 `ErrorEnvelopeSchema.stage` used `StageStatus` values (`completed`…), but `docs/API.md` §7 shows a stage **name** (`"review"`). Corrected to a `StageName` enum (`extraction/review/comparison/retrieval/applicability/explanation`).
3. Provider failures previously discarded diagnostics; outcomes now carry a coarse `errorClass` (e.g. `ApiError:402`) — message bodies are never logged.

## Live run (BLOCKED — owner action)

`npm run live:sample -w api` against the real provider:

```
{"result":"error","status":503,"code":"EXTRACTION_UNAVAILABLE","totalMs":670}
{"probe":{"reason":"unavailable","errorClass":"ApiError:402"}}
```

- Model id `gemini-3.5-flash` was probed directly and is **valid** (no 404); the request reaches Gemini.
- Failure is `402: prepayment credits are depleted` on the GCP-linked AI Studio project. This is an owner-side billing blocker, not a code defect.
- The failure path itself behaved as documented: fail-closed `503 EXTRACTION_UNAVAILABLE`, retryable, no content leaked.
- **Rerun needed** once the owner adds AI Studio credits (`https://ai.studio/projects` → billing/credits). Exit criterion "sample TC-002 extracts through live Gemini" stays **pending** until then; recorded here rather than claimed.
