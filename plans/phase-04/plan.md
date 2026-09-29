# Phase 04 — Evidence verification (PDF text-layer matching) — plan

**Depends on:** Phase 03 (extraction step). Branch `phase-04-evidence` stacked on
`phase-03-extraction` until PR #6 merges; retarget to `dev` then. The live
TC-002 rerun gate from Phase 03 stays open (provider 503/429) and this phase's
live exit rides on the same rerun.

**Re-planning check:** `docs/TECHNICAL_ARCHITECTURE.md` §3.1 step 4, `docs/ADR-004`,
`docs/API.md` §4.2, `docs/SECURITY.md` §4/§5 re-read. Phase 03 mapper currently
stamps every evidence `verification: "model_transcription"` (honest placeholder);
this phase adds real corroboration. New dependency needed for text extraction.

**Goal (master-plan):** reported passages are corroborated against the actual
PDF text layer where possible; uncorroborated passages are labeled honestly.
Never rewrite a quote to force a match.

## Dependency decision

**`pdfjs-dist`** (current major, `legacy` Node build) for text-layer extraction.
Reasons: per-page `getTextContent` API (needed for page-accurate matching),
actively maintained, no native bindings; `pdf-parse` has no page-wise API and
wraps an old pdfjs. Rendering disabled — text content only, bounded memory.
Bounded resource rules: only ≤ `maxPagesPerPdf` pages, no worker threads, no
font/annotation processing beyond text items, `AbortSignal`-less synchronous
parse per document (bytes already admitted). Extracted text is **untrusted data**.

## Files to create/change (`api/src/`)

| File | Content |
| --- | --- |
| `services/evidence/pdf-text.ts` (new) | `extractPdfPageTexts(bytes, {maxPages}): Promise<string[]>` — per-page raw text via pdfjs `getTextContent` (items joined with spaces; `null` entry = page has no usable text layer). Throws typed `PdfTextError('malformed')` (bytes already admission-checked; defensive only). |
| `services/evidence/matcher.ts` (new) | Pure matching module. `normalizeForMatch(text)`: NFC, collapse all whitespace runs to single space, lowercase, unify curly quotes/apostrophes/dashes to ASCII, strip soft hyphens, drop zero-width chars. `verifyEvidence({quote, page}, pageTexts): {verification, qualityNotes[]}` — exact normalized substring on the **claimed** page ⇒ `matched_text`; else `model_transcription` + note `passage_not_matched_on_claimed_page`; if the normalized quote exists on a *different* page, add note `passage_found_on_page_<N>` — **page number is never corrected**; no text layer on the claimed page ⇒ note `claimed_page_has_no_text_layer`. |
| `services/extraction/mapper.ts` (change) | `mapModelExtraction` gains `pageTexts: readonly (string | null)[]` per document input; evidence verification + quality notes come from the matcher instead of the constant. Field-level: if `state === 'present'` and **every** evidence entry is unmatched *and* the claimed pages have no text layer, append note `transcription_unverified_scan` (stays `present` — user inspects; no fabricated absence, ADR-004). |
| `routes/extractions.ts` (change) | Extract page texts once per admitted document (before provider call; bytes in memory) and pass through to the mapper. Bounded by existing page limit. |
| `services/gemini/prompt.ts` (no change) | Prompt already demands verbatim quotes. |
| `api/test/phase-04/*` (new) | Suites below. |

Tests generate fixture PDFs with **pdf-lib** (known exact text per page), so
expected matches are deterministic — no provider involved.

## Tests (`api/test/phase-04/`)

1. **Matcher unit (`matcher.test.ts`)** — exact quote on claimed page ⇒ `matched_text`; reformatted quote (line breaks/extra spaces) ⇒ `matched_text` (normalization); curly quotes/apostrophes/dashes ⇒ `matched_text`; case differences ⇒ `matched_text`; wrong claimed page but present elsewhere ⇒ `model_transcription` + `passage_found_on_page_N` + page unchanged; invented quote ⇒ `model_transcription` + `passage_not_matched_on_claimed_page`; empty/no-text-layer page ⇒ `claimed_page_has_no_text_layer`; notes deduplicated and bounded.
2. **Text extraction (`pdf-text.test.ts`)** — pdf-lib fixture with known lines on pages 1–2: page texts contain the lines in order; blank page ⇒ `null` entry; page cap respected (15-page fixture, cap 3 ⇒ 3 entries); malformed bytes ⇒ typed error.
3. **Mapper integration (`mapper.test.ts`)** — model evidence quotes drawn verbatim from fixture page text ⇒ fields come out `matched_text`; invented quotes ⇒ `model_transcription` + notes; present field with only unmatched evidence on a textless page ⇒ `transcription_unverified_scan` note, still `present`; absent/unclear untouched; issued payload still validates against Phase 02 schemas.
4. **HTTP contract (`extraction.test.ts` extension)** — fake Gemini returns quotes copied from the generated fixture text ⇒ response evidence shows `matched_text` and no matching notes; invented quotes ⇒ `model_transcription` visible through the API; full existing phase-03 suite stays green (constant-verification assertions updated to the new behavior).
5. **Bounded-resource smoke** — 15-page fixture extraction completes; per-page text bounded; no unbounded loop (pdfjs `TextItem` count capped defensively).
6. **Live rerun (manual, owner capacity pending)** — `npm run live:sample -w api`: TC-002 quotes derived from `sample-text.json` ⇒ expect `matched_text` on text-layer passages; recorded in the testing log with latency.

## Decisions

- **Strict normalized-substring matching only** — no fuzzy/Levenshtein fallback in this phase. A near-miss is labeled `model_transcription` with notes; loosening requires evidence and its own decision.
- **Notes use stable snake_case tokens** (`passage_not_matched_on_claimed_page`, `passage_found_on_page_N`, `claimed_page_has_no_text_layer`, `transcription_unverified_scan`) — UI maps them to plain English later; they are not free-text provider notes.
- **Verification happens before signing** (master-plan) — inside the mapper, so the signed payload carries final verification states.
- **pdfjs `legacy` build** import path for Node/tsx compatibility; only `getDocument` + `getTextContent` used.
- Phase 03's `matched_text`-never-appears test assertions will be updated — they were placeholders encoding the Phase 03 scope.

## Exit criteria (master-plan)

- TC-002 live run shows `matched_text` on text-layer quotes (rides on the provider-capacity rerun; offline proof in the meantime).
- Invented-quote fake yields `model_transcription`; wrong-page rejection tested — both proven offline.
- Whole suite green; lint/typecheck/build green; CI green.

## Out of scope

Scan-quality heuristics beyond the text-layer absence note, fuzzy matching, evidence UI (Phase 11), Urdu/images gates.
