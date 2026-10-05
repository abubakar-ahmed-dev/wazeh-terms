# P1 — Current-state audit and baseline (WazehTerms usability upgrade)

**Status:** Inspection complete. Facts come from code read, live API reads,
Sanity queries, and the committed prod2 evaluation artifacts — all gathered
2026-10-04. The visual baseline is the owner-captured screenshot set in
`public/screenshots/` (deployed `00018-qas`, 2026-10-04). Evidence quality
varies by finding, and the register says which: **verified from code/data**,
**observed in screenshots** (static), or **awaiting interaction testing** —
navigation, recovery, focus, and work-preservation behavior have *not* been
exercised in a live session yet and get explicit completion points in
P4–P6/P11 validation. Residual live captures: error/expired/pending states and
narrow-screen behavior. Every fact is marked **verified**, **intended**
(spec target not fully implemented), or **unresolved**.

Branch: `usability-upgrade` (from dev @ `d6bcdfa`). Deployed production:
revision `wazehterms-00018-qas`, image digest `fa30020…` (docs/DEPLOYMENT.md §4).

---

## 1. Fact sheet (plan §2.1 table, filled)

| Fact | Status | Evidence |
| --- | --- | --- |
| Accepted input: `application/pdf` only, English (`en`) analysis only | **verified** | live `GET /api/v1/capabilities`; `Upload.tsx:40-41` client hint |
| Limits: 8 MB/file (`maxBytesPerFile` 8388608), 16 MB total, 15 pages/PDF, max 2 documents, max 100 corrections | **verified** | live capabilities; `api/src/config.ts`; per-file + page limits surfaced in dropzones (`Upload.tsx:191`); **total-byte limit not surfaced client-side** |
| Custom upload availability | **verified: ENABLED live** (`customUploadEnabled: true`, 2026-10-04) | live capabilities; gated branch still implemented (`Upload.tsx:107-114`, `App.tsx:260-267`) |
| Privacy notice version `gemini-free-demo-v1`; upload acknowledgment required (unticked default) | **verified** | live capabilities; `Upload.tsx:286-310` |
| Provider handling copy: Free tier, Google may use content to improve products, human reviewers possible, WazehTerms stores nothing but cannot promise provider zero-retention | **verified** (accurate wording) | `Upload.tsx:286-296` |
| Provider credential project `gen-lang-client-0448639879`, billing disabled, Free tier | **verified** (established earlier session; unchanged) | owner verification 2026-10-03 |
| Review expiry: 30 minutes (`REVIEW_TTL_MS` 1,800,000); relative client label, no fake countdown | **verified** | `api/src/config.ts:95`, `format.ts:60-67` |
| Reload loses review/report (memory-only); degraded states implemented | **verified** | `App.tsx:22,401-415,447-461` |
| 12 field groups / 33 field keys, stable order | **verified** | `web/src/lib/types.ts:178-228` |
| Finding categories: `document_mismatch`, `source_backed_concern`, `missing_information`, `needs_clarification`, `unable_to_determine`; mismatch requires exactly 2 evidence + code-owned `comparisonRuleKey`; only source-backed concerns may carry a citation | **verified** | `api/src/contracts/finding.ts:14-84` |
| Finding `importance`: `high/medium/low/unknown`; **UI renders an "unknown priority" chip** for `unknown` | **verified** (defect noted) | `finding.ts:53`; `Findings.tsx:229-233` |
| Stage set incl. `not_applicable`; single-doc wording "Not applicable — only one document supplied." | **verified** | prod2 artifacts (TC-014); `Findings.tsx:149-151` |
| Six fictional samples live (TC-001, 002, 012, 013, 014, 015) | **verified** | live `GET /api/v1/samples` |
| Scenario labels hardcoded per case id in client (`scenarioTag`) | **verified** | `Samples.tsx:9-26` |
| Sanity published records: **44** total (authority 2, sourceDocument 6, rule 3, contractFieldDefinition 33). Of these, **42** carry explicit `approved` + `current`; the 2 **authority** records set `reviewStatus: approved` but have no `recordStatus` field at all. The canonical runtime gate reads rules and source versions — all of which are approved+current — so the gate is unaffected. Earlier "42 vs 44 discrepancy" was an arithmetic error in this audit (2+6+3+33 = 44), now corrected; the documented "44 approved published records" stands, with the note that two authority records simply lack the status field. | **verified** (corrected 2026-10-04 after review R2) | Sanity GROQ queries 2026-10-04 |
| Approved+current rules: **3** (ae-recruitment-costs-employer-bears, ae-salary-payment-due-monthly, pk-oep-service-charges-bank-deposit), all revision 1, schemaVersion 1, primarySource set | **verified** | Sanity query 2026-10-04; `api/src/services/canonical/reader.ts` |
| Runtime eligibility: KB candidates mapped by pinpoint quote → per-request canonical read (approved+current, pinned revision, strict schema, sv≤1) → eligibility gate → display or withhold with closed reason | **verified** | `reader.ts:136-187`; `retrieval.ts:150-210` |
| Only 1 rule exercised by the corpus (recruitment costs, `triggerKey` set, regime `uae_mainland_private`); other 2 have `triggerKey: null` (pk rule regime `unknown`) and were never exercised live | **unresolved** (their runtime eligibility is untested; "one executable rule" public claim is corpus-scoped) | Sanity query; prod2 artifacts |
| Evaluation baseline (prod2, 2026-10-03): 53/53 fields, 11/11 mismatch recall, 13/13 precision, citation 1/1, 0 abstention violations, e2e p50 18.6 s / p95 21.5 s (n=15) | **verified** | `test-corpus/eval/eval-2026-10-03-prod2-review.md` |
| Prod2 saved reports carry the **pre-fix** summary wording ("the official-source check was not performed" beside a displayed citation); live app serves the corrected wording since `00018-qas` | **verified** (documented in prod2 review record) | prod2 JSONL; PR #27 |
| Source-check dates / rule effective dates recorded per citation; `effectiveTo` exists in contract but **is not displayed** | **verified** (gap noted) | `finding.ts:42-43`; `Findings.tsx:320` |
| Scope/category declaration questions (spec §4.3 `declaredRegime`/`declaredWorkerCategory`) | **intended, not implemented** — upload shows a static "Jurisdiction & Route Scope" chip instead; server infers applicability from documents | `Upload.tsx:271-283` vs spec §4.3 |
| Footer claim "personal document upload stays closed until its release gates pass" | **verified false today** (upload is enabled) — stale copy | `App.tsx:468-471` |

