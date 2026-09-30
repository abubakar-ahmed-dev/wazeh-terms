# TC-002 fixtures — fictional salary-change sample pair

Fictional, project-owned test fixtures.

Contents:

- `sample-text.json` — exact text lines of both documents; the single source
  of truth for the fictional wording. Whatever generates the sample PDFs and
  whatever tests quote-matching must both read this file.
- `sample-offer.pdf`, `sample-contract.pdf` — visibly marked fictional sample
  documents (fictional employer "Gulf Horizon Facilities Services LLC",
  fictional worker). Seeded difference: offer basic salary AED 2,400/month
  (total 3,200) vs contract basic salary AED 1,800/month (total 2,600).

## What these files are and are not at runtime

- The PDFs **may** serve at runtime as public demo inputs: same-origin preview
  assets and bounded inline bytes sent to Gemini for the sample extraction
  path (`docs/API.md`, `docs/SECURITY.md`).
- Nothing in this folder is ever returned **as a result**. A runtime sample
  request must always extract through Gemini; no code path may return this
  folder's text, or any stored expected result, as an extraction or analysis
  response (`docs/API.md` §1, owner decision D2 in `plans/master-plan.md`).
- Expected-result/truth files for this pair do not live here; they are
  produced with the synthetic corpus in that phase and kept out of runtime
  paths.

Extraction fixtures matching the documented `docs/API.md` schema are created
by the corpus tooling in the relevant phase.

PDF regeneration tooling lands with the synthetic-corpus phase; it must render
`sample-text.json` deterministically and keep the synthetic markers. The final
corpus layout (the `test-corpus/` path in the specs is proposed, not fixed) is
decided in that phase's re-planning, updating affected docs together.
