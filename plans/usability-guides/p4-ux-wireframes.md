# P4 — UX structure and wireframes (WazehTerms usability upgrade)

**Status:** Complete design for P5 (visual) and P6 (pilot) to implement.
Copy source: `drafts/` (P3) — strings quoted here are from those drafts.
Structure-only: colors/typography/motion are P5. Issue numbers reference
`audit/p1-baseline.md`; review references (R#) reference the external review.

**Breakpoints** (from spec §3, unchanged): ≥900px two-column work surfaces ·
600–899px stacked panels · <600px single column, large targets.

---

## 1. Global navigation

### Desktop header

```
┌──────────────────────────────────────────────────────────────────────┐
│ ▤ WazehTerms  [Demo]     Home   Samples   Upload   Help              │
└──────────────────────────────────────────────────────────────────────┘
```

- "Demo" badge stays (one, small). All-caps eyebrows die (P1 issue 26; P5
  styles a quiet label instead).
- **Help** replaces "How it works" (P2 §1.2). Technical hub lives in
  About/footer only.
- Wordmark click → Home with the same discard guard as in-review navigation
  (§6.1), not an unconditional reset (P1 issue 3).

### Mobile header (<600px)

```
┌────────────────────────────┐
│ ▤ WazehTerms [Demo]    ☰  │   ☰ → sheet: Home / Samples / Upload /
└────────────────────────────┘        Help / About
```

Menu button ≥44px; sheet is a non-modal dialog: Esc/overlay-click closes,
focus returns to ☰.

### Workflow bar (active review only) — 4-step canon (P2 §1.3)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ① Choose documents ─ ② Read documents ─ ③ Verify terms ─ ④ Findings │
│                                              [scenario chip]         │
└──────────────────────────────────────────────────────────────────────┘
```

- Step labels fixed; done/current states by style (P5), never by color alone
  (numbered ①–④ carry the state).
- Mobile: compact — `① · ② · **③** · ④ Verify terms` (current step named,
  others as numbers), same aria-label "Review progress".
- Steps ② ③ ④ are **status, not navigation** — clicking does not jump
  (jumping backward would imply re-running; forward is meaningless). This is
  stated once in the bar's sr-only description.

### Footer

```
┌──────────────────────────────────────────────────────────────────────┐
│ One limits statement (merged canon — U8 summary line)                │
│ About · How WazehTerms works · Privacy and scope · Privacy notice ·  │
│ Repository (opens elsewhere)                                         │
└──────────────────────────────────────────────────────────────────────┘
```

Capability-neutral wording (P1 issue 1). Links per P2 §1.2 (Gemini API terms,
in-app source articles).

---

## 2. Home

```
┌──────────────────────────────────────────────────────────────────┐
│ Pakistan → UAE mainland private-sector offers                    │
│ Understand your job offer before you sign                        │
│ (hero lead — 2 sentences, P3-tightened)                          │
│                                                                  │
│ [Start with a sample →]  [Use my fictional PDFs]                 │
│ No account needed. Fictional documents only — this is a demo.    │
│ First time? Read the 2-minute guide.                             │
│                                                                  │
│ ┌ Illustrative example ──────────────────────────────────────┐   │
│ │ Offer · Page 2      vs      Contract · Page 1              │   │
│ │ "Basic salary: AED 2,400…"   "Basic salary: AED 1,800…"    │   │
│ │ ⚠ Different wording: basic salary differs by AED 600.00    │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ The four steps (connected strip — not a card grid; see §2.1)     │
│ ① Choose documents → ② Read documents → ③ Verify terms          │
│                      → ④ Findings report                         │
│ (each step: one sentence what-you-do/what-you-get + guide link)  │
│                                                                  │
│ What this does not check (single panel — merged limits canon)    │
│ [Read the full scope guide →]                                    │
└──────────────────────────────────────────────────────────────────┘
```

Decisions:

- **CTA order:** sample first, upload second (plan §8.2: prominent fictional
  sample action) — reverses the current order. Both capability-gated as
  today.
- Mockup relabelled **"Illustrative example"** (spec §4.1 wording) — no
  longer implies a real case output.
- **§2.1 Four-step strip replaces the 6 square boxes** (P1 issue 26): a
  connected horizontal stepper (mobile: vertical) — one row, arrows between
  steps, each step = number, name, one sentence, guide link. The three
  feature boxes (Deterministic comparison / Curated official rules / privacy)
  are **retired as boxes**; their true claims move into the strip sentences
  and the limits panel, with the "Zero-Retention" heading deleted (P1 issue
  2 — privacy wording now U8's careful version).
- "2-minute guide" claim: only used if U1 measured reading stays under ~2
  minutes at final copy; otherwise "Read the short guide" (plan §3.3 — no
  invented reading times). **Default: "Read the short guide."**
- States (loading / error+retry / samples-only) keep existing behavior, new
  copy per P3 HOME-5.

---

## 3. Samples

```
┌──────────────────────────────────────────────────────────────────┐
│ Worked examples (H1: Explore a fictional example)                │
│ Every employer and amount is invented. Starting one runs the     │
│ real review — reading, checking, and the findings report.        │
│                                                                  │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ [Fictional]  Changed salary                  ⓘ scenario    │   │
│ │ Fictional salary change                                     │   │
│ │ 📄 Job offer (PDF) · 📄 Employment contract (PDF)            │   │
│ │ (one-sentence situation)                                    │   │
│ │ [Review this sample →]  [Preview files]                     │   │
│ │ ▸ Preview: Offer (opens elsewhere) · Contract (opens …)     │   │
│ └────────────────────────────────────────────────────────────┘   │
│ … six cards …                                                    │
└──────────────────────────────────────────────────────────────────┘
```

- Eyebrow "Interactive Testing Scenarios" → "Worked examples" (issue 19).
- `TC-xxx` id chip **removed from card face**; scenario badge keeps the
  plain name. The id stays in the detail disclosure for supportability.
- "Downloadable Fictional Fixtures" → "Preview files" panel, links labelled
  `Offer (PDF, opens elsewhere)` (jargon fix).
- Scenario ⓘ = InfoTip (short variant per sample type, P3 U2#choosing).
- Busy state: button spinner + "Starting review…" (existing). Disabled
  *other* buttons keep current single-run behavior.
- Mobile: card full-width; buttons stack; ≥44px targets.

---

## 4. Upload

```
┌──────────────────────────────────────────────────────────────────┐
│ H1: Start a document review                                      │
│ Fictional documents only — a demo, not for real offers.          │
│ (one line; replaces the all-caps banner + separate warning)      │
│                                                                  │
│ ┌ DOCUMENT 1 · Job offer ─────┐  ┌ DOCUMENT 2 · Contract ────┐   │
│ │ What this slot is for (1 line + guide link)                 │   │
│ │ [dropzone]  or file card: name · size · [Remove]            │   │
│ └─────────────────────────────┘  └────────────────────────────┘   │
│ Requirements line (capabilities-rendered): PDF only · 8 MB per   │
│ file · 16 MB total · 15 pages · English · digital PDF            │
│                                                                  │
│ Selected: 1 document — its terms can be checked, but two         │
│ documents allow comparison.  (appears only when 1 selected)      │
│                                                                  │
│ Processing notice — ALWAYS VISIBLE (review R19):                 │
│ Your document content is sent to Google's Gemini API (Free       │
│ tier), which may use it to improve its products; human           │
│ reviewers may examine it. WazehTerms processes files in memory   │
│ and stores nothing.                                              │
│ ▸ What this means in detail (expands; U3#processing-and-privacy) │
│ Full notice: [WazehTerms processing and privacy →]               │
│ (/help/scope-and-privacy#your-data) · [Gemini API terms          │
│ (opens elsewhere)]                                               │
│ [✓] I understand and agree — fictional only, no personal,        │
│     sensitive, or confidential information.                      │
│                                                                  │
│            [Start reading →]  (disabled until file + ✓)          │
│ Prefer ready-made documents? Open the fictional samples.         │
└──────────────────────────────────────────────────────────────────┘
```

- **Acknowledgment + processing consequences are never collapsed** (review
  R19): the visible notice line, both notice links, and the checkbox sit
  beside the start action; only the extended explanation expands. The
  disabled start button and its prerequisite are always on screen together.
- **Two distinct notice targets** (R19): the in-app **WazehTerms processing
  and privacy** page (`/help/scope-and-privacy#your-data` — application-side
  handling, the formal notice's home) and the **Gemini API terms** (provider
  terms, labelled "opens elsewhere"). Never label provider terms as "the
  full notice"; the visible line itself carries the provider consequences
  (Free-tier use, human review) rather than deferring them.
