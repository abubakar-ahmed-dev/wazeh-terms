# Phase 01 — implementation log

Branch: `phase-01-foundation` (from `dev` @ `50f141e`). Date: 2026-09-28.

## What was changed

Created the buildable monorepo skeleton — no product endpoints, no runtime behavior.

- `package.json` (root): npm workspaces `api` + `web`; `dev`/`build`/`test`/`typecheck`/`lint` delegating via `--workspaces --if-present`; `engines.node >=22`; private.
- `api/`: `package.json` (express ^5, zod ^4, dotenv; dev typescript/tsx/vitest/eslint/typescript-eslint/@types), strict `tsconfig.json` (NodeNext) + `tsconfig.build.json` (emits `dist/` from `src/`), `eslint.config.mjs` (typescript-eslint flat), `src/version.ts` placeholder, `test/smoke.test.ts`.
- `web/`: Vite + React 19 + TS scaffold (`package.json`, `tsconfig.json`, `vite.config.ts` with vitest, `eslint.config.mjs`, `index.html`, `src/main.tsx`, `src/App.tsx` trivial home, `src/lib/version.ts` + trivial test).
- `.github/workflows/ci.yml`: Node 22; `npm ci`; lint, typecheck, test, build; push/PR; deterministic, no credentials.
- `.env.example` (root): documented names from `docs/DEPLOYMENT.md` §2 with placeholders and per-variable degradation notes; local secrets belong in git-ignored `api/.env`.
- `plans/phase-01/plan.md`, this log, `testing-log.md` per protocol.

## Decisions / deviations

- **Placeholder `src` modules:** master plan says Phase 01 `src/` is "empty", but the exit criteria (`typecheck`/`build`/`test` green) need at least one TS input per workspace. Added minimal non-behavioral identity modules (`api/src/version.ts`, `web/src/lib/version.ts`); real code replaces them in later phases. Recorded as the only deviation from the master-plan wording.
- **Express ^5, zod ^4, React 19, Vite 6, ESM everywhere:** current stable majors; docs pin no versions. No zod/express code written yet (Phase 02/03).
- **vitest ^5.0.2 (not ^3):** initial install with vitest 3 reported 2 moderate advisories (`@vitest/mocker` path traversal, GHSA-82fw-gwwq-j7x9, dev-only). Upgraded both workspaces before any real tests existed; audit now `found 0 vulnerabilities`.
- **No Tailwind/shadcn:** UI stack belongs to Phase 11 per master plan; Phase 01 is a buildable placeholder only.
- **`sanity-studio/` not added to root workspaces or CI:** separate toolchain; schema arrives Phase 08 (MT-2 dataset decision pending).
- **Linux rollup native binary pinned in root `optionalDependencies` (`@rollup/rollup-linux-x64-gnu@^4.63.5`):** CI runs on `ubuntu-latest` while the lockfile is authored on Windows; npm prunes foreign-platform optional binaries from the lockfile (npm/cli#4828), so `npm ci` failed on Linux with `Cannot find module @rollup/rollup-linux-x64-gnu`. The os/cpu-guarded entry is skipped on Windows and restores the binary on Linux. Maintenance rule recorded in `ci.yml`: keep this entry in sync when rollup bumps. Two CI runs failed before this fix (36456514335, 36456951037); run 36457300658 green.
- **Pre-plan leftovers untouched:** stray gitignored root `node_modules/` from the deleted prototype (npm install pruned extraneous packages); empty untracked `plans/e2e-sample-comparison-slice/` directory left as found.

## Files/components affected

Root: `package.json`, `.env.example`, `.github/workflows/ci.yml`, `package-lock.json` (new). New: `api/` (6 files), `web/` (9 files), `plans/phase-01/*` (3 files).

## Validation

See `testing-log.md` — install, lint, typecheck, test (2/2), build all green locally on Node 22.16.0. Live CI run recorded there after push.

## Remaining issues

- None blocking. Open owner items unchanged: MT-1/MT-8 (Phase 03), MT-2/MT-3 (Phase 08), MT-4 (Phase 09), MT-5 (Phase 10), MT-7 (Phase 14), MT-9 (`sources/` + license), MT-10 (provider notice).
