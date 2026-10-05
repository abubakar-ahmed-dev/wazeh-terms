# WazehTerms — Phase 12 Release & Maintenance Record

> **Release Version:** v0.1.0 (Usability Upgrade)
> **Target Branch:** `usability-upgrade`
> **Release Candidate Build Date:** 2026-10-05
> **Topology:** Monorepo (`api` + `web`), single-origin Cloud Run container

---

## 1. Release Scope & Delivered Artifacts

This release completes the comprehensive Usability Upgrade planned in `WazehTerms-Usability-Guidance-and-UI-UX-Plan.md`, transitioning WazehTerms from an early functional prototype to a transparent, resilient, and fully documented employment document review system.

### A. Practical Guidance Suite (U1–U8) & Help Hub
- **Help Hub (`/help`):** Task-first organized index across 5 logical clusters (`Start`, `Check`, `Understand`, `Recover`, `Boundaries`).
- **Article Reader (`/help/:slug`):** Responsive reading layout with sticky/collapsible Table of Contents, anchor scrolling, and related guide navigation.
- **8 Practical Guides:**
  1. `getting-started`: Understand your offer before signing; 4-step sequence; corridor boundaries.
  2. `trying-samples`: How to evaluate scenarios, previews, and live extraction.
  3. `uploading-documents`: Requirements (PDF only, 5MB/10MB, 10 pages), offer vs contract roles, and privacy notice.
  4. `checking-terms`: The 12 canonical review groups, field states, and correction mechanics.
  5. `reading-findings`: Report anatomy, priority-first reading order, category cards, and zero-finding distinction.
  6. `evidence-and-sources`: Verbatim PDF quotes, statutory citations, in-force dates, and pinpoints.
  7. `troubleshooting`: Comprehensive recovery guide for 11 specific error and pending situations.
  8. `scope-and-privacy`: Transient memory-only processing, third-party provider terms, and legal boundaries.
- **Glossary (`/help/glossary`):** 31 migration, contract, and labor law terms defined with anchor navigation.

### B. Public Technical Hub (T1–T7) & About
- **Technical Hub (`/how-it-works`):** Architectural overview and sequential reading order (T1–T7) for evaluators, recruiters, and engineers.
- **7 Technical Transparency Articles:**
  1. `system-overview`: Pipeline walk-through, two-step signed contract integrity, and system responsibility boundaries.
  2. `employment-knowledge-content`: Modeling labor law as versioned Sanity schemas (`authority`, `sourceDocument`, `rule`, `contractFieldDefinition`).
  3. `retrieval`: Sanity Knowledge Base Context MCP integration, query filtering, and fail-closed live verification.
  4. `from-candidates-to-concerns`: The six-stage statutory eligibility gate, candidates vs eligible/withheld concerns.
  5. `content-review`: Audited editorial review lifecycle, human legal sign-off, and statutory amendment supersession.
  6. `privacy-and-limits`: Transient memory-only processing, zero database storage for worker files, zero accounts.
  7. `evaluation`: 15-case synthetic benchmark results (100% precision & recall, p50 18.6s e2e machine time) and current limits.
- **About Page (`/about`):** Mission statement, 4 core architectural commitments, repository links, and exploration actions.

### C. Workflow & Findings Polish (P7 & P8)
- **Home View:** Connected 4-step stepper strip, illustrative comparison mockup, and unified limits card.
- **Findings Report:** Start here orientation line, live category and priority filter counts, category-specific card anatomies per P4 §7.3, human-worded processing stages, withheld concerns disclosure, and official next steps disclaimer with MOHRE/BEOE fallback.
- **Review Workspace:** 12 canonical groups with stable numbering, draft persistence across group switches and help opening, and overlay PDF document viewer.
- **Print Stylesheet (`@media print`):** Suppresses interactive UI chrome; formats high-contrast monochrome paginated printouts.

---

## 2. Verified Test & Build Evidence

- **Unit, Interaction & Acceptance Tests:**
  - `api`: 55 test files, 347 tests passing (100%).
  - `web`: 13 test files, 97 tests passing (100%).
  - Total: **444 tests passing across 68 test files**.
- **Type Safety (`tsc --noEmit`):** 0 errors across entire monorepo (`api`, `web`, `sanity-studio`).
- **Code Style (`eslint`):** 0 warnings, 0 errors.
- **Production Build:** Vite bundle built in 3.04s (`dist/index.html`, 45 KB CSS, 405 KB JS).

---

## 3. Maintenance Ownership & Change Procedures

