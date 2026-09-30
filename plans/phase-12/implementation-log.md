# Phase 12 — Implementation Log

Branch: `phase-12-ui-polish`
Date: 2026-09-30

## What Changed

1. **Design System & Theme Tokens (`web/src/styles.css`)**:
   - Introduced a distinctive Dark Mode palette: Deep Obsidian (`#0B0F0E`), Slate Surfaces (`#131917` / `#1A221F`), Burnished Brass accents (`#D4A359`), and Forest Emerald indicators (`#2E6F50`).
   - Integrated Fraunces serif display typography with Source Sans 3 body fonts.
   - Styled modern dark scrollbars (`scrollbar-color`, `::-webkit-scrollbar`).
   - Formulated a 4-step workflow stepper, dual-column review workspace, and side-by-side mismatch comparison cards.
   - Suppressed programmatic focus outline on `[tabindex="-1"]:focus` while maintaining accessible `:focus-visible` styles.

2. **Core UI Primitives (`web/src/ui.tsx`)**:
   - Created accessible SVG icons (`DocumentIcon`, notice icons).
   - Upgraded `EvidenceQuote` with origin color badges (emerald for offer, brass for contract).
   - Upgraded `Notice` component with modern card surfaces and distinct category styling.

3. **Application Shell & Guided Journey (`web/src/App.tsx`)**:
   - Added persistent brand emblem ("WazehTerms DEMO") with responsive navigation tabs (`Home`, `Fictional Samples`, `How it works`).
   - Implemented a 4-step progress stepper: `1. Choose Sample` → `2. Extraction` → `3. Verify Terms` → `4. Findings Report`.
   - Polished pending analysis & extraction screens with smooth spinner animations.

4. **Home View (`web/src/views/Home.tsx`)**:
   - Built a centered, authoritative Hero with route badge ("Pakistan → UAE Mainland Private-Sector Job Offers").
   - Added interactive side-by-side Offer vs Contract comparison card mockup illustrating salary discrepancies.
   - Added 3-step pipeline walkthrough cards with numbered badges.
   - Highlighted core guarantees: Deterministic Comparison, Curated Official Rules, Zero-Retention Privacy.
   - Added clear boundary disclaimer ("What this does not check").

5. **Samples View (`web/src/views/Samples.tsx`)**:
   - Organized sample cases into clear scenario cards with scenario badges (`Consistent Terms`, `Salary Discrepancy`, `Worker Recruitment Charge`, `Missing Notice Clause`, `Single Contract / Abstention`).
   - Added document chips and dual actions ("Review this sample" primary CTA, "Preview files" secondary).

6. **Review Workspace (`web/src/views/Review.tsx`)**:
   - Implemented top metadata status bar showing extraction verification and TTL countdown.
   - Dual-pane layout: sticky left-side PDF document viewer with page switcher; right-side accordion field editor with field categories and item counters.
   - Enhanced value editor with inline correction capability and clear distinction between extracted text and user corrections.

7. **Findings Report (`web/src/views/Findings.tsx`)**:
   - Added executive overview card with review status badge (`Complete review` / `Partial review`), scope route, and timestamp.
   - Category navigation pills with finding count badges.
   - Side-by-side dual-pane mismatch cards (`mismatch-box`) contrasting offer wording against contract wording.
   - Authoritative Citation cards with issuing authority badges, verbatim rule pinpoints, and verified external links.
   - Collapsible "What we checked" section with stage grid and coverage breakdown.
   - Official next steps section pointing directly to verified government resources (BEOE, MOHRE).

8. **Test Server Script (`api/scripts/e2e-server.ts`)**:
   - Fixed `corpusDir` resolution to support both project root and dist directories when running via `tsx`.

## Files Affected
- `web/src/styles.css`
- `web/src/ui.tsx`
- `web/src/App.tsx`
- `web/src/views/Home.tsx`
- `web/src/views/Samples.tsx`
- `web/src/views/Review.tsx`
- `web/src/views/Findings.tsx`
- `api/scripts/e2e-server.ts`
- `plans/phase-12/plan.md`
- `plans/phase-12/implementation-log.md`
- `plans/phase-12/testing-log.md`
