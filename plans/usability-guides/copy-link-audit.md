# WazehTerms — Copy, Link, and Integrity Audit Record (P10)

> **Purpose:** Comprehensive verification and audit report covering interface copy, canonical
> terminology, anchor navigation links, print behavior, and copy-law adherence across all
> views, practical guides (U1–U8), and technical documentation (T1–T7).

---

## 1. Action Labels & Canonical Step Terminology Audit

All public surfaces consistently utilize the four-step workflow terminology defined in P4 §1.3:

1. **Step 1: Choose documents**
   - Homepage: "1. Choose documents" (pick a sample or upload fictional PDFs).
   - Samples view: Action buttons labeled `Start review →` and `Preview offer/contract`.
   - Upload view: Submit action labeled `Start review with your PDFs →`.
2. **Step 2: Read documents**
   - Workflow bar: `2. Read documents`.
   - Pending state: Heading "Reading the documents" with honest status ("Your document(s) being read…").
3. **Step 3: Verify terms**
   - Workflow bar: `3. Verify terms`.
   - Review workspace: Step heading "Verify terms", action button `Continue to analysis →`.
4. **Step 4: Findings report**
   - Workflow bar: `4. Findings report`.
   - Findings header: "Findings report" with orientation line ("Start here: X high-priority items across Y categories").

---

## 2. Review Groups (12 Canonical Groups) Alignment Audit

Verified that all 12 review group titles, IDs, and anchor links are 100% synchronized across `FIELD_GROUPS` (`types.ts`), `guides.ts` (`rev.group.*`), and `checking-terms` (`articles.ts`):

| # | Group ID | Display Heading | Tip ID (`guides.ts`) | Deep-Link Anchor Target (`checking-terms`) | Verified |
| :-: | :--- | :--- | :--- | :--- | :-: |
| 1 | `employer` | Employer | `rev.group.employer` | `#group-employer` | ✓ Pass |
| 2 | `occupation` | Occupation | `rev.group.occupation` | `#group-occupation` | ✓ Pass |
| 3 | `location` | Work location | `rev.group.location` | `#group-location` | ✓ Pass |
| 4 | `pay` | Pay | `rev.group.pay` | `#group-pay` | ✓ Pass |
| 5 | `term` | Term | `rev.group.term` | `#group-term` | ✓ Pass |
| 6 | `probation` | Probation | `rev.group.probation` | `#group-probation` | ✓ Pass |
| 7 | `working_time` | Working time | `rev.group.working_time` | `#group-working-time` | ✓ Pass |
| 8 | `ending_terms` | Ending terms | `rev.group.ending_terms` | `#group-ending-terms` | ✓ Pass |
| 9 | `deductions` | Deductions and worker charges | `rev.group.deductions` | `#group-deductions` | ✓ Pass |
| 10 | `recruitment_and_travel_costs` | Recruitment and travel costs | `rev.group.recruitment_and_travel_costs` | `#group-recruitment-travel` | ✓ Pass |
| 11 | `benefits` | Benefits | `rev.group.benefits` | `#group-benefits` | ✓ Pass |
| 12 | `document_details` | Document details | `rev.group.document_details` | `#group-document-details` | ✓ Pass |

---

## 3. Guide & Findings Deep-Link Resolution Audit

Verified that all contextual links and report helper actions resolve to actual existing section anchors:

