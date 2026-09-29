# Phase 08 — Sanity Studio content schema + programmatic content gate — plan

**Depends on:** Phase 01 (done). Parallel track — no runtime dependency on
Phases 03–07. Branch `phase-08-content-schema` from `dev` @ `49b801c`.
**Owner inputs needed:** the MT-2 dataset decision (final section) — not
blocking for code/tests, required before any content or Studio deploy.

**Re-planning check:** `docs/DATABASE_SCHEMA.md` §2–§11, `docs/SOURCES.md` §4,
`docs/SECURITY.md` §5 re-read. Studio shell exists (project `8g0kllu0`,
dataset `production`, `schemaTypes: []`, not deployed). Key constraint: Studio
validation does **not** constrain API/imports — the programmatic gate is the
real release check (DATABASE_SCHEMA §1/§9).

**Goal (master-plan):** Studio edits the five documented record types; the
programmatic content-validation gate enforces what Studio cannot. Studio build
passes; **no documents created** (content is Phase 09).

## Files to create

| File (`sanity-studio/`) | Content |
| --- | --- |
| `schemaTypes/enums.ts` | Controlled enums verbatim from DATABASE_SCHEMA §2: `jurisdiction` (PK/AE/international), `employmentRegime`, `workerCategory`, `party`, `reviewStatus` (draft/approved/rejected), `recordStatus` (current/superseded/historical/withdrawn), `evidenceClass` (binding_official_rule/official_guidance/international_guidance), `authorityType`, `sourceKind`, `mediaType`, `ruleKind`, plus `schemaVersion` number field helper. |
| `schemaTypes/authority.ts` | §4 fields: `authorityKey` (stable key, regex-validated), `name`/`shortName`, `jurisdiction`, `authorityType`, `officialDomains` (array of hostnames), `officialHomepage`, review metadata (`reviewStatus`, `reviewedAt`, `reviewerCode`), `schemaVersion`. |
| `schemaTypes/sourceDocument.ts` | §5: `sourceKey`+`versionKey` (unique pair), `title`, `issuer` → authority, `jurisdiction`, `evidenceClass`, `officialUrl` (https), `authorizedFile` (optional file), `sourceKind`, `mediaType`, `publicationDate`/`effectiveFrom`/`effectiveTo` (nullable dates), `retrievedAt`/`lastVerifiedAt`, `contentHash`/`versionNote`, `applicableRegimes`/`applicableCategories`, `recordStatus`/`reviewStatus`, `supersededBy` (self-reference), review metadata, `schemaVersion`. |
| `schemaTypes/rule.ts` | §6: `ruleKey`+`revision` (unique pair), `title`, `claimText`, `topic`/`relatedFieldKeys` (fieldKeys restricted to the 33-key list), `triggerKey` (restricted list), `ruleKind`, `evidenceClass`, `jurisdiction`/`origin`/`destination`, `employmentRegime`/`workerCategory`/`responsibleParty` (no `unknown` options for claimable fields — options narrowed), `conditions`/`exceptions` arrays, `machineConditionKeys`, `effectiveFrom`/`effectiveTo`, `currentGuidanceVerifiedAt`, `primarySource` → exact sourceDocument version, `pinpoint` object (`label`/`page`/`clause`/`quote`), `supportingSources`, `plainEnglish`/`plainUrdu`, `sourceCheckedAt`/`reviewedAt`/`reviewerCode`, `recordStatus`/`reviewStatus`/`schemaVersion`, `supersededBy`/`resolutionNotes`. |
| `schemaTypes/contractFieldDefinition.ts` | §7: `fieldKey` (options = the 33 registry keys, duplicated as a local constant), `groupKey`, `label`, `valueKind`, `acceptedLabels`, `comparisonStrategyKey` (7-name list mirroring the api registry), `importantIfAbsent`, `relatedRuleTopics`, `recordStatus`/`reviewStatus`/`schemaVersion`. |
| `schemaTypes/resolutionNote.ts` | §8: `resolutionKey`, `title`, `affectedRules`/`affectedSources`, `claimsInConflict`, `selectedTreatment`, `reasoning`, `reviewedAt`/`reviewerCode`/`nextReviewAt`, `reviewStatus`/`schemaVersion`. |
| `schemaTypes/index.ts` | Barrel + structure config unchanged (plugin set untouched). |
| `schemaTypes/trigger-keys.ts` | Code-owned `triggerKey` allowlist for Phase 10 (initial demo topics: worker-charge/salary family), each documented with its intended code predicate. Studio offers only these; the gate re-checks. |
| `scripts/validate-content.ts` | The **programmatic content gate**: input = an array of plain record objects (from a JSON fixture file, or from the dataset via `@sanity/client` when `SANITY_PROJECT_ID`/`SANITY_DATASET` + token are present; offline/CI mode = fixtures only). Enforces DATABASE_SCHEMA §9: unique natural keys (`authorityKey`; `sourceKey`+`versionKey`; `ruleKey`+`revision`; `fieldKey`; `resolutionKey`), exactly one `approved`+`current` revision per `ruleKey`, reference integrity (issuer/primarySource/supersededBy/affected* resolve), evidence-class compatibility (guidance class cannot carry a binding `triggerKey`; international guidance never `binding_official_rule`), required pinpoint (label+quote, page or clause), enum containment, `schemaVersion` present, URL shape, effective-date ordering (`effectiveFrom < effectiveTo` when both set). Output: structured findings; non-zero exit on any error. |
| `scripts/validate-content.test.ts` + fixtures (`scripts/fixtures/valid-seed.json`, `scripts/fixtures/invalid-*.json`) | Vitest suite (api workspace vitest config already picks `api/test/**`; studio tests run via `npm run test -w sanity-studio`? **Decision:** keep studio tests inside `api/test/phase-08/` so one runner covers them; fixtures live in `sanity-studio/scripts/fixtures/`). |
| `package.json` | `sanity` + `@sanity/*` versions already present; add `"test": "echo 'studio tests run in api workspace'"`? No — leave package as-is except adding a `validate` script (`tsx` via api? studio has no tsx). **Decision:** validation script executed from the api workspace (`npm run validate:content -w api`) with tsx; the script file stays in `sanity-studio/scripts/` and imports only `zod`-free plain TS + types. Content shapes validated with hand-written guards (no zod dependency added to studio). |

