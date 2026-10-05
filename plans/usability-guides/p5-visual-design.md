# P5 — Visual design rules (WazehTerms usability upgrade)

**Status:** Specification awaiting visual validation (review R28). Tokens and
component contracts below are build-ready; the plan's "reviewable designs
with realistic content" gate is satisfied at the **P6 pilot checkpoint** —
before P7 expansion, rendered desktop/mobile examples of: uncertain
evidence, correction editing, linked help, partial report, citation chain,
and filter reset are reviewed (controlled fictional fixture states in the
client — no provider calls needed). This document owns color, type, space,
components, and state styling only.

**Character commitment (plan §10.1):** keep the live dark identity —
botanical charcoal surfaces, warm amber action color, Fraunces/Source Sans —
and refine it. No palette swap, no glass, no gradients, no dashboard look,
nothing that reads as a risk score.

---

## 1. Tokens (changes to `web/src/styles.css` custom properties)

### 1.1 Kept as-is (verified contrast 2026-10-04)

| Token | Value | Ratio (vs surface) |
| --- | --- | --- |
| `--canvas` | `#0b0f0e` | ink 17.7:1 |
| `--surface` / `--surface-elevated` / `--surface-hover` / `--surface-active` | `#131917` / `#1a221f` / `#222c28` / `#293631` | ink 16.4:1 |
| `--ink` | `#f3f6f4` | 16.4:1 |
| `--ink-secondary` | `#9eb0a6` | 7.8:1 |
| `--primary` / `--primary-on` / `--primary-hover` | `#d4a359` / `#0b0f0e` / `#e2b56c` | 8.4:1 (button text) |
| `--accent` / `--accent-on` | `#2e6f50` / `#ffffff` | 6.0:1 |
| `--contract-accent` | `#c88350` | 5.8:1 |
| `--rule`, `--rule-subtle` | `#242e2a`, `#18201d` | decorative only |
| source / incomplete / error triads | unchanged | 6.1–8.3:1 |
| radius 6/12/16, shadows, max-widths 52/76rem | unchanged | — |

### 1.2 Changed / added

| Token | Value | Why |
| --- | --- | --- |
| `--ink-muted` | `#7d8f85` (was `#6e7f75`) | old value = 4.20:1 on surface — fails AA body text. **Permission rule (R24):** permitted only on `--surface` (5.21) and `--canvas` (5.64); **on `--surface-elevated/-hover/-active` use `--ink-secondary` instead** (7.13/6.32/5.53 — verified per state). Muted stays restricted to ≤1-line secondary hints regardless of surface |
| `--focus-ring` | `2px solid #d4a359`, `outline-offset: 2px` | one visible focus style everywhere; amber on dark passes 3:1 non-text everywhere it appears |
| `--cat-difference` | `#d4a359` | category accent (dot/border only) |
| `--cat-concern` | `#68c594` | ties to the existing official-source green |
| `--cat-missing` | `#9eb0a6` | quiet neutral |
| `--cat-clarify` | `#c88350` | copper, distinct from amber |
| `--cat-undetermined` | `#7d8f85` | muted |
| `--space-1..8` | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px | kills the inline `style={{margin…}}` sprawl (P1 issue 26) |

Category accents are **orientation only**: a 3px left border on report cards
+ a dot beside the category label. All ≥3:1 non-text vs surface (7.8 / 8.5 /
7.8 / 5.8 / 5.2). Category meaning is always carried by the text label;
accent hue is never the only signal, and none of the hues is a
verdict-suggestive red/green pair (green here is the *official source*
color, used consistently since the source panel shipped).

## 2. Typography

Families unchanged: Fraunces (display only) + Source Sans 3. Scale (desktop →
mobile):

