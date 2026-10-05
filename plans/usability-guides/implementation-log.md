# Implementation log — usability upgrade (branch `usability-upgrade`)

Local working log; challenge-neutral. One entry per work session, newest last.

## P1–P5 (planning phases, no product code)

- P1 audit (`audit/p1-baseline.md`): fact sheet (verified/intended/unresolved),
  state inventory, issue register (30 + 31), copy audit, strengths, screenshot
  baseline (owner captures), corrected twice after external review (R2
  arithmetic fix — 44 published records stands; R3 evidence-quality framing).
- P2 architecture (`p2-guidance-architecture.md`): IA (/help, /how-it-works,
  /about), 8+7 article outlines, glossary, contextual rules, state-to-help
  map; corrected for R4 (anchor map normative), R8 (tooltip contract).
- P3 drafts (`drafts/`): U1–U8, glossary, short-variants, technical outlines
  + unresolved-claims table; corrected for R1–R16 (16 findings verified then
  applied — R2 and R5 by code/data inspection, incl. the scan-handling truth
  and the compare.ts coverage facts).
- P4 wireframes (`p4-ux-wireframes.md`): navigator/workspace review, overlay
  viewer, priority-first report, help surfaces, dialogs; corrected for
  R17–R23 (draft hoisting, split dialogs, visible acknowledgment, three
  zero-states, 600–899 layout, corrected-card anatomy, abort-on-leave).
- P5 visual rules (`p5-visual-design.md`): tokens (contrast-audited),
  components, representative-screen plan; corrected for R24–R28 (per-state
  contrast permission rule, InfoTip/HelpPanel split, no compactness caps,
  320px-equivalent reflow, "specification awaiting visual validation" gate).

## P6 — pilot implementation (one complete sample journey)

**Files added**

- `web/src/content/guides.ts` — 51 guide units (12 group tips, legends,
  category intros, dialogs, empty states, pending copy, sample scenario
  tips) + `JOURNEY_STEPS` canon + `emptyGroupTipId` state selector.
