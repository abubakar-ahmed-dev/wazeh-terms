# Phase 09 — publication + KB build runbook

Executed by the implementation agent **only after the owner confirms Rule 3**
(and supplies the amendment PDFs for Rule 1, whenever they arrive). Nothing
here runs before that confirmation. Prepared 2026-09-30.

## Scope of the publication

Published: the eligible reviewed records — 2 authorities, 6 source versions,
**rule 2 only** (`ae-salary-payment-due-monthly`, approved guidance, no
trigger), 33 field definitions.

NOT published (stay drafts):

- `rule.ae-recruitment-costs-employer-bears.r1` — Rule 1, draft pending the
  Article 6 amendment check. **Excluded from claimable retrieval by
  construction**: the canonical reader only sees approved+current *published*
  records, and the eligibility gate withholds null-approval anyway.
- `rule.pk-oep-service-charges-bank-deposit.r1` — Rule 3, until the owner
  confirms it. If confirmed in the same session, it publishes with the rest;
  otherwise it stays a draft.

## Steps (in order; abort on any failure)

1. **Pre-flight gate on the draft set** (unchanged state):
   `npm run validate:content -w api -- ../sanity-studio/content/seed/records.json` → PASS.
2. **Strengthen references + publish authorities** (2 records, no refs):
   `patch_documents` on the two authority drafts (no-op patch not needed —
   they carry no references) → `publish_documents` ids `authority.uae-federal-government`,
   `authority.beoe`.
3. **Strengthen + publish sources** (6 records): for each source draft,
   `patch_documents` `set` `issuer` to the same `_ref` **without `_weak`**;
   then `publish_documents` the six source ids. (Targets published in step 2,
   so strong refs validate.)
4. **Strengthen + publish the eligible rules**: patch `primarySource` to
   strong on `rule.ae-salary-payment-due-monthly.r1` (+ Rule 3 if confirmed);
   publish those ids only. Rule 1 is never in this list.
5. **Publish field definitions** (33; no references): `publish_documents`.
6. **Post-publish validation**: `npm run validate:content -w api -- --from-dataset --published`
   → must fetch exactly **42 published records** (2+6+rules-eligible+33) and
   PASS. Published-perspective count re-checked; drafts remaining = Rule 1
   (+ Rule 3 if unconfirmed).
7. **Dated export + KB projection** (reads published perspective, re-gates,
   refuses on failure):
   `SANITY_PROJECT_ID=8g0kllu0 SANITY_DATASET=production node sanity-studio/scripts/export-approved.mjs`
   → `content/export-<date>.json` + `content/kb-projection-<date>.json`.
   Commit both with the dated `content/README.md` note.
8. **Report to owner** (separate message, per instruction): published counts,
   export/projection counts, gate result. No source-backed-finding claims in
   this report.

## KB feed + build (owner + agent)

1. Owner feeds `kb-projection-<date>.json` to the Knowledge Base (KB sources
   only on the endpoint — never a dataset source; ADR-006) and triggers the
   build/refresh; apply any issues the KB reports.
2. Agent runs the endpoint checks **reported separately from the
   source-backed concern test**:
   `LIVE_KNOWN_ANSWER_QUERY="salaries due first of month wage protection" LIVE_KNOWN_ANSWER_RULE_KEY=ae-salary-payment-due-monthly npm run live:retrieval -w api -- --tools-only`
   → PASS = tools/list verified + KB mode + known-answer read surfaces the
   seeded ruleKey.
3. **Gated source-backed concern test is explicitly NOT part of this
   milestone.** It waits for: Article 6 amendment check complete → Rule 1
   approved by owner → published → KB refreshed/rebuilt → indexed → then the
   full `npm run live:retrieval -w api` (without `--tools-only`) must show an
   eligible citation. Phase 10 does not complete on guidance retrieval alone
   (owner decision 2026-09-30).

## Failure handling

- Any gate failure after publish: stop, report findings, fix as a new record
  revision (never overwrite a published reviewed record in place), re-validate.
- KB known-answer failure: per docs/SOURCES.md §5 — refresh/rebuild, re-check,
  and keep `source_backed_concern` withheld (it is withheld regardless until
  Rule 1 exists anyway).
