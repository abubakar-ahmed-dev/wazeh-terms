# Phase 09 — Canonical content seed (reviewed sources + rules)

**Status:** PLANNED. Implementation starts only after the owner inputs below arrive
(MT-4 verification is human-only browser/PDF work). Planning done 2026-09-29 on
`dev` @ `1a53abe` (phases 01–08 merged).

**Goal (master plan §Phase 09):** Real reviewed reference records exist in the
curated dataset — the owner-decided `production` dataset of Sanity project
`8g0kllu0` (MT-2): at least one approved Pakistan and one approved UAE source
version, initial rule revisions backing the demo worker-charge/salary topics,
the 33 `contractFieldDefinition` records, and a dated export committed with the
project. Minimum curation gate (`docs/SOURCES.md` §7) items 1–3 and 5
satisfied and recorded. No rule text without a verified passage; blocked
sources stay `candidate`.

## Owner inputs this phase needs (blockers)

| # | Input | From | How it arrives |
| --- | --- | --- | --- |
| 1 | **MT-4 verification per source used:** retrieval date, exact URL opened, document title/edition, and confirmation the pinpoint passages below appear in the official file | Owner (browser + downloaded PDFs already under `sources/{pakistan,uae,guidance}/`, git-ignored) | Chat: per-source confirmation lines; I compute `contentHash` digests locally from the files |
| 2 | **Pinpoint approval:** exact article/section label + short quoted passage for each proposed rule (table below) | Owner | Chat review; only approved pinpoints become records |
| 3 | **Import path confirmation:** default is that I create drafts + publish via the authenticated Sanity MCP session (no new secrets, gate runs before publish), owner reviews in Studio afterwards; alternative is owner-run CLI import with a write token | Owner | Chat |
| 4 | **Dataset read posture confirmation for Phase 10:** whether `production` is publicly readable or the runtime canonical reader will need `SANITY_READ_TOKEN` (MT-6) | Owner | Chat (recorded in `needs-and-requirements.md`) |

`reviewerCode` values are public-safe labels agreed in chat (e.g. `owner-1`);
no names, emails, or worker data enter records.

## Proposed seed content (all rows pending owner verification — nothing is approved until then)

### Authorities (2)

| authorityKey | name | jurisdiction | authorityType |
| --- | --- | --- | --- |
| `mohre` | Ministry of Human Resources and Emiratisation (UAE) | `AE` | `government` |
| `beoe` | Bureau of Emigration and Overseas Employment (Pakistan) | `PK` | `government` |

### Source versions (2–4; owner confirms edition of each downloaded PDF)

| sourceKey | versionKey | candidate | file | evidenceClass / sourceKind |
| --- | --- | --- | --- | --- |
| `uae-federal-decree-law-33-2021` | owner-confirmed (e.g. `mohre-pdf-2026`) | AE-02 | `sources/uae/employment-laws-and-regulations-in-the-private-sector.pdf` | `binding_official_rule` / `law`, mediaType `pdf` |
| `uae-cabinet-resolution-1-2022` | owner-confirmed | AE-03 (if the PDF was downloaded; else deferred) | under `sources/uae/` | `binding_official_rule` / `regulation`, `pdf` |
| `pk-beoe-emigration-rules-1979-2023` | `updated-2023` | PK-01 | `sources/pakistan/Emigration_Rules_1979_Updated_2023.pdf` | `binding_official_rule` / `law`, `pdf` |
| `pk-beoe-procedure-overseas-employment` | owner-confirmed | PK-02 | `sources/pakistan/procedure-for-overseas-employment.pdf` | `official_guidance` / `official_guidance`, `pdf` |

Every record: `officialUrl` from `docs/SOURCES.md` §3, `retrievedAt` +
`lastVerifiedAt` from the owner's verification date, `contentHash` (SHA-256 of
the reviewed file), `applicableRegimes`/`applicableCategories` narrowed to the
MVP route, `reviewStatus: approved`, `recordStatus: current`, `schemaVersion: 1`.

### Rules (3 proposed; claim wording never exceeds the approved pinpoint)

| ruleKey / revision 1 | triggerKey | primary source | proposed claim (narrow, owner verifies wording) |
| --- | --- | --- | --- |
| `ae-recruitment-costs-employer-bears` | `worker_charge.payer_must_be_uae_employer` | `uae-federal-decree-law-33-2021` + pinpoint | Employer bears recruitment/visa/residency costs for the worker; worker-paid charges of that class are a concern. `jurisdiction: AE`, regime `uae_mainland_private`, category `non_domestic`, party `uae_employer`, ruleKind `obligation`. `machineConditionKeys`: charge class present in documents; payer stated. |
| `ae-wage-payment-monthly` | `salary.payment_frequency_must_be_monthly` | `uae-federal-decree-law-33-2021` (wages article) or WPS resolution if owner prefers | Wages are payable at monthly intervals; a stated non-monthly or missing frequency raises a clarification-backed concern. Same scope fields. |
| `pk-oep-fee-receipt` (informational, **no triggerKey**) | null | `pk-beoe-emigration-rules-1979-2023` + pinpoint | Pakistan-side: payments to a recruiter should be to a licensed OEP with documented receipt. Displayed as labelled Pakistan-side guidance/next-step context only — never merged with UAE-side charges. Demonstrates a non-claimable rule class in the seed. |