| Role | Size / line | Usage |
| --- | --- | --- |
| Display H1 | 2.6rem / 1.15 → 1.9rem | one per view |
| H2 | 1.35rem / 1.3 | section heads |
| H3 card title | 1.05rem / 1.35 | finding/group titles |
| **Value** | 1.2rem / 1.3, `--ink`, weight 600 | `Read as:` line — the visually primary line in a field card |
| Body | 1rem / 1.6 | paragraphs, card text |
| Secondary | 0.92rem / 1.5 | `--ink-secondary` |
| Hint | 0.85rem / 1.45 | `--ink-muted`, single lines only |
| Label/caption | 0.8rem, letter-spacing 0.04em, sentence case | provenance lines, eyebrow replacements (no all-caps blocks) |

Rules: no serif body; max ~72ch reading width (52rem panel); evidence quotes
may run wider but wrap; numerals tabular where columns exist (`font-variant-
numeric: tabular-nums` on values, counts, and the report toolbar). No tiny
text inside banners (plan §10.2).

## 3. Components (structure from P4; this section = their visual contract)

### 3.1 Buttons
Primary (amber fill, dark text), secondary (elevated surface + rule border),
ghost (text button), full-width variant. States: default / hover (existing
tokens) / focus (`--focus-ring`) / disabled (45% opacity + `not-allowed`,
label unchanged) / pending (spinner inside, min-width locked to avoid
layout shift). Min height 44px (40px for inline ghost actions with ≥44px
hit-area via padding). One primary action per view region.

### 3.2 State chips (4 field states) — text + shape + hue
| State | Look |
| --- | --- |
| Found in document | green dot + accent-tinted bg (`--source-bg`), `--source-ink` text |
| Not found on readable pages | hollow circle + transparent bg, `--ink-secondary` text, dashed rule border — must not read as error |
| Unclear | half dot + `--incomplete` triad |
| Could not read | ✕ glyph + `--error` triad, quiet weight |

Chip text stays the full P3 labels (no abbreviation).

### 3.3 Provenance labels (evidence)
`Offer · Page 2 — Text matched to PDF` as a caption line above the quote;
`Model transcription — check the page` in `--incomplete-ink`. Quote block:
elevated surface, 3px left rule (`--rule`), Fraunces italic reserved for the
wordmark only — quotes stay in body font.

### 3.4 Notices → one slim banner treatment
All four Notice kinds keep their triads but: single-line title + body, icon
16px, padding 12/16, max 2 sentences visible + "details" link. Partial
review = one banner (P4 §7.1) — never a stack. **Compactness is a default,
not a content cap (R26):** text always wraps fully — no clipping, no
truncation, no `line-clamp` — at any width or text size; only supplementary
detail moves behind a disclosure. If a required explanation needs five
lines at 360px, it gets five lines.

### 3.5 Group navigator item
Row: ① number (tabular) + name + count chip (or needs-check pill). Active =
elevated surface + amber left rule. Needs-check pill = incomplete triad.
Hover only on interactive affordance; whole row is the button, 40px min
height.

### 3.6 Field card
Elevated surface, 12px radius, 16px padding, stack order per P4 §6.1. Value
line (§2 "Value" role) is the anchor; "As written" quote uses §3.3; action
row bottom-aligned, ghost buttons. Empty/absent card: **compact single row
on desktop as the default, never a content limit (R26)** — the row wraps
freely on narrow screens and at enlarged text sizes (stacking to two/three
lines is correct behavior, not a defect); no clipped labels, no hidden
state text (kills the empty-wall look, issue 28). **Corrected card (R22):**
the *effective* value leads in the primary value style with a 3px copper
left rule + "Your correction — used for analysis" attribution label; the
original extraction (read-as + quote) stays visible below in the quiet
secondary style; the `✎ Corrected by you` chip replaces the state chip.
Copper (not amber) marks user-authorship so the action color stays
button-only.

### 3.7 Report finding card
Left category accent rule (3px, `--cat-*`) + header row: category dot +
label chip + priority chip (only when high/medium/low) + title. Body per
P4 §7.3 anatomy. Mismatch: two aligned panes with role labels, equal
heights, divider `--rule`; mobile stacks with labels repeated.
Citation block keeps the source triad (green = official, established
meaning), pinpoint quote emphasized, Source details as quiet disclosure.