## 2. Page/state inventory

| Page/state | Exists | Copy quality (quick verdict) |
| --- | --- | --- |
| Home: loading / ready(upload+samples) / sample-only / samples-off / error | yes, all capability-driven | Good hero; stale "five cases"; oversold "Zero-Retention Privacy"; weak external links |
| Home: hero mockup | yes | Hardcoded example employer + salary diff; not labelled "Illustrative example" (spec wording) |
| Samples list / per-card busy / preview open | yes | Clear; testing jargon ("Interactive Testing Scenarios", "Fictional Fixtures", TC-xxx chips); no empty state (n/a while API-driven) |
| Upload: empty slots / filled / validation error / gate closed / busy | yes | Honest, strong notice copy; error strings good; all-caps eyebrow; three stacked banners |
| Extracting: pending / error(422 scan/encrypted, other) | yes | Pending copy truthful (no fake progress); error copy good for 422 |
| Review: expired / needs-check / unreadable-pages / partial-extraction / 12 groups / field cards (4 states, 2 provenance labels) / correction editor / doc viewer closed+open | yes | Core honest-state copy is good; **zero guidance layer** — groups unnumbered, states/provenance unexplained, no empty-group message, silent group hiding when a group has no fields |
| Review: reload-degraded ("Nothing to review yet") | yes | Good |
| Analyzing: pending / error | yes | Truthful; but error dead-ends (see issues 4-5) |
| Result: complete / partial / single-doc / empty-report / per-category sections / citation / coverage / next steps / actions | yes | Structure good; banners long (known); no filters/search/counts (P8 scope); absent categories silently hidden; citation `effectiveTo` not shown |
| Result: reload-degraded ("No report to show") | yes | Good |
| Reset / start-over paths | yes | **No confirmation before discarding active work** (nav Home, wordmark) |

