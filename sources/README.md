# sources/ — curation input, local research materials

This folder feeds source curation (`docs/SOURCES.md`). It is **not** runtime
data and never reaches the application, Sanity worker paths, or the Knowledge
Base input directly.

## What is committed vs local-only

Committed here:

- `*/links.md` link lists (URLs only).
- Inventory/provenance metadata and reviewed documentation (e.g. a dated
  inventory table per candidate ID).

Local only (git-ignored — see repository `.gitignore`):

- Downloaded official PDFs and documents.
- Browser captures of blocked pages: screenshots, saved HTML, full-page
  transcriptions. Every capture is an **unreviewed capture** until a human
  records its official URL, publisher, capture time, version where known, and
  the exact section relied on.
- Suggested ignore-scope: `sources/captures/` plus document/media types.

## Rules for captures and copied text

- Official sites block automated access. Work from the owner's downloaded
  official PDFs and dated browser captures; do not defeat access restrictions
  and do not infer a rule from search snippets.
- A capture supports at most a **proposed** narrow source record or rule for
  human review, with conditions and exceptions stated. Only approved, current
  records with verified pinpoints belong in the Sanity Content Lake and the
  Knowledge Base input; the application MCP endpoint stays Knowledge
  Base-only.
- Full PDFs upload to Sanity only when permitted and needed. User employment
  documents never go there.
