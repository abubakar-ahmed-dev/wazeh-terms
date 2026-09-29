# Phase 07 — implementation log

Branch: `phase-07-corpus` (from `dev` @ `49b801c`; plan committed first).
Date: 2026-09-29.

## What was changed

The 15-case labelled corpus and the five production demo cases exist as
committed, deterministically regenerable fixtures, with a corpus runner that
proves fixture extraction → analyses → truth assertions in fixture mode.

- **`test-corpus/TC-001…TC-015/`** (authored): `sample-text.json` (text lines — single source of truth), versioned `truth.json` (schema v1), `notes.md`; **generated**: `offer.pdf`/`contract.pdf` (pdf-lib, fixed timestamps ⇒ byte-identical regeneration) and `extracted.json` (fixture extraction valid against the Phase 02 contracts, `matched_text` evidence tied to the text layer). Plus `README.md` (layout, regeneration, scoring contract) and `source-catalog.csv` (headers-only scaffold — no listing data used).
- **`api/src/corpus/truth-schema.ts`**: zod schema v1 for truth files (route, documents + readable pages, expected fields with evidence pointers into the text, seeded differences, allowed/forbidden finding categories, `requiredRuleRefs` — empty until Phases 09/10, expected abstentions).
- **`api/src/corpus/generator.ts`**: pure builders — `buildCasePdf` (deterministic), `buildExtractionFixture` (truth + text → per-role full 33-key extraction; unpinned keys explicit absences; unreadable pages from truth → `partial` status), `buildIssuedPayload` (runtime-fresh timestamps so proof TTL is live when tests sign), loaders.
- **`api/scripts/generate-corpus.ts`** + `npm run generate:corpus -w api`: regenerates all PDFs + extracted fixtures (fails if case count ≠ 15).
- **`api/test/phase-07/`**: truth-schema, pdf-regeneration (byte-identity + text-layer + extracted identity), runner (all 15 through HTTP analyses with truth assertions), production-samples (five demo cases fixed; TC-002 corpus copy mirrors the preserved demo fixture text exactly). 36 new tests (api 202 total).
- **Docs**: `docs/TESTING.md` §1 and `docs/SOURCES.md` §6 updated to the concrete committed layout (resolves the "proposed path" open question, per plan).

## Decisions / deviations from plan

- **Single-document case is TC-014** (contract-only, page 2 unreadable) rather than the plan's "TC-010 single-document variant": TC-010 stays an overtime-wording mismatch pair, keeping the six-pair mismatch group intact; TC-014 doubles as the required single-document case and the abstention demo. Logged as the one distribution deviation.
- **`missing_information` allowed in every pair case's truth:** sparse documents leave unpinned `importantIfAbsent` keys absent in both documents — the engine correctly reports them; truths allow the category instead of pinning everything (pinning 8 keys × 15 cases adds noise without information). Runner separately asserts the seeded fields' specific outcomes.
- **TC-015 assertion shape:** missing-information findings are legitimate; the data-treatment test asserts no mismatch/rule claim and no injected content (`9999`, instruction strings) anywhere in the serialized report.
- **Truth-authoring bug caught by the runner:** contract-side pin values originally mirrored the offer (six cases silent). Runner caught every one; contract expectations patched, fixtures regenerated.
- `extracted.json` committed for byte-identity CI checks; regeneration determinism asserted (PDF bytes + fixture equality).
- No new dependencies; generator runs on existing pdf-lib/pdfjs/tsx.

## Files/components affected

New: `test-corpus/**` (16 dirs: 15 cases + scaffold), `api/src/corpus/` (2), `api/scripts/generate-corpus.ts`, `api/test/phase-07/` (4), `test-corpus/README.md`.
Changed: `api/package.json` (`generate:corpus`), `docs/TESTING.md`, `docs/SOURCES.md`.

## Validation

See `testing-log.md`: 35 files / **202/202 tests**, lint 0 issues, typecheck
clean, build green. 15/15 cases green in fixture mode via the real analyses
endpoint; five production samples fixed and reproducible.

## Remaining issues

- `requiredRuleRefs` empty by design; TC-012's source-backed expectation awaits Phases 09/10 (disclosed in its truth notes).
- Live scoring deferred to Phase 15 (per plan; no provider calls made).
