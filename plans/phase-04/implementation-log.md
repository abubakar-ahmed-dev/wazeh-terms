# Phase 04 — implementation log

Branch: `phase-04-evidence` (stacked on `phase-03-extraction`; retarget/rebase
onto `dev` after PR #6 merges). Date: 2026-09-29.

## What was changed

Reported passages are now corroborated against the real PDF text layer before
the extraction response is signed; uncorroborated passages carry stable,
honest labels. No API shape changes — `Evidence.verification` values were
already in the Phase 02 contract.

- **`services/evidence/pdf-text.ts`** (new): `extractPdfPageTexts(bytes, {maxPages})` — pdfjs-dist `legacy` build, `getTextContent` per page (≤ admitted page count), rendering/fonts/workers off, textless page ⇒ `null`, typed `PdfTextError`. pdfjs v6 notes: teardown via the loading task's `destroy()`; `isEvalSupported` no longer exists.
- **`services/evidence/matcher.ts`** (new, pure): `normalizeForMatch` (NFC, whitespace collapse, lowercase, curly quotes/apostrophes → ASCII, all Unicode hyphen/dash variants incl. U+2011 → `-`, zero-width/soft-hyphen stripped) + `verifyEvidence` (normalized exact substring on the **claimed** page ⇒ `matched_text`; else `model_transcription` with stable note tokens: `claimed_page_has_no_text_layer`, `passage_not_matched_on_claimed_page`, `passage_found_on_page_<N>`). Pages are never rewritten; quotes are never altered.
- **`services/extraction/mapper.ts`**: `MapperDocumentInput` gains `pageTexts`; evidence verification + note tokens computed per evidence entry (deduped into field `qualityNotes`); present field whose evidence is entirely unmatched **and** sits on textless pages gains `transcription_unverified_scan` (stays `present` — ADR-004: user inspects, no fabricated absence). Verification is metadata: unmatched evidence alone does **not** degrade `status`/`extractionStatus`.
- **`routes/extractions.ts`**: text layer extracted once per admitted document before the provider call; extraction failure degrades to all-null pages (evidence then honestly unmatched) instead of blocking.
- **Tests**: `api/test/phase-04/` (matcher unit, pdf-text, mapper integration, HTTP contract with a TC-TEXT fixture whose quotes are drawn from the real generated text layer); helpers gained `createTextPdf` + TC-TEXT; logging test now separates pdfjs's own console warnings from logger JSON lines while still asserting zero content leakage anywhere.
- Dependency: `pdfjs-dist` (api workspace).

## Decisions / deviations from plan

- **Strict normalized-substring matching only** — per plan; near-misses stay `model_transcription`.
- **Unmatched evidence does not degrade the report status** (plan was silent): a `model_transcription` label is honest metadata, not a pipeline failure; only structural problems (dropped keys, invalid values, provider notes) mark partial. Recorded for the corpus phase's precision metric.
- **Wrong-page case carries both note tokens** (`passage_found_on_page_N` + `passage_not_matched_on_claimed_page`) — both facts are true; the earlier plan wording implied one.
- pdfjs v6 API adjustments (destroy-on-task, removed option) — implementation detail, no contract impact.

## Files/components affected

New: `api/src/services/evidence/` (2), `api/test/phase-04/` (4).
Changed: `api/src/services/extraction/mapper.ts`, `api/src/routes/extractions.ts`,
`api/test/phase-03/{helpers,logging.test}.ts`, `api/package.json`, root lockfile.

## Validation

See `testing-log.md`: 19 files / **101/101 tests** green, lint 0 issues,
typecheck clean, root build green. Live `matched_text` confirmation on TC-002
rides the provider-capacity rerun (phase-03 auto-retry); every offline path of
the matching behavior — including wrong-page rejection and invented quotes —
is proven.

## Remaining issues

- Live rerun pending (provider `503`/`429` on large inline requests; text-only succeeds). Auto-retry continues.
- Phase 05 (normalization + comparison) can proceed in parallel; it consumes the contracts, not the evidence verifier.
