# Implementation Phase Instructions

This directory contains implementation plans for **WazehTerms**, a Pakistan-to-UAE pre-signing employment-document review assistant. These instructions apply while carrying out a plan in this directory. Paths to project documents below are relative to the repository root.

## Before Starting

Read:

1. The relevant `plan.md`.
2. The relevant sections of `PRD.md`.
3. `TECHNICAL_ARCHITECTURE.md` and the task-specific contracts: `API.md`, `DATABASE_SCHEMA.md`, `SOURCES.md`, `FRONTEND_SPECIFICATION.md`, `SECURITY.md`, `TESTING.md`, or `DEPLOYMENT.md` as applicable.
4. `ADR.md` when architectural decisions are involved.
5. The current progress file for the phase.

Then inspect the existing implementation and its actual configuration. The documents define intended behavior; their design status does not mean a feature has been built, tested, or deployed. If code and documentation differ, identify the discrepancy before making a major change and update the appropriate contract as part of the work.

## Work Scope

- Implement only the current phase/feature.
- Do not start future phases or redesign unrelated parts of the application.
- Avoid unnecessary refactoring and preserve existing functionality.
- Follow the accepted ADRs. Record a superseding decision before intentionally changing the agreed architecture.

## WazehTerms Boundaries

- The initial route is Pakistan to UAE **mainland, non-domestic private-sector employment** when applicability can be established. A document comparison can still be useful when legal applicability is uncertain; do not present a mainland rule conclusion in that case.
- The public demo starts with **allowlisted fictional samples**. Keep `customUploadEnabled` false until the provider-data-handling, notice, cleanup, log, and test gates in `PRD.md`, `SECURITY.md`, and `TESTING.md` pass. Do not infer that an arbitrary file is synthetic. English PDF is the assured input path after validation; JPG/PNG and Urdu explanation have independent release gates. UI labels must match `GET /api/v1/capabilities`.
- Keep the API's two-step flow: `POST /api/v1/extractions` returns a signed original extraction; `POST /api/v1/analyses` receives that unchanged payload and proof plus separate correction deltas. The client holds the active file preview, extraction, and report only in memory. Do not introduce accounts, server sessions, saved cases, or a report database without a new architectural decision.
- Treat uploaded text, model output, and MCP retrieval as untrusted. Validate extraction and evidence states; compare explicit offer/contract fields in application code. A user correction is labelled user supplied and cannot create a confirmed documentary mismatch by itself. Missing, unclear, unreadable, and explicit negative terms are different states.
- Use Sanity Content Lake only for approved, versioned **reference content**, never worker files, personal case data, corrections, or reports. The application-facing Sanity Context MCP endpoint has **Knowledge Base sources only**. A separate dataset source may feed that Knowledge Base. Before displaying a source-backed concern, check the current approved canonical rule, exact official source version and pinpoint, actor, route, conditions, and dates. Retrieval alone is not verification.
- Keep the built React app and Express API on one Cloud Run origin. Provider credentials, Sanity tokens, and the review signing secret remain server-side. Do not log document content, identifiers, original excerpts, prompts, signed extractions, or secrets.
- Reports show evidence, questions, coverage, and honest partial states. Never assign an overall safe, legal, fraudulent, or compliant verdict, and do not show a positive whole-review message when relevant checks are incomplete.

## During Implementation

Before changing a file:

- understand its current responsibility
- check how it is used
- follow existing project patterns

When introducing a dependency, service, API field, Sanity record, rule trigger, provider file-handling method, or external integration, verify it against the relevant contract before implementing it. Do not silently change source eligibility, accepted inputs, retention behavior, or the deployment layout. If an accepted decision must change, record the replacement ADR and update affected documentation and tests.

## Testing

Run validation appropriate to the change and the scripts that actually exist in the repository. Do not claim a test, quality target, integration, or deployment passed without running and recording it.

Frontend changes should normally include:

- lint
- typecheck
- relevant tests
- browser/Playwright checks when user-facing behavior changes, including mobile, keyboard, gated controls, evidence display, and partial/error states as relevant

Backend changes should normally include:

- lint
- typecheck
- unit/integration/API tests for the changed contract
- synthetic-case checks for extraction, deterministic comparison, signed review, or rule applicability when those paths change

Sanity/source changes should validate published and approved record versions, exact source pinpoints, Knowledge Base refresh or rebuild, and a known-answer MCP retrieval when relevant. Infrastructure or security changes should include the relevant `SECURITY.md` and `DEPLOYMENT.md` validation. Use fictional cases for normal development and production smoke tests. Record actual results and denominators for corpus evaluation as specified in `TESTING.md`.

## Progress Log

Maintain the phase progress file. Keep entries concise.

Record:

- implementation completed
- files changed
- validation performed and actual results
- issues discovered or release gates still closed
- important decisions and documentation changes

Update existing entries when correcting previous work instead of creating unnecessary duplicate entries. Separate completed behavior from planned or unverified behavior.

## Git

Only commit work that belongs to the current feature.

Before committing:

1. Check `git status`.
2. Review `git diff`.
3. Run required validation.
4. Confirm no secrets, real worker documents, personal information, generated artifacts, or unintended sample/source assets are included.
5. Commit with a meaningful message.

Never force-push shared branches.

## Completion

A phase is complete only when:

- planned implementation is complete
- relevant tests pass or any blockers are recorded explicitly
- required security, source, API, and deployment checks for that phase have been performed
- known issues are resolved or explicitly documented
- progress documentation is updated
- the final Git diff is reviewed

Passing a phase does not automatically open the separate public-upload, image, Urdu, official-rule, or production-release gates. Their evidence requirements remain in `PRD.md`, `SECURITY.md`, `SOURCES.md`, `TESTING.md`, and `DEPLOYMENT.md`.