# Phase 15 — Replanning items (contract/engine changes surfaced by the eval)

From `test-corpus/eval/eval-2026-10-02-review.md`. Each needs either a
superseding contract note or an engine fix in a future planned phase —
none are silent extensions.

1. **Comparison explanation/evidence template mismatch** — a mismatch
   finding's explanation and evidence can belong to a different field than
   `fieldKeys` claims (TC-009 start_date carried a payment-frequency
   explanation; TC-009 contract_duration carried start-date evidence).
   Fix belongs in the compare draft assembly; needs tests pinning
   explanation ↔ fieldKey ↔ evidence consistency per finding.
   **Status (release-polish):** re-inspection of the production JSONL showed
   the misdescribed findings do not exist in the data — verdicts 6–7 were
   first-pass review errors (see the addendum in
   `test-corpus/eval/eval-2026-10-02-review.md`). Consistency is now pinned
   by `api/test/release-polish/comparison-policy.test.ts`. No engine bug.
2. **`document_reference` comparison policy** — offer/contract reference
   numbers differ by design; comparison must exempt expected-to-differ
   metadata fields (or the corpus must seed them). Affects precision (13
   false mismatches in the run).
   **Status (release-polish): FIXED** — registry `expectedToDiffer` on
   `document_date`, `document_reference`, `verification_reference`,
   `annex_reference`; comparison never emits them; scorer counts them
   `policyExempt`. Authoritative count for the 2026-10-02 run: **15**
   (an earlier note and the fix commit message said 17 — an estimate from
   the first-pass breakdown that mixed metadata with duplicate and
   forbidden-category reasons; superseded by the rescored artifact).
3. **Conditional-seed routing** — seeded `conditional` differences should
   produce `needs_clarification`, not evidence-less `document_mismatch`
   (TC-010/011).
   **Status (release-polish): CLOSED as review error** — the run's TC-010
   finding is a real explicit difference and TC-011 carries two matched
   passages with a truth-allowed category. Existing behavior is correct and
   now pinned by tests (explicit→conditional = mismatch; conditional-vs-
   conditional wording = `needs_clarification`).
4. **Field-registry alignment** — worker-charge clause emitted as
   `recruitment_cost` while truth labels `deduction_item` (TC-012): either
   the registry needs the mapping or the truth annotation moves.
   **Status (release-polish): FIXED** — truth rebaselined to
   `recruitment_cost` (registry-correct; value corrected to one-time
   worker-paid per the stated text), `source_backed_concern` allowed with
   `requiredRuleRefs`, `no_rule_claims` superseded. Also removed phantom
   seeds on TC-001/003/004/005 and added the real TC-006/007 seeds.
   Owner ratification pending.
5. **Abstention labeling vs live extraction** — TC-014's synthetic
   "unreadable" page is readable to the live model. Decide: redesign the
   page (image-only content) or relabel truth; affects the abstention story
   for real scans later.
6. **Fixture regeneration** — bundled `fixtures/samples/` PDFs drifted from
   `test-corpus/` PDFs; regenerate copies (or assert regeneration
   determinism) to restore the Phase 07 byte-identical claim.
   **Status (release-polish): partial** — corpus regenerated deterministically
   after the truth rebaseline (PDFs byte-identical; the Phase 07 suite
   passes). The bundled `fixtures/samples/` copies were NOT touched in this
   pass; verify separately before the next deploy.
