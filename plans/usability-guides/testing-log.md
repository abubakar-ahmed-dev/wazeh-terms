# Testing log — usability upgrade (branch `usability-upgrade`)

Environment: Windows 10, Node (web workspace), vitest 5 (node + jsdom
per-file), tsc 5.8, eslint 9. All runs `cd web` unless noted.

## P6 validation runs — 2026-10-04

| Check | Command | Result |
| --- | --- | --- |
| Unit + interaction tests | `npx vitest run` | **8 files, 54/54 passed** (registry 11, articles 3, ui 10, review 12, findings 9, journey 4, phase11 render 5) |
| Typecheck | `npx tsc --noEmit` | clean |
| Lint | `npx eslint src` | clean |
| Production build | `npm run build` | ✓ built in 3.65s (js 335.9 kB / 102.5 gzip, css 37.4 kB / 7.4 gzip) |

### What the tests establish (mapped to contracts)

- **Copy law (R29):** no verdict/safety words in registry copy; "safe" only
  inside negations; glossary expiry carries no absolute retention claim.
- **R11:** empty-group messages are state-specific (absent / unresolved /
  mixed) and never promise a report category.
- **R31:** every registry `/help` link resolves to a served full-section
  article; 12 group sections present at depth.
- **R8/R25:** InfoTip — open on click, `aria-describedby` (body-only mode),
  Esc returns focus, Tab closes without focus steal, link-bearing tips are
  labelled non-modal dialogs.
- **R17:** HelpPanel overlays a still-mounted workspace; Review drafts
  survive group switches and help open/close with no dialog.
- **R18:** leave-confirm (full-loss copy) vs three-choice continue dialog
  are separate; save/discard/keep each verified, including commit call + no
  duplicate `onContinue`.
- **R20:** zero-findings three-state — partial never renders the all-clear
  sentence; complete renders the scoped spec sentence; filtered-empty never
  renders either.
- **R22:** corrected card leads with effective value; needs-check count
  excludes corrected fields (counts describe original extraction).
- **R30 (journey):** stale extraction response after leaving pending does
  not hijack the newer journey (exactly one review renders);
  leave-confirm guards header navigation while work exists; retry shows
  Retry-After countdown, is disabled while limited, does not double-submit,
  then succeeds on the SAME review.
- **Issues 10/11/14/17/19/28:** unknown-priority chip suppressed;
  effectiveTo range shown; combined upload limit rendered; absent-category
  line; absent compact cards with not-proof hint.

### Defects found by the tests and fixed in the same pass

1. `startSample`/`handleCustomUpload` `.finally` skipped reset when the
   journey had advanced (abort path) — `busyCaseId` froze and disabled ALL
   sample buttons permanently. Fixed: busy flags clear unconditionally
   (UI truth, not journey data).
2. Late extraction/analysis responses called `navigate()` unconditionally —
   any slow response hijacked whatever view the user had reached (issue 31).
   Fixed with the journey generation counter + abort-aware catch.

### P6 exit gate — browser pass (Playwright, 2026-10-05): CLOSED

Live servers: api :3000 (real Gemini/Sanity config) + web :5173. Two live
sample journeys run (TC-002, TC-012 — 2 extractions + 2 analyses, within the
budgeted provider calls).