### 3.8 Priority chips — deliberately NOT traffic lights
high = `--ink` text, strong rule border, bold; medium = default chip; low =
`--ink-muted`. Hue carries no priority meaning (text does); no red/amber/
green ladder (nothing implies danger rating). `unknown` renders nothing.

### 3.9 Category chip
`--cat-*` 8px dot + label text in `--ink-secondary`. Used on cards, in the
toolbar select, and in the absent-categories summary line.

### 3.10 Help affordances — two distinct patterns (reworked per R25; implements the R8 contract)

**a) InfoTip — non-interactive tooltip (definitions only).**
Trigger: 18px ⓘ glyph inside a **40px minimum hit target** (padding, not
glyph size); `--ink-secondary`, hover `--ink`; `aria-expanded` +
`aria-describedby`. Popup: elevated surface, `--rule` border, shadow, 12px
radius, max-width 20rem. **Popup text = secondary body size (0.92rem), not
caption** — definitions are substantive text (R25). Content rule unchanged:
definitions only, **no links, no controls inside** — that is what makes the
trigger-only focus ring correct: there is nothing inside to focus. `Tab`
from the trigger closes the popup quietly (P2 §4.2); `Esc`/outside click
closes with focus returned. Caret skipped.

**b) Help panel / linked popovers — interactive.**
Any help surface that contains links or controls (the in-review help panel,
future linked popovers) is NOT an InfoTip: it follows the non-modal dialog
pattern (P4 §8.3) — it stays open while focus moves through its content,
and **every link and control inside shows the standard visible focus ring**.
Two patterns, two names in code (`InfoTip` vs `HelpPanel`), so styling and
behavior cannot drift into each other.

### 3.11 StepIntro / disclosures
`▸` chevron rotates; summary row 44px; content indents 16px with a left
`--rule`. Same pattern for: What is this step, legend, What we checked,
Source details, article TOC (mobile).

### 3.12 Empty states
Centered in a bordered (dashed `--rule`) panel: 20px icon, 1–2 sentence
message (body size, `--ink-secondary`), optional action link. Used for:
empty group workspace, filtered-empty report, no-findings panel. Nothing
blank taller than one line anywhere (issue 9/28 family).

### 3.13 Dialogs (two, per the R18 split)
Modal, elevated surface, 16px radius, shadow-lg; title + 2-sentence body;
focus trapped; Esc = the safe choice. **Leave-confirm:** actions `[Stay]`
(primary) / `[Leave]` (secondary), DISCARD-CONFIRM copy. **Continue-with-
draft:** three actions — `[Keep editing]` (primary/safe), `[Save correction
and continue]`, `[Continue without saving]` (destructive styling, explicit
consequence text). Consequence text differs per dialog (P4 §6.5).

### 3.14 Icons
Replace emoji (📄📥🔍⚖️📜🔒⚠️⏱️) with a 16/18px stroke set (2px, round caps,
currentColor): document, upload, search, scale, scroll, lock, alert-triangle,
clock, info, check, x, chevron, external. Unfamiliar icons always paired
with text. Replaces the emoji-in-labels pattern (P1 issue 26) without a
dependency — hand-rolled SVG like the existing ones.

## 4. Representative screens (specs → built in P6/P7; not images)

Per plan §10.6. Each = P4 wireframe + §3 components + realistic P3 copy.
Verified against the checks in §5 during build:

| Screen | Desktop | Narrow |
| --- | --- | --- |
| Home (4-step strip, illustrative example) | ✔ | ✔ |
| Sample card (scenario tip, preview open) | ✔ | ✔ |
| Upload (slots, one-selected line, acknowledgment panel) | ✔ | ✔ |
| Review — uncertain evidence (unclear + unreadable + transcription visible) | ✔ | ✔ |
| Correction editing (editor open, inline error state) | ✔ | ✔ |
| Report — paired difference (long quotes) | ✔ | ✔ |
| Report — source-backed concern (full chain + citation) | ✔ | ✔ (R27 — the most demanding narrow state) |
| Report — partial (slim banner + coverage) | ✔ | ✔ |
| Report — filter-empty panel | ✔ | ✔ (R27) |
| Guide article (TOC, figure, section anchors) | ✔ | ✔ |
| Technical article (table + diagram slot) | ✔ | ✔ (R27) |

