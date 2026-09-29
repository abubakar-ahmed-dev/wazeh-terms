# Phase 08 — implementation log

Branch: `phase-08-content-schema` (from `dev` @ `49b801c`; plan committed first).
Date: 2026-09-29.

## What was changed

Sanity Studio now defines the five documented record types, and the
programmatic content gate enforces what Studio cannot.

- **`sanity-studio/schemaTypes/`**:
  - `registry-mirror.ts` (new, pure): controlled vocabularies + the studio
    mirrors of the 33 field keys / 7 comparison strategies / value kinds —
    zero `sanity` imports so the api-side gate can import them.
  - `enums.ts`: Sanity fields over the pure lists (`enumField`,
    `schemaVersionField`).
  - `authority.ts`, `sourceDocument.ts`, `rule.ts`, `contractFieldDefinition.ts`,
    `resolutionNote.ts`: per `docs/DATABASE_SCHEMA.md` §4–§8 — stable-key
    regexes, versioned pairs, references, evidence classes, pinpoint object,
    claimable scope fields narrowed (mainland + non-domestic + explicit party;
    no `unknown`), `plainUrdu` present-but-gated, review metadata,
    `schemaVersion` everywhere.
  - `trigger-keys.ts`: code-owned allowlist (3 seed triggers for the
    worker-charge/salary families), each documenting its Phase 10 predicate.
  - `index.ts`: barrel wired into `sanity.config.ts` (schemaTypes no longer empty).
- **`sanity-studio/scripts/validate-content.ts`**: the programmatic gate —
  unique natural keys, exactly one approved+current revision per ruleKey,
  reference integrity, evidence-class compatibility (trigger ⇒ binding;
  rule class = primary source class; source must be approved+current),
  registry containment + mirror-drift check, pinpoint label+quote, https URLs,
  date ordering, `plainUrdu` gate, enum containment, `schemaVersion`.
  Pure exported function + findings array; runs under the api workspace tsx.
- **`sanity-studio/scripts/validate-content.cli.mjs`**: CLI — offline fixture
  mode (default `valid-seed.json`, or a path argument) and `--from-dataset`
  (Phase 09; requires `SANITY_PROJECT_ID`/`SANITY_DATASET`, optional
  `SANITY_READ_TOKEN`, uses `@sanity/client` from the studio toolchain).
- **`api/package.json`**: `validate:content` script (plan's runner path).
- **Root `package.json`**: `typecheck` now includes
  `tsc -p sanity-studio/tsconfig.json --noEmit`; studio `package.json` gains a
  matching `typecheck` script.
- **Fixtures** (`sanity-studio/scripts/fixtures/`): `valid-seed.json` (2
  authorities, 2 source versions, 1 approved rule, 33 field definitions,
  1 resolution note — all explicitly fictional seed records) + 8 negative
  fixtures, one per violation class. `.generator.cjs` kept? Deleted after run —
  fixtures are the committed source of truth.
- **Docs**: `plans/manual-tasks.md` MT-2 DECIDED (`production` dataset, project
  `8g0kllu0`; visibility unchanged; never worker documents), MT-3 pending
  owner deploy, editor invites: none needed; `plans/needs-and-requirements.md`
  decision 1 resolved.

## Decisions / deviations from plan

- **Dataset = `production`** per owner decision (plan recommended a dedicated
  `knowledge` dataset; owner chose existing `production` — recorded, no config
  change needed since the studio already points there). Visibility untouched.
- **Pure `registry-mirror.ts` module added** (not in plan): needed so the gate
  imports studio-side constants without pulling `sanity` into the api
  toolchain; the gate's drift check makes the mirror enforceable.
- **CLI split into a `.mjs` runner** (plan had the gate file double as CLI):
  the studio package is CommonJS-context for TS purposes, which bans
  `import.meta` in the gate module; a `.mjs` runner avoids the transform
  question entirely.
- **Pinpoint page/clause optional** (contract-faithful) — plan's negative
  fixture wording tightened to label+quote; the fixture still fails via the
  empty quote.
- Studio ESLint/prettier configs untouched; lint for studio files not added to
  CI this phase (typecheck + build + gate cover the surfaces; noted for
  Phase 09's import tooling if needed).

## Files/components affected

New: `sanity-studio/schemaTypes/*` (7), `sanity-studio/scripts/*` (2 + 9 fixtures).
Changed: `sanity-studio/schemaTypes/index.ts` (was empty array), `sanity-studio/package.json`
(typecheck script), root `package.json` (typecheck), `api/package.json`
(validate:content), `plans/manual-tasks.md`, `plans/needs-and-requirements.md`.
Unchanged: `sanity.config.ts` (projectId/dataset already `8g0kllu0`/`production`).

## Validation

See `testing-log.md`: `sanity build` green; studio typecheck green (wired into
root `typecheck`); gate PASS on the valid seed (CLI exit 0) and all 8 negative
fixtures caught (suite asserts codes); **api 178/178 tests** (12 new); root
lint 0 issues; api + web builds green.

## Remaining issues

- **MT-3 pending (owner):** `cd sanity-studio && npx sanity deploy` after this
  phase lands; deployed URL to be recorded. Not counted complete until then.
- Phase 09 uses `--from-dataset` + the import gate; `SANITY_READ_TOKEN` only if
  the dataset's read path needs it (dataset visibility unchanged per owner).