| Check | Result |
| --- | --- |
| Full journey (samples → extracting → review → correction → analyzing → report) | ✓ both samples, live API |
| R28 evidence — uncertain evidence / correction editing | ✓ inline validation error shown (role=alert), corrected-card anatomy live (✎ chip, effective value leads, original preserved) — `p6-correction-error.png`, `p6-corrected-card-live.png` |
| R28 evidence — linked help | ✓ in-panel detailed guide renders over an intact workspace — `p6-help-panel.png` |
| R28 evidence — partial report + citation chain | ✓ slim banner with corrected summary wording ("1 finding carries an official-source citation; 2 … withheld"), full citation (authority, pinpoint Article 6(4) quote, in-force + source-checked dates, official link, Source details) — `p6-citation-full.png` |
| R28 evidence — filter reset / filtered-empty | ✓ "0 of 5 findings shown", filtered-empty panel + reset — `p6-filter-empty-live.png` |
| R27 narrow (360px) | ✓ report, banner, citation, mismatch panes wrap cleanly — `p6-report-360-fixed.png`, `p6-citation-360.png` |
| R27 reflow (320-equivalent) | ✓ scrollWidth ≤ viewport (355/338) after fix |
| Keyboard + focus | ✓ amber focus ring visible, logical tab order — `p6-focus-visible.png` |
| beforeunload guard | ✓ fired on real navigation attempt; reload-degraded state verified ("Nothing to review yet") |
| User correction semantics live | ✓ corrected basic salary produced **To clarify** ("Part of this difference comes from your correction"), never a confirmed mismatch |
| Live summary wording | ✓ corrected partial summary served ("…1 finding carries an official-source citation; 2 … withheld…") |

**Defects found by the browser pass and fixed (committed):**

1. **Draft identity truncation (critical)** — `instanceId` contains `:`; the
   composite draft key round-trip truncated it, so saved corrections carried
   a wrong `instanceId` and never matched their field. Fixed: draft entries
   carry their own identity; regression test asserts the full payload
   (`f119446`).
2. **Overlay stacking** — sticky header (z 50) intercepted clicks on the
   help panel's Close button. Fixed: help panel 60, viewer 55, dialogs 70
   (`20fa650`).
3. **Header nav overflow** — nav row forced ~195px horizontal scroll at
   360/320-equivalent. Fixed: wrap at <900px (`20fa650`).
4. `.eyebrow` was still all-caps (P5 §2 violation) — sentence case now.

**Recorded, not blocking:** workflow scenario chip wraps into a tall pill at
360 (cosmetic; P7 polish list). Review screen at 360px validated at CSS
media-query level (chip-strip nav) — not screenshotted because it would have
required a third provider extraction; the report/screens were captured at
both widths instead.

### P6 gate: CLOSED (automated + browser evidence recorded)

## P7 validation runs — 2026-10-05

| Check | Command | Result |
| --- | --- | --- |
| Unit + interaction tests | `npx vitest run` | **9 files, 65/65 passed** (registry 11, articles 5, ui 10, review 12, findings 9, journey 4, phase11 render 4, version 1, p7 workflow 9) |
| Typecheck | `npx tsc --noEmit` | clean |
| Lint | `npx eslint src` | clean |
| Production build | `npm run build` | ✓ built in 3.49s (js 371.1 kB / 112.1 gzip, css 42.0 kB / 8.1 gzip) |

### What the tests establish (mapped to contracts)

- **Home page redesign (P4 §2, plan §8.2):**
  - Renders sample CTA as primary; upload as secondary when `customUploadEnabled` is true.
  - Explains upload is disabled when `customUploadEnabled` is false without dead buttons.
  - Connected 4-step workflow strip renders with links to guide articles (`/help/trying-samples`, `/help/checking-terms`, `/help/reading-findings`).
  - "What this does not check" limits card lists core out-of-scope items with link to `/help/scope-and-privacy`.
- **Help surfaces (P4 §8, plan §7):**
  - `HelpHub` renders Start Here card, all 5 task-first groups (`HELP_HUB_GROUPS`), glossary reference link, and troubleshooting recovery link.
  - `ArticlePage` renders Table of Contents with section anchors, article markdown content, and related guide footer.
  - `GlossaryPage` renders definition list for all 31 terms with deep-link anchors.
- **Troubleshooting & contextual recovery:**
  - App error banners and degraded reload state provide direct links to `/help/troubleshooting`.
  - Upload error notices link to relevant troubleshooting anchors.
- **Copy law (R29):**
  - All 8 articles (U1–U8) verified free of banned verdict/safety words except permitted negations.

## P8 validation runs — 2026-10-05

