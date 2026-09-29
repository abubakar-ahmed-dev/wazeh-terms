# WazehTerms — Source Policy, Candidate Register, and Review Procedure

**Status:** Curation policy and candidate inventory; a listed link is **not** an approved runtime rule  
**Route:** Pakistan → UAE mainland private sector, non-domestic workers  
**Related:** `PRD.md`, `ADR.md`, `DATABASE_SCHEMA.md`, `TECHNICAL_ARCHITECTURE.md`, `TESTING.md`

## 1. What this document controls

WazehTerms displays an official-source concern only when an approved, narrowly phrased `rule` points to an exact, applicable passage in an identified `sourceDocument` version. Sanity Context MCP helps **find candidates**; it does not certify that a retrieved summary is current law or that it applies to the user's situation. Document-to-document differences may be reported without asserting a legal breach.

This file supplies the source selection, provenance, approval, and maintenance procedure. The tables below are **research candidates**, not a claim that their passages, amendments, dates, or applicability have been individually approved. The actual approved source/version/rule IDs and review timestamps belong in Sanity and a dated export or catalog committed with the project. Do not claim “20–30 verified rules” until those records exist and have been checked.

## 2. Source classes and claims they can support

| Class | Examples | Allowed wording after review |
| --- | --- | --- |
| **Binding official rule** | Applicable Pakistan legislation/rules or UAE law/executive regulation, including relevant amendments. | A narrow source-backed concern tied to the exact clause, actor, regime, conditions, and effective period. Avoid a global legality verdict. |
| **Official explanatory guidance** | BEOE, MOHRE, or UAE Government process and rights pages. | “The issuing authority's guidance says …” where the page supports that wording. Do not upgrade an explanatory page into a statutory prohibition without the binding source. |
| **International guidance** | ILO principles and IOM checklists. | Clearly labelled good-practice or background explanation. It cannot, by itself, establish a Pakistan/UAE legal requirement. |
| **Public job listing** | BEOE UAE vacancy attributes. | Realistic **synthetic-test provenance only**; a listing is neither a signed offer nor a contract nor a legal rule. |

Prefer the exact binding text and amendment history for a legal proposition. An official explanatory page may clarify practical processes, but if it conflicts with a binding source, an updated version, or another competent authority, **withhold the automated rule claim** and open a `resolutionNote` for review. Do not settle source conflicts by a generic authority score. Keep Pakistan recruitment/protection matters distinct from UAE employer/worker obligations; record the actor and jurisdiction on every rule.

## 3. Candidate source register

All entries below have `candidate` status until an editor downloads or opens the actual content, records a version and pinpoint, checks changes and scope, and approves a Sanity record. A search result, reachable landing page, or URL alone is insufficient. Dates in a webpage footer or a PDF filename are not necessarily the rule's effective date.

### Pakistan: BEOE and emigration process

