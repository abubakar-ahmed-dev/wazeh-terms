# Walkthrough video script (WI-12) — owner review required before recording

Target length ≈ 3 minutes. Record AFTER the release-polish revision is
deployed and the browser journey (WI-11) passes, so the video shows final
state. Fictional samples only; no tokens, secrets, real documents, or
personal information in any frame. Captions for narration.

## Beats

1. **Problem (≈20 s).** Two documents, one job. The offer and the contract
   can disagree — salary, benefits, who pays what. Reading them side by side
   by hand is exactly where people sign on wording they never saw.
2. **Evidence-first review (≈30 s).** Open the salary-difference sample
   (TC-002). Show the finding: both passages, page numbers, the two values.
   Correct a value in the review screen; original stays visible and signed.
3. **Official citation (≈30 s).** Open the worker-charge sample (TC-012).
   Show the source-backed concern: UAE Federal Decree-Law 33/2021,
   Article (6) clause (4), the quoted passage, the official source link.
   Point out this appeared only after the Knowledge Base retrieval AND the
   canonical approved-record verification both completed.
4. **Honest limits (≈30 s).** Open the missing-terms sample (TC-013):
   notice period absent from both documents → a missing-information
   finding, with absence never presented as denial. Then the
   single-contract sample (TC-014): one document means no comparison, and
   the report says exactly what a one-document check cannot determine.
   Then the adversarial sample (TC-015): embedded instructions are treated
   as data — nothing injected, nothing obeyed.
5. **Structured content is load-bearing (≈60 s).** The key segment:
   - Sanity Dashboard: the KB entries, each linked to its source.
   - The approved rule record: revision, source version, pinpoint, scope.
   - Why not keyword search: relevance is easy; applicability (jurisdiction,
     worker category, actor, dates, current version) is structure. Fail
     closed when the structure does not confirm.
   - Content-decides evidence, stated carefully: the eligibility gate is
     unit-pinned — a rule whose `recordStatus` leaves `current` is
     `not_current` and the concern is withheld (`api/test/phase-10/
     gate.test.ts`); the canonical read is a per-request Content Lake
     query with no cache, so a status change applies to the next analysis.
     Do NOT claim a live toggle was demonstrated unless it actually was.
6. **Measured honesty (≈20 s).** The evaluation ledger: 15 frozen cases
   through the live stack — field accuracy 52/53, recall 11/11, precision
   13/13 substantive (post-rebaseline, owner ratification pending), 0
   abstention violations, machine p50 ≈ 20 s. Fifteen samples = development
   check, not legal validation. No overall verdict anywhere in the product.

## Production notes

- Screen recording at 1080p minimum; browser zoom ≥ 110% for readability.
- Blur nothing — run entirely on fictional samples; do not open Studio
  pages that expose tokens or organization settings on camera.
- End card: live URL, the README's zero-credential local demo command,
  and the scope sentence (Pakistan → UAE mainland, non-domestic,
  private-sector; not a lawyer).
- Owner reviews this script and the final cut before anything is published.
