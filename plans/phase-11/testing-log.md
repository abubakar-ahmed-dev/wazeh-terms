# Phase 11 — testing log

Environment: Windows 10 Pro, PowerShell, Node v22.16.0.
Date: 2026-09-30.

| # | Check | Result |
| --- | --- | --- |
| 1 | `npm.cmd run typecheck` | Pass — api, web, and sanity-studio typecheck clean. |
| 2 | `npm.cmd run build` | Pass — api build and web Vite production build green. |
| 3 | `npm.cmd run lint` | Pass — 0 issues after removing stale debug import and unused symbols. |
| 4 | `npm.cmd run test` | Pass — api **43 files, 279/279 tests**; web **2 files, 5/5 tests**. |
| 5 | Phase 11 focused tests | Pass — `api/test/phase-11/five-sample-flow.test.ts` exercises all five samples through signed extraction/analysis; `web/src/views/phase11.render.test.tsx` covers rendered sample-only, review provenance, partial findings, and official citation states. |
| 6 | Browser smoke via Playwright MCP | Pass — served `web/dist` through `api/scripts/e2e-server.ts` on port 3014; `/` and `/examples` loaded; desktop and 390px mobile accessibility snapshots showed the five sample cards without obvious overlap. |
| 7 | Committed Playwright + axe suites | Not run. Browser test packages were not locally available; attempted install was stopped after a silent hang. |

## Notes

- The focused API test exercises the five production samples through
  `/api/v1/extractions` and `/api/v1/analyses` using fake Gemini backed by the
  committed Phase 07 corpus extractions.
- The web render test covers capability-gated sample-only copy, sample preview
  URLs, correction provenance, partial findings, and official citation display.
- The Playwright MCP browser tool exposed navigation/snapshot only in this
  session, so the interactive click-through remains covered by the API
  five-sample smoke rather than a committed Playwright journey.
