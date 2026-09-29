# Phase 08 — testing log

Environment: Windows 10 Pro, bash (Git Bash), Node v22.16.0, vitest 5.0.2,
Sanity 6.16.0. Date: 2026-09-29. Offline (fixture-based gate; no dataset or
Studio deploy involved).

| # | Check (plan §Tests) | Command / file | Result |
| --- | --- | --- | --- |
| 1 | Valid seed passes | `content-gate.test.ts` + CLI `npm run validate:content -w api` | Pass — zero findings, exit 0. Seed: 2 authorities (AE+PK), 2 source versions (binding law + official guidance), 1 approved+current pinpointed rule (fictional seed, `triggerKey` set), 33 field definitions, 1 resolution note. |
| 2 | Negative matrix | `content-gate.test.ts` (8 fixtures) | Pass — duplicate `sourceKey+versionKey` ⇒ `natural_key`; two approved+current revisions ⇒ `approved_current_uniqueness`; broken `primarySource` ⇒ `reference`; guidance-classed rule with `triggerKey` ⇒ `evidence_class`; empty pinpoint quote ⇒ `pinpoint`; `recordStatus: "published"` ⇒ `enum`; inverted effective dates ⇒ `date_order`; fieldKey outside registry ⇒ `registry`. Non-array input ⇒ `shape`. |
| 3 | Registry mirror sync | `content-gate.test.ts` + gate-internal check | Pass — `STUDIO_FIELD_KEYS` equals the api registry keys in order; strategy lists equal; gate fails with `registry_drift` if they diverge (compiled check). |
| 4 | CLI behavior | `validate-content.cli.mjs` | Pass — valid seed exit 0; `invalid-two-approved.json` exit 1 with `[approved_current_uniqueness]` finding printed. `--from-dataset` path present for Phase 09 (requires env; untested here by design). |
| 5 | Studio build | `npx sanity build` | Pass — build succeeds with the five record types wired (`dist/index.html` emitted). First run failed with missing-export errors from a stale barrel (index re-exporting moved symbols) — fixed by re-pointing the barrel at `registry-mirror.ts`. |
| 6 | Studio typecheck | `tsc -p sanity-studio/tsconfig.json --noEmit` (also wired into root `npm run typecheck`) | Pass — schema types, registry mirror, trigger keys, and the gate script all type-clean under the studio tsconfig. |
| 7 | Regression | full suite | Pass — **32 files, 178/178 tests** (12 new); root `lint` 0 issues; root `typecheck` (api + web + studio) clean; api + web builds green. |

## Issues found and fixed during the phase

1. **Pinpoint rule stricter than the contract:** the gate initially demanded page-or-clause; `docs/DATABASE_SCHEMA.md` §6 requires label + exact passage only (page/clause optional refinements). Relaxed; missing-label/quote still caught.
2. **Stale barrel broke `sanity build`:** `schemaTypes/index.ts` re-exported symbols that had moved to `registry-mirror.ts`; build failed with missing-export errors, fixed by re-pointing the barrel.
3. **Pure-list extraction:** enum value arrays and the studio registry mirror moved into `schemaTypes/registry-mirror.ts` (zero `sanity` imports) so the gate can run under the api workspace without the Studio toolchain.

No dataset connection, no documents, no Studio deploy (owner runs MT-3; recorded pending in `plans/manual-tasks.md`).
