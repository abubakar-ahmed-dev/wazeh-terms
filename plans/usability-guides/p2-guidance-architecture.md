# P2 — Guidance architecture and content plan (WazehTerms usability upgrade)

**Status:** Complete plan for P3 drafting. Builds on `audit/p1-baseline.md`
(issue numbers below reference that register). No implementation in P2.

---

## 1. Information architecture

### 1.1 URL map (all new routes client-side; Express SPA fallback already reserves `/api/*`)

| Path | Page | Audience |
| --- | --- | --- |
| `/` Home | Journey entry, starting actions | Worker |
| `/examples` Fictional samples | Scenario chooser | Worker |
| `/upload` (alias `/start`) Demo upload | Fictional-document intake | Worker |
| `/review` · `/result` | Working steps (unchanged) | Worker |
| `/help` **Help hub** | Practical guide index, grouped by task: start · prepare · check · understand · recover; troubleshooting prominent; glossary linked | Worker |
| `/help/getting-started` | U1 | Worker |
| `/help/trying-samples` | U2 | Worker |
| `/help/uploading-documents` | U3 | Worker |
| `/help/checking-terms` | U4 (12 group sections) | Worker |
| `/help/reading-findings` | U5 | Worker |
| `/help/evidence-and-sources` | U6 | Worker |
| `/help/troubleshooting` | U7 | Worker |
| `/help/scope-and-privacy` | U8 | Worker |
| `/help/glossary` | Glossary (also section-linked from hub) | Worker |
| `/how-it-works` **Technical hub** | T1–T7 index + suggested reading order | Technical reader |
| `/how-it-works/system-overview` | T1 | Technical |
| `/how-it-works/employment-knowledge-content` | T2 | Technical |
| `/how-it-works/retrieval` | T3 | Technical |
| `/how-it-works/from-candidates-to-concerns` | T4 | Technical |
| `/how-it-works/content-review` | T5 | Technical |
| `/how-it-works/privacy-and-limits` | T6 | Technical |
| `/how-it-works/evaluation` | T7 | Technical |
| `/about` | Project intro, repo/docs links, demo path, technical-hub discovery | Both |

Stable addresses: one pathname per article; section anchors per outline below
(`#group-pay`, `#corrections`, `#partial-reports`, …). Anchor slugs are content
IDs, not derived from headings, so headings can be reworded without breaking
links.

### 1.2 Navigation changes

- **Header:** Home · Samples · Upload (capability-driven, current behavior) ·
  **Help**. "How it works" leaves the header (was a home-anchor scroll); the
  technical hub is reached from **About/footer** (plan §3.1 — worker nav stays
  task-focused).
- **Footer:** one canonical limits statement (merged from current footer +
  Home scope card — P1 issue 22 merge), then: About · How WazehTerms works ·
  Privacy and scope (→ `/help/scope-and-privacy`) · Privacy notice (full
  notice link) · Repository.
- **Footer link fixes (P1 issue 6):** provider link → `ai.google.dev/gemini-api/terms`
  labelled "Gemini API terms (opens elsewhere)"; source explanation → T2/T4
  articles (in-app), not sanity.io/docs.
- **In-review help (decision):** a contextual help **panel inside the working
  view** (overlay, Review stays mounted — nothing in App/Review state is lost;
  `Esc`/close returns focus). Panel contains the step's short help + "Read the
  full guide (opens in a new tab)" for U4/U5 deep links. Full articles are NOT
  opened in-app from an active review — in-app navigation would unmount Review
  and lose position; the panel + new-tab combo satisfies plan §4.4 without
  restructuring state ownership. Outside an active review, articles are normal
  in-app pages.
- Direct visits to `/help/*` and `/how-it-works/*` work with no active review
  (static content). Direct visits to `/review`//result` without state keep the
  existing degraded states (P1: good).
- Router: extend `currentPath()` to parse two segments (`/help/{slug}`,
  `/how-it-works/{slug}`); new `doc` view; no dependency added.

### 1.3 Canonical journey naming (resolves P1 issue 22)

