# Findings Report UI, Alignment, and Evidence Label Fix

## 1. Description of Issues Identified

From the user-provided screenshot of the Sample Findings Report page (`media_1790781754291.png`), the following issues were identified:

1. **Unconstrained Width & Edge-to-Edge Alignment Failure**:
   - The findings report container in `Findings.tsx` was rendered as `<div className="view__inner" style={{ maxWidth: 'none' }}>` without the standard `<div className="view">` wrapper used by all other app views.
   - On wide desktop screens (1920x1080 and above), the layout stretched to 100% of the viewport width. Elements on the left (e.g. "Your document review", category tabs, buttons) and elements on the right (e.g. "Pakistan → UAE Mainland Private", "Fictional consistent pair" badge, priority chips) were pushed to extreme outer edges, separated by vast empty space.
   - Cards stretched into excessively wide horizontal strips, breaking visual balance and typography readability.

2. **Offer Evidence Mislabeled as "Contract" (Critical Data Presentation Bug)**:
   - In `web/src/ui.tsx`, `EvidenceQuote` extracted the document role by checking:
     ```typescript
     const documentRole = evidence.documentId.includes('offer') ? 'offer' : evidence.documentId.includes('contract') ? 'contract' : 'document';
     ```
   - In WazehTerms architecture, `documentId` is an opaque UUID (e.g. `doc_609ec768...`), so it never includes the substring "offer" or "contract". The role therefore always defaulted to `"document"`.
   - In `web/src/lib/format.ts`, `roleLabel(role)` did `role === 'offer' ? 'Offer' : 'Contract'`, returning `"Contract"` for any role other than `"offer"`.
   - As a result, in the `Different wording: Document reference` mismatch pane, under **OFFER WORDING**, the quote was incorrectly tagged as **"Contract · Page 1 — Text matched to PDF"**!

3. **Missing Space & Collapsed Whitespace in "Suggested question or step"**:
   - In JSX, `<strong>Suggested question or step: </strong><span>{finding.suggestedQuestionOrStep}</span>` collapsed trailing whitespace before `</strong>`, resulting in `Suggested question or step:Ask why...` with no space between the colon and the text.
   - The action box styling was a plain surface box with a thin yellow border.

4. **Grammatical Glitch in Compare Engine Outputs**:
   - In `api/src/compare/compare.ts`, the helper set `where = side === 'both' ? 'either document' : '${side} document'`, and the string template was `"No ${lower} was found in the ${where}."`.
   - For cases where neither document had the term, this produced `"No payment frequency was found in the either document."` ("in the either document" is awkward/ungrammatical English).

5. **Lack of Visual Priority Differentiation & Alignment**:
   - The priority chips ("High Priority", "Medium Priority") used plain styling with no semantic color coding to distinguish urgency.
   - The card header aligned items to baseline rather than center, causing vertical offset between titles and chips.

6. **"What we checked" Accordion Missing Visual Affordance**:
   - `<details className="group">` hid the default webkit marker without supplying a custom chevron, making the accordion look like an unclickable, collapsed static bar.

7. **Disconnected Bottom Actions**:
   - "Review another sample" and "Start over" buttons floated at the bottom-left edge without proper spacing or framing relative to the content.

---

## 2. Solutions Implemented

### A. Layout & View Structure (`web/src/views/Findings.tsx`, `web/src/styles.css`)
- Wrapped `Findings.tsx` inside `<div className="view"><div className="view__inner view__inner--wide findings-view">`.
- Configured `.findings-view` in `styles.css` with `max-width: 68rem` (~1088px) and `margin: 0 auto`, perfectly aligning with the workflow progress bar (`--max-work`) and ensuring optimal reading width.
- Added `<span className="eyebrow">Step 4 of 4: Findings Report</span>` to create continuity with Step 3 (Verification).
- Added `.findings-section` with `scroll-margin-top: 5rem` for smooth in-page category navigation jumps.
- Added a clean bottom action bar `.findings-actions` with top border separation.

### B. Evidence Document Role Resolution (`web/src/lib/format.ts`, `web/src/ui.tsx`, `web/src/views/Findings.tsx`, `web/src/App.tsx`)
- In `web/src/lib/format.ts`: Updated `roleLabel` to return `"Offer"` for offer, `"Contract"` for contract, and fallback to `"Document"` (never defaulting unknown to Contract).
- In `web/src/ui.tsx`: Extended `EvidenceQuote` to accept an explicit `role?: 'offer' | 'contract' | 'document'` prop.
- In `web/src/views/Findings.tsx`:
  - Added optional `issued?: IssuedExtraction | null` prop.
  - Constructed a memoized `documentRoleMap` from `issued.documents` or `report.coverage.documentIds`.
  - In mismatch panes, explicitly passed `role={role}` so offer wording receives `role="offer"` and contract wording receives `role="contract"`.
  - In single-evidence findings, passed `role={documentRoleMap.get(evidence.documentId)}`.
