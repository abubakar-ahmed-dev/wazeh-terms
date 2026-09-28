# plans/ — WazehTerms implementation plans

Index and working protocol. Phase instructions live in `CLAUDE.md` beside this file.
Authoritative product/technical contracts live in `docs/` (`README.md` at the root
orients; it does not override `docs/API.md` or `docs/ADR.md`).

## Files

| File | Purpose |
| --- | --- |
| `CLAUDE.md` | Phase execution instructions (read before any phase work). |
| `master-plan.md` | Phase-wise plan for the full MVP, dependency order. Current authority for sequencing. |
| `manual-tasks.md` | Human-only tasks, mapped to the phases that need them. |
| `needs-and-requirements.md` | What the implementation needs from the repository owner: nonsecret IDs/URLs per phase, secret-handling rules, decisions. |
| `phase-01/` … `phase-15/` | One folder per phase. |

## Per-phase folder protocol

Each `phase-NN/` folder holds three files, created as follows:

| File | Created when | Content |
| --- | --- | --- |
| `plan.md` | At **re-planning**, immediately before the phase starts | Detailed, specific instructions for that phase: exact files to create/change/remove, contract sections to implement, test list, acceptance checks. Re-planning re-reads `docs/`, `git log`, and the code to catch drift since the previous phase. |
| `implementation-log.md` | When the phase starts; appended during work | What was changed, files affected, decisions taken, deviations, remaining issues. Written whether or not the phase completes. |
| `testing-log.md` | When the phase starts; appended as validation runs | Commands run, actual results (pass/fail counts), coverage of the phase's test list, environment notes. |

Until a phase begins, its folder contains only a `README.md` stub describing scope.

## Workflow per phase

1. **Branch:** create `phase-NN-<slug>` from `dev` (e.g. `phase-01-foundation`). All phase work happens on that branch; never work directly on `main`.
2. **Re-plan:** write `phase-NN/plan.md` after re-checking docs, git state, and code for changes since the last phase. Update `master-plan.md` if reality diverged.
3. **Implement:** follow `plan.md` within the phase scope only.
4. **Validate:** run the phase's checks; record real results in `testing-log.md`.
5. **Log:** record what/where/why in `implementation-log.md`.
6. **Merge:** review `git status`/`git diff`, open a PR into `dev`, merge after validation passes. One coherent commit (or a small set) per phase. Never commit secrets, `.env`, generated artifacts, or real personal documents.

## Standing rules (from root `CLAUDE.md` and owner decisions)

- Fresh repository: implementation is built from `docs/` contracts only; the documented two-step signed `/api/v1` flow is the only runtime API. No legacy code exists or returns.
- Sample text/PDF fixtures under `fixtures/` are deterministic test inputs only. The running sample experience always calls Gemini; provider unavailable → documented `503 EXTRACTION_UNAVAILABLE`.
- Plans are milestone-based; no competition names or calendar delivery targets in plan files. Product-required dates (source-checked, effective periods, document dates, timeouts) are still recorded where the product needs them.
- `source_backed_concern` is complete only when Knowledge Base retrieval, the runtime MCP endpoint, official-source review, and canonical rule checks actually work. Until then, document-check-only milestones disclose the source-review limitation explicitly.
- Secrets never appear in plans, logs, source control, or client code. Local secrets live in a git-ignored `.env`; deployment secrets in the platform secret binding.