One canon, used by workflow bar, Home, guides, and contextual copy:

**1 Choose documents → 2 Read documents → 3 Verify terms → 4 Findings report**

Workflow bar labels change accordingly ("2. Extraction" → "2. Read documents";
step 1 label loses the PDF/sample split — the scenario chip already says which).
Home how-it-works is rewritten to the same four steps (P1 issues 20–22 fix here).

## 2. Practical guide outlines (U1–U8) with stable section anchors

Each outline lists sections in order with target anchor ids. Lengths are
targets to keep articles task-sized (U4 is the long one by design).

### U1 `/help/getting-started` — Getting started
Sections: `#what-wazehterms-does` (reads written terms; what you get: evidence-backed findings, never a verdict) · `#who-its-for` (corridor + category; scope summary → link U8) · `#fictional-only` (demo boundary; where the privacy notice lives) · `#the-four-steps` (canon journey; what you do vs what the system does at each) · `#one-or-two-documents` (what a single document can/cannot produce) · `#accounts-and-data` (no account; memory-only review; reload loses work — by design) · `#where-to-go-next` (samples vs upload decision; help map; technical hub pointer).
Embeds: Home hero sub-link, Help hub first card, Samples intro, Upload intro.
Success: reader picks a starting action and never calls the output a verdict.

### U2 `/help/trying-samples` — Trying fictional samples
Sections: `#what-samples-are` (invented data; live processing; may be unavailable) · `#choosing-a-scenario` (scenario types in plain words: consistent pair, changed pay, worker charge, missing terms, single contract, adversarial instructions — what each demonstrates, what to look for; **no ground-truth promises**) · `#previewing` (what Preview files does; "opens elsewhere"; preview failure ≠ processing failure) · `#after-you-start` (reading step → verify → report, what you will see) · `#evaluators-path` (short: suggested sample, then link T7 for how quality is measured).
Embeds: Samples page intro, per-card scenario help (short variant), preview help.
Success: reader starts a sample and still inspects extracted terms afterward.

### U3 `/help/uploading-documents` — Preparing and uploading fictional documents
Sections: `#offer-vs-contract` (by document purpose, not filename) · `#one-or-both` (what comparison becomes possible; single-doc limitation inline) · `#requirements` (live capability values: PDF, 8 MB/file, 16 MB total, 15 pages, English, readable text — with "why image-only scans fail") · `#fictional-only` (no real/personal documents even if identifiers removed — this is a demo boundary, not advice to anonymize) · `#before-you-upload` (role, legibility, annex references, encryption checklist) · `#processing-and-privacy` (who processes: Gemini on the Free tier; what WazehTerms retains: nothing; what cannot be promised: provider zero-retention; acknowledgment meaning; full notice link) · `#after-upload` (reading, partial extraction, failure, retry, return to upload) · `#why-no-replacement` (submitted bytes cannot be swapped inside a signed review; start over instead).
Depends on: P1 issue 15 decision (scope/category questions) — outline has a
`#scope` section drafted for **current behavior** (server infers applicability
from documents; static scope chip explained); rewrite trigger recorded in §8.
Embeds: Upload intro, per-slot help, requirements line, acknowledgment area, upload errors (U7 cross-link).
Success: correct roles, correct expectations, no real document uploaded.

### U4 `/help/checking-terms` — Checking and correcting extracted terms (the central guide)
Sections: `#why-this-step` (model read; you verify before analysis; corrections stay yours) · `#the-workspace` (group list, document viewer, expiry) · `#field-states` (four states + "Not found ≠ does not exist") · `#evidence-quality` (matched text vs model transcription; page references; "Original wording" vs "Read as" labels — P1 issue 27 naming) · `#needs-attention` (what the badge counts: unclear + unreadable; absent fields worth a look too — P1 issue 8) · then **one section per canonical group**, anchor `#group-{key}`:
`#group-employer` `#group-occupation` `#group-location` `#group-pay` `#group-term` `#group-probation` `#group-working-time` `#group-ending-terms` `#group-deductions` `#group-recruitment-travel` `#group-benefits` `#group-document-details` — each: what to inspect, how to find evidence, one common ambiguity, what it means when nothing usable shows (per P1 group facts).
Then: `#corrections` (three corrected states in plain words; save/remove; effect on comparison; attribution; original evidence immutable; unreadable fields currently cannot be corrected — **describes current behavior**, P1 issue 7 decision pending, rewrite trigger recorded) · `#expiry` (30-minute window from actual config; what expires; what survives nothing) · `#continue` (what analysis does with your checked terms).
Embeds: Review `StepIntro`, every group `InfoTip` (short variant of its section), state legend, evidence tips, correction editor help, expiry tip.
Success: reader inspects evidence, saves and removes a correction, explains the difference from original text.

