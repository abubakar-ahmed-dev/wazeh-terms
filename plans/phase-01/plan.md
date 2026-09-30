# Phase 01 — Monorepo foundation + CI — plan

**Re-planning check (before start):** `dev` at `50f141e`. Repository contains only
`docs/`, `plans/`, `sanity-studio/` (shell, empty schema), `fixtures/samples/TC-002/`,
untracked `sources/*.md` link lists, root `README.md`/`CLAUDE.md`/`.gitignore`.
No `api/`, no `web/`, no root `package.json` — nothing to repair; built from scratch
per master-plan D1. Leftover gitignored root `node_modules/` from the deleted
pre-plan prototype stays untracked; `npm install` prunes it.

**Goal (master-plan):** clean, buildable monorepo skeleton (api + web), tooling,
lint, CI, documented environment template. No product endpoints yet.

## Files to create

| File | Content |
| --- | --- |
| `package.json` (root) | private; `workspaces: ["api", "web"]` (sanity-studio excluded — separate toolchain); scripts `dev`, `build`, `test`, `typecheck`, `lint` delegating with `--workspaces --if-present`; `engines.node >=22`. |
| `.env.example` (root) | Documented names from `docs/DEPLOYMENT.md` §2 only, placeholders, each marked optional-with-degradation, no real values: `GEMINI_API_KEY`, `SANITY_ORGANIZATION_TOKEN`, `SANITY_READ_TOKEN`, `REVIEW_HMAC_SECRET`, `SANITY_CONTEXT_MCP_URL`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SAMPLE_MODE_ENABLED`, `CUSTOM_UPLOAD_ENABLED`, `IMAGE_INPUT_ENABLED`, `URDU_EXPLANATION_ENABLED`, `MAX_BYTES_PER_FILE`, `MAX_TOTAL_BYTES`, `MAX_PAGES_PER_PDF`, `MAX_CORRECTIONS`, `APPLICATION_DEADLINE_MS`, `PRIVACY_NOTICE_VERSION`. Note that local secrets live in git-ignored `api/.env`. |
| `api/package.json` | type `module`; deps `express`, `zod`, `dotenv`; dev `typescript`, `tsx`, `vitest`, `eslint`, `typescript-eslint`, `@types/express`, `@types/node`; scripts `dev` (tsx watch), `build` (tsc), `typecheck`, `test`, `lint`. |
| `api/tsconfig.json` | strict; `NodeNext` modules; `outDir dist`; includes `src`, `test` for typecheck; build config emits `src` only. |
| `api/eslint.config.mjs` | typescript-eslint flat config, type-checked not required at this phase. |
| `api/src/version.ts` | Placeholder module (`API_NAME`, `API_VERSION` exports) so `tsc` and `vitest` have inputs. Master-plan says "empty `src/`"; a single non-behavioral placeholder is the minimal deviation that keeps the exit-criteria commands green. No endpoints, no server bootstrap. |
| `api/test/smoke.test.ts` | Trivial vitest: placeholder exports exist. |
| `web/package.json` | Vite + React + TS scaffold: deps `react`, `react-dom`; dev `@vitejs/plugin-react`, `typescript`, `vite`, `vitest`, `eslint`, `typescript-eslint`, `@types/react`, `@types/react-dom`; scripts `dev`, `build` (`tsc --noEmit && vite build`), `preview`, `typecheck`, `test`, `lint`. |
| `web/tsconfig.json` | Strict, bundler resolution, JSX `react-jsx`, includes `src` + `vite.config.ts`. |
| `web/eslint.config.mjs` | Flat config with react hooks not yet needed; plain TS + browser globals. |
| `web/index.html` | Root html mounting React. |
| `web/vite.config.ts` | React plugin; vitest config (node environment, trivial suite). |
| `web/src/main.tsx`, `web/src/App.tsx` | Trivial buildable home placeholder ("WazehTerms — implementation starts at Phase 11"). |
| `web/src/lib/version.ts`, `web/src/lib/version.test.ts` | Tiny pure module + one trivial vitest. |
| `.github/workflows/ci.yml` | On push/PR; Node 22; `npm ci` at root; run `lint`, `typecheck`, `test`, `build` via root scripts; deterministic — no provider credentials, no Sanity, no network calls; suites needing live services do not exist yet and later phases must skip when env absent. |

## Decisions

- Express major: `^5` (current stable major; docs do not pin a version; runtime code arrives Phase 03).
- ESM everywhere (`"type": "module"`), matching `tsx`/Vite defaults and Node 22.
- Per-workspace ESLint flat configs; root script delegates. No shared eslint package yet (no clear need).
- No Tailwind/shadcn/UI dependencies in this phase — UI stack lands with Phase 11 per master plan; Phase 01 is a buildable trivial scaffold.
- `sanity-studio/` keeps its own package.json and toolchain; not a root workspace, not part of CI this phase (no schema yet; MT-2/MT-3 pending).
- API `build` emits `dist/` via `tsc` (proves compilation); real container build arrives Phase 14.
- Money/field/proof code does not exist yet — nothing in this phase touches `docs/API.md` runtime shapes.

## Test list (acceptance)

1. `npm install` at root resolves workspaces without errors.
2. `npm run lint` green for api + web.
3. `npm run typecheck` green for api + web.
4. `npm run test` green: one trivial vitest per workspace (2 tests).
5. `npm run build` green: api `tsc` emits `dist/`; web `vite build` emits `dist/`.
6. `.env.example` contains only DEPLOYMENT.md §2 names + placeholders, no real values.
7. CI workflow file present, Node 22, deterministic steps only.
8. Live CI run green on push (checked via `gh` if available; otherwise recorded as pending owner push).

## Out of scope

Any `/api/v1` route, HMAC, field registry, Gemini/Sanity integration, Studio schema, UI design, deployment.