## 3. Issue register (priority per plan §15.1; tier 1 = misleading/privacy/data-loss)

| # | Tier | Page/state | Problem | Evidence | Proposed outcome |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | Footer | Claims upload "stays closed until its release gates pass" while custom upload is live-enabled | `App.tsx:468-471` | Rewrite footer: capability-neutral wording (or capability-driven) |
| 2 | 1 | Home feature box | "Zero-Retention Privacy" heading + "no permanent document storage" oversells vs provider retention; upload notice is the accurate wording | `Home.tsx:170-175` | Align with upload notice: WazehTerms memory-only; cannot promise provider zero-retention |
| 3 | 1 | Review/global | Active review discarded without confirmation: header Home click, wordmark click call `resetCase` immediately; no `beforeunload` guard; unsaved correction edits lost silently | `App.tsx:236-243,251-259` | Confirm-before-discard + beforeunload guard while issued exists (spec §6 requires) |
| 4 | 1 | Analyzing error | Retryable failures (429/5xx, `retryAfterSeconds` already parsed) dead-end with no retry of the same proof; only "Start a fresh review" | `App.tsx:186-202,427-433`; `api.ts:39-44` | Offer "Try again" (safe replay during TTL per spec §4.6) alongside fresh-start; show Retry-After when supplied |
| 5 | 1 | Analyzing error | `422 INVALID_CORRECTION` treated as fatal review loss; spec §6 wants offending correction highlighted/undoable | `App.tsx:196-197` | Split 422: return to review, surface the correction, allow undo |
| 6 | 1 | Home + footer links | "Provider and privacy information" → generic GCP data-processing terms (not Gemini API terms); "How sources are handled"/"Source Policy" → sanity.io/docs homepage (not a source policy) | `Home.tsx:188-194`; `App.tsx:474-479` | Point to `ai.google.dev/gemini-api/terms` (matches notice) and a real in-repo/public source explanation; rename links honestly |
| 7 | 2 | Review | No way to correct an `unreadable` field at all (button hidden); plan §9 wants the limitation explained, and a user who can read the page has no path to record it | `Review.tsx:345` | Decide: allow corrected-state for unreadable (absent/unclear/user-value) or explain the block in guide copy |
| 8 | 2 | Review | "N fields need your check" counts only unclear+unreadable; `absent` fields never flagged — user can finish without noticing them | `Review.tsx:32` | Guide copy must say "Not found" items are worth a look; consider optional absent-count (P4 decision) |
| 9 | 2 | Review | Groups with zero extracted fields silently hidden (`return null`) — no "nothing was found for this group" message | `Review.tsx:231` | Render group with explicit empty message (guides copy) |
| 10 | 2 | Result | `importance: 'unknown'` renders an "Unknown priority" chip | `Findings.tsx:229-233` | Hide chip unless high/medium/low |
| 11 | 2 | Result citation | `effectiveTo` never displayed; "In force from X" can overstate currency | `Findings.tsx:320` | Show range when set ("in force from X to Y") |
| 12 | 2 | Result ordering | Findings render in API array order; no priority-first ordering (plan §8.11 requirement for P8) | `Findings.tsx:113-117` | P8: sort by importance with stable tie order |
| 13 | 2 | Result | No filters/search/result counts (plan §8.12 required — P8 scope) | `Findings.tsx` (absent) | P8 implementation |
| 14 | 2 | Upload | Combined 16 MB total limit not surfaced client-side (per-file only) | `Upload.tsx:39-48` | Add total-size hint from capabilities |
| 15 | 2 | Upload | Scope/category declaration (spec §4.3) not implemented — static chip instead | `Upload.tsx:271-283` | Owner decision: implement declaration questions (spec) or amend spec to current inference model |
| 16 | 2 | Correction editor | Default corrected-state is always "Present" (dead conditional `field.state === 'present' ? 'present' : 'present'`); no client validation on date/amount format | `Review.tsx:378,477-483` | Prefill from actual state; inline format validation |
| 17 | 3 | Result nav | Absent categories silently hidden; no compact absent-category summary (plan §8.13) | `Findings.tsx:27-29` | Compact summary line ("Not flagged: …") in P8 |
| 18 | 3 | Result actions | "Review another sample" navigates to Upload when custom upload enabled — label/destination mismatch | `App.tsx:442` | Label by destination or split actions |
| 19 | 3 | Samples | Testing jargon user-facing: eyebrow "Interactive Testing Scenarios", `TC-xxx` chips, "Downloadable Fictional Fixtures" | `Samples.tsx:43,60,111` | Reword ("Worked examples", "Sample files"); keep ids subtle |
| 20 | 3 | Home | Pipeline says "five realistic cases" — six exist | `Home.tsx:133` | Fix count (or derive from API length) |
| 21 | 3 | Home | Step 3 claims "checked UAE MOHRE and Pakistan BEOE legal citations" — loose vs actual (1 rule exercised; citations from approved rules) | `Home.tsx:147` | Rewrite to what is true ("checked against approved official sources") |
| 22 | 3 | Global | Journey naming inconsistent: Home 3 steps vs workflow bar 4 steps; guides must adopt one canon (4-step) | `Home.tsx:128-151` vs `App.tsx:296-312` | Unify in P2/P7 |
| 23 | 3 | Report partial | API limitation wording "withheld because the **cited** rule could not be fully verified" — nothing was cited to the user; "candidate/retrieved" is accurate | api report limitation strings (`api/src/services/analysis/report.ts`) | Reword API-owned string (with test updates) |
| 24 | 3 | Result coverage | "Check verified official government resources for your procedure:" awkward | `Findings.tsx:180` | Reword in copy pass |
| 25 | 3 | Everything | No guidance layer at all: no per-group help, no state/provenance legend, no glossary, no help hub (the core of this upgrade — P2–P7) | whole frontend | The upgrade itself |
| 26 | 4 | Visual | All-caps eyebrow banners; three stacked notices on upload; 6 square boxes on Home (3 pipeline + 3 features); emoji icons; heavy inline styles; taglines ("A deterministic, transparent review pipeline designed to protect workers before signing.") | `Home.tsx`, `Upload.tsx`, `styles.css` | P5 scope — recorded, not actioned now |
| 27 | 3 | Review field cards | "Original wording:" vs "What we read:" — both are extraction outputs; the pair reads as redundant and users cannot tell raw quote from typed value without help | `Review.tsx:305-315`; confirmed in `verify terms page SS open pane.png` | Rename one (e.g., "As written:" / "Read as:") or attach the state/provenance legend here (guides) |
| 28 | 3 | Review absent fields | Absent-state cards render as near-empty boxes (chip + links, no content) — a wall of empty-looking cards when many fields are absent | `verify terms page SS pdf viewer open.png` (Ending terms) | Empty-state treatment with one-line explanation ("Nothing was located on the readable pages — this is not proof of absence") |
| 29 | 3 | Review group chips | Count chips (Pay "8", Term "6") are per-document field instances, not issue counts — reads like "8 problems" | `verify terms page SS closed pane.png`; `Review.tsx:243` | Relabel or explain (e.g., "8 values" + sr-only wording); guides define |
| 30 | 3 | Result | Card-wall monotony confirmed on a mismatch-rich custom report: ~8 similar mismatch cards + ~12 near-identical "Not stated:" cards in one scroll; tiny priority pills; no grouping/filtering | `finding reports page SS.png` | P8: category layouts, priority ordering, filters/search (issues 12, 13, 17) |
| 31 | 2 | Extracting/analyzing | Late response hijacks the view: `navigate('review')`/`navigate('result')` run unconditionally in fetch `.then`, so leaving a pending screen and starting something else gets yanked back when the old request resolves. No abort-on-leave contract existed | `App.tsx:138,170,193` | R23 contract: AbortController on leave, ignore post-abort responses (P6) |