- **Banner merge** (P1 issues 14/26): the demo warning and gate-closed
  notice collapse into the one boundary line + requirements line. Gate-closed
  state replaces slots with the samples CTA (existing logic, new copy).
- Requirements line is **one line rendered from capabilities** incl. the
  combined total (fixes issue 14). Gate-closed state replaces slots with the
  samples CTA (existing logic, new copy).
- One-document helper line appears when exactly one slot is filled (P3
  U3#one-or-both short variant).
- Scope: static chip row stays *as is* (server-inferred applicability — P1
  issue 15 decision pending owner; no UI invented for it here).
- Error Notice: field-level, beside the offending slot, keeps the other
  selection (existing behavior; message copy per P3).
- Mobile: slots stack; "Before you continue" expands **above** the start
  button (spec §4.3 order).

---

## 5. Extracting / Analyzing (pending screens)

```
┌──────────────────────────────────────┐
│ (spinner)                            │
│ Reading the documents                │
│ {Sample title | Your documents}      │
│ being read…                          │
│ Next: you check what was read.       │
│ [error → ErrorPanel + actions]       │
└──────────────────────────────────────┘
```

- Copy per P3 (honest, no fake progress). "Next:" line added (plan §8.5 —
  identify the next step).
- **Navigation during processing (review R23 — new interaction contract):**
  leaving a pending screen (header nav, wordmark, browser Back) **aborts the
  client request** (`AbortController`), clears case state, and lands on the
  chosen destination. A late response after abort is ignored — the view is
  never hijacked by an in-flight result. Re-entering the journey = starting
  again. *Registered as issue 31: today `App.tsx` `navigate('review')` runs
  unconditionally in the fetch `.then` and will yank the user back when a
  late extraction/analysis resolves — fix lands with the P6 pilot.*
- **Analyzing error gets a retry** (P1 issue 4): `ErrorPanel` actions become
  — `[Try again]` (re-POST same issued+proof+corrections; safe replay within
  TTL, spec §4.6) and `[Start a fresh review]`. When `retryAfterSeconds`
  exists: "Try again available in {n}s" then the button enables. Failure of
  the retry keeps both actions.
- 422 INVALID_CORRECTION becomes its own path (P1 issue 5): navigate back to
  review with a Notice — "A correction could not be used: {field, plain
  reason}. Fix or remove it, then continue." The review is **not** lost
  (state still in memory; proof unexpired).

