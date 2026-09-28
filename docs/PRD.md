# WazehTerms — Product Requirements Document

**Status:** MVP design baseline; implementation and validation are pending  
**Delivery planning:** Milestone-based; release gates depend on verified evidence   
**Related documents:** `README.md`, `ADR.md`, `TECHNICAL_ARCHITECTURE.md`, `SOURCES.md`, `TESTING.md`

## 1. Product and problem

**WazehTerms helps a person in Pakistan understand the written terms of a proposed UAE job before signing.** The person may have a job offer, an employment contract, or both. The application extracts relevant terms, shows the supporting passages for review, compares two documents when available, and explains concrete discrepancies and carefully sourced concerns. It suggests questions the person can ask an employer, recruiter, or appropriate authority.

An offer may promise pay or benefits that a contract phrases differently. A charge may be assigned to a worker without a clear explanation. An important term may be absent, conditional, or unreadable. The user needs a clear account of **what each document actually says**, what remains uncertain, and which official source, if any, supports a specific rule concern.

WazehTerms provides information for document review. It does not authenticate a document, verify an employer or visa, determine fraud, certify legal compliance, represent the worker, or replace a qualified adviser or authority.

## 2. User, context, and supported boundary

- **Primary user:** a Pakistani worker considering a UAE private-sector job before signing employment documents.
- **Primary task:** compare the written offer and contract, identify questions, and understand source-backed issues without treating uncertainty as proof of wrongdoing.
- **Initial route:** Pakistan to the UAE; UAE mainland, non-domestic private-sector employment when that category can be established.
- **Assured input at launch:** readable English PDFs, subject to the input and extraction acceptance tests. A user may submit a single offer, a single contract, or one of each.
- **Conditional input:** JPG/PNG photographs or scans become public supported formats only after the separate image-quality evaluation passes. A scanned PDF can still be partially or wholly unreadable.
- **Assured output:** plain English. Urdu explanatory text is a separately gated enhancement and must retain the English passage, source, numbers, conditions, and uncertainty.
- **Access:** no account in the MVP; a public demonstration can start with clearly labelled synthetic sample documents.

The earlier project scope plan listed images and Urdu as MVP ambitions. This baseline treats them as release-gated capabilities in line with the README's validation boundary and ADR-009. The interface and documentation must describe the formats and languages **actually verified and enabled**, not everything contemplated by the plan.

The user supplies the intended route and worker category. The application checks for document clues that conflict with those selections. A logo, address, or company name alone cannot establish the governing employment regime. If applicability is unknown, the application may still show readable terms and direct document differences but must withhold a regime-specific rule claim.

## 3. Goals and exclusions

### MVP goals

1. Produce reviewable, structured evidence for the 12 field groups in section 5.
2. Let the user inspect and correct extracted values without erasing the original extraction.
3. Detect material offer-versus-contract differences with deterministic application logic.
4. Retrieve candidate reference material through a Sanity Knowledge Base-backed Context MCP endpoint, then check each proposed rule concern against a reviewed rule and official source.
5. Show findings with the relevant passages, pages, scope, source, date, uncertainty, and a useful question or official next step.
6. Preserve useful document-only results when source retrieval or explanation fails, while identifying the incomplete stage.

### Explicit exclusions

- Domestic work, UAE government work, free-zone-specific regimes, and other origin or destination countries.
- Employer reputation, fraud prediction, identity, company-registration, barcode, visa, and document-authenticity verification.
- Filing complaints, submitting documents to authorities, providing legal representation or definitive legal conclusions.
- User accounts, saved cases, subscriptions, collaboration, and an archive of uploaded documents.
- Training a custom model or automatically scraping changing government sites for live rule decisions.

## 4. User journey and required states

