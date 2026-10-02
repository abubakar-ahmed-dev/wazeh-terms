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
2. **`document_reference` comparison policy** — offer/contract reference
   numbers differ by design; comparison must exempt expected-to-differ
   metadata fields (or the corpus must seed them). Affects precision (13
   false mismatches in the run).
3. **Conditional-seed routing** — seeded `conditional` differences should
   produce `needs_clarification`, not evidence-less `document_mismatch`
   (TC-010/011).
4. **Field-registry alignment** — worker-charge clause emitted as
   `recruitment_cost` while truth labels `deduction_item` (TC-012): either
   the registry needs the mapping or the truth annotation moves.
5. **Abstention labeling vs live extraction** — TC-014's synthetic
   "unreadable" page is readable to the live model. Decide: redesign the
   page (image-only content) or relabel truth; affects the abstention story
   for real scans later.
6. **Fixture regeneration** — bundled `fixtures/samples/` PDFs drifted from
   `test-corpus/` PDFs; regenerate copies (or assert regeneration
   determinism) to restore the Phase 07 byte-identical claim.