## The gate's negative test matrix (each must be **caught**, exit non-zero)

| Fixture | Violation |
| --- | --- |
| `invalid-duplicate-key.json` | two `sourceDocument` records with the same `sourceKey`+`versionKey` |
| `invalid-two-approved.json` | two `rule` revisions, same `ruleKey`, both `approved`+`current` |
| `invalid-broken-reference.json` | `rule.primarySource` pointing at a missing `sourceDocument` |
| `invalid-guidance-trigger.json` | `evidenceClass: international_guidance` rule carrying a `triggerKey` |
| `invalid-missing-pinpoint.json` | approved rule without pinpoint quote/label |
| `invalid-bad-enum.json` | `recordStatus: "published"` (not a controlled value) |
| `invalid-date-order.json` | `effectiveTo` before `effectiveFrom` |
| `valid-seed.json` | one authority + one PK + one UAE source + one rule (approved/current/pinpointed) + 33 field definitions + a resolutionNote — **passes clean** |

## Decisions

- **Single source of truth stays code-side:** the 33 `fieldKey`s and 7 strategy names are duplicated as constants in the studio schema (Sanity schemas cannot import workspace code); the validation gate asserts the two lists agree by importing the api registry (script runs under the api workspace's tsx, so it *can* import `api/src/contracts/field-registry`). Drift between studio list and api registry ⇒ gate failure.
- **`triggerKey` list is small and pre-declared** (Phase 10 consumes it): values follow `topic.predicate` naming (e.g. `worker_charge.payer_must_be_uae_employer`); each entry documents the intended deterministic predicate; implementation + tests are Phase 10's.
- **No dataset writes, no documents, no deploy in this phase.** `sanity build` proves the schema compiles; the gate runs on fixtures in CI.
- **`plainUrdu` field exists but stays null** — Urdu gate (ADR-009) untouched.
- Studio `projectId`/`dataset` unchanged (`8g0kllu0`/`production`) until MT-2 decides; a dataset switch is a one-line config change recorded in Phase 09.

## Tests

1. Valid seed passes the gate (zero findings, exit 0).
2. Every negative fixture is caught with a finding naming the record and violation class.
3. Gate agrees with the api registry: field keys + strategy names + repeatable flags match; deliberate drift in a mutated copy fails.
4. `sanity build` (or `npx sanity check`? build only) succeeds with the five schema types wired.
5. Full repo suite + lint + typecheck + build stay green (studio tsconfig included in typecheck? studio has own tsconfig — root `typecheck` covers workspaces api+web only; **add**: run `tsc -p sanity-studio/tsconfig.json --noEmit` via a studio `typecheck` script and include it in CI after verifying the studio tsconfig supports noEmit mode).

## Exit criteria (master-plan)

`sanity build` green; validation gate green against all fixtures; schema matches
DATABASE_SCHEMA §2–§8 field tables; manual Studio deploy (MT-3) recorded when
the owner runs it.

## Out of scope

Any content creation (Phase 09), KB build (Phase 10 prerequisites, MT-5),
deploy of Studio (owner, MT-3), runtime canonical reader (Phase 10).

---

## Owner inputs needed

| # | Item | Where / how | Blocks |
| --- | --- | --- | --- |
| 1 | **MT-2 dataset decision** — dedicated dataset for curated records (recommended: `knowledge`) vs reuse `production` | Reply in chat (nonsecret). If dedicated: create it at sanity.io/manage → project `8g0kllu0` → Datasets → new dataset `knowledge` (visibility: public read is fine for approved reference content; tell me which you chose) | Not the code/tests; blocks Phase 09 content import + MT-3 deploy config |
| 2 | **MT-3 Studio deploy** (after this phase lands): `cd sanity-studio && npx sanity deploy` — interactive Sanity login in your terminal | You run it; paste back the deployed Studio URL (nonsecret) | Only the "Studio deployed" record; nothing downstream until Phase 09 |
| 3 | Studio editor invites (editors only, no public write) — sanity.io/manage → Members | Owner action, any time before Phase 09 | Phase 09 review workflow |

Nothing secret is needed. If you answer item 1 with `knowledge`, I will flip
`sanity-studio/sanity.config.ts` dataset to `knowledge` as part of Phase 09's
first commit and record it.