| Stage | Required behavior | If the stage cannot be completed |
| --- | --- | --- |
| Scope and notice | Show supported route, worker category, accepted formats, provider-processing notice, and advice to redact unnecessary identifiers. Offer synthetic samples. | Do not imply the selected category has been verified. |
| Upload | Accept one supported document of either type, or an offer/contract pair. Check signature, MIME, size, page count, and basic readability. | Explain rejection or unreadable pages. Never invent missing text. |
| Extraction | Return typed values with field states and page-level passages; show evidence quality. | Identify unreadable or uncertain fields; permit a partial review if appropriate. |
| Review | Show original extracted text beside the document page; allow user corrections as separately attributed values. | Corrections without documentary support remain user supplied. |
| Comparison | Compare explicit terms when both readable documents are present; distinguish missing, conditional, and conflicting terms. | A single document yields a term review and questions, never a claimed comparison. |
| Source review | Retrieve relevant candidates from Sanity Context and check the approved rule, issuer, scope, actor, dates, conditions, and exact source pinpoint. | Withhold a rule claim and preserve any substantiated document-only results. |
| Report | Group findings by type; show evidence, limits, uncertainty, and next questions. State which stages and fields were covered. | Mark partial work explicitly; offer a retry only for the failed stage where feasible. |

The browser holds the reviewed extraction only for the active session. There is no account or server-side case history. The API verifies the original extraction returned by the server, and treats later user corrections as separately labelled input; see ADR-002.

## 5. Field groups and evidence requirements

The MVP covers **12 groups**, each of which may have multiple independently evidenced components:

1. Employer name.
2. Job title or occupation.
3. Work location.
4. Basic salary, each allowance, stated total, currency, and payment frequency.
5. Start date, duration, and renewal wording.
6. Probation period.
7. Ordinary working hours and overtime wording.
8. Notice and termination wording.
9. Deductions and charges assigned to the worker.
10. Recruitment, visa, residency, medical, and travel costs and their stated payer.
11. Accommodation, food, transport, medical, and travel or return-ticket benefits.
12. Document language, signatures, dates, identifiers, verification references, and referenced annexes or policies.

For each component, record `present`, `absent`, `unclear`, or `unreadable`. A present value carries its original wording, document ID, page, and excerpt. A claimed absence requires sufficiently readable relevant pages. Keep the original text beside normalized values. For money, distinguish basic pay, allowances, total, and charges; retain amount, currency, frequency, and stated payer where relevant. Do not infer a payer or benefit from silence or from a reference to an unseen policy.

The system should check reported passages against the document when technically possible, and visibly flag transcriptions that cannot be independently corroborated, especially for scans. A machine-readable shape is necessary but does not establish that the passage or value is correct. A correction is labelled `user supplied`; it does not become verified source text.

## 6. Findings and report language

| Finding | Required evidence and interpretation |
| --- | --- |
| **Document mismatch** | Two sufficiently readable documents make explicit, materially different statements about the same component. Show both passages and the comparison used. |
| **Source-backed concern** | A document term raises a narrow issue supported by an approved, currently applicable official rule with its verified pinpoint, issuer, scope, actor, conditions, and source-check date. |
| **Missing information** | A material term cannot be found after sufficient review of the relevant readable pages; this does not automatically contradict the other document. |
| **Needs clarification** | A clause is conditional, refers to an unavailable annex/policy, has multiple readings, or depends on facts the documents do not establish. |
| **Unable to determine** | Relevant text, document type, employment regime, rule applicability, or source support cannot be established. |

Categories can coexist. A user correction without corroborating document text may support a labelled *user-reported difference* or question, but cannot alone establish a confirmed document mismatch. International guidance may be shown as guidance and never as binding Pakistan or UAE law. When sources conflict or are superseded, show the uncertainty or withhold the rule claim rather than merge them silently.

Each finding includes its category, relevant field, concise explanation, documentary evidence and pages when applicable, uncertainty or confidence rationale, and a specific question or official next step. Rule concerns additionally include a stable rule ID, official source URL, issuing authority, pinpoint clause/page, jurisdiction, affected actor, effective period where established, and last-checked date. Do not present a numeric certainty percentage without calibration.

Never show a global verdict of “safe,” “legal,” “fraudulent,” or “fully compliant.” Only a completed check with no flagged concern may say **“No concern detected in the fields checked.”** A partial report must identify its incomplete checks and must not use that positive statement as a summary of the whole review.

