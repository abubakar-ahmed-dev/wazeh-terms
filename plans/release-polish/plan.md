# Release Polish — Comparison Fixes, Content Expansion, Documentation, and Operational Readiness

Status: planned (not started). Branch for implementation: `release-polish`
from `dev`, PR into `dev` (per the branch-per-phase workflow). No work on
`main` directly. Authority: `docs/PRD.md` targets, `docs/TESTING.md` §3/§5,
`docs/SOURCES.md` approval procedure, `docs/DATABASE_SCHEMA.md`, and
`plans/phase-15/replanning-items.md` (root causes recorded there are the
input to WI-1–WI-4).

## 1. Goal and scope

Close the known quality and presentation gaps left after Phase 15 so the
deployed product is accurate, content-rich, well-documented, and
operationally steady for public traffic:

1. Fix the comparison defects that produce visible false findings.
2. Re-measure the corpus honestly and close the pending evidence review.
3. Expand approved rule-backed content and demonstrate conflicting sources.
4. Restructure documentation around the Sanity Context / Knowledge Base
   architecture and add a zero-credential local demo path.
5. Record a full browser-journey validation and a product walkthrough video.
6. Finish repository hygiene and operational readiness for a public window.

## 2. Current verified state

- Live deployment: revision `wazehterms-00009-stc`, sample mode ON, demo
  upload ON (fictional only, notice `gemini-free-demo-v1`).
- One approved rule (`ae-recruitment-costs-employer-bears`) with a verified
  Article (6)(4) pinpoint on the live path; 44 approved published records;
  KB `kbynAP4r8P6m`.
- Phase 15 evaluation achieved field accuracy 46/49, mismatch recall 8/13,
  precision 6/28 human-adjusted, citation 1/1 pending owner confirmation,
  zero abstention violations. Four owner sign-offs open in
  `test-corpus/eval/eval-2026-10-02-review.md`.
- Six replanning items recorded in `plans/phase-15/replanning-items.md`,
  including: comparison explanations/evidence attached to the wrong field;
  `document_reference` over-firing (13 false mismatches); conditional seeds
  emitted as evidence-less mismatches; `deduction_item` vs `recruitment_cost`
  registry mismatch on TC-012; TC-014 "unreadable" page label vs live
  behavior; fixture PDF drift from corpus bytes.
- Full browser journey on the live URL still unrecorded (HTTP-level smoke
  only). `e2e-server.ts` provides a fake-Gemini zero-credential local path
  that is undocumented. `sources/` is untracked with its own committed-vs-
  local rules in `sources/README.md`. Root license is `UNLICENSED`.

## 3. Work items

### WI-1 — `document_reference` comparison policy fix

Root cause: offer/contract reference numbers (receipt, offer, contract
identifiers) differ by design, yet the comparison emits `document_mismatch`
for them (13 false findings in Phase 15).

- Classify reference/identifier field keys as metadata, not comparable
  substantive terms. Options: (a) exempt field keys in the comparison
  module via the field registry; (b) downgrade to an informational note
  category. Choose (a) as default unless the registry already distinguishes
  metadata; keep the decision recorded in the implementation log.
- Preserve mismatch behavior for substantive terms (salary components,
  benefits, dates, duration) — no regression on the existing two-sided
  unequal-component tests.
- Files: comparison module in `api/src` (comparison/analysis service), field
  registry types, comparison unit tests, affected corpus truth notes if
  expectations change.
- Validation: comparison unit suite, corpus dry run (`run-eval.ts
  --mode=dry`), precision delta recorded.

### WI-2 — Evidence/explanation misattachment fix

Root cause: a mismatch finding carried the explanation and document
evidence of a different field (start_date finding with payment-frequency
evidence).

- Bind each finding's `explanation` and `documentEvidence` to the exact
  compared `(fieldKey, instanceId)` pair that produced it. Add a unit test
  asserting explanation/evidence provenance for every emitted finding.
- Preserve original excerpts and page references exactly as extracted
  (no normalization of quotes).
- Files: comparison + report assembly in `api/src`, tests.
- Validation: unit suite, corpus dry run, spot-check TC-001/TC-002 findings.