| Check | Command | Result |
| --- | --- | --- |
| Unit + interaction tests | `npx vitest run` | **9 files, 73/73 passed** (findings 17, review 12, ui 10, p7 workflow 9, registry 11, articles 5, journey 4, phase11 render 4, version 1) |
| Typecheck | `npx tsc --noEmit` | clean |
| Lint | `npx eslint src` | clean |
| Production build | `npm run build` | ✓ built in 2.81s (js 377.1 kB / 113.2 gzip, css 42.8 kB / 8.2 gzip) |

### What the tests establish (mapped to contracts)

- **Priority-first ordering & Start here orientation (P4 §7.1, §7.2):**
  - High-priority items render first across categories; unknown priority chips suppressed.
  - Orientation sentence summarizes high-priority item and category counts.
- **Search, filters, and reset (plan §8.12):**
  - Category & priority filter dropdowns display live counts.
  - Search matches across titles, explanations, field labels, quotes, authority, pinpoints, and uncertainty blockers.
  - Reset restores the original priority-first report view without re-submitting or rerunning analysis.
- **Per-category card anatomy (P4 §7.3):**
  - `document_mismatch`: side-by-side aligned quotes with role, page, provenance; user correction attribution.
  - `source_backed_concern`: 3-block chain with document statement, official pinpoint citation, and uncertainty note.
  - `missing_information`: coverage pointer to `#findings-coverage`.
  - `needs_clarification`: visually primary action step box.
  - `unable_to_determine`: named blocker in uncertainty box.
- **Coverage & withheld reasons (P4 §7.4, plan §8.13):**
  - Human-worded processing stages (Reading documents, Comparing document terms, etc.).
  - Detailed list of withheld official-source candidate concerns with reasons.
- **Official next steps & boundary disclaimers (plan §8.13):**
  - Discloses resources leave WazehTerms and have not examined the user's case.
  - Curated fallback general resources when report has no next steps.
- **Contextual guide links (plan §8.11):**
  - Each finding card provides deep link to the relevant section in `/help/reading-findings` or `/help/evidence-and-sources`.

## Phase 9 — Public Technical Section Test Evidence

### Automated Test Runs
- `web/src/content/technical.test.ts` (6 tests, all passed):
  - Defines exactly 7 technical articles (T1–T7) in sequential order.
  - Guarantees unique, URL-friendly kebab-case section IDs.
  - Verifies table block formatting and matching column counts.
  - Cites exact 2026-10-03 prod2 synthetic benchmark run metrics (53 / 53 fields, 11 / 11 mismatches, 13 / 13 concerns, p50 18.6 seconds, p95 21.5 seconds, n=15).
  - Cites exact 44 published reference records in Sanity Studio content lake.
  - Verifies strict copy-law compliance (zero standalone positive verdict words without negation).
- `web/src/views/p9.technical.test.tsx` (5 tests, all passed):
  - TechnicalHub: renders hero CTA, all T1–T7 articles in reading order, and discovery links to About and Help.
  - TechnicalArticlePage: renders TOC with section scrolling, previous/next article sequential navigation, and final "Back to Technical Hub" on T7.
  - AboutPage: renders mission, 4 core architectural commitments, interactive exploration triggers, and GitHub repository link.
  - Home technical discovery: renders discovery strip and correctly triggers `onOpenTechnical`.
- Monorepo full run:
  - `api`: 55 test files, 347 tests passed.
  - `web`: 11 test files, 84 tests passed.
  - Total: **431 tests passing across 66 test files**.
  - TypeScript check (`npx tsc --noEmit`): 0 errors across monorepo.
  - Lint check (`npm run lint`): 0 errors, 0 warnings.
  - Production build (`npm run build`): clean build in 3.20s.

## Phase 10 — Visuals, Links, and Content Alignment Test Evidence

### Automated Test Runs
- `web/src/content/links.test.ts` (7 tests, all passed):
  - 12 review group keys in `FIELD_GROUPS` match `guides.ts` and `checking-terms` section anchors (`#group-*`).
  - All articles in `HELP_HUB_GROUPS` exist in `ARTICLES`.
  - All served anchors (`servedAnchorSet`) resolve to existing article slugs and sections.
  - All findings report contextual guide links match exact section IDs in `reading-findings` (`document-differences`, `missing-information`, `questions-to-clarify`, `could-not-determine`).
  - Sequential reading order across all 7 technical articles (T1–T7).
  - Strict copy law: verified 0 affirmative verdict assertions across all 8 user guides and 7 technical articles.
