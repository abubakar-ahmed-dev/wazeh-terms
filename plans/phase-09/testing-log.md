# Phase 09 — testing log

Environment: Windows 10 Pro, Git Bash, Node v22.16.0. Content work 2026-09-29;
draft import + post-import validation + publication + KB build 2026-09-30.

## Draft-stage checks (2026-09-30)

| # | Check | Command / method | Result |
| --- | --- | --- | --- |
| 1 | Seed gate (pre-import) | `npm run validate:content -w api -- ../sanity-studio/content/seed/records.json` | PASS, exit 0 (44 records: 2+6+3+33) |
| 2 | Draft-variant gate | gate on `seed/drafts.json` (weak refs) | PASS, exit 0 |
| 3 | Draft import | Sanity MCP `create_documents`, dependency order (authorities → sources → rules → fields) | 44/44 created as `drafts.*`; 0 failures |
| 4 | No publication (pre-authorisation) | MCP query, `perspective: published`, 5 record types | count = **0** — nothing published |
| 5 | Post-import gate (read-back) | MCP `query_documents` raw perspective → `readback-2026-09-29.json` → gate | **First run FAIL (2 findings)**: `responsibleParty` missing on both UAE rules — import-payload omission caught by the gate. Patched both drafts (`patch_documents`), re-read 44, re-ran gate: **PASS, exit 0** |
| 6 | Rule states in dataset | read-back inspection | worker-charge = draft; wage-guidance = approved (no trigger); PK OEP = draft — exactly per owner decisions |
| 7 | Regression after gate/schema change | api suite 276/276; gate tests 14/14; lint 0; typecheck (api+web+studio) clean; `sanity build` green | Pass |

## Publication + KB checks (2026-09-30, owner-confirmed subset)

| # | Check | Command / method | Result |
| --- | --- | --- | --- |
| 8 | Publication | `publish_documents` in dependency order; weak→strong ref patches before each level | **43 published** (2+6+2+33); Rule 1 excluded |
| 9 | Published counts + refs | MCP query: published vs drafts; `_weak` scan | 43 published / **1 draft (Rule 1)** / **0 weak refs** among published |
| 10 | Published-record gate | gate on authenticated read-back `published-readback-2026-09-30.json` | **PASS, exit 0** (43 records) |
| 11 | CLI dataset read posture | `validate:content --from-dataset --published`; unauthenticated probe; org-token probe | **0 records unauthenticated**; org token → `401 project user not found` → MT-6 reversed: project Viewer `SANITY_READ_TOKEN` required (owner action recorded) |
| 12 | Dated export + KB projection | built from authenticated read-back; committed `export-2026-09-30.json` + `kb-projection-2026-09-30.json` | 43 + 43; Rule 1 excluded from projection |
| 13 | KB import job | `sanity context imports create kbynAP4r8P6m --file kb-projection-2026-09-30.json` | job `ctx-ingest-e8368760…` **succeeded** |
| 14 | KB build job | `sanity context build kbynAP4r8P6m` | job `ctx-build-c2ff3a39…` **succeeded** (≈2m15s) |
| 15 | **Live tools-only + known-answer** (reported separately from any source-backed concern test) | `LIVE_KNOWN_ANSWER_QUERY="salaries due first of month wage protection system" LIVE_KNOWN_ANSWER_RULE_KEY=ae-salary-payment-due-monthly npm run live:retrieval -w api -- --tools-only` | **PASS**: tools/list + KB-mode verified; known-answer read surfaced the seeded ruleKey (4 entries). Gated source-backed concern test explicitly **SKIPPED** — guidance retrieval does not complete Phase 10 (owner instruction) |
| 16 | Regression after live-fix changes | api suite **276/276**; typecheck clean | Pass |

## Issues found and fixed during these checks

1. Post-import gate caught missing `responsibleParty` (import-payload
   omission) — patched, re-validated.
2. Content Lake API serves no anonymous dataset queries; org Context token is
   not a project member (401). Exports/projections produced from the
   authenticated session read-back; `SANITY_READ_TOKEN` now required (MT-6).
3. MCP transport treated the endpoint's 202-empty notification response as a
   rejection, and sent an illegal `id` on JSON-RPC notifications — both fixed
   in `transport.ts` (found live, regression-tested offline).
4. Search tool selection picked the KB reader instead of the searcher;
   `pickKbSearchTool` now selects the search surface.
5. `knowledge_base_search` requires `knowledgeBase` + `query` (schemas probed
   live); query builder rewritten to the real tool shape with a new nonsecret
   `SANITY_KB_ID` config; KB prose output handled by key-token candidate
   extraction + `expectedTopic` gate check (each documented in the
   implementation log).
6. Projection filter dropped authorities (no `recordStatus` field) — fixed in
   both the committed projection and `export-approved.mjs`.

## Notes

- Live Sanity/KB/MCP operations above are the content-release work the owner
  explicitly requested; no Gemini calls were made.
- Phase 09 publication milestone is done; Phase 09 completion and the Phase 10
  gated source-backed concern remain open pending the 20/2023 + 9/2024
  amendment checks, Rule 1 approval/publication/KB indexing, and the full live
  gate run.
