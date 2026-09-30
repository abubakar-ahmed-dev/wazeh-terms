# WazehTerms — Architecture Decision Record

**Status:** Accepted MVP design decisions; implementation and operational verification are pending  
**Scope:** Pakistan-to-UAE pre-signing employment-document review  
**Companion:** `PRD.md`; details are expanded in future architecture, schema, API, security, sources, testing, and deployment documents.

An **Accepted** decision establishes the implementation direction; it does **not** claim that the feature works. Change a decision by adding a new ADR that explains what it supersedes. Provider-specific behavior and public release gates still require verification. The earlier scope plan is a historical planning document; for conflicting MVP commitments, these accepted decisions and `PRD.md` refine that plan. Keep the README aligned when capabilities are enabled.

## ADR-001 — Limit the initial employment route and separate applicability from comparison

**Status:** Accepted.  
**Decision:** Support Pakistan-to-UAE, UAE mainland, non-domestic private-sector employment when the governing category can be established. Ask the user for the intended route and category, then check documents for contrary clues. An uncertain, contradictory, domestic, government, or free-zone category cannot receive a mainland-specific rule claim. Readable fields and direct document differences may still be shown, with a scope warning.

**Rationale:** Document comparison depends on the text of the two documents; rule applicability depends on the worker, employer, regime, actor, and date. Conflating them could make a correct comparison appear to prove an incorrect legal conclusion.

**Consequence:** An employer name, logo, or address is not sufficient regime verification. The report tracks comparison coverage and rule applicability separately. Wider routes require their own reviewed sources and tests.

## ADR-002 — Use a stateless, two-step review flow

**Status:** Accepted.  
**Decision:** The API first extracts terms and returns a structured original extraction with a short-lived server signature over a canonical payload. The browser holds that payload and uploaded-file preview in memory for the active review. For analysis, it sends the original payload and signature plus separate user correction deltas. The server verifies integrity, expiry, and schema; it does not treat corrected values as original evidence. Do not persist the payload, signature, or document in URLs, browser storage, application case storage, or normal logs.

**Rationale:** The user can check extraction before analysis without relying on affinity to a Cloud Run instance or introducing a database. An integrity signature prevents the client from silently rewriting the purported server extraction. A signature is not encryption or authentication of the user and does not prevent replay within its short lifetime.

**Consequence:** A refresh loses the active review; the UI explains this. Corrections remain visibly user supplied. The API and security specifications will define payload binding, expiry, size limits, key rotation, and behavior when verification fails. Do not claim a confirmed documentary mismatch solely from an uncorroborated correction.

## ADR-003 — Process small documents inline and describe provider handling accurately

**Status:** Accepted for the MVP; provider configuration must be checked before public real-document uploads.  
**Decision:** Send bounded PDF content to Gemini inline for a single extraction call. Prefer in-memory processing; any necessary local temporary bytes are removed after success, error, cancellation, or timeout. Do not use the Gemini Files API, external URLs, cached content, or a file-search store in the initial document path. If the implementation changes to provider-side file upload, add file-ID tracking, explicit deletion, tests, a privacy-copy change, and a superseding ADR.