## 7. Privacy and trust requirements

- Public samples contain fictional people and employers, are visibly marked synthetic, and are not represented as authentic offers or contracts. Public job listings may inform plausible attributes but are not themselves contracts.
- The app does not save worker documents or personal profiles to Sanity, an application database, or ordinary application logs. Process uploads transiently and remove any application-side temporary files after completion or failure.
- The pre-upload notice must say documents are sent to the selected model provider for extraction, explain the provider behavior verified for the deployed account and API path, and avoid promising immediate provider-side deletion or zero retention. Real-document uploads require this review and an appropriate public notice before they are enabled.
- Retrieval queries carry only the topic and applicability information needed to find a rule, not raw clauses, names, document images, or identifiers. Secrets stay on the server.
- Treat instructions inside documents and retrieved content as untrusted data. The model cannot change the finding type, invent evidence, authorize tool use beyond the defined retrieval path, or override application checks.
- Bound upload size, page count, request time, concurrency, and request rate. Publish actual supported limits in the UI and API contract after validation.

## 8. Completion and evaluation

### Release acceptance criteria

- A visitor can open the deployed URL without an account and analyze a bundled synthetic sample; if the upload gate is cleared, the visitor can upload a supported synthetic PDF.
- The core sample paths demonstrate a consistent pair, an explicit salary/benefit change, a worker-charge question backed by an applicable source, a missing/conditional term, and a case requiring abstention.
- Structured extraction covers the 12 scoped groups with field states and reviewable page passages; user corrections retain their attribution.
- Offer/contract mismatches are computed in application code. A single document is never labelled a comparison.
- The deployed agent actually queries the Sanity Knowledge Base through Context MCP. A rule claim passes the separate approved-rule and official-passage gate.
- Out-of-scope, unreadable, failed-retrieval, and superseded-source paths return limited or partial results rather than invented conclusions.
- Uploaded worker material is absent from Sanity, client bundles, source control, and normal logs. The deployed provider-processing notice matches the configuration in use.
- The repository documents data provenance, privacy, evaluation, local setup, and the real deployment. Actual test results are recorded rather than implied by this specification.

### Evaluation corpus and targets

Create **15 labelled synthetic cases**: four consistent pairs, six mismatch pairs, three cases emphasizing costs/deductions or missing terms, and two incomplete, low-quality, multilingual, or adversarial cases. Label extracted fields, seeded issues, applicable rule/source IDs, and expected abstentions. Run the five core demonstration cases in production.

The following are **targets, not achieved measurements**: at least 95% field accuracy on clean digital documents; at least 90% recall for seeded critical mismatches; at least 85% finding precision; 100% of displayed rule-supported findings checked against a genuinely supporting official passage; zero definitive compliance conclusions on abstention cases; and median end-to-end analysis under 45 seconds under normal demo conditions. The earlier plan's 85% scanned/photo accuracy target applies only if that input type is enabled and evaluated. Report denominators, observed counts, and limitations in `TESTING.md`; a small synthetic corpus is not legal validation.

## 9. Release gates and unresolved implementation measurements

| Gate | Required evidence before enabling or claiming support |
| --- | --- |
| Real document uploads | Provider account tier, API state/retention behavior, public notice, upload cleanup, and log review are checked. Otherwise keep the public demo sample-focused. |
| JPG/PNG | Representative photographed and scanned cases pass extraction, passage, and abstention checks; the UI explains quality limits. |
| Urdu explanation | Human review of representative translated findings confirms amounts, negation, conditions, scope, and uncertainty; official quotations remain available. |
| Rule-backed report | MCP tools and a live read work in the deployed service; relevant approved rules, source pinpoints, and dates are verified. |
| Upload and performance limits | File/page caps, memory, timeouts, and concurrency are set from actual tests; provider failures yield accurate partial states. |

Release-gated features are not part of the assured public promise until the corresponding gate passes. ADRs record the selected approach; technical contracts, exact routes, schemas, interface behavior, tests, and deployment commands belong in their respective follow-on documents.
