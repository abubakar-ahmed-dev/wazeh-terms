# WazehTerms

**Understand your job offer before you sign.**

WazehTerms is an evidence-first employment document review app for people in Pakistan who are considering private-sector work in the United Arab Emirates. It reads a job offer and/or employment contract, extracts the written terms, shows the exact wording it found, compares the documents, and highlights differences or questions that deserve clarification before signing.

The app is built for one careful use case: Pakistan to UAE mainland private-sector employment terms. It is not a lawyer, recruiter, visa checker, employer verifier, or fraud detector. Its job is narrower and practical: help a worker see what the documents actually say, where the wording comes from, and which points may need a question.

![WazehTerms homepage](public/images/homepage.png)

## Current Status

**WazehTerms is live at <https://wazehterms-957765366699.asia-south1.run.app>** (Cloud Run, `asia-south1`, single origin for web + API per ADR-008; release record in `docs/DEPLOYMENT.md` §4).

As of October 2, 2026, the repository contains the complete MVP implementation:

- React/Vite web app with the Phase 12 dark visual design, guided navigation, fictional samples, upload/review flow, extraction review, findings dashboard, and responsive/accessibility checks.
- Express/TypeScript API with signed extraction handoff, deterministic term comparison, Sanity-backed source retrieval checks, HMAC proof validation, structured errors, cancellation handling, and security headers.
- Six allowlisted fictional sample cases for public demonstration and automated testing — the five core cases verified on the live deployment; the adversarial-instructions case (TC-015) joins this release.
- **Demo custom upload (MT-10, owner decision 2026-10-02):** real PDF upload is enabled **for fictional, non-sensitive documents only**, behind the approved "Demo uploads only" notice (`gemini-free-demo-v1`) with an unticked acknowledgment required before submission. The deployed provider is the Gemini API Free tier: submitted content may be used to improve Google products and may be reviewed by people — the notice says so plainly, and no zero-retention or private-processing claim is made. Real employment documents remain excluded; accepting them is a separate future release on a paid provider path.
- Security hardening for rate limits, concurrency admission, log redaction, no persistent upload storage, CSP, same-origin API behavior, and zero-temp-file test coverage.
- Live deployment: multi-stage Dockerfile, Cloud Run service with pinned Secret Manager bindings, staging-measured limits (45 s deadline, 15 s retrieval budget), rollback drill passed, and a verified source-backed concern on the live path — the worker-charge sample raises the official Article (6)(4) citation of UAE Federal Decree-Law 33/2021 (`docs/DEPLOYMENT.md` §4).

The public runtime advertises and enforces exactly what `/api/v1/capabilities` reports. The demo-upload posture is acknowledged as imperfect: a notice cannot guarantee users follow the fictional-only restriction — the owner accepted that residual risk for this demo, and a one-line flag rollback (`CUSTOM_UPLOAD_ENABLED: "false"` + redeploy) stays available.

## What It Does

WazehTerms supports a simple review journey:

1. Choose one of the fictional samples, or upload a job offer and/or employment contract when the runtime enables custom uploads.
2. The API extracts important terms from the PDF documents.
3. The review screen shows every extracted value with the page and quoted wording that supports it.
4. The user can correct a misread value without overwriting the original signed extraction.
5. The analysis step compares offer and contract terms with deterministic application logic.
6. The report lists document mismatches, missing information, unclear wording, and source-backed concerns where approved official references apply.

The app is designed to avoid false reassurance. If extraction, retrieval, citation verification, or applicability checks are incomplete, the result is explicitly partial. It should not tell a user that everything is fine when important checks did not finish.

![WazehTerms sample cases](public/images/sample-page.jpg)

## Review Scope

The MVP focuses on readable English PDF documents for Pakistan-to-UAE mainland private-sector employment.

It reviews terms such as:

- Employer name, job title, location, start date, and contract duration.
- Basic salary, allowances, total stated compensation, currency, and frequency.
- Accommodation, transport, meals, medical coverage, travel, or return ticket wording.
- Recruitment fees, visa or residency costs, medical costs, travel costs, deductions, and the stated payer.
- Probation, working hours, overtime, notice, termination wording, signatures, dates, and annex references.

It does not currently cover:

- Domestic work, government work, free-zone-specific rules, or other destination countries.
- Employer reputation, document authenticity, visa status, identity checks, or complaint filing.
- Image uploads, Urdu explanation, or arbitrary public uploads until those flags pass their independent gates.
- Broad legal compliance conclusions beyond the specific evidence-backed checks implemented.

## Built on Structured Content

The source-backed check only works because the content behind it is structured. Official references live in Sanity as versioned records — authority, exact source version, approved rule revision, and a pinpoint to the passage that supports the concern — each with its scope: jurisdiction, worker category, actor, conditions, and effective dates.

```
extraction → deterministic comparison → KB-only Sanity Context MCP query
           → canonical approved-record verification (rule revision, source
             version, pinpoint, actor, scope, dates) → concern + citation
           → any check fails or times out → withheld, report marked partial
```

Three things keyword search over documents cannot do:

- **Applicability, not relevance.** Finding the sentence "the employer shall bear recruitment costs" is easy; knowing the rule is current, applies to UAE mainland private-sector employment, and matches the documents' worker category is structure. The check fails closed when the structure does not confirm it.
- **Versioning with consequences.** When a rule is superseded, its approved revision changes and concerns tied to the old revision stop appearing. The content decides what may be claimed — not the prompt.
- **Designed for honest conflicts.** The content model keeps claims distinct — each linked to its own source and version, with uncertainty shown instead of blended away; a public side-by-side conflict case is on the roadmap.

The runtime endpoint is Knowledge Base-only (organization token, server-side); uploads, worker data, and reports never enter Sanity. Retrieval alone is never proof — the canonical approved record is.

## Evidence-First Design

WazehTerms treats evidence as a product requirement, not a cosmetic detail.

Every extracted field has a state: `present`, `absent`, `unclear`, or `unreadable`. A present value needs a document ID, page number, and supporting quote. A correction records both the original extraction and the corrected value. The report must show which value was used.

Findings are separated into clear categories:

| Category | Meaning |
| --- | --- |
| Document mismatch | Two readable explicit terms differ in a meaningful way. |
| Source-backed concern | An approved official source supports a specific concern about a term. |
| Missing information | A material term cannot be located in a sufficiently readable document. |
| Needs clarification | Wording is conditional, incomplete, or points to an unseen annex/policy. |
| Unable to determine | The relevant text, document, or source support is not available. |

Language models help with extraction and wording. They do not get to invent a mismatch, create a rule concern without source support, or hide uncertainty.

## User Experience

The interface is built around a small number of focused screens:

- Home page: introduces the app and shows a concrete salary mismatch example.
- Upload and review: lets a user provide a job offer, an employment contract, or both when enabled.
- Fictional samples: provides six invented cases for safe testing and demonstration, including one with embedded instructions aimed at automated systems (treated as data, never obeyed).
- How it works: explains the three-step flow and the privacy/evidence principles.
- Review workspace: displays extracted terms, page quotes, user corrections, and analysis status.
- Findings report: shows differences, questions to ask, and citations where source-backed checks apply.

![WazehTerms upload screen](public/images/upload-page.jpg)

## Architecture

WazehTerms is a monorepo with a React web client, Express API, Sanity-backed reference content, and a one-service Cloud Run deployment target.

| Layer | Technology | Role |
| --- | --- | --- |
| Web | React 19, TypeScript, Vite | Public UI, sample selection, upload/review flow, findings display. |
| API | Node.js 22, Express 5, TypeScript | Validation, extraction orchestration, signed handoff, comparison, report assembly. |
| Extraction | Gemini document understanding | Reads bounded PDF input and returns structured fields validated by schemas. |
| Knowledge | Sanity Content Lake and Sanity Context MCP | Curated official references, approved rules, and retrieval candidates. |
| Deployment | Docker and Cloud Run | One public service for built web assets, `/api/v1/*`, and `/health`. |