- In `web/src/App.tsx`: Passed `issued={issued}` to `<Findings report={report} issued={issued} ... />`.

### C. Suggested Question Box Styling & Guaranteed Space (`web/src/views/Findings.tsx`, `web/src/styles.css`)
- Guaranteed whitespace after colon using React explicit spacing `<strong>Suggested question or step:</strong>{' '}<span>...</span>`.
- Redesigned `.action-step-box` with:
  - Subtle warm amber background tint (`rgba(212, 163, 89, 0.05)`) and border (`rgba(212, 163, 89, 0.25)`).
  - 4px solid primary accent bar.
  - Dedicated circular prompt/question SVG icon (`.action-step-box__icon`).
  - Flexbox alignment for clean multi-line wrapping.

### D. Grammar Fix in Compare Engine (`api/src/compare/compare.ts`)
- Updated `where = side === 'both' ? 'either document' : 'the ${side} document'`.
- Updated explanation templates to:
  - `"No ${lower} was found in ${where}."` -> Produces: `"No payment frequency was found in either document."`
  - `"The ${lower} wording is unclear or conditional in ${where}."` -> Produces: `"...in either document."`
  - `"Ask why the ${lower} is not stated in ${where}."` -> Produces: `"...is not stated in either document."`

### E. Priority Badges & Card Headers (`web/src/styles.css`, `web/src/views/Findings.tsx`)
- Added `.chip--priority-high` (coral/red background tint with high contrast for urgent risks).
- Added `.chip--priority-medium` (amber tint for differences and omissions).
- Added `.chip--priority-low` (subtle surface background for low importance items).
- Updated `.finding__header` to `align-items: center` for vertical centering of heading and badge.

### F. Interactive Chevron for Accordion (`web/src/views/Findings.tsx`, `web/src/styles.css`)
- Added an SVG chevron inside `<summary className="group__summary">`.
- Configured `.group__chevron` with 90° rotation on `.group[open]` for accessible, obvious accordion interaction.

---

## 3. Files Modified

| File | Changes Made |
|------|-------------|
| `web/src/lib/format.ts` | Fixed `roleLabel` to fallback to `"Document"` instead of `"Contract"`. |
| `web/src/ui.tsx` | Added optional `role` prop to `EvidenceQuote` with graceful fallback. |
| `web/src/views/Findings.tsx` | Wrapped with `.view` and `.findings-view` (max 68rem); added `documentRoleMap`; passed accurate roles to `EvidenceQuote`; ensured space after colon in action box; added prompt icon; added priority chip classes; added accordion chevron; added section headers and bottom action bar. |
| `web/src/App.tsx` | Passed `issued={issued}` state to `<Findings />`. |
| `web/src/styles.css` | Added `.findings-view`, `.findings-section`, `.findings-actions`, `.finding__header`, `.chip--priority-high/medium/low`, `.action-step-box__icon`, and `.group__chevron`. |
| `api/src/compare/compare.ts` | Corrected grammar in compare draft template strings to avoid `"in the either document"`. |

---

## 4. Verification and Testing Logs

### Automated Tests
1. **Web Test Suite**:
   ```
   npm test (web)
   ✓ src/lib/version.test.ts (1 test)
   ✓ src/views/phase11.render.test.tsx (4 tests)
   Test Files: 2 passed (2)
   Tests: 5 passed (5)
   ```

2. **Web Typecheck**:
   ```
   npm run typecheck (web)
   tsc --noEmit -p tsconfig.json -> Exit code 0 (0 errors)
   ```

3. **Web Linter**:
   ```
   npm run lint (web)
   eslint . -> Exit code 0 (0 warnings, 0 errors)
   ```

4. **API Test Suite**:
   ```
   npm test (api)
   Test Files: 51 passed (51)
   Tests: 314 passed (314)
   ```

5. **API Typecheck & Build**:
   ```
   npm run typecheck (api) -> Exit code 0
   npm run build (api) -> Exit code 0
   npm run build (web) -> Exit code 0 (Vite build production bundle generated)
   ```

### Visual Verification
- Conducted full headless Edge CDP browser run on local production server:
  - **TC-001 (Consistent Pair)**: Verified centered container, clean vertical rhythm, prompt icon in suggested questions, priority badges, and accordion chevron.
  - **TC-002 (Mismatch Pair)**: Verified that **Offer wording** correctly renders **"Offer · Page 1 — Text matched to PDF"** with green accent bar, and **Contract wording** correctly renders **"Contract · Page 1 — Text matched to PDF"** with gold accent bar.
  - Verified no text overlapping, no colon truncation, and no navbar glitches.

---

## 5. Resolution Status
**Status: SOLVED**
All visual, alignment, data labeling, grammatical, and spacing issues reported on the Findings page have been resolved and validated across unit, typecheck, lint, and browser rendering tests.