`salary.stated_total_must_match_components` deliberately gets **no rule** in
this seed unless the owner verifies a passage that supports it — internal
arithmetic consistency is already a document-only check; inventing a citation
is forbidden. Gap recorded in the implementation log.

Rules carry `conditions`/`exceptions` reviewed as (possibly empty) lists,
`effectiveFrom` from the owner's verification (binding rules need a verified
temporal start), `pinpoint {label, quote}` exactly as approved, plain-English
explanation, `sourceCheckedAt` = verification date, `revision: 1`.

### contractFieldDefinition (33)

Generated from the code registry (`api/src/contracts/field-registry.ts`) by a
committed script (`sanity-studio/scripts/build-field-definitions.ts`), emitted
as seed JSON; the Phase 08 gate already fails on registry drift. Labels,
`comparisonStrategyKey`, `valueKind`, `importantIfAbsent` mirror code; editors
cannot change comparison semantics.

### resolutionNote

None planned. One is authored only if a real conflict appears during
verification (recorded per `DATABASE_SCHEMA.md` §8).

## Adds/changes

- **`sanity-studio/content/seed/*.json`** — authored seed records in the
  Phase 08 gate input shape (authorities, source versions, rules, field
  definitions), one file per record type. Committed.
- **`sanity-studio/scripts/build-field-definitions.ts`** — registry→seed
  generator (tsx, api-workspace toolchain). Committed output; script committed.
- **`api/package.json`** — `seed:field-definitions` script (generator runner).
- **Gate first:** `npm run validate:content -w api` must PASS on the seed
  before any import. Content gate runs again post-import.
- **Import (default MCP path):** drafts via Sanity MCP `create_documents`,
  publish via `publish_documents`, per record type in dependency order
  (authority → sourceDocument → rule → contractFieldDefinition). No secrets
  introduced; the MCP session is already owner-authenticated. Records are
  created **approved** only after owner chat approval of pinpoints (input 2).
- **Post-import verification:** read back via MCP `query_documents`
  (approved/current projection) and validate the read-back JSON through the
  same `validateContent` function — the `--from-dataset` CLI path stays
  available but is not required this phase (dataset visibility unchanged per
  MT-2; no new token needed for the MCP session).
- **Dated export committed:** `sanity-studio/scripts/export-approved.mjs`
  writes `sanity-studio/content/export-<date>.json` (approved/current records,
  public-safe fields only) via MCP read-back results; a short
  `sanity-studio/content/README.md` records export date + record counts.
  Per `docs/SOURCES.md` §1 (actual approved IDs/timestamps live in Sanity AND a
  dated export/catalog committed with the project).
- **KB projection for MT-5:** same export step emits
  `sanity-studio/content/kb-projection-<date>.json` — minimal traceable field
  set per `docs/DATABASE_SCHEMA.md` §9 (`ruleKey`, `revision`, claimText,
  topic, conditions, primary source key/version, officialUrl, pinpoint) for
  the owner to feed the Knowledge Base. Committed.
- **Plans/docs:** `manual-tasks.md` MT-4 → status update;
  `needs-and-requirements.md` rows for phase 09 resolved; phase logs.

## Test list

1. Content gate PASS on the full seed locally before import (exit 0, zero findings).
2. Field-definition seed matches the code registry exactly (gate drift check).
3. Every demo rule resolves to exactly one approved current revision + its
   exact source version + pinpoint (new assertion in `content-gate.test.ts`
   against the seed fixture set).
4. Negative regression: gate still rejects draft/superseded/two-approved
   fixtures (existing 8 fixtures stay green).
5. Post-import read-back validates through `validateContent` (recorded in
   testing log with record counts; live Sanity operation).
6. Export + KB projection files parse, contain only approved/current records,
   and exclude any draft/superseded record.
7. No worker/personal data in any record (manual diff review before commit;
   every record's fields are reference content).

## Exit criteria

- Minimum curation gate items: ≥1 approved PK source, ≥1 approved AE source,
  demo rule claims have exact approved pinpoints, fail-closed behavior proven
  by the gate, owner browser verification recorded. Item on KB mapping
  (§7 "generated entry maps back") belongs to Phase 10's live checklist.
- Dated export + KB projection committed; Sanity contains reference content
  only (checklist item `DATABASE_SCHEMA.md` §11.5 spot-checked and recorded).
- Logs written; no delivery dates, no competition references.