### WI-3 — Conditional-seed routing to `needs_clarification`

Root cause: conditional wording (TC-010/TC-011) was emitted as evidence-less
`document_mismatch` instead of `needs_clarification`.

- Route conditional/incomplete/annex-pointing wording to
  `needs_clarification` per the finding taxonomy; never emit a mismatch
  without two explicit readable passages.
- Files: comparison module, report assembly, tests for TC-010/TC-011
  expectations.
- Validation: unit suite, corpus dry run; precision/recall effect recorded.

### WI-4 — Field-registry alignment (`deduction_item` vs `recruitment_cost`)

Root cause: TC-012 truth uses a key the registry treats differently, so the
finding lands under the wrong field family.

- Decide (with owner, see §7) whether to align the registry key or the
  truth annotation. If the registry changes, update `DATABASE_SCHEMA.md`'
  active field registry and the schema component tests.
- Files: registry/schema types, `test-corpus/TC-012/truth.json` (versioned
  bump), schema tests, scorer expectations if keys change.
- Validation: schema unit suite, corpus dry run, TC-012 re-score.

### WI-5 — Evaluation rerun, evidence ledger, and sign-off closure

Depends on WI-1–WI-4. Follow the Phase 15 procedure
(`plans/phase-15/plan.md` §1–§4) with a new freeze manifest version:

- Regenerate/verify fixtures if drift is confirmed (replanning item #6);
  record the fixture revision in the freeze manifest.
- Dry-run harness proof, then one paced production run (owner quota
  approval; resume via JSONL; retry discipline unchanged).
- Score, produce human review bundles, update `docs/TESTING.md` §3 ledger
  row (new build, numerators/denominators, conditions, open failures).
- Resolve replanning item #5 (TC-014 abstention labeling vs live behavior):
  either correct the label procedure or the runtime, and record which.
- Close the four pending owner sign-offs from the 2026-10-02 review record
  (or supersede them with the new run's review record).
- Update the README results block to the new honest numbers; targets stay
  targets; keep the 15-sample uncertainty statement.
- Validation: full eval artifacts (`results-*.jsonl`, `eval-*.json`, review
  record) committed under `test-corpus/eval/`.

### WI-6 — Approved rule content expansion

Add 3–5 additional approved, current, pinpointed rules so multiple samples
exercise Knowledge Base retrieval. **Owner approval is the gate; no rule is
created from a candidate alone** (`docs/SOURCES.md` procedure).

- Candidate areas (proposals only, each needs the full source-check
  procedure and owner approval): probation-period terms, notice period,
  overtime wording, contract duration, end-of-service/gratuity reference,
  additional worker-cost allocations.
- Per rule: source check with recorded provenance (dated capture rules in
  `sources/README.md` apply), official version + pinpoint, actor/scope/
  conditions/effective dates, owner approval, Sanity records
  (`authority`, `sourceDocument`, immutable `rule` revision) per
  `DATABASE_SCHEMA.md`, programmatic content validation
  (`npm run validate:content -w api`).
- Then: refresh the KB, run the live known-answer check per rule
  (`docs/TESTING.md` §5 — a refresh issue with a stale live entry is not
  pass evidence), and add/adjust a demo case that exercises each new rule
  end to end through the live path.
- KB budget: confirm the filtered approved-projection stays within the
  Knowledge Base document limit after additions; record the count.
- Validation: retrieval/content layer tests, live MCP known-answer per new
  rule, one signed live-path run per new demo case.

### WI-7 — Conflicting-source demonstration

Depends on WI-6 (needs at least two eligible approved sources that actually
conflict, e.g. superseded guidance versus the current law).

- Verify/extend the `applicability: conflicting` path so the report shows
  **both claims side by side, each with its source, version, and pinpoint**,
  plus the resolution basis (e.g., temporal applicability / later
  instrument), with no invented citation and no overall verdict.
- If the existing implementation cannot surface both claims in the report
  UI, extend report assembly + the findings view; this stays within the
  existing report contract unless a schema change is required — if it is,
  update `docs/API.md` first.
- Add a corpus case with expected two-claim output; add retrieval/content
  and report tests.
- Validation: report/E2E layer tests, live-path run of the conflict case,
  browser check of the side-by-side display.

### WI-8 — Public adversarial sample

Add one TC-015-style adversarial/injection case to the public sample
allowlist (five become six).

- Files: sample manifest/allowlist in `api/src` (content samples), fixture
  generation if the corpus case needs regeneration, samples view in `web`,
  allowlist tests.
- Keep the visibly-fictional labeling rules; capabilities unchanged.
- Validation: API sample tests, browser pass on the samples page, the
  abstention assertions for the case.

### WI-9 — Documentation restructure

- README: new leading section presenting the Sanity Context + Knowledge
  Base architecture — diagram of the analysis path (extraction →
  deterministic comparison → KB-only MCP retrieval → canonical approved-rule
  verification → fail-closed concern), why keyword search is insufficient
  (approved revision, exact version + pinpoint, actor/scope/conditions/
  temporal checks, abstention), and a KB/Dashboard screenshot.
- README: document the zero-credential local demo path
  (`api/scripts/e2e-server.ts` + corpus fixtures + dry-run eval commands)
  with the exact commands.
- README: compress the phase-numbered "Latest Verification Snapshot" into
  outcome statements; keep the not-yet-complete list accurate.
- `docs/BLOG.md`: cover the content system (approved rules, pinpoints,
  conflict handling) with screenshots.
- Contract docs: no API/schema change expected from WI-1–WI-3; if WI-4 or
  WI-7 changes a contract, update `API.md`/`DATABASE_SCHEMA.md` in the same
  change set (docs and code together, per repository rules).
- Validation: docs review against live `/api/v1/capabilities` and actual
  behavior; links resolve; no secrets in screenshots.

### WI-10 — Repository hygiene

- `sources/`: decide tracked vs ignored. Its own README says link lists and
  inventory metadata may be committed while captures stay local. Either
  commit the permitted files or extend `.gitignore`; do not leave it
  untracked-and-ambiguous.
- License: owner decision — keep `UNLICENSED` or apply a distribution
  license; record the decision and rationale (external usage requirements
  govern; see §7).
- Sweep for stray files at the repo root; confirm no secrets, no `.env`,
  no captures in the tree.
- Validation: `git status` clean after the decision; secrets audit grep.

### WI-11 — Full browser journey on the live deployment

- Scripted pass covering: home → samples (all, including new ones) →
  extraction progress states (20 s wait must communicate activity) →
  review/evidence display → correction flow → analysis → findings with
  citations → partial/abstention states → demo upload consent flow with a
  fictional PDF → mobile viewport + keyboard navigation.
- Prefer Playwright; a manual scripted pass is acceptable if automation is
  impractical, recorded step by step in the testing log.
- Close the open "browser journey unrecorded" item in README.
- Validation: recorded evidence in `plans/release-polish/testing-log.md`;
  any defect found gets a fix + retest before WI-12.

### WI-12 — Product walkthrough video

Record after WI-5/WI-6/WI-7/WI-8/WI-11 so the video shows final state.

- Script beats: (1) problem and journey; (2) mismatch finding with both
  quotes and page references; (3) official pinpoint citation, click-through
  to the source; (4) adversarial sample + abstention honesty; (5) content
  system segment: Dashboard/KB entries linked to sources, live retrieval
  evidence, and the supersede-a-rule demonstration — a rule flipped to
  superseded in Studio makes the live concern disappear, showing structure
  is load-bearing; (6) close on the evaluation ledger and honest limits.
- Production notes: no secrets, no tokens, no real documents; fictional
  samples only; captions where narration is used.
- Owner review of the script and the cut before it is published anywhere.

### WI-13 — Operational readiness for a public window

- Decide `min-instances` during high-attention windows (cold start vs cost);
  owner approves the change; revert plan recorded.
- Verify Gemini quota/credit headroom and the spending alert; record the
  check procedure for the window (quota exhaustion = every extraction 503s).
- Re-run the rollback drill on the final revision; verify
  `status.traffic` pinning after the deploy (recorded operational lesson).
- Confirm incident contact record and `docs/DEPLOYMENT.md` §4 release row
  for the new revision; update the demo-upload notice fields if anything
  in the release changes them (expected: unchanged).

## 4. Sequencing and dependencies

```
WI-6 (start first — owner source approvals are the long pole)
WI-1 → WI-2 → WI-3 → WI-4 → WI-5
WI-8 (independent, early)
WI-7 (after WI-6)
WI-9 (after WI-5; content section after WI-6/WI-7)
WI-10 (anytime)
WI-11 (after code fixes + new content are deployed in one revision)
WI-12 (after WI-11)
WI-13 (last, and before any high-attention public window)
```

Deploy once after WI-1–WI-8 are complete (single new revision), then run
WI-11 against it. Avoid revision churn.

## 5. Non-goals

- Real employment document enablement (stays excluded; separate future
  release on a paid provider path).
- JPG/PNG input and Urdu explanation gates (independent, unchanged).
- Accounts, sessions, saved reports, or persistent storage (ADR boundary
  stands; a superseding ADR would be required).
- Provider migration or retention-behavior changes.
- Any change to the demo-upload notice or `privacyNoticeVersion`
  (expected unchanged this cycle).
- Interactive free-form "ask the knowledge base" querying: candidate future
  feature; requires its own accepted ADR + dedicated plan before any
  implementation. Explicitly out of scope here.
- No new infrastructure or dependencies without clear need.

## 6. Risks

| Risk | Mitigation |
| --- | --- |
| Comparison policy change suppresses genuine mismatches | Keep two-sided unequal-component regression tests green; corpus dry run gates every comparison change |
| Source verification rejects candidate rules → thin content expansion | Owner early review of candidates; acceptable floor is ≥2 eligible sources so WI-7 conflict demo remains possible |
| KB refresh leaves a stale live entry | Per `TESTING.md` §5: verify the live entry after refresh; fail the item if the stale entry is what serves |
| Production eval consumes quota | Owner approval before the run; paced, resumable, retry-with-backoff runner unchanged from Phase 15 |
| Fixture regeneration drifts the frozen corpus | Version the corpus + freeze manifest; never silently overwrite frozen expectations |
| Single-deploy batching delays a security-relevant fix | If a fix is urgent, deploy it alone; do not hold correctness fixes hostage to batching |
| Video records a state that later changes | Record last, re-record the changed segment if a late fix lands |

## 7. Owner decisions / touchpoints

1. Approve candidate rules for WI-6 and each source record (per
   `docs/SOURCES.md`); approve the conflicting-source pair for WI-7.
2. WI-4: registry-key vs truth-annotation alignment decision.
3. WI-5: production eval quota spend approval; final sign-off on the new
   ledger row and README results wording (supersedes the four open
   2026-10-02 sign-offs).
4. WI-10: license decision (keep `UNLICENSED` vs apply one) and
   `sources/` tracking decision.
5. WI-12: script + final cut review.
6. WI-13: `min-instances` cost approval; confirm monitoring/alert state.
7. Carry-over: any demo-upload posture change (none planned).

## 8. Exit criteria

- All comparison fixes landed with regression tests; corpus re-run shows
  improved precision/recall with numerators/denominators published and
  open failures listed.
- ≥3 approved rules live with verified pinpoints, each exercised by a demo
  case through the live path; one conflicting-source case showing both
  claims with sources in the report UI.
- Adversarial sample public; samples page, allowlist, and tests updated.
- README restructured (architecture lead, zero-credential demo path,
  outcome snapshot); blog updated; contract docs aligned to any change.
- Hygiene items closed (license decision recorded, `sources/` disposition,
  clean status).
- Browser journey recorded on the live deployment including mobile and
  keyboard checks; defects fixed and retested.
- Walkthrough video recorded and owner-reviewed.
- Operational items done: rollback drill on the final revision, traffic
  pinning verified, quota headroom checked, `min-instances` decision
  recorded, release row updated in `docs/DEPLOYMENT.md` §4.
- Standard gates green at each merge: lint, typecheck, unit/API tests,
  build; corpus dry run for comparison changes; live smoke for the new
  revision.