### U5 `/help/reading-findings` — Reading your findings report
Sections: `#report-anatomy` (status, scope line, attention nav, categories, coverage, next steps) · `#attention-first` (how items are ordered; priority = reading order, not danger score) · `#categories` with per-category subsections: `#document-differences` `#source-backed-concerns` `#missing-information` `#questions-to-clarify` `#could-not-determine` · `#corrections-in-report` (attribution; user correction never becomes a confirmed document mismatch) · `#citations` (anatomy: document statement → official passage → pinpoint → official link; rule vs guidance label; scope honesty; what "withheld" means — P1 issue 23 wording fixed at source) · `#partial-reports` (real reasons: stages failed/unavailable/withheld; what remains usable) · `#coverage` (What we checked; stage states in human words; single-document case) · `#zero-findings` ("No concern detected in the fields checked" and what it does NOT mean; zero matches vs zero findings once filters exist) · `#official-next-steps` (general resources, not your case; leaving the site).
Embeds: Result `StepIntro`, per-category intros, priority tip, citation tips, coverage tips.
Success: reader identifies an important item, inspects its basis, formulates a question, states the report's limits.

### U6 `/help/evidence-and-sources` — Understanding evidence and official sources
Sections: `#three-kinds-of-text` (document passage / model transcription / your correction — with a worked example) · `#pages-and-quotes` (page refs; opening the page; what highlight does and does not promise) · `#official-law-vs-guidance` (evidence class labels; why the label matters; authority homepage ≠ support for a claim) · `#pinpoints-and-dates` (pinpoint label/quote; in-force dates; source-checked date; **link unavailable** case: retain the reference, availability proves nothing either way) · `#applicability` (jurisdiction, actor, route, worker category — why the same rule may not apply to you).
Embeds: Review legend, report citation help, U5 cross-links.
Success: reader can say what came from the document, the user, and the official reference.

### U7 `/help/troubleshooting` — Troubleshooting and starting again
Organized by reader problem (one section each, anchor = slug): `#file-rejected` · `#cannot-read-document` · `#busy-or-rate-limited` (respects Retry-After once issue 4 lands) · `#processing-failed` · `#review-expired` · `#page-refreshed` (memory-only; nothing recoverable — by design) · `#opened-a-step-directly` (degraded states explained) · `#correction-not-saved` (covers issue 5 fix when it lands) · `#preview-wont-open` · `#source-check-incomplete` · `#search-no-matches` (P8). Each: what happened → what remains → what to do → whether work restarts.
Embeds: every error Notice gets a "Read the troubleshooting guide" link; recovery actions cross-link here.
Success: reader recovers without repeating invalid input or misjudging what was lost.

### U8 `/help/scope-and-privacy` — Scope, limitations, and privacy
Sections: `#supported-scope` (corridor, mainland non-domestic, applicability checked not assumed) · `#what-it-does-not-do` (no verdict, no employer/visa/document verification, no legal advice) · `#document-limits` (one vs two docs; unreadable pages; annexes) · `#when-things-are-withheld` (uncertain scope, failed checks — honest partials) · `#evaluation-limits` (small synthetic corpus; link T7) · `#fictional-only-policy` · `#your-data` (WazehTerms memory-only; Gemini Free-tier processing; acknowledgment; full notice; **no absolute-retention claims** — resolves P1 issue 2 wording house-wide) · `#getting-real-help` (official resources; when qualified assistance makes sense; no case-specific legal recommendation).
Embeds: Home scope card, upload notice, report limitations, footer, Help hub.
Success: reader knows what cannot be concluded and what never to upload.