The browser holds selected files and signed extraction payloads in memory. The API does not create user accounts, worker databases, or permanent document archives. The knowledge system stores official/reference material only, not uploaded worker documents.

## Repository Layout

```text
.
|-- api/                 Express API, extraction, comparison, tests, fixtures
|-- web/                 React/Vite frontend
|-- sanity-studio/       Sanity schemas and content validation scripts
|-- docs/                Product, API, security, testing, deployment, and blog docs
|-- plans/               Phase plans, logs, implementation evidence, release notes
|-- deploy/              Cloud Run environment and deploy script
|-- public/images/       App screenshots used by documentation and blog content
|-- Dockerfile           Production image build
`-- package.json         Workspace scripts
```

## Local Development

Requirements:

- Node.js 22 or newer
- npm
- Server-side credentials for live extraction/retrieval tests when running provider-backed flows

Install dependencies:

```powershell
npm install
```

Run the API and web client in development:

```powershell
npm run dev
```

Run validation:

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

Useful workspace scripts:

```powershell
npm run dev -w api
npm run dev -w web
npm run live:sample -w api
npm run live:retrieval -w api
npm run validate:content -w api
```

Provider-backed scripts require the relevant environment variables. Do not put secrets in client-side Vite variables or commit `.env` files.

### Run it with no credentials at all

A test-path server bundles the real Express app with a deterministic fake extraction provider and the fictional corpus fixtures — no Gemini key, no Sanity token, no network beyond localhost:

```bash
cd api
# deterministic 15-case evaluation through the full HTTP stack (fake provider):
npx tsx scripts/run-eval.ts --mode=dry
# score it:
npx tsx scripts/run-eval.ts --mode=score --date=<the-date-you-ran-with>