**Rationale:** Inline input suits small, transient, one-pass documents and avoids managing a reusable provider file. Google documents different storage behavior for inline data and Files API uploads. Inline data still goes to a provider; model API state and provider logging/data-use behavior depend on the chosen API and account tier. In particular, if the Interactions API is used, explicitly disable its default conversation-state storage where available. Consult the [file input methods](https://ai.google.dev/gemini-api/docs/file-input-methods) and [data-retention guidance](https://ai.google.dev/gemini-api/docs/zdr) for the deployed path.

**Consequence:** The public notice describes actual provider processing, not “zero retention.” Real-document uploads remain gated on an account-tier and notice review. Conservative file/page limits must reflect API, Cloud Run, memory, cost, and tested document readability; a suggested starting cap is not a verified platform limit.

## ADR-004 — Preserve field-level provenance, uncertainty, and corrections

**Status:** Accepted.  
**Decision:** Each field component has `present`, `absent`, `unclear`, or `unreadable` state. Present values retain original wording, document ID, page, and reported passage; normalized and corrected values never overwrite those records. Absence is claimed only after sufficient review of relevant readable pages. On digital PDFs, corroborate passages against page text where feasible; on images and scans, expose transcription uncertainty and allow the user to inspect the page.

**Rationale:** Structured output can be valid JSON while the document value or passage is wrong. A field-level evidence trail lets the application explain the result and abstain when it cannot establish a claim.

**Consequence:** Compound values such as pay, allowances, benefits, charges, and payer need component-level evidence. No unverified model excerpt is labelled as independently verified verbatim text. The UI must distinguish documentary evidence from a user correction.

## ADR-005 — Compute document mismatches in code; use the model for extraction and phrasing

**Status:** Accepted.  
**Decision:** Validate model extraction against a runtime schema, normalize values, and compare explicit terms using application code. Compare basic salary, allowances, stated total, currency, payment frequency, job, dates, costs, benefit states, and conditions as distinct components. The model may explain an established finding in plain language; it cannot introduce a mismatch, change its category, add a rule, or fabricate a citation.

**Rationale:** Exact pay, date, actor, and benefit comparisons need predictable behavior and inspectable tests. Silence, conditional wording, a policy reference, and a conflicting explicit term have different meanings.

**Consequence:** Missing and unclear terms create their own result types. Pakistan-side processing charges and UAE-side employer charges are separate, source-specific questions. Do not silently convert currencies, assume pay frequency, or infer a cost payer.

## ADR-006 — Keep curated reference content in Sanity and use a Knowledge Base-only MCP for retrieval

**Status:** Accepted; the deployed endpoint and tools must be verified.  
**Decision:** Store public/authorized `authority`, `sourceDocument`, `rule`, `contractFieldDefinition`, and `resolutionNote` records in Sanity Content Lake. Build a Sanity Knowledge Base from approved reference material. Connect the running agent to a dedicated Context MCP endpoint whose sources are **Knowledge Bases only**. Use MCP to discover candidate evidence; resolve a candidate against the approved rule/source records before displaying a rule concern. Never put uploaded offers, contracts, user corrections, or raw logs into Sanity.

**Rationale:** The product architecture requires actual Context MCP use, while curated rule records supply stable IDs and reviewed scope. Knowledge Base entries are generated and may be incomplete or stale. Sanity [derives endpoint retrieval mode from its sources](https://www.sanity.io/docs/ai/sanity-context-retrieval-modes): attaching a dataset source to that endpoint changes the tools it serves. A separately scoped server-side read of canonical records may be needed; it is not a substitute for the MCP retrieval step.

**Consequence:** Verify `tools/list` and a known-answer retrieval in production. Store only reference material approved for that Knowledge Base; scope the endpoint narrowly. Rule edits require a source review, Knowledge Base rebuild where applicable, and a known-answer check before newly edited material supports claims. Retrieval queries omit worker identifiers and raw document passages.

## ADR-007 — Gate rule claims on exact, applicable, dated evidence

**Status:** Accepted.  
**Decision:** A rule-supported finding requires an approved stable rule ID; an official source with an actually supporting pinpoint; issuing authority; jurisdiction; worker category; responsible actor; conditions and exceptions; source status; relevant effective period; and last-checked date. Compare these with the claim and known facts. Record the review date and document/start dates separately. If a necessary condition, source version, or pinpoint cannot be checked, withhold the rule conclusion and show a clarification or incomplete-source state.

**Rationale:** Retrieval relevance alone does not establish legal applicability. A useful document discrepancy can stand without any rule claim. ILO/IOM material is labelled guidance rather than binding Pakistan or UAE law.

**Consequence:** Source curation is a release gate, not background copywriting. A source URL pointing to general background is insufficient. Superseded, conflicting, inaccessible, or unverified passages cannot support a current definitive claim. `SOURCES.md` will document the review procedure and any documented resolution of source conflicts.

## ADR-008 — Serve the web app and API from one public Cloud Run service

**Status:** Accepted for the MVP; deployment settings remain subject to measurement.  
**Decision:** Containerize the built React client and Express API in one Cloud Run service under one origin; reserve `/api/*` for the API and route client pages to the SPA. Keep Sanity Studio as a separate editing surface. Bind Gemini and Sanity credentials server-side; never ship them in the client bundle.

**Rationale:** One service simplifies the public demonstration URL, same-origin requests, and coordinated deployment of UI/API contracts.

**Consequence:** Bound uploads, memory, concurrency, provider calls, and request time. Abort upstream work on cancellation where possible. A timeout or retrieval failure must not convert a partial check into a complete positive report. `DEPLOYMENT.md` will record actual commands and values, not assumed settings.

## ADR-009 — Gate image input and Urdu explanations independently

**Status:** Accepted.  
**Decision:** The assured launch path is readable English PDF input and English reporting. JPG/PNG input is enabled and advertised only after photo/scan passage and abstention tests pass. Urdu is an optional explanation of a completed English finding and is enabled only after reviewing representative translations for amounts, negation, obligations, exceptions, and uncertainty. Show the source passage and official source alongside either language.

**Rationale:** Image quality and translated legal nuance are separate risks. The earlier scope plan proposed both as MVP scope; the newer README requires validation before either is represented as supported. This ADR makes the narrower public promise explicit.

**Consequence:** Tests and the deployed UI decide the actual supported-format and language labels. Failure of either gate does not block the English PDF vertical slice; do not show a disabled feature as though it were delivered.

## ADR-010 — Prefer transparent partial reports and bounded public execution

**Status:** Accepted.  
**Decision:** Track extraction, review, comparison, retrieval, applicability, and explanation as separately completed, failed, or inapplicable stages. A single document may yield terms and questions but no offer/contract comparison. If a provider or Sanity is unavailable, preserve valid document-only results and explicitly identify what was not checked. Apply upload/page limits, throttling, concurrency limits, and time budgets to the public endpoint.

**Rationale:** A public analysis is costly and depends on several external services. Silent fallbacks can turn missing evidence into false assurance. Cloud Run can continue running code after a client-facing timeout, so the application needs its own deadline and cancellation handling; see [Cloud Run timeout behavior](https://cloud.google.com/run/docs/configuring/request-timeout).

**Consequence:** The report can say “No concern detected in the fields checked” only when those checks completed. No global legal or safety verdict. Log stage outcomes and operational metrics without raw documents, identifying details, or excerpts.

## ADR-011 — Validate with synthetic cases before involving real worker documents

**Status:** Accepted.  
**Decision:** Ship visibly fictional samples and a labelled 15-case synthetic corpus derived where useful from public listing attributes without representing a listing as an authentic contract. Track extraction, mismatches, unsupported claims, citations, latency, and abstention against expected results. Real worker documents require a separate consent, minimization, provider-data-handling, and retention review before being used for evaluation.

**Rationale:** Real employment documents contain sensitive worker and employer information, and a small test set cannot establish legal reliability.

**Consequence:** `TESTING.md` reports achieved counts and denominators, not just targets. Keep the production demo cases reproducible. Before enabling public real-document uploads, satisfy the privacy gate in `PRD.md` and ADR-003.
