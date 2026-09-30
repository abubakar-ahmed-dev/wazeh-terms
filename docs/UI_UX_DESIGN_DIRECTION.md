# WazehTerms — UI/UX design direction for the web app

**Status:** Proposed visual and interaction direction for Phases 11–12  
**Date:** 30 September 2026  
**Scope:** The five-sample, English, PDF-first experience. Personal upload and Urdu remain controlled by live capabilities.

## Decision

Build a **quiet editorial document-review interface**: warm paper, dark botanical ink, restrained clay accents, generous margins, and precise evidence annotation. It should feel like carefully reading two important documents with a helpful guide, rather than using an AI dashboard or a government portal. No gradients, glass panels, translucent layers, decorative chat bubbles, government seals, or colored legal-risk scores.

Keep `docs/FRONTEND_SPECIFICATION.md` authoritative for product behavior, API mapping, copy invariants, privacy, and recovery. The proposal below changes its §3 visual palette and typography. Incorporate those changes into §3 and the applicable §4 screen descriptions **before UI implementation**; do not silently override the existing deep-teal token table. The attached `WazehTerms-Project-Scope-and-Data-Plan.md` contains older upload/image and deadline assumptions; use the current `master-plan.md` and frontend specification for this phase.

## The design system

| Role | Token | Use |
| --- | --- | --- |
| Canvas | `#F5F1E8` | Warm paper background. |
| Main surface | `#FFFEFA` | Reading and editing areas; solid fill. |
| Main ink | `#24362E` | Body text, headings. |
| Secondary ink | `#34473D` | Supporting text and metadata; avoid low-opacity text. |
| Primary action | `#254D3A` | Buttons, links, selected controls with white text. |
| Warm accent | `#A54C2A` | Small chapter markers, rules, and important callouts; white text works on this fill. Use sparingly. |
| Rule / divider | `#D8D7C9` | Borders and page separators; test non-text contrast wherever a border conveys control boundaries. |
| Source note | `#E6EDE1` with `#234534` | Labelled official-source details, never an implied government endorsement. |
| Incomplete note | `#F7E9C8` with `#574112` | Partial result, uncertain transcription, or omitted checks. |
| Error note | `#FFF0ED` with `#A13B31` | Validation and technical failures only. |
| Focus | `#A54C2A` outer ring with light separation | Clearly visible keyboard focus on every surface; adjust after rendered inspection. |

Calculated contrast for proposed main pairs: main ink/canvas **11.34:1**; secondary ink/canvas **8.81:1**; white/primary **9.54:1**; white/accent **5.73:1**; source note **8.91:1**; incomplete note **8.04:1**. These are color-pair calculations, **not** an accessibility certification. Recheck actual CSS combinations, focus outlines, input borders, hover and disabled states in the browser.

**Type:** self-host **Fraunces** for the wordmark and large page headings only, using a restrained weight/style; self-host **Source Sans 3** for navigation, buttons, forms, evidence, and long reading. Font fallbacks: `Georgia, serif` and `system-ui, sans-serif`. Avoid serif body paragraphs, ornamental italics, all-caps blocks, and tiny legal footnotes. Start at 16–18 px body with 1.5–1.6 line height; use approximately 40–52 px desktop and 32–38 px mobile for the home heading, and a smaller scale for work screens. Keep paragraphs to roughly 60–75 characters per line. If Urdu is enabled in a later phase, choose and test a suitable Urdu font and right-to-left layout separately; Fraunces does not make the English design multilingual by itself.

**Geometry:** 8 px spacing rhythm (with 4/12 px exceptions), 12 px card radius, 1 px solid dividers, almost no shadow. Max reading width about 720 px; overall work area about 1160–1200 px. Use whitespace and typographic hierarchy before adding another box. An original document excerpt can have a slim vertical rule and page label, like a margin annotation. That cue must also have explicit text such as **Offer · Page 2**.

## One screen, one main question

| Screen | Main question and first view | Details disclosed when useful |
| --- | --- | --- |
| Home | “What does this help me review?” Short promise, supported Pakistan → UAE route, **Try a sample review**, and a small fictional offer/contract illustration. | Three-step explanation, limitations, privacy/provider and sources links below the first view. State that personal upload is unavailable in sample-only mode as ordinary text. |
| Examples | “Which fictional situation should I try?” Five descriptive cards with the document roles and one plain sentence each. | Preview links and what each case demonstrates. Do not disclose the expected answer before the review. |
| Extraction pending | “Is the request still running?” One honest **Reading the documents** state and a real retry/recovery action on failure. | No percentages or fictitious page counters. |
| Review | “Did we read my documents correctly?” Show role, page, coverage, and **Needs your check** count, then 12 named groups. | All 33 active components remain reachable under groups; open only the first relevant group by default. Each component exposes its raw wording, evidence quality, and typed value; **Correct value** reveals the editor while preserving the original. |
| Analysis pending | “Are the reviewed terms being checked?” One honest pending state. | No pretend live source stages. |
| Findings | “What should I inspect or ask?” Heading, complete/partial status, and omissions near the top; then actual finding categories and the first actionable item. | Evidence pairs, official citation details, coverage, and next steps remain easy to open. Never show a risk score or universal all-clear. |

