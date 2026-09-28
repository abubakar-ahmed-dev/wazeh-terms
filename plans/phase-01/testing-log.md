# Phase 01 — testing log

Environment: Windows 10 Pro, bash (Git Bash), Node v22.16.0, npm 10.9.2.
Date: 2026-09-28. All commands run at repository root.

| # | Check (plan §Test list) | Command | Result |
| --- | --- | --- | --- |
| 1 | Workspace install | `npm install` | Pass — 283 packages, `found 0 vulnerabilities` after vitest upgrade (first install had 2 moderate, dev-only `@vitest/mocker` via vitest 3; fixed by moving both workspaces to `vitest ^5.0.2`, see implementation log). |
| 2 | Lint both workspaces | `npm run lint` | Pass — eslint clean in `api` and `web`, no errors/warnings. |
| 3 | Typecheck both workspaces | `npm run typecheck` | Pass — `tsc --noEmit` clean in `api` and `web`. |
| 4 | Unit tests | `npm run test` | Pass — vitest 5.0.2: api `test/smoke.test.ts` 1/1, web `src/lib/version.test.ts` 1/1 (2/2 total). |
| 5 | Build | `npm run build` | Pass — `api/dist/version.js(+map)` emitted by `tsc`; `web/dist/index.html` + assets emitted by `vite build` (29 modules). |
| 6 | `.env.example` contents | manual review | Pass — only `docs/DEPLOYMENT.md` §2 names, placeholders, no real values, degradation notes per variable. |
| 7 | CI workflow deterministic | manual review | Pass — `.github/workflows/ci.yml`: Node 22, `npm ci`, lint → typecheck → test → build, no credentials/network. |
| 8 | Live CI run | `git push` + GitHub Actions | Pending — recorded after the branch is pushed; workflow file is deterministic and mirrors the locally green commands. |

Not run (out of phase scope): Playwright, corpus, provider/MCP live checks, deployment smoke. None exist yet by design.
