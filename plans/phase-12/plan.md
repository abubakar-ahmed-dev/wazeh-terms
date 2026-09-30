# Phase 12 — UI/UX Polish & Modern Dark Mode Overhaul

Branch: `phase-12-ui-polish` from `dev` @ `2b81292`. Date: 2026-09-30.

Authority: `docs/FRONTEND_SPECIFICATION.md` (§3/§4 amended), `docs/UI_UX_DESIGN_DIRECTION.md`, `plans/master-plan.md` (Phase 12).
Preserves all API contracts, schemas, HMAC proof verification, capability gating, and privacy guarantees.

## Scope

1. **Design Foundation & Dark Theme:**
   - Deep Obsidian (`#0B0F0E`), elevated card surfaces (`#131917` / `#1A221F`), borders (`#242E2A`), crisp text (`#F3F6F4` / `#9EB0A6`), and warm brass / ochre accents (`#D4A359` / `#E5B869`) with forest emerald (`#2E6F50` / `#68C594`).
   - Self-hosted Fraunces (headings and brand) + Source Sans 3 (body, UI, monospace/numbers).
   - Glassmorphic navigation bar (`backdrop-filter: blur(12px)`), custom modern scrollbars with WebKit fallbacks.
   - Enhanced shared components: `Notice`, `ErrorPanel`, `EvidenceQuote`, `CorrectionQuote`, badges and chips.

2. **Refined Views & User Journey:**
   - **Header & Shell:** Wordmark emblem, navigation tabs (`Home`, `Samples`, `How it works`), multi-step review progress indicator (`1. Choose` → `2. Extract` → `3. Review` → `4. Findings`).
   - **Home:** Centered authoritative Hero, Pakistan → UAE scope pill, dual CTAs, interactive Offer vs Contract mockup, 3-step connected pipeline stepper, 3-card benefit grid, clean scope disclaimer drawer.
   - **Samples:** High-end scenario cards with case badges, scenario tags, document chips, and expandable PDF preview.
   - **Pending States:** Sleek animated spinner with subtle pulsing status message.
   - **Review Workspace:** Top status bar with expiry countdown and "needs your check" counter; dual-pane layout with sticky document viewer on left; collapsible 12 field groups with 3-tier provenance chips (Original, Parsed, Corrected) and inline per-kind editors; responsive mobile drawer with focus restoration.
   - **Findings Dashboard:** Status & coverage overview bar, quick-jump category filter pills with count badges, side-by-side mismatch dual-column comparison boxes, authoritative MOHRE / BEOE source citation blocks with direct links.

3. **Accessibility & Responsive Polish:**
   - WCAG 2.2 AA contrast compliance across all text and control surfaces (minimum 4.5:1 for normal text, 3:1 for UI boundaries).
   - Touch targets ≥ 44 × 44 px.
   - Clear `:focus-visible` styling (`outline: 2px solid var(--primary)` with 2px offset).
   - Responsive breakpoints: mobile (<640px), tablet (640-899px), desktop (≥900px).

## Verification Targets

- `npm run typecheck`: clean across all workspaces.
- `npm run lint`: 0 errors.
- `npm run test`: all existing 279 API tests and web tests pass without regression.
- `npm run build`: production build passes.
- Visual inspection via local e2e-server.