---

## 6. Verify terms (the core redesign)

### 6.1 Desktop layout (≥900px) — two columns + viewer overlay (reworked per review R21)

```
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 3 · Verify terms            ⏱ expires in ~28 min   ② fields    │
│ Check what we read                need your check      [✓ Clean]     │
│ Compare each value with the original page. Your changes stay       │
│ labelled as yours.        [Open offer PDF] [Open contract PDF]      │
│ ▸ What is this step?  ▸ What the chips mean                         │
├───────────────┬──────────────────────────────────────────────────────┤
│ GROUP NAV     │  FIELD WORKSPACE (group 4) — uses full remaining     │
│ (220–260px)   │  width whether or not the viewer is open             │
│               │                                                      │
│ Needs att. (2)│  4.1 Basic salary  [Offer]   ● Found in document     │
│ ① Employer  2 │  Read as: 2,400.00 AED · monthly      ← emphasized   │
│ ② Occupation 2│  As written: “Basic salary: AED 2,400 per month …”   │
│ ③ Work loc. 2 │  Offer · Page 2 — Text matched to PDF  [View page]   │
│ ▶④ Pay      8 │  …                                                   │
│ ⑤ Term      6 │  4.2 Allowance item [Offer] ● Not found on readable  │
│ ⑥ Probation 2 │  (one-line absent card)                              │
│ …             │                                                      │
│ [All|Needs]   │        [Continue to findings →]                      │
└───────────────┴──────────────────────────────────────────────────────┘
     Viewer = overlay sheet over the workspace when open (≈55% width,
     slides from the right, `role="dialog" aria-modal="false"`):
     ┌───────────────────────────┐
     │ [Offer|Contract] Page 3   │
     │ ┌───────────────────────┐ │   Close (Esc/[Close]) returns focus
     │ │ iframe PDF            │ │   to the triggering View page /
     │ └───────────────────────┘ │   Open button (existing pattern).
     └───────────────────────────┘
```

