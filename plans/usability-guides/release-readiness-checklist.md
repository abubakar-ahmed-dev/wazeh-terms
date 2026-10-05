# WazehTerms — Release-Readiness Checklist (P11)

> **Release Target:** v0.1.0 (Usability Upgrade)
> **Branch:** `usability-upgrade`
> **Verified Baseline:** 2026-10-05

---

## 1. Product & Architecture Release Gates

- [x] **Zero-Retention Privacy:** No database storage for worker documents; reviews live exclusively in transient browser and server memory.
- [x] **No User Accounts:** No login, registration, or session tracking required to use the system.
- [x] **Deterministic Comparisons:** Salary differences, probation days, and duration calculations execute in audited TypeScript; language models are strictly confined to initial OCR/text extraction.
- [x] **HMAC Contract Integrity:** Two-step API contract: `POST /api/v1/extractions` returns signed `IssuedExtractionV1`, and `POST /api/v1/analyses` accepts that unchanged payload + proof + user deltas.
- [x] **Sanity Knowledge Base Integration:** Curated reference schemas with 44 published records; fail-closed Context MCP integration.
- [x] **Six-Stage Eligibility Gating:** Statutory rules must satisfy Authority, Jurisdiction, Temporal Validity, Worker Applicability, Document Statement Match, and Threshold Comparison.

---

## 2. Guidance & Usability Release Gates

- [x] **Four-Step Workflow Strip:** Home page, review screens, and pending states share uniform terminology:
  `1. Choose documents → 2. Read documents → 3. Verify terms → 4. Findings report`.
- [x] **Unified Limits & Boundaries Panel:** Prominently explains single corridor (`PK → AE mainland private`), non-domestic scope, and lack of employer verification or legal advice.
- [x] **Complete Practical Guides Suite (U1–U8):**
  - U1: Getting started (`getting-started`)
  - U2: Trying samples (`trying-samples`)
  - U3: Uploading documents (`uploading-documents`)
  - U4: Checking terms (`checking-terms`)
  - U5: Reading findings (`reading-findings`)
  - U6: Evidence and sources (`evidence-and-sources`)
  - U7: Troubleshooting (`troubleshooting`)
  - U8: Scope and privacy (`scope-and-privacy`)
- [x] **Comprehensive Glossary:** 31 labor migration and contract terms defined at `/help/glossary`.
- [x] **Public Technical Hub (T1–T7):**
  - T1: System overview & architecture (`/how-it-works/system-overview`)
  - T2: Modeling employment knowledge (`/how-it-works/employment-knowledge-content`)
  - T3: Retrieval via Context MCP (`/how-it-works/retrieval`)
  - T4: Candidates to concerns gate (`/how-it-works/from-candidates-to-concerns`)
  - T5: Editorial lifecycle & review (`/how-it-works/content-review`)
  - T6: Privacy & operational limits (`/how-it-works/privacy-and-limits`)
  - T7: Evaluation & benchmark evidence (`/how-it-works/evaluation`)
- [x] **In-Memory State Preservation:** All guide links and footer buttons clicked during an active review open in a new tab (`window.open(..., '_blank', 'noopener')`), preventing loss of in-progress case data.
- [x] **Draft Resilience (Review Screen):** Edits survive group switching and help panel opening without confirmation dialogs.
- [x] **Strict Copy Law:** 0 affirmative verdict assertions ("safe", "compliant", "valid") anywhere across the product.

---

## 3. Automated Validation & Quality Gates

- [x] **TypeScript Type Safety:** `npx tsc --noEmit` exits with 0 errors across both `api` and `web` workspaces.
- [x] **Code Style & Linting:** `npm run lint` passes with 0 errors and 0 warnings.
- [x] **Production Bundle Build:** `npm run build` succeeds cleanly in < 3.5s with optimized chunks.
- [x] **Test Suite Coverage:**
  - `api`: 55 test files, 347 tests passing.
  - `web`: 12 test files, 97 tests passing (including P11 acceptance suite).
  - Total: **444 tests passing across 67 test files**.
- [x] **Link & Anchor Integrity:** `web/src/content/links.test.ts` validates that 100% of internal links, group anchors, and guide shortcuts resolve to live content.
- [x] **Print Stylesheet (`@media print`):** Tested and verified for clean document and report printing.
- [x] **WCAG 2.2 AA Accessibility Checks:** Semantic markup, keyboard navigation, focus trapping in dialogs, and contrast validated.

---

## 4. Known Disclosures & Staged Release Conditions

- **Human Comprehension Observation:** Marked as **PARTIAL** pending formal in-person task observation with migrant worker candidates (recorded in `p11-validation-record.md`).
- **Scanned Document Limitation:** Scanned image-only PDFs remain unsupported and require digital selectable text (honestly disclosed across UI and guides).
- **Corridor Boundary:** Rules apply strictly to UAE mainland private-sector non-domestic employment; free zones and domestic work are explicitly disclosed as outside statutory scope.
