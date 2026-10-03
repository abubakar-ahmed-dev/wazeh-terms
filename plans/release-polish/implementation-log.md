# Release-polish — implementation log

Branch: `release-polish` (working-tree changes only — **no commits, no
pushes** per owner instruction for this pass). Base: `main` @ `b24e2d3`
(content-identical to `dev` @ `3365ff7`; `dev` is one merge behind).

## Recovered stranded Phase 15 work (found on start)

Commit `1b3453c` (production eval results, evidence ledger, review record,
replanning items, phase logs, docs alignment) existed **only** on branch
`phase-15-results` — never merged, contradicting the earlier "merged to
dev + main" claim. Its files were restored into this working tree via
`git checkout 1b3453c -- <paths>` (no commit). The branch itself remains
for the owner to merge or discard.

## WI-1 — expectedToDiffer comparison policy (DONE)

- `api/src/contracts/field-registry.ts`: new `expectedToDiffer` flag; set on
  `document_date`, `document_reference`, `verification_reference`,
  `annex_reference` (15 policyExempt metadata findings in the 2026-10-02
  run per the rescored artifact — an earlier "17" here and in commit
  `5afa079` was an estimate; superseded).
- `api/src/compare/compare.ts`: mismatch emission skipped for these fields
  (single + defensive repeatable guard); still counted in
  `checkedFieldKeys`. `signature_presence`/`document_language` stay
  must-match.
- `api/src/corpus/score.ts`: `policyExempt` counter — such findings in
  pre-fix runs are neither errors nor in the precision denominator;
  abstention `falseMismatches` uses the same filter. Bundle indices stay
  aligned to `report.findings`.
- `docs/DATABASE_SCHEMA.md` §7: policy documented.

## WI-2/WI-3 — misattachment + conditional routing (CLOSED as review errors, pinned)

Re-inspection of `results-2026-10-02.jsonl` contradicted four first-pass
human verdicts (TC-009 ×2, TC-010, TC-011): explanations and evidence are
correct in the data; "evidence-less" claims were wrong. No engine bug.
`api/test/release-polish/comparison-policy.test.ts` pins:
explanation↔fieldKey↔evidence consistency (multi-field), explicit→conditional
benefit = documented mismatch, conditional-vs-conditional wording =
`needs_clarification`.

## WI-4 — truth rebaseline (DONE; owner ratification pending)

- TC-001/003/004/005: removed phantom seeds (sample-text identical across
  documents; cases remain consistent pairs).
- TC-012: seed + expectedFields `deduction_item` → `recruitment_cost`;
  expected value corrected to one-time/worker-paid per stated text;
  `source_backed_concern` allowed with `requiredRuleRefs` =
  `ae-recruitment-costs-employer-bears` rev 1; `no_rule_claims` superseded.
- TC-006/007: added real `stated_total_pay` / `allowance_item` seeds +
  expectedFields + evidence line refs (real textual differences the run
  reported correctly).
- `api/src/corpus/truth-schema.ts`: `requiredRuleRefs` widened from frozen
  `z.never()` to `{ruleKey, ruleRevision}` objects (non-breaking, schema
  stays v1).
- Corpus regenerated (`npm run generate:corpus -w api`): PDFs byte-identical,
  TC-012 fixture updated, others EOL-only.

## WI-5 — evaluation (dry-run + rescore DONE; production re-run = owner quota approval)

- Dry run on corrected engine + rebaselined truth: **15/15 cases, 53/53
  field accuracy, 11/11 recall, 12/12 precision, 0 abstention violations**
  (`eval-rp-dryrun3.json`).
- Production 2026-10-02 outputs rescored under amended truth + policy:
  **52/53 (98%), 11/11 (100%), 13/13 (100%) substantive**, citation 1/1
  structural (owner sign-off pending), 0 abstention violations, 0 false
  mismatches, 0 hallucinated quotes (`eval-2026-10-02-revised.json`).
- `run-eval.ts`: `--results=` and `--freeze=` params for rescoring.
- Records: addendum in `eval-2026-10-02-review.md`; revised ledger row in
  `docs/TESTING.md` §3; README results block updated; replanning items
  annotated with final statuses.

## WI-8 — sixth public sample (DONE)

- `fixtures/samples/TC-015/` (offer.pdf, contract.pdf copied from corpus).
- Manifest entry ("Fictional adversarial instructions") + `Samples.tsx` tag.
- Six-sample wording across `docs/TESTING.md` §1/§4, `docs/FRONTEND_SPECIFICATION.md`,
  README, Dockerfile comment; tests updated (production-samples, five-sample
  flow → six) and green.

## WI-9 — documentation (DONE)

- README: new "Built on Structured Content" section (flow diagram,
  applicability/versioning/conflicts vs keyword search, KB-only endpoint,
  zero-credential local demo commands), compressed phase-numbered snapshot
  into outcome statements, corrected results block.
- `docs/BLOG.md`: new "Built on Structured Content" section; six-sample and
  measured-results updates.

## WI-10/WI-6/WI-12/WI-13 — prep artifacts (owner inputs required)

- `plans/release-polish/rule-candidates.md` (WI-6 kickoff; owner approvals
  gate all rules).
- `plans/release-polish/video-script.md` (WI-12; record after deploy).
- `plans/release-polish/ops-readiness.md` (WI-13 checklist; includes
  pending hygiene actions: commit `sources/` permitted files, license
  decision).

## Validation (actual results)

- API: lint clean, typecheck clean, **54 files / 342 tests passed** (one
  transient parallel-load flake in `security/zero-retention` passed on
  isolated rerun, matching the known pattern).
- Web: lint clean, typecheck clean, 5/5 tests, production build ok.
- Corpus regeneration determinism asserted by the Phase 07 suite.
- Not done (blocked or owner-gated): production eval re-run (quota
  approval), live browser journey + deploy (no commits/pushes this pass),
  KB screenshot for README (owner capture), video recording.

## Decisions taken (flag for owner ratification)

1. Truth rebaseline set (WI-4) — documented human re-inspection performed;
   TESTING.md §5 rebaseline rule satisfied procedurally, ratification open.
2. Metadata exemption policy (WI-1) + scorer `policyExempt` treatment.
3. TC-015 joins the public sample set; docs updated to "six".
4. Phase-15 `phase-15-results` branch left in place for owner merge.
