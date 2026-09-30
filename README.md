# WazehTerms

**Understand your job offer before you sign.**

WazehTerms is an evidence-first employment document review app for people in Pakistan who are considering private-sector work in the United Arab Emirates. It reads a job offer and/or employment contract, extracts the written terms, shows the exact wording it found, compares the documents, and highlights differences or questions that deserve clarification before signing.

The app is built for one careful use case: Pakistan to UAE mainland private-sector employment terms. It is not a lawyer, recruiter, visa checker, employer verifier, or fraud detector. Its job is narrower and practical: help a worker see what the documents actually say, where the wording comes from, and which points may need a question.

![WazehTerms homepage](public/images/homepage.png)

## Current Status

**WazehTerms is deployed and serving the public sample-only demo at <https://wazehterms-957765366699.asia-south1.run.app>** (Cloud Run, `asia-south1`, single origin for web + API per ADR-008; release record in `docs/DEPLOYMENT.md` §4).

As of September 30, 2026, the repository contains the complete MVP implementation:

- React/Vite web app with the Phase 12 dark visual design, guided navigation, fictional samples, upload/review flow, extraction review, findings dashboard, and responsive/accessibility checks.
- Express/TypeScript API with signed extraction handoff, deterministic term comparison, Sanity-backed source retrieval checks, HMAC proof validation, structured errors, cancellation handling, and security headers.
- Five allowlisted fictional sample cases for public demonstration and automated testing — all five verified on the live deployment.
- Custom PDF upload implementation with streaming multipart parsing and in-memory previews.
- Security hardening for rate limits, concurrency admission, log redaction, no persistent upload storage, CSP, same-origin API behavior, and zero-temp-file test coverage.
- Live deployment: multi-stage Dockerfile, Cloud Run service with pinned Secret Manager bindings, staging-measured limits (45 s deadline, 15 s retrieval budget), rollback drill passed, and a verified source-backed concern on the live path — the worker-charge sample raises the official Article (6)(4) citation of UAE Federal Decree-Law 33/2021 (`docs/DEPLOYMENT.md` §4).

The runtime stays gated to the fictional-sample demo: `SAMPLE_MODE_ENABLED=true` and `CUSTOM_UPLOAD_ENABLED=false` in the deployed configuration. Upload support exists in the codebase, but enabling it for real documents waits on the provider data-handling review, privacy-notice approval, and remaining release gates (MT-10 in `plans/manual-tasks.md`); the public runtime advertises and enforces exactly what `/api/v1/capabilities` reports.

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
- Fictional samples: provides five invented cases for safe testing and demonstration.
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

Recent phase logs record the following successful checks:

- Phase 12 UI polish: typecheck, lint, API tests, web tests, build, desktop/mobile visual validation, accessibility/focus checks.
- Security hardening: lint, typecheck, build, 314 API tests, 5 web tests, HMAC abuse tests, parser hardening, security headers, redaction, and cancellation cleanup.
- Phase 13 custom uploads: streaming multipart upload behavior and in-memory previews.
- Phase 14 deployment: production build, local Express runtime probe, Docker image build/run/policy probes, Cloud setup/secrets/IAM, and the live deployment smoke (2026-09-30):
  - Health, capabilities, samples, SPA, and sample PDFs return 200 on one origin; CSP/frame-ancestors/referrer headers present; zero CORS grants.
  - All five fictional samples extract successfully; TC-001 completes with a signed extraction.
  - TC-012 raises the live source-backed concern with the official Article (6)(4) pinpoint of UAE Federal Decree-Law 33/2021 — Phase 10 retrieval verified in production.
  - Arbitrary upload returns a clean `403 CUSTOM_UPLOAD_DISABLED`; withheld rule reasons appear in the coarse `retrieval_outcome` log.
  - Rollback drill passed (traffic shifted to the previous revision and back); secrets resolve from pinned versions.
  - Full results: `plans/phase-14/testing-log.md` and `docs/DEPLOYMENT.md` §4.

Not yet recorded as complete:

- Full Playwright browser journey against the live URL (smoke so far is HTTP-level).
- Corpus evaluation metrics (Phase 15): field accuracy, mismatch recall, citation support, latency.
- Final approval to enable public custom uploads (MT-10).

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