The visual hierarchy on the home page should be: **promise → sample action → fictional/scope qualifier**. Do not put every legal limitation into the hero. Link to a clear limits section below. Research on progressive disclosure supports revealing secondary options when they become relevant, while public-service check-answer patterns support an explicit review step before committing an interpretation.

## Two screens that determine usability

### Review

- Desktop: original document and fields side by side around 55/45, with a clear **Offer / Contract** switch only for supplied roles. The selected field's **View page** control navigates to the one-based page. If a verified text highlight cannot be located, open the page and keep the quoted excerpt alongside the field.
- Put the count of **unclear or unreadable** items near the top, not a fabricated completion percentage. Within each group, prioritize fields requiring attention while allowing the user to browse every component and repeated allowance/deduction instance.
- Distinguish three layers visually and in text: **Original wording**, **What we read**, and **Your correction**. A correction uses a separate accent edge and “Used for analysis” label; it never replaces or impersonates a page quote.
- Small screen or high zoom: field list comes first. **View document page** opens a full-screen panel with a visible return control, focus restoration, and the current field retained. Avoid side-by-side miniature PDF panes.

### Findings

- A partial result begins with **Partial review** and a short statement of which checks did not finish. It does not need a huge warning banner or a false empty state.
- Group actual items by the five API categories in the specified order. For a mismatch, present **Offer wording** and **Contract wording**, each with page and document role, then the concrete question to ask. On mobile these stack in reading order.
- For a source-backed concern, distinguish the document passage from the **Official rule** or **Official guidance**. Show issuer, pinpoint, date, and direct official link in the main card; hide only secondary source-version metadata behind **Source details**.
- For no finding, use the exact conditional language allowed by the API/spec. A partial report or an unreadable/unknown scope state never becomes a green approval screen. Keep **What we checked** available for coverage and omissions.

## Accessibility and interaction acceptance

- Aim for WCAG 2.2 AA: check text and control contrast, visible and unobscured focus, target size, semantic labels, status announcements, and reflow at an equivalent 320 CSS px width. Make primary touch controls roughly 44 × 44 CSS px. A PDF page may require its own zoom/pan, while the surrounding workflow must reflow.
- Use real buttons and links, one `h1` per view, helpful inline errors plus a focused error summary on submit. Show a recovery action for unavailable capabilities, failed extraction, expired review, and partial analysis.
- On view change, move focus to the new heading or blocking error. On closing mobile preview, restore focus to the triggering control. Announce request completion once; do not announce every spinner cycle.
- Use browser memory for private case data. No saved history, analytics excerpts, query-string proof, auto-sharing, or upload affordance while the flag is closed.
- Validate at desktop, a narrow phone width, keyboard only, and 200%/400% zoom; use axe as a smoke check and human inspection for reading order and truthful language.

## Fast implementation sequence

1. **Before coding UI:** amend `docs/FRONTEND_SPECIFICATION.md` §3 with the chosen tokens and type, and adjust §4 only where the screen hierarchy above adds clarity. In `plans/master-plan.md`, make tokens, typography, responsive review, and essential focus/reflow part of **Phase 11**. Keep **Phase 12** for visual refinement and a full accessibility pass. The signed two-step API and capability gates remain as specified.
2. **Build a tiny visual foundation:** CSS variables, self-hosted fonts, page shell, button/link/input states, notice, document excerpt, and card. Render a simple home plus one sample card and one representative review component before building all screens. Inspect at phone and desktop width immediately.
3. **Implement the real flow:** capability-aware home and examples → extraction → grouped review/corrections → analysis → findings. Use actual API shapes and five manifest cases. Reuse the same evidence, citation, and state components rather than hand-designing every case.
4. **Protect time for verification:** run the five-sample Playwright journey, one partial result, expiry recovery, keyboard navigation, axe, and a narrow/zoomed layout pass. Fix misleading claims and blocked actions ahead of decorative details.

**Cut if time is tight:** animated illustration, custom icon set, resizable split pane, elaborate highlights, motion, extra landing sections. **Do not cut:** evidence labels, correction provenance, partial-result disclosure, capability gate, mobile page access, keyboard recovery, readable contrast.

## Basis for the interaction choices

- [Nielsen Norman Group: Progressive Disclosure](https://www.nngroup.com/videos/progressive-disclosure/) and [reducing cognitive load in forms](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/): defer secondary detail while keeping the next task visible.
- [GOV.UK Design System: Check answers](https://design-system.service.gov.uk/patterns/check-answers/) and [validation](https://design-system.service.gov.uk/patterns/validation/): give people an explicit chance to correct interpretations and clear recovery from errors.
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/): contrast, focus, target size, status messages, and reflow criteria.
- [Fraunces typeface project](https://github.com/undercasetype/Fraunces) and [Source Sans 3](https://fonts.google.com/specimen/Source%2BSans%2B3): expressive display type paired with a UI-oriented reading face.