| Component / Asset | Responsible Maintainer | Update Triggers | Verification Command |
| :--- | :--- | :--- | :--- |
| **Statutory Rules & Pinpoints** | Legal Editorial / Lead | UAE Federal Decree-Law No. 33 or Pakistan Emigration Rules amendments | `npm test --workspace=api` |
| **Review Group Definitions** | Core Engineering | Addition/modification of the 33 canonical contract field keys | `npm test --workspace=web` |
| **Practical Guides (U1–U8)** | Guidance / UX Lead | Changes to workflow steps, upload constraints, or review mechanics | `npx vitest run src/content/` |
| **Technical Articles (T1–T7)** | System Architect | Pipeline architecture modifications, Context MCP updates, benchmark re-runs | `npx vitest run src/content/technical.test.ts` |
| **Visuals & Screenshots** | Frontend Lead | Interface restyling, navigation label updates, card anatomy redesigns | Check against `screenshot-maintenance-record.md` |
| **Broken Link & Copy Audit** | Release Engineer | Pre-deployment gate for all releases | `npx vitest run src/content/links.test.ts` |

---

## 4. Known Disclosures & Limitations

1. **Demonstration Upload Boundary:** Real PDF upload is currently restricted to fictional, non-sensitive documents. Personal real documents remain excluded until a paid provider pathway with formal tenant retention guarantees is implemented.
2. **Document Format Limitation:** Scanned camera images and image-only PDFs without digital text layers are not supported.
3. **Corridor Limitation:** Applies strictly to UAE mainland private-sector employment. Free zones, domestic workers, and other GCC countries are outside current statutory scope.
4. **Human Observation Status:** External comprehension observation is logged as **PARTIAL** in `p11-validation-record.md` pending field testing sessions with Pakistani migrant workers.

---

## 5. Rollback & Recovery Runbook

In the event of an operational anomaly, broken statutory rule, or unexpected regression post-deployment to Cloud Run:

1. **Immediate Traffic Reversion (Fast Rollback):**
   ```bash
   # Revert Cloud Run traffic immediately to previous known stable revision
   gcloud run services update-traffic wazeh-terms \
     --to-revisions=PREVIOUS_REVISION_NAME=100 \
     --region=me-central1
   ```
2. **Container Build Rollback:**
   - If deploying via container image tags, re-deploy the previous tag sha:
     `gcloud run deploy wazeh-terms --image=IMAGE_REPO@PREVIOUS_STABLE_SHA`
3. **Git Tag Reference:**
   - Stable baseline commit prior to P7–P12 usability upgrade: `44eaee9` (feat: core verification and comparison pipeline).
   - Usability upgrade release candidate commit: HEAD of `usability-upgrade`.
4. **Sanity Content Rollback:**
   - Sanity Studio records maintain internal document revision histories. Any corrupted or misstated statutory rule or pinpoint in the `rules` or `sourceDocuments` dataset can be reverted to its previous approved revision in Sanity Studio without code redeployment.

---

## 6. Before / After Experience Summary

| Dimension | Before Usability Upgrade (Baseline) | After Usability Upgrade (Candidate v0.1.0) |
| :--- | :--- | :--- |
| **Workflow Guidance** | Bare two-slot file picker with minimal context | Stepper strip (1–4), illustrative sample cards, corridor guidance, constraints |
| **User Guidance** | No documentation or help system | Help Hub (`/help`), 8 comprehensive guides (U1–U8), 31-term glossary |
| **Technical Transparency** | No public engineering or legal architecture explanation | Technical Hub (`/how-it-works`), 7 deep architecture articles (T1–T7), `/about` |
| **Term Checking** | Unstructured field list | 12 canonical groups with stable numbering, value badges, draft preservation |
| **Findings Report** | Basic card list with raw provider text | Priority-first ordering, category anatomies, human stages, fallback next steps |
| **Copy & Verdict Compliance** | Ad-hoc messages | Strict copy-law compliance (zero affirmative verdicts, zero "guaranteed safe") |
| **Error Handling** | Generic alert boxes | Inline contextual error cards with actionable remediation and recovery links |
| **Accessibility & Print** | Default browser styles, unstyled print | Focus-trapped dialogs, ARIA labels, semantic figures, dedicated `@media print` |
| **Test Verification** | 55 API test files (347 tests) | 68 test files (444 tests: 347 API + 97 Web), 100% pass rate |

---

## 7. Prioritized Remaining Improvements (Post-v0.1.0)

These items represent future enhancements beyond the agreed v0.1.0 usability upgrade scope:

1. **Urdu Language Explanations (P0 Next Priority):**
   - Provide Urdu translations for all 8 practical guides (U1–U8) and key UI navigation labels to enhance accessibility for workers with limited English literacy.
2. **Field-Based Worker Comprehension Testing (P0 Validation Gate):**
   - Conduct in-person comprehension interviews with 5 Pakistani jobseekers evaluating findings clarity, salary evidence verification, and action confidence.
3. **OCR for Scanned Document Intake (P1):**
   - Add pre-processing pipeline for high-resolution document scans and photos of printed employment offers.
4. **Interactive Document Excerpt Highlighting (P2):**
   - When inspecting a finding, highlight the exact corresponding bounding box or page region in the embedded PDF document viewer.
5. **Multi-Corridor Expansion (P3):**
   - Expand beyond UAE mainland private sector to include domestic worker contracts and key Free Zones (e.g., DIFC, ADGM, DMCC) with their respective statutory authorities.