| Candidate | Official material | Intended use before claim approval | Curation caution |
| --- | --- | --- | --- |
| PK-01 | [BEOE Emigration Rules, 1979 — PDF marked updated 2023](https://beoe.gov.pk/files/legal-framework/Emigration_Rules_1979_Updated_2023.pdf) | Identify relevant Pakistan-side emigration/recruitment provisions. | Determine which amendments actually apply, the exact rule/page, responsible actor, and whether a later official amendment exists. The PDF title alone does not prove current validity. |
| PK-02 | [BEOE Procedure for Overseas Employment](https://beoe.gov.pk/files/legal-framework/procedure-for-overseas-employment.pdf) | Understand official process and the roles of an Overseas Employment Promoter. | It is a procedure document; examine whether a sentence is normative, explanatory, route-specific, or historical before turning it into a rule. |
| PK-03 | [How to Get Emigrant's Protection](https://beoe.gov.pk/how-to-get-emigrants-protection) | Explain a Pakistan-side next step when relevant. | Process guidance, not proof that any uploaded document or recruiter is valid. |
| PK-04 | [BEOE Emigrant Fee Structure](https://beoe.gov.pk/fee-structure-emigrant) | Review named, dated Pakistan-side official charges separately from UAE-side costs. | Record each fee's amount, currency, eligible applicant/route, publication/check date, and whether it changed. No blanket “all worker charges are unlawful” inference. |
| PK-05 | [BEOE FAQs](https://beoe.gov.pk/faqs) | Context and official support links. | Use an exact answer and date as explanatory guidance; prefer primary text for binding claims. |
| PK-06 | [BEOE Direct Emigrant Registration Form](https://beoe.gov.pk/files/forms/direct-emigrant-registration-form.pdf) | Understand fields used in official paperwork. | A blank form is not proof that a person's employment offer or passport is genuine; never import completed personal forms. |

Some BEOE pages and PDFs returned access errors to automated fetches during this planning pass even though official-domain search indexes found them. An editor must obtain and inspect the official file/page manually, record retrieval and checksum if available, and verify the link in a browser before approving a rule. A blocked fetch is **not** a reason to cite a search snippet as a pinpoint.

### UAE: binding texts and official explanations

| Candidate | Official material | Intended use before claim approval | Curation caution |
| --- | --- | --- | --- |
| AE-01 | [MOHRE Laws and Regulations index](https://www.mohre.gov.ae/en/laws-and-regulations/laws.aspx) | Find the authority-hosted current law and amendment files. | Index is a discovery page; record the selected official PDF's exact URL, version, and clauses separately. |
| AE-02 | [Federal Decree-Law No. 33 of 2021 and amendments, MOHRE-hosted PDF candidate](https://www.mohre.gov.ae/assets/download/4d342ff8/Federal%20Decree-Law%20No.%2033%20of%202021%20Regarding%20the%20Regulation%20of%20Employment%20Relationship%20and%20its%20amendments_638990571068264034.pdf.aspx) | Identify directly applicable UAE private-sector provisions. | MOHRE hosts multiple PDF URLs/versions; confirm this edition, every relevant amendment, effective period, translation, scope, and pinpoint. Do not infer that the linked PDF is the latest merely from its name. |
| AE-03 | [Cabinet Resolution No. 1 of 2022 — implementing regulation, MOHRE PDF candidate](https://www.mohre.gov.ae/assets/download/ff353ce9/Cabinet%20Resolution%20_Executive%20Regulations%20Decree-Law%20No.%2033.pdf.aspx) | Identify detailed conditions and exceptions for reviewed topics. | Check later amendments and exact provision before using it with AE-02. |
| AE-04 | [UAE Government: Job offers and the employment process](https://u.ae/en/information-and-services/jobs/employment-in-the-private-sector/job-offers-and-work-permits-and-contracts/expatriates-employment-in-private-sector) | Explain offer/contract sequence and official process. | Official guidance; do not infer offer authenticity from appearance alone. |
| AE-05 | [UAE Government: Employment contract duration and models](https://u.ae/en/information-and-services/jobs/employment-in-the-private-sector/job-offers-and-work-permits-and-contracts/employment-contracts-duration-and-models-in-the-private-sector) | Clarify contract terms and available work arrangements. | Check the page's source law, amendments, and exceptions before a rule claim. |
| AE-06 | [UAE Government: Protection of workers' rights](https://u.ae/en/information-and-services/jobs/employment-in-the-private-sector/labour-rights) | Official context for offer consistency and costs. | A useful concern requires the exact passage and relevant actor, not merely the page title. |
| AE-07 | [MOHRE: Dear Worker — Know Your Rights](https://www.mohre.gov.ae/en/guidance-and-awareness-portal-new/employee-companies/dear-worker-know-your-rights) | Worker-facing official guidance and potential next steps. | Confirm page/file version and distinguish guidance from a cited law article. |
| AE-08 | [UAE Government: Payment of salaries/wages](https://u.ae/en/information-and-services/jobs/employment-in-the-private-sector/payment-of-wages) | Wage-payment background and official escalation link. | A pre-signing wording discrepancy is not proof of a later nonpayment event. |
| AE-09 | [UAE Government: Working hours and overtime](https://u.ae/en/information-and-services/jobs/employment-in-the-private-sector/working-hours) | Compare proposed hours/overtime wording with current official explanation. | Identify the applicable legal clause and any exceptions before an automated source-backed claim. |
| AE-10 | [UAE Government: Tips to avoid labour and visa fraud](https://u.ae/en/information-and-services/visa-and-emirates-id/tips-to-avoid-labour-and-visa-fraud) | User questions and official verification direction. | WazehTerms does not itself detect fraud or validate a company/visa. |

MOHRE and UAE portal content may change, and a landing page may point to revised PDFs. Preserve an exact reviewed source version and periodically compare it with the current official page; do not silently overwrite a prior version in Sanity.

### International material: separately labelled guidance

| Candidate | Publisher material | Permitted use |
| --- | --- | --- |
| INT-01 | [ILO General Principles and Operational Guidelines for Fair Recruitment](https://www.ilo.org/publications/general-principles-and-operational-guidelines-fair-recruitment-and) | Fair recruitment context, including a distinction between good-practice principles and a particular national rule. |
| INT-02 | [IOM Checklist — Employment Contracts](https://publications.iom.int/books/migrant-worker-guidelines-employers-checklist-employment-contracts) | Non-exhaustive checklist for questions about contract completeness. |

Neither INT entry authorizes a Pakistan or UAE illegality finding by itself. The initial inventory contains **18 candidate references** (six Pakistan, ten UAE, two international), which is within the earlier 12–18-source planning range. It does **not** mean 18 sources have been approved or incorporated into a working Knowledge Base.

## 4. Rule and source approval workflow

1. **Choose the issue first.** For the MVP, prioritize offer/contract consistency, distinct salary components, named worker costs and payer, key working terms, and material benefit wording. Stop expansion when the high-value checks can be supported well; 20–30 rules is a planning target, not a quota to fill with weak claims.
2. **Acquire the primary source.** Open or download from the issuing authority; record URL, retrieval time, document title/edition, original language, file digest for stable PDFs, issuing authority, and any amendment. For a changing webpage, record a dated snapshot/version note and review again after changes. Respect authorization and source terms when importing material into Sanity.
3. **Capture a pinpoint.** Record the exact article/section/page and a short passage that directly supports one narrow proposition. Review surrounding definitions, conditions, exceptions, and cross-references. A homepage, search result, KB paraphrase, or source reputation does not substitute for the passage.
4. **Determine applicability.** Document Pakistan or UAE jurisdiction; employer, worker, or recruiter actor; UAE employment regime and worker category where relevant; effective start/end; and how a pre-signing offer or contract is implicated. Do not infer that a future rule will apply from today's page alone.
5. **Classify claim and language.** Mark binding text, official explanation, or international guidance. Draft a claim no stronger than the cited passage; if the source only advises, use guidance wording. Translate explanations separately from official quotations.
6. **Review and publish.** Create the versioned `sourceDocument` and the `rule` revision. A reviewer checks source authenticity, pinpoint, classification, scope, conditions, dates, and wording; mark `approved` and publish only after passing both Studio and programmatic content validation. A draft or merely published record is not automatically eligible.
7. **Build and verify retrieval.** Feed only approved/current material into the KB; apply refresh issues or rebuild when required. Test a known-answer MCP query. Confirm the generated candidate maps back to the same rule revision/source version; otherwise withhold the runtime claim.

`DATABASE_SCHEMA.md` defines stable keys, exact source versions, review metadata, and status fields. In production, the API checks canonical records again. The actual official URL/pinpoint must be displayed in the report alongside when it was checked. A curated version demonstrates what the team reviewed; it is not a promise that every external page remains unchanged between reviews.

## 5. Changes, conflicts, and removal

- **Scheduled check:** Reopen official URLs and check source updates at a cadence appropriate to the topic; recheck immediately when a relevant amendment or broken link is discovered. Record `lastVerifiedAt`; distinguish it from publication and legal effective dates.
- **Changed source:** Create a new `sourceDocument` version for a substantive change, mark the old version superseded, then create and approve a replacement rule revision where needed. During the gap, withhold the affected automated concern.
- **KB lag:** A Knowledge Base refresh can identify issues while still serving old entries. Apply reviewed changes or rebuild as needed, confirm the resulting entries, and run a known-answer query before restoring claims. A generated entry path is not a stable rule ID. See [Sanity Knowledge Base maintenance](https://www.sanity.io/docs/ai/sanity-context-maintain-knowledge-base).
- **Conflict:** Record the opposing source passages, authorities, versions, actor/date/scope distinctions, and chosen editorial treatment in `resolutionNote`. If still unresolved, exclude the rule from automated source-backed findings and offer an official next step.
- **Withdrawn or unverifiable evidence:** Set affected source/rule status accordingly, remove it from the approved KB input, refresh/rebuild, and suppress runtime claims. Keep the historical metadata for traceability.

The server may use a narrowly scoped direct Sanity read to validate a retrieved candidate, but a rule-supported report still requires an actual Sanity Context MCP candidate. The agent's MCP endpoint has **Knowledge Base sources only**. A Sanity dataset can separately feed the Knowledge Base without being attached to that MCP endpoint; see [Sanity retrieval modes](https://www.sanity.io/docs/ai/sanity-context-retrieval-modes).

## 6. Synthetic case provenance

Use [BEOE UAE foreign-job listings](https://beoe.gov.pk/foreign-jobs?country_name=United+Arab+Emirates) only to inform plausible public attributes such as occupation, location, salary, and advertised benefits. Preserve listing URL, permission/listing number when visible, and retrieval date in `test-corpus/source-catalog.csv` (headers-only scaffold as of Phase 07 — the corpus attributes are invented; add listing-informed rows only with recorded provenance). Build fictional, clearly marked offer/contract PDFs; invent worker and employer details rather than copying actual identities. A listing does not prove that an offer is valid, and a fictional case is not an actual worker dispute.

For each `TC-###` case, keep the two files where applicable, `truth.json`, and brief notes identifying the synthetic change, the expected finding or abstention, and any reviewed source/rule ID. Label 15 cases as described in `PRD.md`; count **achieved** accuracy and citation support in `TESTING.md`. Do not use real worker documents found on public sites, in message groups, or through search without separate consent and a defined privacy process.

## 7. Minimum curation gate for the first public report

- At least one reviewed Pakistan reference and one reviewed UAE reference are versioned correctly; sources used by the demo's rule claims have exact supporting passages and approved rule revisions.
- The five demo cases include a direct document mismatch and a separate source-backed concern whose official pinpoint and applicability have been checked. Do not force a rule claim into every case.
- Every displayed source-backed finding has a rule ID/revision, source key/version, official URL, pinpoint, issuing authority, jurisdiction, actor, dates, relevant conditions, and last-check date.
- Superseded, draft, stale, unmappable, or conflict-affected candidates fail closed. A retrieval failure still allows substantiated document-only comparison with an explicit partial-review label.
- The team has verified the current candidate URLs in a browser, including BEOE materials that automated tools could not open, before labelling them approved.
