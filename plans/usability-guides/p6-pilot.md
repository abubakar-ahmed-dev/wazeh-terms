# P6 — Pilot: one complete sample journey (WazehTerms usability upgrade)

**Scope:** implement the P4/P5 design for ONE end-to-end journey —
Samples → Extracting → Review (navigator + workspace + correction + help) →
Analyzing → Report — plus the guardrails the journey depends on (discard
guards, abort-on-leave, analysis retry, invalid-correction recovery). Fix
what the pilot exposes; then the pattern is approved for P7 spread.

**Not in P6:** Help hub/article full build (pilot serves only the articles
its own links target, at full-section depth — see R31 rule), **Home page
redesign including the 4-step strip (P7** — scope clarification; P6 touches
only App-owned chrome: workflow-bar canon labels + footer capability-neutral
copy, which the journey needs to be truthful), Urdu/image gates, report
filter polish beyond the spec'd controls.

**P6 exit gate (plan §13.2 P6 + P5 review R28):** automated checks green +
rendered-fixture evidence of the six difficult states (uncertain evidence,
correction editing, linked help, partial report, citation chain, filter
reset) **each captured on desktop AND narrow (360px + the 320px-equivalent
reflow check, R27)** + preservation-matrix behaviors covered by tests
(including R30's journey contract); browser/keyboard/mobile pass recorded
(Playwright after session reload, or owner-assisted manual pass) — recorded
in testing-log; anything broken fixed before P7.

## Work order

1. `web/src/content/guides.ts` + `glossary.ts` — registry with pilot units
   (short-variants as source); integrity test.
2. `web/src/ui.tsx` — `InfoTip`, `StepIntro`, `GuideLink`, `EmptyMessage`,
   `Legend`, `HelpPanel`, `ConfirmDialog`, icon set; a11y tests.
3. `web/src/views/Review.tsx` — full P4 §6 rework (navigator, single-group
   workspace, overlay viewer, hoisted drafts, corrected card, numbering,
   legend, dialogs); tests per preservation matrix.
4. `web/src/views/Findings.tsx` — P4 §7 rework (priority-first, filters,
   card anatomies, three zero-states, slim banner); fixture-driven tests
   covering the R28 states.
5. `web/src/App.tsx` — issue 31 abort, issue 4 retry, issue 5 422 path,
   guards (§6.5), workflow-bar canon labels, `/help` route + minimal
   article view; tests.
6. `Upload.tsx` (R19 ack rework), `Samples.tsx` (jargon fixes), `styles.css`
   additions (P5 tokens + components; touched components only). **Home page
   redesign is P7** — P6 only fixes App-owned chrome (workflow bar labels,
   footer copy).

## R30 — journey-state contract (test contract; extends P4 §6.5 to pending states)

| Action | Contract |
| --- | --- |
| Open help / document viewer during review | preserve everything; never prompt (R17) |
| Temporarily leave a view (header nav) **with an active review** | leave-confirm first; confirm = full reset (abort in-flight analysis, revoke previews) |
| Navigate away during **extracting/analyzing** | AbortController abort + case reset, **no prompt** (nothing user-authored exists yet beyond file choice); honest copy: "Your request was cancelled here. Processing on the provider's side may still complete." |
| Start another case while one is in flight | new request supersedes: a **journey generation counter** guards every async continuation — a stale response never mutates state or navigates (issue 31) |
| Analysis **retry** | re-POSTs the *same* `issued` + `proof` + `corrections` snapshot; client-side expiry check first (expired → expired path, no request); retry button disabled while a request is in flight (no duplicate submissions); server replay rules unchanged (TTL) |
| Deliberate abandon (Start over / confirm-leave) | reset + abort + revoke blob URLs |
| Cancellation copy | promises only client behavior: request cancelled **here**; provider-side processing may still complete — never "processing stops" |

Tests: stale-response-ignored (fake timers + two journeys), retry-no-duplicate,
retry-after-expiry-does-not-fire, abort-on-leave resets, viewer/help preserve.

## R31 — pilot help content rule

Every `/help/...` link that ships in the pilot registry **must resolve to a
served article section with full-section depth** — short variants are for
contextual help only, never link targets. Pilot-served articles (content from
the P3 drafts, review-hardened): `checking-terms` (complete U4),
`reading-findings` (complete U5), `evidence-and-sources` (complete U6),
`scope-and-privacy` (#your-data section at full depth; full article is P7).
The doc router renders exactly these; the registry-link integrity test fails
if any registry link targets an unserved path or missing anchor. Links to
articles outside this set must not ship in the pilot registry.

## R29 — corrected-copy traceability

The implementation baseline is the **review-hardened** drafts (R1–R16
applied to `drafts/`), P4 §6.5/§6.3 (R17/R18 interactions), P5 (R24–R28).
Mapping lives in `audit/p1-baseline.md` (issue register + R17–R28 resolution
tables); each corrected requirement below is enforced by a named test:

| Corrected requirement | Enforcing test |
| --- | --- |
| Copy law (no verdict words; "safe" only in negation) | `guides.test.ts` copy-law |
| Empty-group messages state-specific, never promise a category (R11) | `guides.test.ts` emptyGroupTipId |
| Help preserves drafts without prompt (R17) | `ui.interactions` HelpPanel non-modal + upcoming Review draft tests |
| Tab never steals focus; link-tips are dialogs (R8/R25) | `ui.interactions` InfoTip |
| Discard dialogs state distinct consequences (R18) | `ui.interactions` ConfirmDialog |
| Zero-findings three-state logic (R20) | Findings tests (step 4) |
| Absolute-retention ban (R10) | glossary expiry test + copy-law sweep |
| Priority = reading order, no unknown chip (R15/R10) | Findings tests (step 4) |
7. Validate: lint, typecheck, vitest; record; open P6 issues list.

## Contracts honored

- Copy source of truth: `drafts/short-variants.md` (registered verbatim
  where feasible).
- No API contract changes; findings data untouched (presentation only).
- No new dependencies; no browser storage; capabilities-rendered limits.
- All P1 issues with P6 flag: 3, 4, 5, 10, 14, 17, 18, 19, 20, 21, 24, 27,
  28, 29, 31 (in-scope for the pilot surfaces); others wait for P7.