### Additions from the P4 review (R17–R23; design-level, resolved in `p4-ux-wireframes.md`)

| # | Finding | Resolution in P4 |
| --- | --- | --- |
| R17 | Help open contradicted preservation contract (confirm on help with editor open) | Drafts hoisted to Review state; help/group-switch never prompt; §6.5 matrix rewritten |
| R18 | One discard dialog reused for materially different actions | Split: leave-review confirm (full-loss copy) vs three-choice CONTINUE-WITH-DRAFT; browser Back + header Help added to the navigation contract |
| R19 | Upload acknowledgment + essential processing info inside a collapsible; provider terms mislabeled "full notice" | Ack + visible consequences + two distinct notice targets always beside the start action; only extended detail expands |
| R20 | Zero-findings design omitted the coverage gate | Three-state logic: completed+clean / zero-displayed+partial (never all-clear) / filtered-zero |
| R21 | Review responsive layout unresolved at 600–899px; viewer reserved space while closed | Viewer is an overlay sheet; closed state = workspace full width; 600–899 = chip-strip navigator; P6 validation checkpoint added |
| R22 | Corrected-card hierarchy unspecified | Corrected anatomy defined: effective value leads with copper rule + ✎ chip; original preserved; counts describe original extraction |
| R23 | Navigation during processing had no contract | Abort + reset contract defined; implemented hijack registered as issue 31 |

