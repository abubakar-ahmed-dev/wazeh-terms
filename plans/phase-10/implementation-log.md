# Phase 10 — implementation log

Branch: `phase-10-knowledge-base` (from `dev` @ `1a53abe`; plan committed first).
Date: 2026-09-29.

## What was changed

The retrieval chain exists behind an injected service; an unconfigured
deployment keeps the Phase 06 honest partial byte-for-byte.

- **`api/src/config.ts`**: new `sanity` section (`contextMcpUrl`,
  `organizationToken`, `projectId`, `dataset`, `readToken` — all optional) +
  `retrieval` limits (`maxToolCalls` 6, `timeoutMs` 8s, `sourceCheckMaxAgeDays`
  180). Startup summary reports set/missing, never values.
- **`api/src/services/retrieval/transport.ts`**: minimal JSON-RPC 2.0 MCP
  client over HTTP (session header capture, deadline abort, coarse failure
  classes `unavailable|timeout|malformed`). Injected via `McpTransport`;
  tests use fakes.
- **`client.ts`**: initialize → tools/list → mode verification. KB tools are
  discovered by name pattern, never hardcoded; a dataset/GROQ-only toolset
  fails `wrong_mode` (ADR-006).
- **`query-builder.ts`**: closed fact-only payload (`topic`, jurisdiction,
  regime, category, party, effectiveDate); `isAllowlistedQueryPayload` guard
  asserted by tests.
- **`candidates.ts`**: zod-validated `RuleCandidate` (entryId is provenance,
  never a rule ID); structured array or labelled-prose parsing; malformed
  entries dropped with a count.
- **`known-answer.ts`**: ops check — seeded query must surface the expected
  canonical `ruleKey`; never a per-request call.
- **`api/src/services/canonical/reader.ts`**: narrow Content Lake read via
  plain `fetch` (no SDK): exactly one approved+current revision per ruleKey
  (optionally revision-pinned), `primarySource->` deref; unsupported
  `schemaVersion`, ambiguity, and transport failure map to closed reasons.
- **`api/src/services/eligibility/`**: `trigger-keys.ts` (code-owned registry
  mirroring the Studio allowlist + registered `machineConditionKeys`
  predicates), `triggers.ts` (three pure predicates: worker-charge payer,
  payment frequency, stated-total arithmetic in minor units per currency),
  `gate.ts` (pure deterministic eligibility: mapping → editorial states →
  trigger/class → machine conditions → scope → temporal validity → pinpoint
  → source-check freshness; every failure withholds with a closed reason and
  builds the exact `SourceCitation` only on success).
- **`api/src/services/analysis/retrieval.ts`**: orchestration — triggered
  topics only, bounded tool loop + deadline, canonical reads, gating;
  `FindingDraft` gained optional `source` (compare.ts).
- **`report.ts`**: retrieval stages/applicability become real; eligible
  candidates become `source_backed_concern` findings; withheld count adds a
  limitation; `status: complete` requires extraction completed + supported
  scope + clean retrieval + no unreadable critical field. Unconfigured output
  unchanged (asserted by regression tests).
- **`routes/analyses.ts` / `server/app.ts` / `server/index.ts`**: optional
  `retrieval` dep; real fetch transport + reader wired only when configured.
- **`routes/read-only.ts`**: `GET /api/v1/capabilities` now reports
  `sourceBackedChecks: "available" | "unconfigured"` (real state).
- **`docs/API.md` §3**: example + sentence for the additive capability key.
- **`api/scripts/live-retrieval-check.ts`** + `live:retrieval` script: the
  Phase 10 live checklist (tools/list + mode + known-answer + one gated
  citation). Not run in CI, not on a timer; runs only when MT-5 + the
  Phase 09 seed exist.

## Decisions / deviations from plan

- **Pakistan-recruiter payer does not fire the UAE-employer trigger** (plan's
  predicate said "payer ≠ UAE employer fires"): refined during testing — the
  trigger covers the UAE-side obligation only; `pakistan_recruiter` stays a
  separate Pakistan-side matter (root CLAUDE.md: never merge the sides).
  Worker/null/unknown/other payers still fire.
- **Uncheckable ≠ mismatch**: a stated total with no basic salary in the same
  currency is skipped, not reported as a total/components inconsistency.
- **Pinned-revision miss maps to `revision_mismatch`**; an unpinned miss maps
  to `unmappable_candidate` (reader `not_found` alone cannot distinguish).
- **`machineConditionKeys` registry added** (plan implied it): four registered
  conditions; an unregistered key on a rule withholds
  `condition_unverifiable` — fail-closed by construction.
- Capabilities key added to `docs/API.md` §3 example (additive contract
  surface, logged here rather than silently extended).

## Files/components affected

New: `services/retrieval/*` (5), `services/canonical/reader.ts`,
`services/eligibility/*` (3), `services/analysis/retrieval.ts`,
`scripts/live-retrieval-check.ts`, `test/phase-10/*` (6).
Changed: `config.ts`, `compare/compare.ts` (FindingDraft.source),
`services/analysis/report.ts`, `routes/analyses.ts`, `routes/read-only.ts`,
`server/app.ts`, `server/index.ts`, `api/package.json`, `docs/API.md`.

## Remaining issues

- **Live verification pending (D8):** `source_backed_concern` stays
  disclosed-partial until MT-5 (KB + endpoint + org token) and the Phase 09
  seed exist; then run `npm run live:retrieval -w api` and record results.
- `web/` renders findings in Phase 11; citation UI not in this phase.