Realistic-content rule: long quotes, repeated allowance items, missing
values, 8+ findings — a layout that only works short is broken (plan §10.6).

## 5. Verification during build (P6/P7 record results)

- Contrast: every text pair from §1/§2 computed **per background state**
  (R24: surface, elevated, hover, active are different backgrounds with
  different ratios — grouped figures are not accepted); ≥4.5 body / ≥3
  large-text+non-text; the §1.1/§1.2 tables are the baseline — any new pair
  gets computed before merge. `--ink-muted` respects its §1.2 permission
  rule.
- Touch targets ≥44px primary, ≥40px inline ghosts (padding makes the hit
  area); InfoTip glyph 18px inside its 40px target (§3.10).
- Narrow: 360px width pass on Home/Upload/Review/Report **including the
  demanding states now listed in §4** (citation chain, filter-empty,
  technical article) — no horizontal scroll, no cramped half-PDF, no
  clipped text (R26/R27).
- **Reflow (WCAG 1.4.10 done properly — R27):** 320 CSS px equivalent —
  tested as 1280px viewport at 400% zoom (or a 320px viewport): long
  quotations, official-source links, disclosures, filter/reset controls,
  and the correction editor all remain usable without two-dimensional
  scrolling, except where the criterion's exceptions genuinely apply
  (the PDF viewer's document canvas may scroll in 2D; evidence text may
  not).
- Reduced motion: only transition = 120ms opacity/transform on hover/focus/
  disclosure; spinner is the sole loop; `prefers-reduced-motion` disables
  the chevron rotation and spinner animation (spinner becomes static text
  "Working…"). No pulses, no counters, no success animations.
- Nothing that implies a verdict: no score, no meter, no green/red ladder
  (§3.8); priority = weight not hue; category accents ≠ pass/fail colors.

## 6. Layout-choice decisions (plan §10.6 "decisions explaining main choices")

1. **Dark palette retained, not the spec's paper-light tokens** — plan §10.1
   says retain the recognizable character; the shipped product is dark.
   Spec §3's light direction stays on the shelf unless the owner wants a
   retheme (would be a spec change, out of scope here).
2. **Amber stays the only action color** — one primary hue keeps "what can
   I press" unambiguous after the redesign adds chips/dots/accents.
3. **Official-source green is never reused for success states** — it means
   "official/citation" (source panel, concern category, Found chip family).
   Success confirmations (saved correction) use ink + text, not green, to
   keep the semantic lane clean.
4. **Priority is typographic, not chromatic** — the product's whole stance
   is "no risk colors"; a red High chip would undo it visually while the
   copy claims otherwise.
5. **Category accents are borders/dots, never fills** — fills would turn
   the report into colored blocks (the dashboard look the plan bans), and
   tinted fills would need 5 new contrast-verified pairs for no reading
   benefit.
6. **`--ink-muted` darkened with a surface permission rule** — pass-everywhere
   claims were wrong (R24: it fails on hover/active surfaces); the token is
   now restricted to surface/canvas, and elevated-or-higher states use
   `--ink-secondary`, verified per state.
7. **Spacing tokens replace inline styles** — the 1,511-line stylesheet plus
   ~200 inline `style={{}}` props is the maintainability ceiling; P6/P7
   migrate touched components only (no big-bang refactor; plan §15.1).

## 7. Prototype scope (plan P5/P6 boundary)

P5's "interaction prototype" = the **P6 pilot**: one full sample journey
(sample → review with a correction → report) built with these rules, reviewed
on desktop + 360px, before spreading (plan P6). Nothing in this document is
"user-tested"; comprehension evidence is P11's gate.
