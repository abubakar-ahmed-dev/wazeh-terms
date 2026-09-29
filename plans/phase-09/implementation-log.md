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

## Draft import executed (owner authorization 2026-09-30: drafts only, no publication)

- All 44 gate-passing records imported as **drafts** via the authenticated
  Sanity MCP session (project `8g0kllu0`, dataset `production`): 2 authorities,
  6 source versions, 3 rules, 33 field definitions. `publish_documents` was
  NOT called; a published-perspective query confirms **0 published records**.
- Rule states as imported: worker-charge rule `draft`, wage-guidance rule
  `approved` (no trigger), PK OEP rule `draft` (owner demoted it from approved
  before import; gate re-run PASS).
- **Weak references during draft stage:** Sanity strong references require a
  published target, so draft-only imports carry `_weak: true` refs
  (`prep-draft-import.ts` → `seed/drafts.json`; authored seed keeps strong
  refs as contract truth). At publish time records are re-created with strong
  refs in dependency order. Logged as a deliberate, reversible deviation.
- **Post-import validation caught a real defect:** the first read-back gate
  run FAILED — `responsibleParty` missing on both UAE rules (my import
  payload omission; Content Lake writes bypass Studio-required validation,
  exactly what this gate exists for). Patched both drafts via
  `patch_documents`; re-read all 44 and re-ran the gate on the read-back
  (`readback-2026-09-29.json`): **PASS, exit 0**. Seed and read-back agree.
- KB projection **preview** generated from eligible seed records
  (`content/kb-projection-preview-2026-09-30.json`: 6 sources, 1 rule, 33
  field definitions). Preview only — the real projection is rebuilt from
  published approved records after Studio review + publish.
- Nothing published; Phase 09 and the Phase 10 live check remain open.

## Publication + KB build executed (2026-09-30, owner-confirmed)

- **43 records published** in dependency order with strong references:
  2 authorities → 6 source versions (issuer patched weak→strong) → Rules 2+3
  (`primarySource` patched weak→strong) → 33 field definitions.
  Rule 3 updates applied before publish: plain-English narrowed to OEP
  service-charge deposits, `reviewedAt` set to the owner's actual review date
  2026-09-30, `reviewStatus: approved` (owner confirmed the Rule 15(1A)
  passage against the official BEOE PDF).
- **Rule 1 remains the only draft** — published-perspective counts: 43
  published / 1 draft (`drafts.rule.ae-recruitment-costs-employer-bears.r1`)
  / 0 weak references among published records.
- **Published-record gate: PASS** on the authenticated read-back of all 43
  (`seed/published-readback-2026-09-30.json`). Note: the CLI
  `--from-dataset --published` path fetched 0 records — the Content Lake API
  does not serve anonymous queries, and the org Context token is not a
  project member (`401 project user not found`). The owner's earlier "public
  dataset" belief does not hold for API reads → **MT-6 reversed**:
  `SANITY_READ_TOKEN` (project Viewer) is required. Recorded in
  `plans/manual-tasks.md` + `plans/needs-and-requirements.md`.
- **Dated export + KB projection committed**: `content/export-2026-09-30.json`
  (43 records) + `content/kb-projection-2026-09-30.json` (43 entries; Rule 1
  excluded — not approved). Built from the authenticated read-back;
  `export-approved.mjs` will reproduce them from the API once a read token
  exists (authorities projection-filter bug fixed in the script).
- **KB fed + built via the signed-in Sanity CLI** (owner's session):
  `sanity context imports create kbynAP4r8P6m --file …/kb-projection-2026-09-30.json`
  → job `ctx-ingest-e8368760…` **succeeded**;
  `sanity context build kbynAP4r8P6m` → job `ctx-build-c2ff3a39…`
  **succeeded** (2026-09-29T20:08Z). No owner action was needed.
- **Retrieval client fixes found by the live endpoint** (all tested offline
  too): JSON-RPC notifications must not carry an `id` (server rejected
  id-bearing `notifications/initialized`); 202/204 empty bodies are success;
  the search tool is `knowledge_base_search` requiring `knowledgeBase` +
  `query` (new nonsecret `SANITY_KB_ID` config); KB renders entries as prose,
  so candidate extraction now scans stable `ae-/pk-` key tokens data-only
  (each gated separately against the canonical reader, with a new
  `expectedTopic` gate check so a key found in an unrelated entry can never
  back a claim).
- **Live tools-only + known-answer check: PASS** — tools/list + KB mode
  verified; known-answer read surfaced `ae-salary-payment-due-monthly` (4
  entries). Reported separately from any source-backed concern test; guidance
  retrieval does not complete Phase 10 (owner instruction).
- Amendment status: **14/2022 verified** (owner PDF, legislation 1637;
  amends Article 8 only — Articles 6 and 22 untouched). **20/2023 +
  consolidated law unavailable** (owner browser attempts failed; portal
  Cloudflare-blocked for automation). **9/2024 not yet obtained.** Rule 1
  stays draft/unpublished/ineligible until the remaining amendments are
  checked.

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
