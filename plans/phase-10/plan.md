# Phase 10 — Context MCP retrieval + rule eligibility/citation gate

**Status:** PLANNED → implementation starts now on this branch. Planning done
2026-09-29 on `dev` @ `1a53abe` (phases 01–08 merged; phase-09 plan on its own
branch).

**Goal (master plan §Phase 10):** Candidate discovery through the runtime
Knowledge Base-only Sanity Context MCP endpoint, and a hard deterministic gate
between candidates and any displayed `source_backed_concern` finding. With no
endpoint configured the current honest partial states are preserved exactly
(D8); with the endpoint configured, every rule claim passes the canonical
eligibility gate or is withheld with a recorded reason.

**Dependencies:** 06 (done), 09 for *live demo content* — not for this phase's
code. The gate, reader, and client are content-agnostic and proven with fakes.
Live verification (tools/list + known-answer + one demo citation) is a recorded
checklist that runs only when MT-5 (KB + endpoint URL + org token) and the
phase-09 seed exist. Owner's standing rule: no ad-hoc live API testing; the
live check is part of real code work once credentials arrive.

## Non-goals

- No dataset source on the application MCP endpoint (ADR-006; GROQ mode
  displaces KB tools — the client must detect and fail that mode).
- No KB building/refresh tooling here (owner MT-5 consumes the phase-09
  projection). No changes to extraction, comparison, or correction semantics.
- No web UI rendering of citations (Phase 11).

## Adds/changes (`api/`)

### Configuration (`src/config.ts`, `.env.example` unchanged — names exist)

New `sanity` config section, all optional, absent → retrieval unconfigured
(current behavior byte-identical):

- `contextMcpUrl` (`SANITY_CONTEXT_MCP_URL`), `organizationToken`
  (`SANITY_ORGANIZATION_TOKEN`, secret, server-only),
  `projectId`/`dataset` (`SANITY_PROJECT_ID`/`SANITY_DATASET`, nonsecret),
  `readToken` (`SANITY_READ_TOKEN`, optional — needed only if the dataset's
  read path requires it; MT-6).
- `retrieval` limits: `maxToolCalls` (default 6), `timeoutMs` (default 8_000,
  strictly under `applicationDeadlineMs`), `sourceCheckMaxAgeDays` (default
  180 — a rule whose `sourceCheckedAt` is older is stale → withheld).

### MCP client service (`src/services/retrieval/`)

- `transport.ts`: `McpTransport` interface (`request(method, params)`) +
  `fetchMcpTransport(url, token)` — JSON-RPC 2.0 over HTTP against the Context
  MCP endpoint, `Authorization: Bearer` org token, bounded response size,
  abort on deadline. Transport is injected; tests use a fake.
- `client.ts`: `initialize` → `tools/list` → mode verification. Pass requires
  at least one Knowledge Base tool (name matches the KB search/read pattern
  discovered from the listing — names are not hardcoded). A listing that only
  offers dataset/GROQ query tools fails as `wrong_mode` (ADR-006). Errors map
  to `unavailable` / `misconfigured`, never thrown into route code raw.
- `known-answer.ts`: `verifyKnownAnswer(transport, seed)` — ops/deploy check
  (script + later release checklist), never a per-request call. Seed comes
  from config/env at live-check time (phase-09 ruleKey + expected source
  version).
- `query-builder.ts`: builds retrieval queries from **facts only**:
  `{ topic, jurisdiction, employmentRegime, workerCategory, responsibleParty,
  effectiveDate }` derived from triggered field topics + declared scope. A
  unit test asserts the outgoing payload contains exactly these allowlisted
  keys — no document text, quotes, names, identifiers, images, or full
  extraction ever reaches Sanity (TECHNICAL_ARCHITECTURE §3.2.5).
- `candidates.ts`: tool results parsed through a zod `RuleCandidateSchema`
  (entryId, optional ruleKey/revision, optional sourceKey/versionKey, snippet,
  scores). Anything malformed → dropped candidate with reason. Retrieved text
  is untrusted data, never instructions.

### Canonical record reader (`src/services/canonical/reader.ts`)