- `web/src/content/glossary.ts` — 30 terms.
- `web/src/content/articles.ts` — 4 served pilot articles at full-section
  depth (checking-terms complete incl. all 12 group sections;
  reading-findings; evidence-and-sources; scope-and-privacy#your-data) + anchor set.
- `web/src/content/guides.test.ts` (11) — registry integrity, copy-law
  (verdict-word ban enforced), empty-group state selector (R11), glossary
  retention ban (R10).
- `web/src/content/articles.test.ts` (3) — R31 closure: every registry /help
  link resolves to a served section; group depth ≥2 blocks.
- `web/src/ui.interactions.test.tsx` (10) — InfoTip dual-mode contract
  (R8/R25), HelpPanel non-modal preservation (R17), ConfirmDialog trap +
  safe-action + three-choice (R18).
- `web/src/views/review.interactions.test.tsx` (12) — preservation matrix:
  draft survives group switch + help with no prompt; three-choice continue
  commit/discard; counts describe original extraction (R22); unreadable
  limitation + no control; absent compact card; needs-attention filter;
  empty-group message; navigator numbering; viewer open/close.
- `web/src/views/findings.interactions.test.tsx` (9) — priority-first
  ordering; category filter + live count + reset; search scope + filtered-
  zero (R20); slim banner; absent-category line (issue 17); effectiveTo
  range (issue 11); unknown-priority suppression (issue 10); user-origin
  attribution.
- `web/src/app.journey.test.tsx` (4) — R30: stale-response immunity
  (issue 31); abort-on-leave pending; leave-confirm Stay/Leave (issue 3);
  retry with Retry-After countdown + no duplicate submit (issue 4).

**Files reworked**

- `web/src/ui.tsx` — Icon set (9 SVGs, replaces emoji), GuideLink (new-tab
  labelled), InfoTip (dual-mode: body-only tooltip vs link-bearing non-modal
  dialog), StepIntro, EmptyMessage, HelpPanel, ConfirmDialog (trap +
  safe-action), ArticleBody.
- `web/src/views/Review.tsx` — full P4 §6: navigator rail (12 numbered
  groups, counts, Needs-attention filter), single-group workspace, overlay
  document viewer (focus restore), hoisted correction drafts + unsaved-edit
  pill, three-choice continue dialog, corrected-card anatomy (✎ chip,
  effective value leads, original preserved), absent compact cards,
  unreadable public limitation, empty-group messages, inline editor
  validation (decimal/date), Read-as/As-written labels (issue 27).
- `web/src/views/Findings.tsx` — full P4 §7: priority-first ordering with
  stable ties; search + category/priority filters + reset + live count;
  per-category card anatomy (3px accent + dot, never fills); slim partial
  banner with withheld limitation + coverage anchor; three zero-states
  (R20); absent-category summary; citation effectiveTo range; "Review
  another set of documents" (issue 18); next-steps line (issue 24).
- `web/src/views/Upload.tsx` — R19: processing consequences + both notice
  links (in-app scope-and-privacy + Gemini API terms) + acknowledgment
  always visible beside the action; detail collapses only; capabilities-
  rendered requirements incl. combined total (issue 14); one-document
  helper; fictional-only boundary one line; "Start reading →".
- `web/src/views/Samples.tsx` — issue 19: "Worked examples"; scenario
  badges in plain words + InfoTip each; case ids demoted to preview
  disclosure ("Sample set TC-xxx"); "Sample files" wording.
- `web/src/App.tsx` — journey contract (see testing log): generation
  counter, AbortControllers, retry + Retry-After countdown, 422
  INVALID_CORRECTION → review with notice, leave-confirm + beforeunload,
  4-step workflow bar, /help doc routes + hub-lite, header Help = new tab
  during review, capability-neutral footer + Gemini terms link (issues
  1/6), stale-busy fix (finally clears busyCaseId/busyUpload unconditionally).
- `web/src/styles.css` — appended P5 §1.2 tokens (focus ring, ink-muted
  fix, category accents) + all new component styles; reduced-motion guards.

**Decisions**

- Home 4-step strip = P7 (scope clarification in the P6 review); P6 touches
  App-owned chrome only.
- busy flags are UI truth — cleared regardless of journey generation
  (defect found BY the journey tests: a stale run froze all sample buttons).
- Dev-only deps added: jsdom + @testing-library/react + user-event (no
  runtime deps; justified for the preservation-matrix interaction tests).

**Known gaps (open P6 gate items)**

- Browser/keyboard/mobile pass + R28 rendered-evidence review pending
  (Playwright MCP needs a session restart; fixtures + SSR/interaction tests
  already cover the six states logically).
- 600–899px band with realistic content unverified in a real browser (R21).

## P7 — Complete the workflow and practical help

**Files added**

- `web/src/views/Help.tsx` — Help Hub (`/help`) with "Start here" hero card,
  5 task-first groups (`HELP_HUB_GROUPS`), glossary & troubleshooting links;
  Article reader (`/help/:slug`) with responsive sticky desktop / mobile
  disclosure Table of Contents, hash anchor scrolling, and related guides
  footer; Glossary page (`/help/glossary`) rendering all 31 glossary terms
  with anchor IDs and definitions.
- `web/src/views/p7.workflow.test.tsx` (9 tests) — Home page redesign contract
  tests (prominent sample CTA as primary, upload as secondary when custom upload
  enabled; upload disabled notice; connected 4-step workflow strip; "What this
  does not check" limits card with guide links) + Help surfaces contract tests
  (HelpHub rendering, ArticlePage with TOC and guide footer, Glossary rendering).

**Files reworked**

- `web/src/content/articles.ts` — Completed full 8-article suite (U1
  `getting-started`, U2 `trying-samples`, U3 `uploading-documents`, U4
  `checking-terms`, U5 `reading-findings`, U6 `evidence-and-sources`, U7
  `troubleshooting` with all 11 problem anchors, U8 `scope-and-privacy`
  expanded with 8 full sections); defined `HELP_HUB_GROUPS` (`Start`,
  `Check`, `Understand`, `Recover`, `Boundaries`).
- `web/src/views/Home.tsx` — Full P4 §2 / plan §8.2 redesign: prominent
  primary sample CTA, secondary upload CTA (when enabled), illustrative
  example mockup (emoji-free, "Changed salary" chip), connected 4-step
  workflow strip (1. Choose documents → 2. Read documents → 3. Verify
  terms → 4. Findings report with guide links), capability-aware upload
  availability sub-text, and "What this does not check" limits panel.
- `web/src/views/Upload.tsx` — Connected slot guide and requirements guide
  links to U3 anchors, plus error notice link to U7 troubleshooting.
- `web/src/views/Samples.tsx` — Connected `trying-samples` guide link in
  StepIntro.
- `web/src/App.tsx` — Wired `/help` → `HelpHub`, `/help/glossary` →
  `GlossaryPage`, `/help/:slug` → `ArticlePage`; wired error notices and
  reload degraded notices (`RELOAD_COPY`) to `/help/troubleshooting`; added
  `Help hub` and `Glossary` to footer links.
- `web/src/styles.css` — Replaced legacy `.pipeline-grid`/`.features-grid`
  with `.stepper-strip`, `.stepper-step`, and `.limits-card`; added styles
  for `.help-hub`, `.help-group`, `.help-card`, `.article-layout`,
  `.article-toc-mobile`, `.glossary-dl`, and `.glossary-item`.
- `web/src/content/articles.test.ts` — Expanded tests to verify all 8
  articles exist, non-empty, and resolve with required sections.

**Decisions**

- Copy law strictly maintained across all new articles and UI: verdict words
  ("safe", "compliant", "valid") strictly forbidden; "safe" permitted only in
  negations ("does not mean it is safe to sign").
- Glossary count: 31 terms verified in `glossary.ts` and rendered in
  `GlossaryPage`.
- Troubleshooting anchor map: all 11 problem anchors (`stale-busy`,
  `invalid-correction`, `rate-limited`, `pdf-issues`, `camera-scans`,
  `unclear-text`, `partial-report`, `citation-not-found`, `reload-lost`,
  `wrong-documents`, `no-findings`) mapped and reachable.

## P8 — Complete the findings experience

**Files reworked**

- `web/src/views/Findings.tsx` — Full findings experience per P4 §7 and plan §8.11–§8.13:
  - Added "Start here" orientation summary line (`Start here: X high-priority items across Y categories`).
  - Added finding counts to category and priority `<select>` dropdowns (`All categories (4)`, `All priorities (4)`, `High (2)`, etc.).
  - Expanded search haystacks to include issuing authority, pinpoint label and quote, responsible party, and uncertainty reasons.
  - Implemented category-specific card anatomy per P4 §7.3:
    - `document_mismatch`: two-pane aligned quotes, correction attribution line, suggested question, contextual guide link (`reading-findings#different-wording`).
    - `source_backed_concern`: 3-block chain (document quote, official citation with pinpoint/dates/external link/source details, uncertainty note), suggested question, contextual guide link (`evidence-and-sources`).
    - `missing_information`: coverage pointer to `#findings-coverage`, document quote, suggested question, contextual guide link (`reading-findings#missing-information`).
    - `needs_clarification`: visually primary action step box (`.action-step-box--primary`), document quote, contextual guide link (`reading-findings#needs-clarification`).
    - `unable_to_determine`: named blocker in `.uncertainty-box`, document quote, suggested step, contextual guide link (`reading-findings#unresolved`).
  - Coverage panel `#findings-coverage`: human-worded stage names (`STAGE_LABELS`) and detailed list of withheld candidate concerns with reasons.
  - Official next steps: boundary disclaimer, external link indicator `(leaves WazehTerms) ↗`, and fallback general resources (`GENERAL_OFFICIAL_RESOURCES` — MOHRE, BEOE).
  - Added `onOpenHelp?: (slug: string, section?: string) => void` prop.
- `web/src/App.tsx` — Passed `onOpenHelp` to `Findings` to open relevant help guides and section anchors in a new tab, preserving the report in memory.
- `web/src/styles.css` — Added styles for `.findings-start-here`, `.action-step-box--primary`, `.uncertainty-box`, and `.finding__footer`.
- `web/src/views/findings.interactions.test.tsx` — Scoped partial banner assertion to `.partial-banner`; added 8 new P8 interaction tests (17 total in the file):
  - Start here orientation line.
  - Category & priority filter option counts.
  - Category-specific card anatomies (coverage pointer, primary question, named blocker, aligned mismatch panes, contextual guide links).
  - Extended search across authority, pinpoints, and uncertainty reasons.
  - Human-worded processing stages and withheld candidate concerns in coverage.
  - Official next steps disclaimer and fallback.
  - Contextual guide link clicks invoke `onOpenHelp`.

## P9 — Finalize the public technical section

**Files created / modified**

- `web/src/content/technical.ts` — Authored 7 deep technical transparency articles (T1–T7) conforming to the `Article` schema:
  - T1 (`system-overview`): System overview & architecture (pipeline, 2-step signed contract integrity, explicit responsibility boundaries).
  - T2 (`employment-knowledge-content`): Modeling employment knowledge in Sanity (schemas, authority/source/rule/contractField, published inventory).
  - T3 (`retrieval`): Knowledge Base Context MCP integration (retrieval query, payload filtering, fail-closed live verification).
  - T4 (`from-candidates-to-concerns`): The statutory eligibility gate (6 evaluation stages, candidates vs eligible/withheld concerns, finding survival).
  - T5 (`content-review`): Editorial review and publication lifecycle (provenance, human legal review, statutory amendment & supersession).
  - T6 (`privacy-and-limits`): Privacy architecture and operational limits (transient memory-only processing, zero accounts, rate limits).
  - T7 (`evaluation`): Evaluation, limitations, and demonstration evidence (synthetic 15-case benchmark, verified frozen results, observed boundaries).
- `web/src/views/Technical.tsx` — Implemented three public technical components:
  - `TechnicalHub` (`/how-it-works`): Hero architecture card, sequential reading order list (T1–T7) with summaries, and discovery resource links.
  - `TechnicalArticlePage` (`/how-it-works/:slug`): Eyebrow, breadcrumbs, sticky/collapsible Table of Contents with section scrolling, full `ArticleBody`, and previous/next article footer navigation.
  - `AboutPage` (`/about`): Project mission, 4 architectural commitments (Deterministic comparisons, Curated Sanity Knowledge Base, Zero-retention privacy, No overall verdicts), explore system actions, and GitHub repository link.
- `web/src/App.tsx` — Wired technical and about views into client-side routing:
  - Extended `View` type with `'technical' | 'about'`.
  - Added path parsing for `/how-it-works`, `/how-it-works/:slug`, and `/about`.
  - Updated `navigate()` callback to handle these routes cleanly.
  - Rendered `TechnicalHub`, `TechnicalArticlePage`, and `AboutPage`.
  - Added "How it works" and "About" buttons to the global footer.
- `web/src/views/Home.tsx` — Added subtle engineering discovery strip below limits card linking to `/how-it-works`.
- `web/src/styles.css` — Added styling for `.tech-reading-order`, `.tech-article-list`, `.tech-article-item`, `.tech-article-item__num`, `.about-view`, `.about-grid`, `.about-box`, and `.about-actions-card`.
- `web/src/content/technical.test.ts` — Comprehensive unit test suite for T1–T7 verifying article structure, section IDs, table blocks, frozen benchmark figures (53/53 fields, 11/11 recall, 13/13 precision, 18.6s p50 e2e), 44 published Sanity records, and copy-law compliance.
- `web/src/views/p9.technical.test.tsx` — Interaction test suite verifying TechnicalHub reading order and clicks, TechnicalArticlePage TOC and navigation, AboutPage architectural commitments, and Home discovery link.
- `plans/usability-guides/challenge-evidence-map.md` — Internal criteria-to-evidence matrix mapping submission criteria to verifiable architectural and test evidence.

**Decisions**

- Factual Benchmark Freeze: Cited exact 2026-10-03 prod2 synthetic benchmark run metrics (53/53 fields, 11/11 mismatches, 13/13 concerns, 1/1 citation, 0 abstention violations, p50 18.6s e2e across n=15) and explicit boundaries without overclaiming.
- Copy Law Verification: Verified that none of the technical articles or About views use standalone verdict words ("safe", "compliant", "valid") unless in explicit negations.
- Separation of Concerns: Technical documentation is discoverable from About/footer and Home discovery, but does not clutter worker-facing practical guides (U1–U8).
- Review Memory Preservation: All footer links to `/how-it-works` and `/about` during active reviews open in a new tab (`window.open(..., '_blank', 'noopener')`), guaranteeing the worker's active in-memory review is never unmounted or lost.

## P10 — Capture final visuals and align content

**Files created / modified**

- `web/src/views/Findings.tsx` — Aligned 3 contextual guide anchor targets with exact section IDs in `reading-findings`:
  - `different-wording` → `document-differences` (heading: "Different wording in the two documents").
  - `needs-clarification` → `questions-to-clarify` (heading: "Question to clarify").
  - `unresolved` → `could-not-determine` (heading: "Could not determine").
- `web/src/views/findings.interactions.test.tsx` — Updated interaction assertion to verify `onOpenHelp` is invoked with `reading-findings` and `document-differences`.
- `web/src/content/articles.ts` — Added `figure` block type to `ArticleBlock` union: `{ readonly type: 'figure'; readonly src: string; readonly alt: string; readonly caption: string }`.
- `web/src/ui.tsx` — Added semantic `<figure>` rendering with lazy-loaded `<img>` and `<figcaption>` in `ArticleBlocks`.
- `web/src/styles.css`:
  - Added `.article-figure`, `.article-figure__img`, and `.article-figure__caption` styling.
  - Added full `@media print` print stylesheet: suppresses header, footer, workflow bar, buttons, dialogs, and navigation links; unfolds layout; enforces `page-break-inside: avoid` on cards, findings, and notices; and forces high-contrast monochrome printing.
- `web/src/content/links.test.ts` — Created comprehensive P10 automated link and copy audit test suite:
  - 12 review group keys in `FIELD_GROUPS` match `guides.ts` and `checking-terms` section anchors.
  - All articles in `HELP_HUB_GROUPS` exist in `ARTICLES`.
  - All served anchors (`servedAnchorSet`) resolve to existing article slugs and sections.
  - All findings report contextual guide links match exact section IDs in `reading-findings`.
  - Sequential reading order across all 7 technical articles (T1–T7).
  - Strict copy law: verified 0 affirmative verdict assertions across all 8 user guides and 7 technical articles.
- `plans/usability-guides/screenshot-maintenance-record.md` — Authoritative inventory and maintenance record for 16 visual assets (SHOT-01 through SHOT-16) covering U1–U8, T2, T4, T7, capture states, fictional references, alt text, captions, and replacement triggers.
- `plans/usability-guides/copy-link-audit.md` — Complete audit report verifying action labels, canonical 4-step terminology, 12 review groups alignment, guide deep links, copy-law compliance, statutory references, and print behavior.

**Decisions**

- Anchor Alignment: Fixed 3 drift anchors between `Findings.tsx` and `reading-findings` (`document-differences`, `questions-to-clarify`, `could-not-determine`), ensuring all report contextual links jump directly to their specific explanation without missing anchor fallback.
- Self-Contained Documentation: Maintained the architectural requirement that all instructional text is 100% complete and understandable without requiring image viewing.
- Print Readiness: Provided `@media print` rules so that workers or advocates printing finding reports or articles receive clean, paginated, high-contrast printouts without UI chrome.

## P11 — Validate understanding, accessibility, and regressions

**Files created / modified**

- `web/src/views/p11.acceptance.test.tsx` — Comprehensive acceptance and accessibility test suite executing scenarios from plan §14.2:
  - Scenario 1: First visit to Home (title, corridor scope, 4-step sequence, limits card, technical discovery).
  - Scenario 2: Choose a sample (scenario titles, descriptions, document chips, start review action).
  - Scenario 3: Upload intake and constraints (slots, file size/page limits, privacy acknowledgment, submit button gating).
  - Scenario 4: Navigate 12 review groups (stable numbering 1–12, value count chips, active group switching to Pay).
  - Scenario 5: Inspect a salary with exact evidence (AED 4,000 and AED 3,200 values, frequency, components, page numbers, verbatim excerpts).
  - Scenario 6: Accessibility & Dialog focus trap (aria-modal, focus trapping inside dialog actions, default safe action focus, Esc dismissal).
- `plans/usability-guides/p11-validation-record.md` — Complete validation record documenting all 10 acceptance scenarios, accessibility checks (keyboard, screen reader, contrast, mobile reflow, print), and explicit partial disclosure regarding external human comprehension sessions.
- `plans/usability-guides/release-readiness-checklist.md` — Authoritative pre-release checklist confirming product architecture, guidance suites, test suites, accessibility, and known disclosures.

**Decisions**

- Acceptance Testing Scenarios: Automated all 6 candidate acceptance scenarios from §14.2 using real `@testing-library/react` DOM interactions rather than static string matching.
- Honest Validation Disclosure: Per §13.2 P11, recorded external human participant observation as "PARTIAL" rather than claiming human validation without real human test sessions. All automated, keyboard, and accessibility checks passed 100%.
- Monorepo Verification: Total test count expanded to 444 tests passing across 68 test files across both `api` and `web` workspaces.

## P12 — Release and maintenance handoff

**Files created / modified**

- `plans/usability-guides/p12-release-record.md` — Authoritative release and maintenance record containing:
  - Section 1: Complete delivered scope covering Practical Guidance Suite (U1–U8), Glossary, Technical Hub (T1–T7), About page, and Findings report polish.
  - Section 2: Verified test & build evidence (444 tests passing across 68 test files, 0 type errors, 0 linter errors, clean production bundle).
  - Section 3: Maintenance ownership matrix assigning responsible roles, triggers, and validation commands across 6 operational areas.
  - Section 4: Known disclosures & limitations (fictional demonstration upload boundary, image-only PDF exclusion, UAE mainland scope, and partial human comprehension gate).
  - Section 5: Operational rollback & recovery runbook (Cloud Run traffic update, container rollback, git tag references, Sanity revision history).
  - Section 6: Before / After experience comparison matrix across 9 dimensions.
  - Section 7: Prioritized post-v0.1.0 roadmap (Urdu translations, in-person migrant worker comprehension sessions, OCR intake, visual excerpt highlights, multi-corridor expansion).
- `plans/usability-guides/release-readiness-checklist.md` — Verified sign-off across all 5 pre-release categories.
- `plans/usability-guides/implementation-log.md` — Synchronized complete engineering log from P1 through P12.
- `plans/usability-guides/testing-log.md` — Synchronized comprehensive automated and manual testing logs across all 12 phases.

**Decisions**

- Multi-Domain Maintenance Matrix: Explicitly delineated maintenance responsibilities between Legal Editorial (rules and pinpoints), Core Engineering (review groups & contract fields), Guidance/UX Lead (practical guides U1–U8), System Architect (technical documentation T1–T7), Frontend Lead (screenshots and visual assets), and Release Engineer (link & copy law audits).
- Cloud Run Rollback Runbook: Documented immediate zero-downtime revision reversion via `gcloud run services update-traffic` to ensure fast rollback capability without container rebuilds.
- Sanity Independent Rollback: Leveraged Sanity Studio's native document revision tracking so that any statutory text adjustments do not require a full software redeployment.
- Clear Roadmap Separation: Explicitly separated completed v0.1.0 commitments from future roadmap items (such as Urdu language support and multi-corridor statutory research) to prevent scope confusion.
