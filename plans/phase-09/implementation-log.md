# Phase 09 — implementation log

Branch: `phase-09-canonical-seed` (plan @ `6f65914`; merged `dev` @ `2c72581`).
Date: 2026-09-29.

## Status

Source verification in progress. Owner supplied MT-4 inputs (official UAE
legislation URLs + retrieval dates; WPS deferral; dataset-public decision;
import path = authenticated write + gate, pinpoints approved before publish).
Nothing imported or published yet — pinpoint drafts await owner approval.

## What was done

- Merged current `dev` into the branch (phase 10 code now available here).
- Matched the two new official PDFs in `sources/uae/links.md` to local files;
  computed SHA-256 for every seed-relevant file (UAE + Pakistan).
- Inspected text layers (pdfjs, local-only dumps, deleted after use):
  - **Decree-Law 33/2021** (46 pp): base text only — the 2023 amendment is
    NOT included; commencement 02 February 2022; Article 6(4) verified
    verbatim on PDF page 8.
  - **Cabinet Resolution 1/2022** (31 pp): in force 02 February 2022;
    Article 16 (Wages) consistent with Decree-Law Art 22 via WPS.
  - **u.ae payment-of-wages** (7 pp): "salaries for the previous month are
    due on the first day of each Gregorian month"; cites Resolution 340/2026
    whose official copy is unverified → guidance wording only.
  - **Emigration Rules 1979 (Updated 2023)** (28 pp): consolidated text with
    SRO 1058(I)/2023 markers; Rule 15 (service charges, bank deposit,
    refund) on printed pages 11–12.
- Wrote committed provenance inventory `sources/inventory-2026-09-29.md`
  (hashes, URL mapping, version findings, open items).
- Decisions applied from owner chat:
  - u.ae laws-overview page is **guidance**, never classified as law.
  - Resolution 340/2026: third-party file stays labelled; **no rule** from
    it; WPS rule deferred; wage rule phrased only as narrowly as official
    text supports → the wage-frequency rule is drafted as `official_guidance`
    class off the u.ae page.
  - `production` dataset is **public** → Phase 10 canonical reader runs
    without `SANITY_READ_TOKEN` (MT-6 resolved; recorded in
    `plans/manual-tasks.md`).
  - Import path: authenticated write-capable Sanity path + validation gate;
    pinpoints approved **before** publishing; post-import validation after.

## Gate fix discovered during verification (phase-10 code, small deviation)

`services/eligibility/gate.ts`: a rule with `triggerKey: null` (informational
record per DATABASE_SCHEMA §6) could previously pass the eligibility gate and
back an automated concern. Now withholds `trigger_unregistered`; test added
(`gate.test.ts`). Suite: **274/274**; lint + typecheck clean.

## Draft pinpoints (awaiting owner approval — nothing published)

See chat draft table: worker-charge rule (Decree-Law 33 Art 6(4), PDF p.8),
wage-frequency guidance rule (u.ae payment page, "When Should Employers Pay
Salaries?"), PK informational rule (Emigration Rules Rule 15, p.12).

## Remaining issues / open items

1. **Amendment cross-check** for Decree-Law 33/2021 Arts 6 & 22: automated
   fetch of `uaelegislation.gov.ae` blocked by Cloudflare (403; not bypassed).
   Owner to download Decree-Law 14/2022, 20/2023, 9/2024 official texts.
   Worker-charge rule stays **draft/unpublished** until then (owner decision).
2. Owner approval of the seed package below → import → Studio review →
   post-import validation → export + KB projection.
3. Context MCP org token (MT-5) still pending for Phase 10 live checks.

## Seed package authored (2026-09-29, awaiting owner approval before import)

- `sanity-studio/content/seed/{authorities,sources,rules}.json` (2 + 6 + 3)
  + generated `field-definitions.json` (33); merged `records.json` (44).
- Scripts: `seed:field-definitions`, `seed:build` (api workspace); gate run:
  `npm run validate:content -w api -- ../sanity-studio/content/seed/records.json`
  → **PASS (exit 0)**.
- Rules state: `ae-recruitment-costs-employer-bears` r1 **draft** (owner
  decision — unpublished pending amendment check; claim narrowed to owner
  wording); `ae-salary-payment-due-monthly` r1 **approved, guidance, NO
  triggerKey** (gate forbids guidance + trigger; owner wording honoured —
  question-prompt, never a violation finding, Resolution 340/2026 uncited);
  `pk-oep-service-charges-bank-deposit` r1 **approved, informational, NO
  triggerKey**, pinpoint revised to Rule 15(1A) + proviso (PDF p.12,
  contiguous quote covering bank deposit + PoE certification + refund —
  owner's objection resolved by quoting what the claim asserts).
- Because guidance carries no trigger, no automated source-backed concern
  exists for payment frequency in this seed; the frequency finding remains a
  document-side clarification/next-step. Recorded honestly.

## Gate change (contract-faithful, needed for the PK informational rule)

`validate-content.ts` + `schemaTypes/rule.ts`: the strict claimable scope
(mainland + non-domestic + explicit party) now applies only to
trigger-carrying (claimable) rules; informational rules (no trigger) may use
`unknown` regime/category — per DATABASE_SCHEMA §2/§6 "no unknown for a
*claimable* rule". Studio options widened to full vocabularies with a
claimable-pairing custom validation. Fixtures: new
`invalid-claimable-unknown-regime.json` (scope fail); valid-seed gained a
fictional PK informational rule exercising the relaxed path. Gate tests 14/14;
api suite 276/276; studio typecheck + `sanity build` green.