| Source File / Component | Trigger / Link Label | Destination Route & Anchor | Target Exists & Verified |
| :--- | :--- | :--- | :-: |
| `Findings.tsx` (Mismatch Card) | "How to evaluate different wording →" | `/help/reading-findings#document-differences` | ✓ Pass |
| `Findings.tsx` (Source Concern) | "About official sources and rules →" | `/help/evidence-and-sources` | ✓ Pass |
| `Findings.tsx` (Missing Term Card) | "How missing terms are handled →" | `/help/reading-findings#missing-information` | ✓ Pass |
| `Findings.tsx` (Question Card) | "Clarifying terms with your employer →" | `/help/reading-findings#questions-to-clarify` | ✓ Pass |
| `Findings.tsx` (Uncertain Card) | "Why some checks cannot be determined →" | `/help/reading-findings#could-not-determine` | ✓ Pass |
| `Findings.tsx` (Coverage Panel) | "Check What we checked if pages were unreadable" | `#findings-coverage` | ✓ Pass |
| `Home.tsx` (Workflow Steps) | "Read workflow guide →" | `/help/getting-started` | ✓ Pass |
| `Home.tsx` (Workflow Steps) | "Read checking guide →" | `/help/checking-terms` | ✓ Pass |
| `Home.tsx` (Workflow Steps) | "Read findings guide →" | `/help/reading-findings` | ✓ Pass |
| `Home.tsx` (Limits Card) | "Read the full scope and privacy guide →" | `/help/scope-and-privacy` | ✓ Pass |
| `Home.tsx` (Discovery Strip) | "How WazehTerms works inside →" | `/how-it-works` | ✓ Pass |
| `Upload.tsx` (Intake Slots) | "How offer and contract roles work →" | `/help/uploading-documents#offer-vs-contract` | ✓ Pass |
| `Upload.tsx` (Requirements) | "File requirements and supported formats →" | `/help/uploading-documents#requirements` | ✓ Pass |
| `App.tsx` (Global Footer) | "Help hub" | `/help` | ✓ Pass |
| `App.tsx` (Global Footer) | "Glossary" | `/help/glossary` | ✓ Pass |
| `App.tsx` (Global Footer) | "How it works" | `/how-it-works` | ✓ Pass |
| `App.tsx` (Global Footer) | "About" | `/about` | ✓ Pass |
| `App.tsx` (Global Footer) | "Privacy and scope" | `/help/scope-and-privacy` | ✓ Pass |

---

## 4. Copy-Law & Anti-Verdict Verification

Strict project copy laws dictate that WazehTerms never passes legal judgments or issues overall authenticity or safety verdicts:

- **Prohibited verdict claims:** "fully compliant", "is legally compliant", "guaranteed safe", "contract is valid", "verified authentic".
- **Audit Result:** Automated regex verification across all 8 practical guides (U1–U8) and 7 technical articles (T1–T7) confirmed **0 instances** of affirmative verdict claims.
- **Allowed negations:** Explicit negations are permitted and enforced to educate users on system boundaries (e.g. "does not mean it is safe to sign", "never issues a 'this contract is safe' verdict", "does not verify employer authenticity").

---

## 5. Factual Data & Statutory Baseline Check

- **Statutory references:**
  - UAE Federal Decree-Law No. 33 of 2021 (Regulation of Labor Relations, effective 2 February 2022).
  - Pakistan Emigration Rules 1979 (Rule 15-A regarding recruitment fee prohibitions).
- **Published Knowledge Base inventory:** 44 published reference records in Sanity Studio content lake (2 authorities, 6 source versions, 3 rules, 33 contract field definitions).
- **Verified synthetic benchmark conditions:**
  - 15 synthetic cases.
  - 53 / 53 fields extracted (100%).
  - 11 / 11 mismatches recalled (100%).
  - 13 / 13 concerns verified with precision (100%).
  - 1 / 1 citation supported (100%).
  - 0 abstention violations.
  - Machine latency: p50 18.6s, p95 21.5s.

---

## 6. Layouts, Media & Print Behavior Check

- **Responsive layouts:** Verified desktop, tablet, and mobile views. The navigation drawer and TOC collapsible `<details className="article-toc-mobile">` adapt gracefully to narrow viewports.
- **Print stylesheet (`@media print`):**
  - Suppresses interactive elements (header, footer, buttons, links, modal overlays).
  - Unfolds article layout to full width.
  - Enforces page-break avoidance inside cards, findings, and notices (`page-break-inside: avoid`).
  - Sets clean monochrome contrast on white background for physical paper printouts.
- **Figure blocks:** Structured figure blocks supported in `ArticleBody` with semantic `<figure>`, lazy-loaded `<img>`, and accessible `<figcaption>`.