### Additions from the P5 review (R24–R28; resolved in `p5-visual-design.md`)

| # | Finding | Resolution in P5 |
| --- | --- | --- |
| R24 | Muted-token "passes AA everywhere" claim false — 4.21 on hover, 3.68 on active | Verified per state; permission rule: `--ink-muted` only on surface/canvas; elevated+ uses `--ink-secondary` (min 5.53); §5 requires per-background-state computation |
| R25 | InfoTip: glyph size vs hit area, caption-size popup text, no focus treatment for in-help links; R8 ambiguity | Split into InfoTip (non-interactive: 18px glyph in 40px target, secondary-body popup text, no links inside, trigger-only ring is then correct) vs HelpPanel (interactive: visible focus on all content) |
| R26 | Fixed compactness caps (≤3-line banners, single-row absent cards) risk clipping | Compact = default, never a cap; full wrapping guaranteed; only supplementary detail collapses; absent cards stack freely when needed |
| R27 | Narrow checks skipped demanding states; reflow check incomplete vs WCAG 1.4.10 | Concern/filtered-empty/technical-article narrow versions added; reflow = 320px-equivalent (1280 @ 400%), two-dimensional exceptions scoped to the PDF canvas only |
| R28 | "Complete design system" overstated; visual validation deferred without a gate | Status retitled "specification awaiting visual validation"; P6 checkpoint gate: rendered examples of uncertain evidence, correction editing, linked help, partial report, citation chain, filter reset (fixture-driven, no provider calls) reviewed before P7 expansion |

## 4. Copy audit (keep / rewrite / move / merge / remove)

**Keep (working well — reuse as the terminology anchor):**
- State labels: "Found in document / Not found on readable pages / Unclear / Could not read" (`format.ts:4-9`)
- Evidence labels: "Text matched to PDF" / "Model transcription — check the page" (`format.ts:18-21`)
- Correction attribution: "Your correction — used for analysis, not a page quote" (`ui.tsx:88`)
- Review instruction line: "Compare each value with the original page. Your changes remain labelled as yours." (`Review.tsx:58`)
- Upload privacy notice paragraph incl. "cannot promise zero retention by the provider" (`Upload.tsx:288-296`)
- Reload copy: "A reload cannot restore an in-progress review — private case data is never saved." (`App.tsx:22`)
- 422 extraction copy (scan/encrypted), expiry relative label, scope-applicability three-variant sentences (`Findings.tsx:69-75`)
- No-verdict scope card core ("does not verify employers, visas, or documents … official help may still be needed")

**Rewrite (wording wrong or stale):** issues 1, 2, 20, 21, 23, 24 above; "Interactive Testing Scenarios" → plain intro; "Downloadable Fictional Fixtures" → "Sample files"; error Notice titles ("Something needs your attention." over every error — fine, but pair with specific titles).