### Glossary `/help/glossary`
Terms (each: one-sentence definition + one-line example where confusable):
offer · contract · written terms · review · extraction · read (a document) ·
verify terms · correction · *your correction* · evidence · matched text ·
model transcription · official rule · official guidance · source-backed
concern · document difference · missing information · unclear · unreadable ·
coverage · partial review · priority · worker charge · recruitment cost ·
allowance · basic pay vs stated total pay · benefit (provided / conditional /
silent) · notice period · probation · mainland route · jurisdiction ·
applicability · expiry · capabilities.
Linked from first meaningful use (term links render as dotted-underline
links to `/help/glossary#{term}` or in-place tip for single use).

## 3. Technical article outlines (T1–T7)

Each: problem → approach → tradeoff; evidence block listing the verified
sources it may cite (from P1 fact sheet); explicit avoid-list per master plan
§7. All numbers must carry date + denominator; **44-vs-42 record count must be
reconciled before T2 publishes any count** (P1 unresolved).

- **T1 `/how-it-works/system-overview`** — pipeline: validate → extract → user review → deterministic compare → retrieval → eligibility → report; responsibility table (Gemini / application / Sanity content / KB / Context / user); two-step signed flow rationale; immutable evidence + attribution; expiry. Evidence: `TECHNICAL_ARCHITECTURE.md`, `API.md`, `reader.ts`, `retrieval.ts`. Avoid: agent framing; "every extraction is source-verified".
- **T2 `/how-it-works/employment-knowledge-content`** — record types (authority, sourceDocument, rule, contractFieldDefinition), revisions, applicability fields, evidence class, pinpoints; editorial vs enforced validation; why structure beats prose for payer/jurisdiction/category; prose-only alternative discussed honestly (no controlled benchmark claim). Evidence: `DATABASE_SCHEMA.md`, live schema, sanitized record examples. Publishes no record counts until reconciled.
- **T3 `/how-it-works/retrieval`** — KB-only Context endpoint; what is projected/indexed; candidate↔canonical mapping by pinpoint quote; read-only runtime vs authoring MCP; known-answer verification; rebuild/sync; what stale retrieval means (fail closed). Evidence: `retrieval.ts`, KB config, verification records.
- **T4 `/how-it-works/from-candidates-to-concerns`** — eligibility gate walk-through; eligible vs withheld fictional examples; closed reasons surfaced as coverage; document findings survive withholding. Evidence: `retrieval.ts` gate, prod2 TC-012 (with clarifying note that saved artifacts predate the summary-wording fix).
- **T5 `/how-it-works/content-review`** — provenance → claim extraction → applicability check → approve/publish → release; manual steps named; revision/supersession handling. Evidence: `SOURCES.md`, release inventory.
- **T6 `/how-it-works/privacy-and-limits`** — transient processing, memory-only client, server-side credentials, input bounds, abuse controls, provider handling; demo posture; expiry tradeoff; no absolute guarantees. Evidence: `SECURITY.md`, capabilities, notice `gemini-free-demo-v1`.
- **T7 `/how-it-works/evaluation`** — corpus design, frozen conditions, prod2 results with dates/denominators, latency definition (machine time ≠ user checking time), what remains untested (unreadable-page case, other 2 rules' runtime eligibility). Evidence: `TESTING.md`, `eval-2026-10-03-prod2-review.md`.

## 4. Contextual help rules and interaction requirements

### 4.1 Surface assignment (which mechanism carries which content)

| Content | Surface |
| --- | --- |
| Required action, constraint, next step | Visible copy at point of use (L0) |
| Meaning of an unfamiliar label/state chip | `InfoTip` (L1) — also listed in the step's legend |
| Multi-sentence section orientation | `StepIntro` collapsible (L2) on Review + Result; one-paragraph intro elsewhere |
| Task depth, examples, troubleshooting | Article section (L3) via named link ("Read the correction guide", never bare "Learn more") |
| Error recovery | Error Notice + named U7 section link |

Documented "no help needed" cases (deliberate): Remove/Replace buttons, Start
over, Preview files toggle, role tabs — labels already self-explanatory; adding
tips would violate "don't explain the obvious" (plan §4.2.2).

### 4.2 Interaction requirements (build contract for P4/P6)

- `InfoTip` (corrected per review R8): button with `aria-expanded` +
  `aria-describedby` popover; opens on click/`Enter`/`Space`. Deliberate
  dismissal: `Esc` (focus returns to the trigger) or a click outside.
  **Ordinary focus movement never steals focus:** `Tab` from the trigger or
  within the popup closes the popup quietly and lets focus continue — no
  focus return on blur. InfoTips carry definitions only (no focusable
  content); if a popup ever needs to contain links/controls, it stops being
  an InfoTip and follows the non-modal dialog pattern instead (stays open
  while focus is inside; `Esc` closes and returns focus). Hover is never the
  only trigger; ≤ ~50 words; never covers its control; mobile: taps as
  popup, no hover dependency.
- `StepIntro`: `<details>`-based; summary names the subject ("What is this
  step?"); open state announced by native semantics; no essential action inside.
- In-review help panel: `role="dialog"` + `aria-modal="false"` (page stays
  usable), focus moves in on open, `Esc`/Close returns focus; opens without
  unmounting the working view; contains article links marked "(opens in a new
  tab)".
- All article pages: `<article>` + TOC (`aria-label="On this page"`), h1 per
  page, focus to h1 on arrival, print-friendly, no state.
- Preservation guarantee (P6 validation target): open panel, edit a correction
  half-way, open/close panel, navigate viewer pages — nothing lost; expiry
  while panel open shows the normal expired state on close.
- No automatic tour anywhere (plan §4.2.8).

## 5. State-to-help map (complete coverage grid)

Legend: **L0** visible copy (exists/new), **T** InfoTip, **P** StepIntro/panel,
**A→** article anchor link. "—" = documented no-help-needed. Anchor ids in
this map are normative; P6 validation must verify every guide link resolves
to its published section id (review R4).

| State / control (P1 inventory) | L0 | T | P | A→ |
| --- | --- | --- | --- | --- |
| Home purpose/decision | exists + rewrite (issues 2,20,21) | — | — | U1 |
| Home limits card | exists, merged canon | — | — | U8 |
| Capabilities loading / error | exists | — | — | U7#busy-or-rate-limited |
| Samples intro / scenario meaning / preview | rewrite intro (issue 19) | scenario tip | — | U2#choosing, U2#previewing |
| Upload roles (slots) | exists + slot help | — | — | U3#offer-vs-contract |
| Upload requirements line | exists (per-file); add total (issue 14) | — | — | U3#requirements |
| Upload fictional-only + privacy + acknowledgment | exists, restructured (merge) | — | — | U3#processing-and-privacy, U8#your-data |
| Upload scope chip | exists | — | — | U3#scope |
| Extraction pending | exists, keep | — | — | U3#after-upload |
| Extraction 422 / other errors | exists | — | — | U7#cannot-read-document, U7#processing-failed |
| Review purpose | new line | — | P | U4#why-this-step |
| Review groups (12) | numbering render | group tip ×12 | — | U4#group-* |
| Field states | legend (new) | per-chip tip | — | U4#field-states |
| Evidence labels | legend (new) | tip | — | U4#evidence-quality, U6 |
| Correction editor | exists ("Saved separately…") | editor tip | — | U4#corrections |
| Expiry chip | exists | tip | — | U4#expiry |
| Empty group | new empty message (issue 9) | — | — | U4 group section |
| Absent-field card wall | new one-liner (issue 28) | — | — | U4#field-states |
| Analyzing pending / errors | exists | — | — | U7#processing-failed |
| Result status pill | exists | tip | — | U5#partial-reports |
| Result categories ×5 | new per-category intro | — | P | U5 subsections |
| Citation block | exists | tips (class, dates) | — | U5#citations, U6#official-law-vs-guidance |
| Priority pill | exists + hide 'unknown' (issue 10) | tip | — | U5#attention-first |
| Coverage disclosure | exists | — | — | U5#coverage |
| Empty category / zero findings | exists/new (issues 17, FND-7) | — | — | U5#zero-findings |
| Official next steps | exists, reword (issue 24) | — | — | U5#official-next-steps |
| Every error Notice | — | — | — | U7 section (named link) |
| Reload-degraded states | exists | — | — | U7#page-refreshed |
| Start over / discard | new confirm (issue 3) | — | — | U7#review-expired |
| Footer limits + links | rewrite (issues 1, 6) | — | — | U8, T6 |

**Coverage check:** every row of the P1 state inventory and every issue-25 gap
has a surface and a destination. No essential information is tooltip-only (all
L0 cells exist or are scheduled as new visible copy).

## 6. Screenshot plan (P10 captures; placeholders in P3 drafts)

| Article section | Shot (state, fictional source) | Status |
| --- | --- | --- |
| U1#the-four-steps | Journey overview strip (4 labeled states) | placeholder |
| U2#choosing-a-scenario | Sample card close-up | owner capture exists (samples page) |
| U3#offer-vs-contract + #requirements | Upload slots + requirements | owner capture exists |
| U3#processing-and-privacy | Acknowledgment area | owner capture exists (upload page) |
| U4#the-workspace | Review overview (closed groups) | owner capture exists |
| U4#group-pay | Pay field with evidence | owner capture exists (open pane) |
| U4#corrections | Correction editor before/after | placeholder (P6 state) |
| U4#field-states | Unclear/unreadable example | placeholder |
| U5#report-anatomy | Report overview | owner capture exists |
| U5#document-differences | Paired evidence | owner capture exists (findings page) |
| U5#citations | Citation anatomy | placeholder (needs TC-012 run capture) |
| U5#partial-reports | Partial banner + coverage | owner capture exists (findings page) |
| U5 zero-matches (P8) | Filter-empty view | placeholder (P8) |
| T2 | Sanitized rule + references | placeholder (Studio capture, fictional-safe) |
| T3/T4 | Candidate → eligible/withheld | placeholder (diagram acceptable) |
| T7 | Evaluation table | table preferred, no shot |
Callout numbering must not collide with group numbering (U4). Interim owner
captures in `public/screenshots/` are baseline references, not final assets.

## 7. Editorial metadata (per article; kept in content module, not rendered publicly)

`{ id, audience, purpose, statesCovered[], factualSources[] (file paths +
endpoints), relatedIds[], screenshots[] (id → state + capture release),
lastReviewed: date, behaviorDependencies[] (issue/capability that forces
review) }` — change-triggered review per master plan §15.3. Public articles
show a human "Reviewed {month year}" line only.

## 8. Decisions, dependencies, and P3 drafting order

**Default positions taken (rewrite triggers recorded; owner can override):**
1. Unreadable fields: copy describes **current** behavior (cannot correct; why) — issue 7 decision pending.
2. Scope: copy describes server-inferred applicability (static chip) — issue 15 decision pending; spec §4.3 questions remain unimplemented.
3. Journey canon: 4 steps as §1.3.
4. In-review deep links open new tabs (identified), panel is the in-place path (§1.2).
5. Footer/privacy links point to Gemini API terms + in-app T6/U8 (issue 6).

**P3 drafting order** (hardest explanations first, per master plan):
1. U4 (groups + corrections + states) — depends on nothing pending except noted defaults
2. U5 + U6 (interpretation layer)
3. U7 + U3 (recovery + intake)
4. U1 + U2 + U8 + glossary (orientation wrap)
5. Short variants: 12 group tips, legend strings, category intros, error links
6. T1–T7 outlines with evidence refs (drafts; finalized after P7/P8 behavior is stable)

**Blocked-on-owner items carried from P1:** issue 7 (unreadable correctability),
issue 15 (scope questions), issue 6 (link targets — default taken), 44-vs-42
record count (blocks T2 numbers only).