# or run the server interactively and click through the samples:
SAMPLE_MODE_ENABLED=true CUSTOM_UPLOAD_ENABLED=true REVIEW_HMAC_SECRET=local-test-secret-not-a-credential GEMINI_API_KEY=dry-run-dummy-key-not-a-credential E2E_CORPUS_FIXTURES_DIR=../test-corpus npx tsx scripts/e2e-server.ts
```

The live sample and retrieval scripts (`live:sample`, `live:retrieval`) are the real-provider paths and do need credentials.

## Runtime Configuration

The deployment contract is documented in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Key settings include:

| Setting | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Server-side document extraction credential. |
| `SANITY_ORGANIZATION_TOKEN` | Sanity Context MCP access. |
| `SANITY_READ_TOKEN` | Canonical approved-rule/source read path where required. |
| `REVIEW_HMAC_SECRET` | Signs extraction handoff payloads. |
| `SAMPLE_MODE_ENABLED` | Enables the fictional sample flow. |
| `CUSTOM_UPLOAD_ENABLED` | Enables or rejects arbitrary user uploads. |
| `IMAGE_INPUT_ENABLED` | Controls image input support. |
| `URDU_EXPLANATION_ENABLED` | Controls Urdu explanation support. |
| `APPLICATION_DEADLINE_MS` | End-to-end API deadline below the platform timeout. |
| `RATE_LIMIT_MAX`, `MAX_CONCURRENT_EXTRACTIONS` | Abuse and resource controls. |

The frontend should trust the capabilities endpoint, not hardcoded assumptions. If the API says custom upload is disabled, arbitrary multipart uploads must return `403 CUSTOM_UPLOAD_DISABLED`.

## Security and Privacy

WazehTerms is designed for sensitive employment documents, so the implementation is intentionally conservative:

- No worker accounts or permanent document database in the MVP.
- Browser-only in-memory file preview.
- Server-side signed extraction proof with short expiry.
- No raw document text, quotes, prompts, identifiers, secrets, or signed payloads in logs.
- Rate limits, concurrency limits, application deadlines, and cancellation cleanup.
- Same-origin API deployment with strict security headers and CSP.
- Public samples are fictional and visibly marked as synthetic.

Real public custom uploads should stay disabled until provider data handling, privacy notice, retention behavior, measured limits, and production smoke evidence are reviewed and recorded.

## Latest Verification Snapshot

Recorded successful checks, by outcome (details in the phase logs under `plans/`):

- **Verification:** lint, typecheck, full API test suite (340+ tests including HMAC abuse, parser hardening, security headers, log redaction, zero-retention), web tests, production build, Docker image probes.
- **Live deployment smoke (2026-09-30):** one-origin SPA + API + `/health` with CSP/security headers and zero CORS grants; all fictional samples extract with signed handoffs; the worker-charge sample raises the official Article (6)(4) pinpoint of UAE Federal Decree-Law 33/2021 through live Knowledge Base retrieval and canonical verification; arbitrary upload cleanly rejected while the flag was off; rollback drill passed. Full results: `plans/phase-14/testing-log.md`, `docs/DEPLOYMENT.md` §4.
- **Demo upload (2026-10-02):** fictional-PDF upload through production returns a complete signed extraction under the approved notice.

Not yet recorded as complete:

- Full Playwright browser journey against the live URL (smoke so far is HTTP-level).
- Acceptance of real employment documents — deliberately out of scope; requires a paid provider path, revised notice, tests, and owner approval (MT-10 demo scope covers fictional documents only).

**Corpus evaluation (2026-10-02, 15 frozen cases, live production stack):**
the first scoring pass read field accuracy 46/49 (94%), recall 8/13 (62%),
precision 6/28 (21%). A later re-inspection (`release-polish` WI-1–WI-5)
found first-pass review errors and phantom truth seeds, fixed the comparison
engine's metadata false-mismatch policy, and rebaselined the truth files:
the same run's outputs rescored to **field accuracy 52/53 (98%), mismatch
recall 11/11 (100%), finding precision 13/13 (100%) substantive** (15
metadata-only mismatches now exempt by the `expectedToDiffer` policy), with
abstention safety 0 violations and 0 hallucinated quotes. Machine latency
p50 ≈ 20 s / p95 ≈ 27 s. The dry-run proof of the corrected engine: 53/53,
11/11, 12/12 across all 15 cases. **Caveats:** citation support is 1/1
structurally valid but awaits owner sign-off; the truth rebaseline awaits
owner ratification; TC-014's unreadable-page labeling is an open design
decision; a fresh production re-run on the corrected engine is the final
confirmation path. Fifteen samples leave wide uncertainty; these are
development checks, not legal-validation promises. Full record:
`test-corpus/eval/eval-2026-10-02-review.md` (see the 2026-10-02 addendum)
and `docs/TESTING.md` §3 ledger.

MT-10 demo-upload verification (2026-10-02): `/capabilities` reports `customUploadEnabled: true` + `privacyNoticeVersion: gemini-free-demo-v1`; a fictional PDF uploaded through production returned a complete, signed extraction (`sourceMode: custom`); the sample journey recovered after the Gemini key rotation (old key disabled at AI Studio and in Secret Manager version 1).

## Documentation

Important project documents:

- [docs/PRD.md](docs/PRD.md): product scope and acceptance gates.
- [docs/API.md](docs/API.md): API routes, payloads, proof, corrections, and errors.
- [docs/TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md): application boundaries and flow.
- [docs/SECURITY.md](docs/SECURITY.md): privacy, trust boundaries, and security gates.
- [docs/TESTING.md](docs/TESTING.md): corpus, test layers, metrics, and launch evidence.
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Cloud Run deployment and release runbook.
- [docs/BLOG.md](docs/BLOG.md): simple product blog article with screenshots.
- [plans/](plans/): phase plans, logs, implementation evidence, and remaining release notes.

## License

This repository is currently `UNLICENSED`. No reuse rights are granted beyond those provided by law unless a license is added later.