Narrow direct read of approved records (allowed: "server may use a narrowly
scoped direct Sanity read to validate a retrieved candidate" — SOURCES.md §5):

- Plain `fetch` against the Content Lake HTTP query endpoint
  (`https://<projectId>.api.sanity.io/v1/data/query/<dataset>`), optional
  Bearer `readToken`. **No new dependency** (`@sanity/client` not added).
- Two queries: `ruleByRuleKey` (exactly one approved+current revision; with
  revision pin when the candidate carries one; `primarySource->` deref) and
  `sourceVersionByKey`. Unsupported `schemaVersion` → explicit
  `schema_version_unsupported`. Ambiguity (two approved current revisions) →
  `ambiguous_record`. Network/auth failure → `reference_unavailable` (report
  goes partial; document findings preserved).

### Eligibility gate (`src/services/eligibility/`)

- `trigger-keys.ts`: code-owned list mirroring
  `sanity-studio/schemaTypes/trigger-keys.ts` (same 3 keys + predicate
  descriptions). A test fs-reads the studio file and fails on key drift —
  same enforcement pattern as the registry mirror.
- `triggers.ts`: pure predicates over reconciled documents:
  - `worker_charge.payer_must_be_uae_employer`: any present
    recruitment/visa/residency/medical/travel/other_worker_charge field with
    stated payer ≠ `uae_employer` (or payer missing) triggers.
  - `salary.payment_frequency_must_be_monthly`: payment_frequency present
    with non-monthly value, or absent under readable coverage, triggers.
  - `salary.stated_total_must_match_components`: within one document, stated
    total ≠ basic + itemized allowances (minor-unit math) triggers.
- `gate.ts`: **pure** deterministic `gateCandidate(candidate, canonical,
  context)` per `DATABASE_SCHEMA.md` §9 runtime eligibility, checks in order:
  unambiguous mapping (candidate ruleKey/revision or unique source/pinpoint
  match) → rule approved + current + one revision → triggerKey registered +
  rule evidence class matches primary source class → source approved+current
  → jurisdiction/regime/category/party match the analysis context →
  `machineConditionKeys` predicates all evaluable and true (unevaluable →
  withheld, never guessed) → temporal validity (`effectiveFrom` inclusive /
  `effectiveTo` exclusive vs analysis + document dates; binding rule without
  verified dates → withheld; guidance needs current `currentGuidanceVerifiedAt`)
  → pinpoint present (label + quote) → `sourceCheckedAt` freshness.
  Output: `{ verdict: 'eligible', citation: SourceCitation }` or
  `{ verdict: 'withheld', reason }` with a closed reason enum
  (`unmappable_candidate`, `not_approved`, `not_current`, `revision_mismatch`,
  `source_superseded`, `evidence_class_mismatch`, `trigger_unregistered`,
  `condition_unverifiable`, `scope_mismatch`, `temporal_mismatch`,
  `pinpoint_missing`, `source_check_stale`, `schema_version_unsupported`,
  `ambiguous_record`). KB entry IDs never become rule IDs.
- `citation.ts`: builds the exact `docs/API.md` §6 `SourceCitation` from the
  canonical record (schema-validated; no field from the KB snippet text).

### Analysis orchestration + report wiring (`src/services/analysis/`)

- `retrieval.ts`: `runRetrieval(drafts, reconciliation, scopeApplicability,
  deadline)` — when configured and scope is `supported`: build fact queries
  for triggered topics, bounded tool loop (≤ `maxToolCalls`, deadline abort),
  map candidates → canonical reads → gate. Returns
  `{ stage, sourceFindings: FindingDraft[], withheld: Array<{ruleKey?:
  string, reason}>, disclosure?: string }`. Scope `conflicting`/`unknown` →
  retrieval `not_applicable` (rules withheld — existing behavior kept);
  unconfigured → `not_started` + existing limitation text (unchanged);
  unavailable/misconfigured → `failed` + disclosure; per-candidate
  withholdings never touch document findings.
- `report.ts`: `assembleReport` takes the optional retrieval result.
  - `stages.retrieval` / `stages.applicability` real values;
    `stages.explanation` still `completed` (deterministic templates).
  - Eligible candidates become `source_backed_concern` findings with
    `source: SourceCitation`, document evidence from the triggered fields,
    importance from the registry, checked next-step text.
  - Withheld candidates: no claim; an aggregated limitation line lists
    withheld count + reason classes (no rule text, no claim leakage).
  - `status`: `complete` only when extraction `completed`, scope
    `supported`, retrieval ran with zero withholdings-attributable gaps, and
    no unreadable critical field — otherwise `partial`. `ALL_CLEAR_SUMMARY`
    still reserved for complete + zero findings; `PARTIAL_SUMMARY` wording
    adjusted to reflect configured/unconfigured states honestly.
- `capabilities` route: expose the real retrieval state
  (`sourceBackedChecks: "available" | "unconfigured"`) — exact key checked
  against `docs/API.md` §5 during implementation; docs updated there if the
  contract names it differently (log any drift).
- `scripts/live-retrieval-check.ts`: ops checklist — tools/list, mode check,
  known-answer read, one gated demo citation. Not run in CI, not run on a
  timer; executed only as part of real work when MT-5 + seed exist. Output is
  the Phase 10 live-verification record for the testing log.

## Test list (fake MCP + fake canonical transport; no network)

1. **Mode verification:** tools/list without KB tools → `wrong_mode`; endpoint
   error → `unavailable`; both → report stays 200 partial with document
   findings intact and honest stage/limitation.
2. **Known-answer:** matching seed passes; mismatching read fails the check
   (ops function returns explicit failure, report unaffected).
3. **Query sanitization:** outgoing payload key-set allowlist asserted; no
   document text/identifiers in any outgoing string.
4. **Happy path:** candidate (ruleKey+revision) → canonical approved/current
   rule + current source → all checks pass → one `source_backed_concern` with
   complete `SourceCitation` (spot-check every field against the canonical
   record).
5. **Gate withholding matrix** (each → withheld with its reason, document
   findings untouched, no `source` object anywhere in the response):
   unmappable candidate; stale KB revision ≠ canonical current; superseded
   source version; rule not approved; rule not current; evidence-class
   mismatch; unregistered triggerKey; `machineConditionKeys` unevaluable;
   scope (jurisdiction/regime/category/party) mismatch; temporal mismatch
   (analysis date before `effectiveFrom` / after `effectiveTo`; binding rule
   with null dates); missing pinpoint; stale `sourceCheckedAt`; unsupported
   `schemaVersion`; two approved current revisions (ambiguous).
6. **Boundedness:** tool-call cap enforced (fake counts calls); deadline abort
   mid-loop → `failed` retrieval + partial report.
7. **Unconfigured regression:** existing phase-06 partial behavior byte-stable
   (same stage values, same limitation text, summary stays partial) when
   `sanity.contextMcpUrl` absent.
8. **Determinism:** same inputs → identical findings order/ids/citations
   (no model involvement anywhere in retrieval/gating).
9. **Trigger predicates:** unit suite per predicate (payer variants,
   frequency variants, total-vs-components incl. currency/frequency mismatch
   cases, repeated allowance items).
10. **Reader:** unsupported `schemaVersion`, ambiguous revisions, HTTP 401/500
    → mapped reasons; malformed GROQ response shape → dropped.
11. **Trigger-key drift:** api list ≠ studio list fails the test.
12. Full regression: lint, typecheck, all suites, builds.

## Owner inputs still pending (recorded, not blocking this phase's code)

| When | Item |
| --- | --- |
| Live checklist | MT-5: KB fed from the phase-09 projection; Context MCP endpoint URL (KB sources only); `SANITY_ORGANIZATION_TOKEN` via secure channel → `api/.env` |
| Live checklist | Phase-09 seed published (rule/source content to run the demo citation against) |
| Before deploy | MT-6 decision: `SANITY_READ_TOKEN` or reviewed public read path |

## Exit criteria (this phase)

- All tests above green without network; retrieval unconfigured behavior
  unchanged; every eligible claim carries a full canonical citation; every
  failure withholds rather than guesses.
- Live checklist script exists and its steps are written down; run recorded
  in the testing log only when the real endpoint + seed exist (until then
  `source_backed_concern` remains disclosed-partial per D8 — gate stays
  closed).
