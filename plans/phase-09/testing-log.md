# Phase 09 — testing log

Environment: Windows 10 Pro, Git Bash, Node v22.16.0. Content work 2026-09-29;
draft import + post-import validation 2026-09-30 (UTC stamps in Sanity show
2026-09-29T19:0xZ).

| # | Check | Command / method | Result |
| --- | --- | --- | --- |
| 1 | Seed gate (pre-import) | `npm run validate:content -w api -- ../sanity-studio/content/seed/records.json` | PASS, exit 0 (44 records: 2+6+3+33) |
| 2 | Draft-variant gate | gate on `seed/drafts.json` (weak refs) | PASS, exit 0 |
| 3 | Draft import | Sanity MCP `create_documents`, dependency order (authorities → sources → rules → fields) | 44/44 created as `drafts.*`; 0 failures |
| 4 | No publication | MCP query, `perspective: published`, 5 record types | count = **0** — nothing published |
| 5 | Post-import gate (read-back) | MCP `query_documents` raw perspective → `readback-2026-09-29.json` → gate | **First run FAIL (2 findings)**: `responsibleParty` missing on both UAE rules — import-payload omission caught by the gate. Patched both drafts (`patch_documents`), re-read 44, re-ran gate: **PASS, exit 0** |
| 6 | Rule states in dataset | read-back inspection | `ae-recruitment-costs-employer-bears` r1 = draft; `ae-salary-payment-due-monthly` r1 = approved (no trigger); `pk-oep-service-charges-bank-deposit` r1 = draft — exactly per owner decisions |
| 7 | Registry mirror | gate-internal drift check | Pass (gate green implies studio lists = code registry) |
| 8 | Regression after gate/schema change | api suite 276/276; gate tests 14/14; lint 0; typecheck (api+web+studio) clean; `sanity build` green | Pass |

## Notes

- The post-import gate catching the missing `responsibleParty` is the §11.2
  acceptance check working as designed: Studio/API writes are not constrained
  by schema validation; only the programmatic gate enforces the invariants.
- Weak-reference deviation (draft stage only) recorded in the
  implementation log; publish step restores strong refs in dependency order.
- Live Sanity operations recorded above are content-import work explicitly
  authorized by the owner; no Gemini or MCP-retrieval calls were made.
