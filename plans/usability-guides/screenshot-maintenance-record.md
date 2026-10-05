# WazehTerms — Screenshot Maintenance Record (P10)

> **Purpose:** Authoritative inventory and maintenance schedule for all interface screenshots,
> diagrams, and visual captures across WazehTerms public articles and guidance.
>
> *Policy (§11): Screenshots illustrate stable implemented states using server-allowlisted fictional samples.*
> *Never embed real names, personal documents, private identifiers, credentials, or traces.*
> *Written instructions must remain fully complete and understandable even without images.*

---

## 1. Visual Assets & Screenshot Inventory

| Visual ID | Article & Section | Pictured Interface State | Fictional Case / Source Reference | Capture Date | Release Target | Replacement Triggers | Text Alternative & Caption |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SHOT-01` | `U1#the-four-steps` | Journey overview stepper strip (4 labeled steps: Choose, Read, Verify, Report) | Home view baseline | 2026-10-04 | v0.1.0 | Workflow step names or sequence modified. | Alt: "Four-step review journey: 1. Choose documents, 2. Read documents, 3. Verify terms, 4. Findings report." |
| `SHOT-02` | `U2#choosing-a-scenario` | Fictional sample chooser cards with scenario badges and start buttons | `Samples.tsx` (TC-001, TC-002) | 2026-10-04 | v0.1.0 | Sample metadata or scenario badge designs change. | Alt: "Fictional sample cards with situation summaries, document chips, and Start review action buttons." |
| `SHOT-03` | `U3#offer-vs-contract` | Upload intake slots, document role selector, and size/page constraints | `Upload.tsx` with both slots | 2026-10-04 | v0.1.0 | Allowed file sizes, types, or slot layouts updated. | Alt: "Upload interface showing offer and contract slots with PDF file constraints and remove/replace controls." |
| `SHOT-04` | `U3#processing-and-privacy` | Fictional acknowledgment checkbox and third-party notice area | `Upload.tsx` bottom section | 2026-10-04 | v0.1.0 | Privacy notice version or third-party notice text modified. | Alt: "Upload acknowledgment panel explaining transient memory processing and third-party API notice." |
| `SHOT-05` | `U4#the-workspace` | Review overview showing 12 canonical groups and attention indicators | `Review.tsx` closed group navigator | 2026-10-04 | v0.1.0 | Group titles, group order, or attention counting logic altered. | Alt: "Review screen showing 12 numbered groups with value counts and check-needed indicators." |
| `SHOT-06` | `U4#group-pay` | Expanded Pay group with basic salary, currency, frequency, and PDF excerpt | `Review.tsx` with Pay open + viewer | 2026-10-04 | v0.1.0 | Field layout, evidence quote styling, or viewer layout changes. | Alt: "Expanded Pay group showing AED 3,500 monthly basic salary alongside verbatim page quote." |
| `SHOT-07` | `U4#corrections` | Inline correction editor showing original model extraction vs user edit | `Review.tsx` correction state | 2026-10-04 | v0.1.0 | Correction schema, save/cancel controls, or error handling modified. | Alt: "Correction editor comparing original extracted value with user edit and clear attribution badge." |
| `SHOT-08` | `U4#field-states` | Visual distinction between Unclear, Unreadable, and Absent field chips | `Review.tsx` field status badges | 2026-10-04 | v0.1.0 | Chip palette, state definitions, or field metadata chips changed. | Alt: "Field status indicators distinguishing between unclear wording, unreadable text, and missing terms." |
| `SHOT-09` | `U5#report-anatomy` | Findings report overview with Start here summary, filter row, and counts | `Findings.tsx` (TC-002 report) | 2026-10-04 | v0.1.0 | Filter controls, report hierarchy, or header layout updated. | Alt: "Findings report showing orientation line, category/priority filter controls, and finding cards." |
| `SHOT-10` | `U5#document-differences` | Paired discrepancy card showing offer quote side-by-side with contract quote | `Findings.tsx` document mismatch | 2026-10-04 | v0.1.0 | Card anatomy, quote alignment, or suggested question styling changes. | Alt: "Document mismatch card comparing AED 4,000 offer salary with AED 3,200 contract salary." |
| `SHOT-11` | `U5#citations` | Source-backed concern card with statutory pinpoint, dates, and external link | `Findings.tsx` rule concern | 2026-10-04 | v0.1.0 | Citation card anatomy, statutory metadata, or link behavior altered. | Alt: "Official citation card citing UAE Federal Decree-Law No. 33 Article 9 regarding recruitment fees." |
| `SHOT-12` | `U5#partial-reports` | Partial review banner with named withhold reasons and `#findings-coverage` | `Findings.tsx` partial report state | 2026-10-04 | v0.1.0 | Partial banner copy or coverage breakdown format changes. | Alt: "Partial review notice naming withheld candidate concerns and pointing to coverage details." |
| `SHOT-13` | `U5#zero-findings` | Filtered-empty view with reset action vs verified zero-finding summary | `Findings.tsx` active filter zero | 2026-10-04 | v0.1.0 | Empty state wording, reset button, or zero-finding summary modified. | Alt: "Filtered report view indicating no matches with reset button, distinct from no findings detected." |
| `SHOT-14` | `T2#sanity-schemas` | Diagram of Sanity content lake schemas (authority, source, rule, field) | Sanity Studio data model | 2026-10-05 | v0.1.0 | Studio schema additions, reference relationships, or record counts change. | Alt: "Schema architecture diagram showing relationships between authorities, source enactments, and rules." |
| `SHOT-15` | `T4#evaluation-stages` | Flow diagram of the six-stage statutory eligibility gate | `compare.ts` pipeline logic | 2026-10-05 | v0.1.0 | Eligibility gate criteria or evaluation sequence altered. | Alt: "Flowchart of the six-stage eligibility gate filtering candidate concerns into eligible or withheld." |
| `SHOT-16` | `T7#benchmark-results` | Benchmark performance summary table (precision, recall, p50 latency) | 2026-10-03 prod2 freeze | 2026-10-05 | v0.1.0 | Benchmark re-run, model upgrade, or dataset expansion. | Alt: "Synthetic benchmark table displaying 100% extraction recall, 100% precision, and 18.6s p50 latency." |

---

## 2. Maintenance and Re-capture Protocol

1. **When to update:**
   - Any modification to header navigation, button labels, or field grouping.
   - Any change to category-specific finding card anatomies.
   - Any update to privacy acknowledgment copy or version strings.
   - Any update to official benchmark evaluation results.

2. **Capture standards:**
   - Crop tightly to the functional area discussed in the article section.
   - Optimize assets using modern formats (WebP/PNG) with file sizes kept under 250 KB per asset.
   - Never overlay callouts directly over actionable buttons or verbatim evidence text.
   - Ensure high contrast in both light and dark viewing environments.
   - Verify that all instructional copy remains 100% functional and understandable even if image loading fails.
