# test-corpus — labelled synthetic cases

15 fictional, visibly-marked cases (TC-001…TC-015) used by the fixture-mode
test runner. **Nothing here is ever served as a runtime result** — the public
sample experience always extracts through Gemini (`plans/master-plan.md` D2);
these artifacts exist for deterministic tests and, in Phase 15, for scoring
against the deployed stack.

## Per-case layout

| File | Role |
| --- | --- |
| `sample-text.json` | Exact text lines per role. **Single source of truth** — the generator renders PDFs from it, and fixture evidence quotes must appear here verbatim. |
| `truth.json` | Versioned annotation (schema v1, `api/src/corpus/truth-schema.ts`): route, documents + readable pages, expected fields with evidence pointers, seeded differences, allowed/forbidden finding categories, expected abstentions. `requiredRuleRefs` stays empty until approved content exists (Phases 09/10). |
| `offer.pdf` / `contract.pdf` | Generated deterministically from the text (fixed timestamps). |
| `extracted.json` | Generated fixture extraction (valid Phase 02 contracts, `matched_text` evidence). Test-path only. |
| `notes.md` | Fictional scenario summary. |

## Regeneration

```bash
npm run generate:corpus -w api
```

Regeneration is deterministic — CI/test suite asserts committed artifacts match
a fresh run (byte-identical PDFs, identical `extracted.json`).

## Case set

| Cases | Emphasis |
| --- | --- |
| TC-001, TC-003…TC-005 | consistent pairs (no mismatch) |
| TC-002 | preserved salary-change pair (mirrors `fixtures/samples/TC-002`) |
| TC-006…TC-011 | mismatch pairs: salary, stated total, job title, start+duration, overtime wording, benefit status |
| TC-012 | worker-paid recruitment fee (document-check layer only; rule-backed concern awaits Phases 09/10) |
| TC-013 | `importantIfAbsent` term missing from both documents |
| TC-014 | single contract, page 2 unreadable (comparison not applicable) |
| TC-015 | embedded instructions targeting the extraction (treated as data) |

Five production demo cases: TC-001 (consistent), TC-002 (salary change),
TC-012 (worker charge), TC-013 (missing term), TC-014 (abstention).

`source-catalog.csv` is a headers-only scaffold: listing-informed attributes
may be added later with recorded provenance (`docs/SOURCES.md` §6); no listing
data was used for this corpus version.
