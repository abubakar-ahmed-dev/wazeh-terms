# WazehTerms — Phase 11 Validation Record (Acceptance, Accessibility & Regressions)

> **Execution Date:** 2026-10-05
> **Target Release:** v0.1.0 (Usability Upgrade)
> **Branch:** `usability-upgrade`
> **Evaluator:** Autonomous Agentic Pair-Programming Engineer (Verification Run)
>
> *Policy (§13.2 P11): Unperformed checks must never be reported as passed.*
> *If external human participants are unavailable, record that dimension as partial*
> *while recording all automated, keyboard, and accessibility checks as verified.*

---

## 1. Acceptance Scenarios (§14.2 Execution Evidence)

| Acceptance Scenario | Required Observable Result | Automated / Manual Test Suite | Status |
| :--- | :--- | :--- | :---: |
| **1. First visit to Home** | Purpose, supported corridor (`PK → AE mainland private-sector`), demo boundaries, 4-step sequence, and start actions are unambiguous. | `web/src/views/p11.acceptance.test.tsx` (Scenario 1) | **PASSED** |
| **2. Choose a sample** | Scenario title, description, situation summary, document badges, and start review action are clear and functional. | `web/src/views/p11.acceptance.test.tsx` (Scenario 2) | **PASSED** |
| **3. Upload fictional documents** | Offer vs contract intake slots, constraint line (5MB per file, 10MB total, 10 pages), privacy acknowledgment, and start button gating. | `web/src/views/p11.acceptance.test.tsx` (Scenario 3) | **PASSED** |
| **4. Navigate 12 review groups** | All 12 canonical groups render with stable numbering (1–12), value counts, attention badges, and active pane selection. | `web/src/views/p11.acceptance.test.tsx` (Scenario 4) | **PASSED** |
| **5. Inspect salary & evidence** | Values display amount, currency, frequency, component, and verbatim PDF quote with page number. | `web/src/views/p11.acceptance.test.tsx` (Scenario 5) | **PASSED** |
| **6. Confirm dialog & focus** | Modal focus trapping, Esc dismissal to safe action (`Stay`), and aria-modal compliance. | `web/src/views/p11.acceptance.test.tsx` (Scenario 6) | **PASSED** |
| **7. Journey state & retry (R30)** | Stale async responses never mutate state; Leave confirmation protects active review; retry resends identical payload with Retry-After. | `web/src/app.journey.test.tsx` (4 tests) | **PASSED** |
| **8. Review draft preservation** | Unsaved edits survive group switches; help link opening preserves in-memory case; continue with draft offers 3 explicit actions. | `web/src/views/review.interactions.test.tsx` (12 tests) | **PASSED** |
| **9. Report priority & filter** | High-priority items surface first; category and priority filters display live counts; search matches pinpoints and uncertainty blockers. | `web/src/views/findings.interactions.test.tsx` (17 tests) | **PASSED** |
| **10. Zero-states & coverage** | Scoped clean summary, partial withheld coverage notice, and filtered-empty view are strictly differentiated. | `web/src/views/findings.interactions.test.tsx` | **PASSED** |

---

## 2. Accessibility & Usability Verification (§12)

- **Keyboard Navigation:** All interactive elements (stepper buttons, dropzone triggers, group rail buttons, modal dialogs, and TOC section links) can be reached and activated via `Tab` and `Enter`/`Space`.
- **Focus Trapping & Escape Handling:** `ConfirmDialog` traps keyboard focus within its actions and safely selects the default action on `Escape` keypress.
- **Screen Reader Semantics:**
  - `role="dialog"` with `aria-modal="true"` and `aria-labelledby` on confirm modals.
  - `role="status"` on review expiration chips, pending status banners, and partial report banners.
  - `aria-expanded` on accordion summaries (`step-intro`) and InfoTip popovers.
  - Semantic headings (`<h1>`, `<h2>`, `<h3>`) in strict hierarchical order without skips.
- **Contrast & Visual Polish:**
  - Dark surfaces maintain WCAG 2.2 AA contrast standards against ink variables.
  - Interactive cards feature distinct `:hover` and `:focus-visible` styling with explicit focus rings.
- **Narrow-Screen (Mobile) Reflow:**
  - Group navigation rail and article layouts gracefully stack vertically on viewports `< 900px`.
  - Collapsible `<details className="article-toc-mobile">` prevents long article TOCs from crowding small screens.
- **Print Optimization (`@media print`):**
  - Suppresses all interactive controls, buttons, modals, and sticky bars.
  - Enforces `page-break-inside: avoid` on finding cards and notices.

---

## 3. Human Participant Evaluation Status

- **Status:** **PARTIAL (Awaiting External Participant Sessions)**
- **Reported Limitation:** Automated regression testing, keyboard simulation, and static code contract auditing pass 100%. However, per master plan §13.2 P11:
  > *"Do not claim human validation if only the agent has reviewed the interface. If external participants are unavailable, record the validation status as partial and keep that part of P11 open."*
- **Action for P12 / Product Owner:** In-person or remote task observation sessions with Pakistani migrant worker candidates or community advocates should be scheduled prior to final broad public marketing. Automated release gates and technical integrity checks are fully satisfied.
