# Phase 11 — implementation log

Branch: `phase-11-web-app`.
Date: 2026-09-30.

## What changed

- Expanded the bundled sample manifest to the five production demo cases:
  TC-001, TC-002, TC-012, TC-013, and TC-014.
- Added the React sample-only flow: capability-aware home, sample chooser,
  extraction pending, grouped review/corrections, analysis pending, and
  findings report.
- Added a small same-origin API client and render helpers under `web/src/lib/`.
- Added the Phase 11 visual foundation with the approved paper/ink/clay tokens
  and self-hosted Fraunces/Source Sans 3.
- Wired Express to serve `web/dist` with SPA fallback while preserving reserved
  `/api/*`, `/health`, and `/samples/*` routes.
- Added `api/scripts/e2e-server.ts` for the local test path: fake Gemini maps
  bundled sample bytes to the Phase 07 corpus `extracted.json` fixtures.
- Added focused Phase 11 tests for the five-sample signed extraction/analysis
  path and server-rendered UI states.

## Decisions / deviations

- The first local browser-test dependency install was stopped after it produced
  no output for several minutes and left no packages installed. The committed
  validation uses Vitest + supertest + React server rendering already available
  in the repository. Playwright/axe remain the intended browser stack once the
  dependency/tooling install is available.
- TC-012 copy was softened from "rules apply here" to "can raise an
  official-source question when source checks are configured" so sample cards
  do not overpromise on unconfigured local runs.

## Remaining issues

- Browser-level Playwright/axe checks are not yet committed because the
  dependencies were unavailable locally. This keeps Phase 11 below its ideal
  browser-proof bar even though the local API/UI render checks cover the core
  sample flow.
