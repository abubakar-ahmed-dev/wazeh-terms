# Phase 04 — testing log

Environment: Windows 10 Pro, bash (Git Bash), Node v22.16.0, vitest 5.0.2,
pdfjs-dist 6.3.289 (legacy build). Date: 2026-09-29. All suites offline with
pdf-lib-generated fixtures carrying deterministic text layers; no provider.

| # | Check (plan §Tests) | Command / file | Result |
| --- | --- | --- | --- |
| 1 | Matcher unit | `matcher.test.ts` | Pass — exact quote ⇒ `matched_text`; reformatted (whitespace/newlines/case) ⇒ `matched_text`; curly quotes/apostrophes + hyphen variants (incl. U+2011 non-breaking hyphen) ⇒ `matched_text`; wrong claimed page ⇒ `model_transcription` + `passage_found_on_page_2` + page never corrected; invented quote ⇒ `passage_not_matched_on_claimed_page`; textless claimed page ⇒ `claimed_page_has_no_text_layer`; notes stay single-finding per quote. |
| 2 | Text extraction | `pdf-text.test.ts` | Pass — per-page text in order; blank/textless page ⇒ `null` entry; 15-page fixture with cap 3 ⇒ 3 entries; unusable bytes ⇒ typed `PdfTextError`. |
| 3 | Mapper integration | `mapper.test.ts` | Pass — text-layer quotes ⇒ `matched_text` in the issued field; invented quotes ⇒ `model_transcription` + note, field stays `present`, **status not degraded** (verification is metadata, not failure); unmatched present field on a textless page ⇒ `transcription_unverified_scan`, still `present`; issued payload validates against Phase 02 schemas. |
| 4 | HTTP contract | `evidence-contract.test.ts` | Pass — through the real route + temp fixture PDFs: fake Gemini quotes copied from the actual PDF text ⇒ response evidence `matched_text`, empty notes; invented quote ⇒ `model_transcription` + `passage_not_matched_on_claimed_page`; wrong-page quote ⇒ `passage_found_on_page_2` with the claimed page kept. |
| 5 | Bounded-resource smoke | `pdf-text.test.ts` cap case + route limit | Pass — pdfjs limited to admitted page count; worker/rendering disabled (legacy build, `getTextContent` only); defensive typed error path proven. |
| 6 | Regression | full suite | Pass — **19 files, 101/101 tests** (phase-03 suites unchanged except: logging test now filters pdfjs's own non-JSON console warnings before JSON assertions; helper gained `createTextPdf` + TC-TEXT fixture). Root `lint` 0 issues, `typecheck` clean, `build` green. |

Notes:

- `pdfjs-dist` v6 API differences handled during implementation: `destroy()` lives on the loading task (not `PDFDocumentProxy`), `isEvalSupported` option no longer exists — bounded `getTextContent` path only.
- An early pdfjs import printed a non-JSON library warning through `console.log`; the redaction test now separates logger JSON lines from library noise while still asserting no content leaks in either.

## Live rerun

Still pending on provider capacity at implementation time (`503` high-demand / `429` quota on large inline requests; text-only calls succeed). The phase-03 auto-retry updates `plans/phase-03/testing-log.md`; when it succeeds, the TC-002 run is expected to show `matched_text` for quotes drawn from `sample-text.json` — that closes this phase's live exit criterion. Offline proof of the full matching path (including wrong-page rejection) is complete above.