**Move (copy to its proper surface):** long upload warnings → compact line + guide link; upload privacy paragraph stays but gets a stable named link to the full notice; Home how-it-works → 4-step canon matching the workflow bar.

**Merge:** the three stacked upload notices (demo warning + gate-closed when applicable + privacy) → one structured panel; Home "What this does not check" + footer limits paragraph → one canonical limits statement reused in both.

**Remove:** "Zero-Retention Privacy" heading; "DEMO — FICTIONAL DOCUMENTS ONLY" all-caps eyebrow (fold into one clear line); duplicate "Demo" badge vs page eyebrow redundancy.

## 5. Strengths to preserve (P4/P5 must not regress)

1. The four-state field model with distinct labels and chips (absent ≠ unclear ≠ unreadable) — rare and honest.
2. Evidence provenance labeling (matched vs transcription) rendered on every quote.
3. Correction attribution end to end (CorrectionQuote label + report "Part of this difference comes from your correction").
4. Capabilities-driven UI everywhere (gates, limits, notice version — nothing hardcoded that should be live).
5. Accessibility foundation: skip link, focus-to-h1 on view change, focus restore from doc pane, `role="status"`/`role="alert"`, keyboard-operable dropzones, `aria-pressed`/`aria-expanded`, sr-only group counts.
6. Truthful pending states (no fabricated progress) and honest reload-degraded states.
7. Workflow bar 4-step with done/active states.
8. Upload notice accuracy about the provider (the bar Home/footer must rise to).

## 6. Release/test baseline ("before" reference)

- Deployed: `wazehterms-00018-qas` @ 100% traffic; includes PR #27 summary-accuracy fix; live health verified 2026-10-04.
- Eval: prod2 (2026-10-03) — 53/53 field accuracy, 11/11 mismatch recall, 13/13 precision, citation 1/1 signed, 0 abstention violations, e2e p50 18.6 s / p95 21.5 s (n=15).
- Frontend tests: Vitest render tests (`web/src/views/phase11.render.test.tsx`); API lint/typecheck/test suites green at last full run (2026-10-03 submission-prep).
- The UI changes from P4 onward are presentation-layer only; per plan §14.5 they do **not** require re-running the live model evaluation unless extraction inputs, report semantics, or eligibility change.

## 7. Screenshot baseline (owner-captured, `public/screenshots/`, deployed `00018-qas`)

| File | State captured | Audit use |
| --- | --- | --- |
| `homepage SS.png` | Home full scroll: hero, mockup, 3+3 boxes, scope card, footer | Confirms issues 2, 6, 20, 22, 26; footer stale claim visible |
| `fictional sample page SS.png` | All six sample cards with scenario badges | Confirms issue 19 (eyebrow, TC-xxx chips) |
| `upload page SS.png` | Upload: slots, scope card, privacy notice, acknowledgment, CTA | Confirms issues 14, 15, 26 (three stacked banners) |
| `verify terms page SS closed pane.png` | Review, viewer closed, groups collapsed with count chips, expiry + Clean extraction chips | Confirms issues 8, 29; shows custom-upload workflow chip |
| `verify terms page SS open pane.png` | Employer group open: field cards, state chip, evidence quotes, action links | Confirms issue 27; shows evidence-label density |
| `verify terms page SS pdf viewer open.png` | Document pane open with rendered PDF, role tabs, page chip; Ending terms absent-state cards | Confirms issues 7, 28 |
| `finding reports page SS.png` | Full partial report: overview, partial banner, attention nav, mismatch card wall, missing-info card wall, clarification, coverage, next steps | Confirms issues 12, 13, 17, 30 |

**Not captured (residual):** extraction/analysis pending states, extraction error, review expired state, reload-degraded states, upload validation error, narrow-screen/mobile rendering. Capture during P4/P5 validation or via Playwright after session reload.

## 8. Open items

1. **Residual:** error/expired/pending + mobile captures (see §7).
2. **Owner decisions surfaced (for P2):** issue 7 (correctability of unreadable fields), issue 15 (implement scope/category questions vs amend spec §4.3), issue 6 link targets. *(The 44-vs-42 item is resolved — see the corrected fact-sheet row; the documented 44 stands.)*