- **No reserved placeholder column when the viewer is closed** (R21): the
  closed state is two header buttons; the workspace always fills the
  remaining width. Long quotes and repeated allowance items get the full
  reading measure with the viewer closed and a narrower-but-workable
  measure with it open — the overlay keeps the workspace from being
  squeezed into a third of the screen.
- **Breakpoints:** ≥900px = nav column + workspace, viewer overlay ≈55%.
  600–899px = nav becomes a horizontal scrolling chip strip above the
  workspace (`① Employer · ② Occupation · …`, active chip highlighted,
  same `aria-current` model), workspace full-width below, viewer = full-
  screen sheet. <600px = per §6.2 (select navigator + full-screen sheet).
  **P6 validation must check the 600–899 band with realistic content**
  (long quotes, repeated allowances, long employer names) at 100% and 200%
  zoom before this structure is called done (R21).
- **Navigator + single-group workspace replaces the 12-accordion**
  (plan §8.6's recommended pattern). One group's cards render at a time.
- **Numbering** (P2 D-G5): groups ①–⑫ always visible with counts; fields
  numbered `{group}.{index}`. Counts labelled "values" in legend and
  sr-only text (issue 29).
- **Needs attention view** = nav filter: groups containing unclear/unreadable
  fields. Absent-only groups are NOT in Needs attention (issue 8 handled by
  copy: legend + REV-9 tip say "Not found items are worth a look").
- **Empty groups are not hidden** (issue 9): REV-8 state-specific message.
- **Absent-field cards** (issue 28): compact one-line card — number, label,
  chip, REV-28 note. **If a correction is later saved on an absent field,
  the card expands to the full corrected anatomy** (§6.3, R22).
- **Field card anatomy — extracted state** (order = reading priority):
  1. `{n}.{i}` + label + state chip + document chip
  2. **Read as:** typed value, large (P5 emphasis) — issue 27 rename
  3. **As written:** quote + provenance label + page + `[View page]`
  4. Quality notes (only when present)
  5. Actions: `[Correct value]` (hidden for unreadable — §6.4)
- **Field card anatomy — corrected state** (defined per review R22): after
  saving, the card re-orders so the **effective value leads**:
  1. `{n}.{i}` + label + `✎ Corrected by you` chip (replaces the state
     chip) + document chip
  2. **Your correction — used for analysis:** the user's value, in the
     primary value style with a copper left rule and the attribution label
  3. Original extraction, quiet: *Read as: {original}* · *As written:*
     {quote} + provenance + `[View page]` (never removed)
  4. `[Remove correction]` returns the card to the extracted anatomy.
  Attention counts describe the **original extraction**: a corrected field
  leaves the needs-check count (the user resolved it); chips elsewhere in
  the UI keep describing what was read. This distinction is stated in the
  legend line: "Counts describe what was read; corrected fields show
  ✎."
- StepIntro + legend collapsed by default — visible entry points, no banner
  stack. Expiry chip unchanged; tip per REV-7.

### 6.2 Mobile (<600px)

```
┌──────────────────────────────┐
│ ③ Verify terms  ⏱ ② ⏳        │
│ Check what we read            │
│ ▸ What is this step?          │
│                               │
│ [All groups ▾]  [Needs: 2]    │  ← navigator as select + toggle chip
│ ─────────────────────────────│
│ 4.1 Basic salary  [Offer]     │
│ ● Found in document           │
│ Read as: 2,400.00 AED monthly │
│ As written: “…” · Page 2      │
│ [View page]  [Correct value]  │
│ …                             │
│ [Continue to findings →]      │
└──────────────────────────────┘
[View page] → full-screen PDF sheet: [← Back to this field] (focus returns
to the originating button — existing pattern, kept)
```

- Document viewer is always the full-screen sheet on mobile (no side pane).
- Group switch = select; position resets to that group's first card.

### 6.3 Correction editor (inline, in the field card)

```
┌ Correction ────────────────────────────────┐
│ Corrected state: [Present (I know the      │
│                    correct value) ▾]       │   ← prefilled from the
│                                            │     field's CURRENT
│ Amount  [ 2500.00 ]  (decimal)             │     state (fixes issue 16
│ Currency [AED]  Frequency [Monthly ▾]      │     dead prefill)
│ or Date [YYYY-MM-DD]  ← format checked     │
│                                            │
│ Invalid values show inline: "Enter the     │
│ date as YYYY-MM-DD" — beside the input.    │
│ [Save correction]  [Cancel]                │
│ Saved separately from the original. The    │
│ page evidence above stays as extracted.    │
│ ⓘ What corrections do (REV-5 tip)          │
└────────────────────────────────────────────┘
```

- Inline client validation for amount (decimal) and date (YYYY-MM-DD) before
  submit (issue 16); server remains the authority; 422 handling per §5.
- **Unsaved-edit model (reworked per reviews R17/R18):** the in-progress
  edit is **draft state held at the Review level, keyed to the field** — not
  locked inside the card. Consequences:
  - **Opening/closing help never prompts and never loses the draft** — the
    panel overlays; help is exactly when users need their unfinished
    correction (R17). The editor's own note says: "Your edit stays open
    while you read."
  - **Switching groups never prompts** — the draft stays attached to its
    field; returning to the group reopens the card with the draft intact.
    A small "1 unsaved edit · Pay" pill in the header (click = jump to the
    field) makes the draft discoverable.
  - **Continue to findings with a draft open** offers three explicit
    choices (R18 — consequences differ, so the dialog says which):
    `[Save correction and continue]` · `[Continue without saving]` (the
    draft is discarded — stated) · `[Keep editing]` (safe action, primary).
  - **Leaving the review** (header Home/wordmark/Samples/Upload, browser
    close) uses the full leave-confirm (§6.5) — the only place the
    "leaving ends the review" copy appears.
  - Discarding a draft otherwise happens only via `[Cancel]` in the editor
    or `[Continue without saving]` — both explicit.
  - Validation errors: inline per §6.3; an invalid draft never silently
    blocks Continue — the three-choice dialog treats it as unsaved.
- Unreadable fields: `[Correct value]` stays hidden; card shows the public
  limitation line from U4 (current behavior; owner decision U-5 open — if
  reversed, editor opens with no quote to prefill).

### 6.4 State/provenance legend (collapsed disclosure under the header)

```
▸ What the chips mean
  ● Found in document — read from located wording
  ○ Not found on readable pages — no wording located; not proof of absence
  ◐ Unclear — found but not pinned down
  ✕ Could not read — text unreadable
  Quotes: “Text matched to PDF” = exact · “Model transcription — check the
  page” = the model's reading; verify on the page
  Full explanations: [field states →] (/help/checking-terms#field-states)
```

### 6.5 Preservation matrix (test contract for P6 — reworked per R17/R18/R23)

| Action while review active | Outcome |
| --- | --- |
| Open/close help panel | **Everything survives, no prompt** (R17): issued, corrections, open draft, group, viewer state, scroll. Panel overlays; Review never unmounts |
| Switch group in navigator | **No prompt** (R18): draft stays attached to its field (hoisted state); unsaved-edit pill visible in header |
| Open/close document viewer | everything + scroll/focus restore (existing) |
| Header Home / wordmark / Samples / Upload click | **Leave-confirm** (full-loss copy: leaving ends the review) before reset; confirm → resetCase; stay → nothing changes |
| Browser Back/Forward while a draft is open | **Same leave-confirm** (R18 extension): Back that unmounts Review discards the draft, so it warns; Back to `/review` from `/result` etc. keeps state (existing persistence) — *implementation note: current code persists `issued` across views, so only history entries that leave the flow need the guard* |
| Header **Help** during review | opens the help hub in the panel/new tab per §8.3 — never navigates the flow, never prompts (R17/R18 extension) |
| Continue with unsaved draft | **Three-choice dialog** (R18): Save & continue / Continue without saving (draft discarded — stated) / Keep editing (primary) |
| Reload / close tab | gone, by design; `beforeunload` guard while `issued` exists; reload-degraded screens explain (existing) |
| Navigate away during **extracting/analyzing** | **Abort + reset, no prompt** (R23): request cancelled via AbortController, late responses ignored, chosen destination shown; starting again is explicit |
| Late response after leaving pending | ignored — never hijacks the current view (issue 31) |
| Help panel open at expiry | on close, expired banner path (no timer games) |

Confirm dialog copy: leave = DISCARD-CONFIRM (P3 short-variants); the
three-choice continue uses CONTINUE-WITH-DRAFT copy (added to short-variants).
Both defined in `drafts/short-variants.md`.

---

## 7. Findings report

### 7.1 Desktop layout (≥900px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ STEP 4 · Findings report                                             │
│ Your document review     [Partial review] · reviewed {date} ·        │
│ documents: offer + contract        [Pakistan → UAE Mainland Private] │
│ Applicability sentence (3 variants, existing copy)                   │
│ ▸ How to read this report (StepIntro FND-0)                          │
├──────────────────────────────────────────────────────────────────────┤
│ ⚠ Partial review — one slim banner (single panel):                   │
│   {report.summary} · {n} possible concerns withheld — details in     │
│   What we checked.  [Read why → #coverage]                           │
├──────────────────────────────────────────────────────────────────────┤
│ What needs your attention                                            │
│ Start here: 3 high-priority items across 2 categories.               │
│ [search──────────────] [Category: All ▾] [Priority: All ▾] [Reset]   │
│ 12 of 12 findings shown · Not flagged by finished checks: benefits   │
│                                                                      │
│ ┌ HIGH · Different wording · Pay ────────────────────────────────┐   │
│ │ Different wording: basic salary                                │   │
│ │ ┌ Offer · Page 2 ─────────┐ ┌ Contract · Page 1 ────────────┐  │   │
│ │ │ “Basic salary: AED …”   │ │ “Basic salary: AED …”         │  │   │
│ │ └─────────────────────────┘ └───────────────────────────────┘  │   │
│ │ ⓘ suggested question…        (per-category anatomy §7.3)       │   │
│ └────────────────────────────────────────────────────────────────┘   │
│ … cards in priority-first order (§7.2) …                             │
│                                                                      │
│ ▸ What we checked (coverage: stages, fields, unreadable, omitted)    │
│ Official next steps (existing links, reworded line)                  │
│ [Review another set of documents]  [Start over]                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.2 Ordering and filters (spec = plan §8.11/§8.12; P8 copy reserved in P3)

- **Default order: priority-first across categories** — sort key
  `(importance high→medium→low→unknown, category order, array index)`.
  Category is not lost: each card carries a category chip + section color
  (P5). This replaces the fixed category-section stack (plan requirement).
- Filters: category select, priority select (All default), text search
  (titles, explanations, term labels, quoted evidence — client-side only),
  `[Reset]`, live count `{shown} of {total} findings shown`.
- Coverage invariants: partial banner + coverage stay visible under any
  filter; filtering never mutates report data or status (P8 copy block in
  P3 short-variants is the wording source).
- Filtered-empty → dedicated panel ("No findings match the current
  filters… [Reset]") — never the zero-findings sentence.
- **Zero-findings logic has three distinct states** (review R20 — the
  coverage gate decides the words, not the finding count):
  1. **Zero findings + all relevant checks completed** → the spec sentence
     "No concern detected in the fields checked" + its scope line, calm
     panel in the attention area.
  2. **Zero displayed findings + partial/unverifiable coverage** (failed
     stages, withheld candidates, unreadable coverage) → **never** the
     all-clear sentence: "No findings were displayed because not all
     checks finished — {n} possible concerns were withheld and some checks
     did not complete. See the banner above and What we checked."
  3. **Filtered to zero** → filter-empty panel with Reset (never either
     message above).
  The partial banner elsewhere does not substitute for state 2's panel —
  the attention area itself must not read as clean.
- **Absent categories**: compact summary line under the toolbar —
  "Not flagged by finished checks: {category list}" (issue 17). No empty
  sections.
- `importance: 'unknown'` renders **no** priority chip (issue 10).
- "Review another set of documents" label replaces "Review another sample"
  (issue 18); destination unchanged (samples/upload by capability).

### 7.3 Card anatomy per category (structure; P5 styles the difference)

| Category | Anatomy order |
| --- | --- |
| document_mismatch | heading "Different wording: {field}" · category+priority chips · explanation · **two-pane aligned quotes** (role, page, provenance) · correction attribution line · suggested question |
| source_backed_concern | heading · chips · explanation **three-block chain**: ① what your document says (quote) → ② what the official source says (pinpoint + quote + rule/guidance label) → ③ what remains unknown (uncertainty, human wording) · responsible party · dates + source-checked · `[Open the official source (leaves WazehTerms)]` · Source details disclosure |
| missing_information | heading · explanation · coverage pointer ("check What we checked if pages were unreadable") · suggested question |
| needs_clarification | heading · explanation · **suggested question, visually primary** (it is the product) |
| unable_to_determine | heading · explanation · blocker named · what to do |

- Evidence quotes keep provenance labels everywhere (P1 strength).
- No nested panels required to see the basis of a finding (plan §8.11) —
  only Source details collapses.

### 7.4 Coverage (unchanged data, better words)

Existing disclosure kept: stages (with the single-doc "Not applicable" line),
fields checked, could-not-read, omitted checks — plus, for partial reports,
the withheld count + reason sentences. Human-worded stage labels from P3
FND-4 intro line placed in the summary row.

### 7.5 Mobile

Toolbar wraps: search full-width row; selects half-width pair; count line
under. Cards single-column; mismatch panes stack (Offer above Contract,
labels kept). Filters are always visible (no drawer) — they are the primary
control for the card wall. Sticky: nothing sticky except the browser UI.

---

## 8. Help surfaces

### 8.1 Help hub `/help`

```
┌──────────────────────────────────────────────────────┐
│ Help                                                 │
│ Start here: Getting started (U1 summary + link)      │
│ START     Trying samples · Uploading documents       │
│ CHECK     Checking terms (the 12 groups)             │
| UNDERSTAND Reading findings · Evidence and sources   │
│ RECOVER   Troubleshooting                            │
| BOUNDARIES Scope, limitations, and privacy           │
│ Glossary · How WazehTerms works (technical)          │
└──────────────────────────────────────────────────────┘
```

Task grouping per plan §3.2; troubleshooting visible without scrolling on
desktop. Each entry: title + one sentence (P2 outlines).

### 8.2 Article page (`/help/{slug}`, `/how-it-works/{slug}`)

```
┌───────────────┬──────────────────────────────────────┐
│ On this page  │ H1 article title                     │
│ (sticky TOC,  │ intro paragraph                      │
│  anchors,     │ H2 sections (P3 drafts, in order)    │
│  aria-label)  │ [figures with captions + alt]        │
│               │ Related guides (footer block)        │
│               │ [Start a review] / [Back to Help]    │
└───────────────┴──────────────────────────────────────┘
```

- Focus to h1 on arrival; print-friendly; no state.
- Mobile: TOC becomes a collapsed "On this page" disclosure above content.
- Technical hub `/how-it-works`: same pattern as help hub + suggested
  reading order (T1→T7). About page: project intro + hub links (P2 §1.1).

### 8.3 In-review help panel (work-preservation contract)

```
 Review (unchanged, still mounted)
 ┌────────────┐
 │ ┌────────┐ │
 │ │ Help   │ │  side sheet (desktop ≥900) / bottom sheet (mobile)
 │ │ panel  │ │  • step help (P3 short variants)
 │ │        │ │  • named links: "Read the full checking guide
 │ │        │ │    (opens in a new tab)"  ← identified new tab
 │ │ [Close]│ │  • role="dialog" aria-modal=false; focus moves in;
 │ └────────┘ │    Esc/[Close] returns focus; page stays usable
 └────────────┘
```

- Opened from: StepIntro's "More" link, per-group "Detailed guide" links
  (U4#group-*), legend's link, expiry tip link. All open the **panel** (not
  navigation) during review; the same links outside a review navigate
  in-app.
- Panel never contains the only copy of a required action (P2 §4.1).

---

## 9. Recovery & guardrail states (wireframe-level)

| State | Screen |
| --- | --- |
| Expired review | ErrorPanel: EXPIRED-BANNER + `[Start over]` (existing, copy kept) |
| Reload-degraded `/review` //result` | existing "Nothing to review yet" / "No report to show" + start action |
| Busy/429 | message + Retry-After wording once issue 4 lands |
| Analysis retryable failure | `[Try again]` + `[Start a fresh review]` (§5) |
| 410/409 at analysis | fresh-start only + explanation (existing copy) |
| 422 INVALID_CORRECTION | back-to-review path (§5) |
| Discard guards | §6.5 confirm + beforeunload |
| Sample busy | per-card spinner (existing) |
| Capabilities error | Home retry Notice (existing) |

---

## 10. Focus & keyboard rules (build contract)

1. View change → focus h1 (existing). Panel/article open → focus their
   heading; close → restore trigger focus.
2. Navigator groups = buttons in a list (`aria-current="true"` on active);
   arrow-key navigation optional (buttons are tabbable individually).
3. InfoTips per corrected P2 §4.2 contract (no focus steal on Tab).
4. All confirms are real dialogs: focus trapped while open, Esc = safe
   choice (stay), focus returns to trigger.
5. Filters/search: label-associated, results count announced via
   `role="status"` (debounced), reset returns focus to search.
6. Skip link unchanged; landmarks unchanged; no keyboard traps outside
   dialogs and the full-screen PDF sheet (which keeps its close/restore
   behavior).

---

## 11. Open decisions for owner (blocking nothing except the noted rows)

| # | Decision | P4 default (used in wireframes) |
| --- | --- | --- |
| 1 | "As written / Read as" rename (issue 27) | **adopted** |
| 2 | Absent-count in Needs attention (issue 8) | not included; copy covers it |
| 3 | "Mark reviewed" affordance | **not included** (plan §8.6 caution) |
| 4 | Unreadable correctability (U-5) | not correctable; public copy explains |
| 5 | Scope declaration questions (U-6) | static chip; server-inferred wording |
| 6 | Reading-time claim on Home | "Read the short guide" |
| 7 | Issue 4/5 fixes (retry + 422 path) | wireframed; need code changes in P6/P7 |
| 8 | Correction drafts hoisted to Review state (R17/R18) | adopted — enables no-prompt help + group switches |
| 9 | Viewer as overlay sheet, not third column (R21) | adopted; 600–899 chip-strip navigator; P6 must validate that band |
| 10 | Leave pending = abort + reset, no prompt (R23) | adopted; fixes issue 31 hijack |
| 11 | Corrected card leads with the effective value + ✎ chip (R22) | adopted; counts describe original extraction |

## 12. Handoff to P5

P5 must express, without inventing structure: navigator vs workspace
distinction; value emphasis ("Read as" is the visually primary line);
category identity on report cards (chip + accent) now that sections are
gone; the calm single-banner partial treatment; empty-state panels; confirm
dialog styling; state chips (4) + provenance labels keeping text labels with
shape/color redundancy. All existing a11y strengths (P1 §5) carry forward
unchanged.