- `web/src/views/findings.interactions.test.tsx` (17 tests, all passed):
  - Verified `onOpenHelp` receives `('reading-findings', 'document-differences')` on different wording link click.
- Web client test run (`vitest run`):
  - 12 test files passed, **91 tests passed** (including new `links.test.ts`).
  - Duration: 24.67s.
- TypeScript check (`npx tsc --noEmit`): 0 errors.
- ESLint (`npm run lint`): 0 errors, 0 warnings.
- Production build (`npm run build`): clean build in 3.04s.

## Phase 11 — Acceptance Scenarios & Regressions Test Evidence

### Automated Test Runs
- `web/src/views/p11.acceptance.test.tsx` (6 tests, all passed in 1.19s):
  - Scenario 1 (Home): Title, corridor badge, 4-step workflow sequence, boundaries card, technical architecture discovery button.
  - Scenario 2 (Samples): Scenario cards, descriptions, situation summaries, document badges, and start review trigger.
  - Scenario 3 (Upload): Offer vs contract intake slots, constraint line, privacy acknowledgment, and submit button gating.
  - Scenario 4 (Review Groups): All 12 canonical groups render with stable numbering (1–12), value counts, and active group switching.
  - Scenario 5 (Salary Evidence): Stated amount, currency, frequency, component, and verbatim PDF quote with page number.
  - Scenario 6 (Accessibility): Confirm dialog traps focus inside actions, focuses safe action by default, and dismisses on Escape keypress.
- Web client test run (`vitest run`):
  - 13 test files passed, **97 tests passed**.
  - Duration: 27.15s.
- Monorepo full test run:
  - `api`: 55 test files, 347 tests passed.
  - `web`: 13 test files, 97 tests passed.
  - Total: **444 tests passing across 68 test files**.
  - TypeScript check (`npx tsc --noEmit`): 0 errors across monorepo.
  - Lint check (`npm run lint`): 0 errors, 0 warnings.
  - Production build (`npm run build`): clean build in 3.04s.

## Phase 12 — Release Readiness & Monorepo Build Evidence

### Monorepo Validation Matrix
- **Test Execution Suite:**
  - `npm test --workspace=api`: 55 test files, 347 passed (100% pass rate).
  - `npm test --workspace=web`: 13 test files, 97 passed (100% pass rate).
  - Monorepo total: **444 tests passing across 68 test files**.
- **Type Checking:**
  - `npx tsc --noEmit`: 0 errors across the entire monorepo (`api`, `web`, `sanity-studio`).
- **Code Style & Linting:**
  - `npm run lint`: 0 warnings, 0 errors.
- **Production Asset Compilation:**
  - `npm run build`: Clean production build in 3.04s.
  - Outputs: `web/dist/index.html`, `web/dist/assets/index-*.css` (45.3 KB), `web/dist/assets/index-*.js` (405.8 KB).

### Release Gate Verification Summary
1. **Practical Guidance (U1–U8):** All 8 user guides verified with valid anchor structure, clear task-based headings, and actionable copy.
2. **Help Hub & Glossary:** 5 task-first categories and 31 migration terms completely indexed.
3. **Public Technical Hub (T1–T7) & About:** All 7 architecture transparency articles verified with factual benchmark citations and explicit model boundaries.
4. **Link Integrity & Copy Law:** 0 broken anchors, 100% cross-reference resolution, 0 prohibited affirmative compliance claims.
5. **Print Stylesheet:** Complete `@media print` rules suppress interactive chrome and format high-contrast monochrome documents.
6. **Accessibility:** Focus trap, keyboard escape, ARIA modal semantics verified via automated DOM interaction tests.
7. **Known Disclosures:** Fictional demonstration upload boundary, image-only exclusion, and partial human comprehension gate documented in release record.






