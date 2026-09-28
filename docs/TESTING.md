# WazehTerms — Test Strategy and Release Evidence

**Status:** Test contract and evidence template; no test execution or result is claimed here  
**Authority:** Product targets in `PRD.md`; accepted decisions in `ADR.md`; exact HTTP behavior in `API.md`. `SOURCES.md` owns source approval, `SECURITY.md` owns privacy controls.

## 1. Scope and test data

Build **15 labelled, visibly fictional cases**: four consistent offer/contract pairs; six pairs with explicit seeded mismatches; three cost/deduction or missing-term cases; and two incomplete, low-quality, multilingual, or adversarial cases. These groups are the planned primary distribution, not a claim that every category has equal metrics. Maintain five reproducible core demo cases: a consistent pair, an explicit salary/benefit change, a source-checked worker-charge question, a missing/conditional term, and an abstention. A single-document sample is required even if one case belongs to another primary group.

Proposed repository fixtures (create when code exists): `test-corpus/TC-001/offer.pdf`, `contract.pdf` where relevant, `truth.json`, and notes; `test-corpus/source-catalog.csv` records the date/URL and visible listing number when a BEOE public listing informed fictional attributes. Invent names, employers, addresses, and numbers. Do not copy real worker documents or represent a vacancy listing as a signed contract. Each `truth.json` should version its annotation schema, declared route/category, documents and readable pages, expected field components and state, original evidence location, seeded differences, allowed finding category, required ruleKey/revision/source version if applicable, and expected abstentions. Two reviewers should resolve contested annotations before scoring.

Keep fixtures and expected results separate from generated output. An official concern is testable only after the relevant `SOURCES.md` approval process produced actual versioned Sanity records; do not fabricate a legal rule merely to fill a test case. Run generated outputs against frozen fixture revisions, with model version, prompt version, code commit, Sanity content release, KB release, and deployed config recorded.

## 2. Test layers and representative cases

| Layer | Required checks | Ownership |
| --- | --- | --- |
| Schema/normalization unit | All 12 PRD field groups and 33 schema component keys; `present/absent/unclear/unreadable`, currency, exact versus conditional benefit, dates, payment frequency, missing payer, unsupported enum, page evidence, duplicate instances. | API code and corpus fixtures. |
| Comparison unit | Two explicit unequal salary components produce a mismatch with two passages; equal amounts, a missing component, one document, unreadable quote, or unsupported currency conversion do not. Pakistan recruitment fee actor remains distinct from UAE employer cost; no inferred benefit denial from silence. | Deterministic comparison module. |
| Review integrity/API | `sampleCaseId` allowlist, fixed sample paths, `403 CUSTOM_UPLOAD_DISABLED`; signed payload round trip, exact canonicalization, tamper to value/scope/digest/expiry, unknown key, old schema, duplicate/oversized/invented correction, user-reported difference. Verify correct 400/403/409/410/413/415/422/429 and safe 502/503/504 conditions from `API.md`. | API contract tests. |
| Extraction/evidence | Typed model output; page/text match on clean PDF, wrong page/false excerpt rejection, quote provenance, unreadable and scan abstention, corrupt/encrypted PDF, malformed JSON, extraction partial state, no accidental full-file retention. | Provider integration with controlled fixtures. |
| Retrieval/content | KB-only MCP `tools/list`, known-answer query, mapping to approved current `ruleKey`/revision and exact source version; missing pinpoint, stale KB, draft/superseded/withdrawn record, temporal mismatch, exception, actor/category mismatch, unresolved `resolutionNote`. | Sanity staging content plus direct canonical read. |
| Report/E2E | Review original versus correction, single versus pair, applicability `supported/conflicting/unknown`, five finding categories, honest stage coverage, official citation click target, official next-step allowlist, no global verdict, no positive summary for partial report. | Browser and API staging tests. |
| Abuse/privacy | MIME/magic mismatch, streamed oversized body, page bomb, malicious filename, adversarial instruction in PDF/KB, rate/concurrency limit, cancellation/deadline, `no-store`, no request body or excerpt in logs/telemetry, absence of worker data in Sanity and static bundle. | Security review and staging tests. |

Use fakes for deterministic unit/API failure tests and real provider/MCP requests only in a controlled staging suite. Check `200 partial` when useful document-only results survive Sanity/model explanation failure; `502`/`503`/`504` when no useful result exists. Check successful extraction does not imply rule review completed. The review step itself is marked `completed` only when the user advanced; it does not transform `model_transcription` into `matched_text`.

## 3. Accuracy and safety measurements

Freeze the labelled test set before measurement, then report exact numerators and denominators alongside the percentages. Score extraction separately for each supported input/language; never average scanned pages into clean-digital performance. The small corpus is a development check, not legal validation.

| Measure | Numerator / denominator | PRD target or invariant |
| --- | --- | --- |
| Clean digital field accuracy | Correct `(case, document, fieldKey, instanceId, component)` state **and** normalized value when present / all labelled in-scope, assessable components on readable English digital PDFs. Show state-only and value-only subtotals so missing fields do not inflate success. | ≥95%. |
| Critical mismatch recall | Seeded, assessable critical differences correctly emitted as `document_mismatch` with the two underlying source passages / all labelled critical mismatches that have two readable explicit terms. Also report separately any unreadable or out-of-scope seeded differences. | ≥90%. |
| Finding precision | Distinct emitted substantive `document_mismatch` or `source_backed_concern` findings judged fully supported in category and evidence / all such emitted findings. Break down by category; count duplicate unsupported findings as errors. Clarification/missing-info are evaluated separately. | ≥85%. |
| Source-backed citation support | Displayed `source_backed_concern` findings with correct approved rule revision, current official source version, actually supporting pinpoint, actor, category, conditions, and temporal applicability / **all** displayed source-backed concerns. Zero findings means no evidence of passing this gate. | 100%; zero unsupported claims. |
| Abstention safety | Cases requiring abstention with zero definitive rule/compliance claim / all labelled abstention cases; separately count false document mismatches. | Zero definitive compliance conclusions on abstention cases; no global verdict anywhere. |
| End-to-end latency | Time from accepted extraction request to report receipt, including human review wait separately: report machine processing time as extraction plus analysis and exclude user think time, with p50/p95, size and provider conditions. | p50 machine processing <45 s under normal demo conditions; not a timeout guarantee. |
| Photo/scan accuracy | Same component denominator on a separately labelled image/scan set, with passage quality and abstentions. | Earlier plan's ≥85% applies **only if** JPG/PNG is enabled; cannot be assumed from PDF results. |

Also publish absolute counts for `present/absent/unclear/unreadable`, failure/partial stages, wrong pinpoints, hallucinated quotations, and unsupported law assertions. A source-backed finding can fail the citation gate even if its general proposition sounds plausible. Report a confidence interval or explicitly state that 15 samples leave wide uncertainty; do not turn these percentages into a promise of legal correctness.

### Evidence ledger (fill after real runs)

| Release/build | Corpus revision | Provider/model | Sanity/KB release | Passed/total by measure | p50/p95 and conditions | Open failures |
| --- | --- | --- | --- | --- | --- | --- |
| Not run | Pending | Pending | Pending | No achieved measurements | No observed timing | Corpus, code, curation, and staging deployment pending |

Store dated machine-readable results and a concise human review record with the project when implemented. Do not include worker data or provider secrets in test artifacts.

## 4. Feature and content release gates

| Gate | Test evidence needed | Public state until passed |
| --- | --- | --- |
| English PDF sample demo | 15 labelled fixtures evaluated, five production samples reproducible, both document comparison and approved pinpointed rule case verified, abstention and partial paths, observed latency/limits. | Do not claim the vertical slice is shipped before tests run. |
| Real custom upload | `SECURITY.md` provider-tier/API/notice/consent review; upload rejection and cleanup tests; secrets and logs audit; measured resource and abuse limits. | `customUploadEnabled: false`; all arbitrary files rejected. |
| JPG/PNG | Separate representative phone photos and scans across page quality; correct quotes/page mapping where possible; strong abstention on ambiguous passages; approved image limits and UI copy. | Do not advertise images in `/capabilities` or UI. |
| Urdu explanation | Human bilingual review of amounts, negation, obligations, exceptions, uncertainty, and source labels; original English evidence visible. | `supportedAnalysisLanguages: ["en"]`. |
| Source-backed findings | Reviewed official Pakistan/UAE records where relevant; exact primary passage, provenance, live MCP candidate, direct Sanity match, adverse stale/conflict tests. | Suppress unapproved claims; keep document-only findings with partial/source limitation. |

For each release, inspect the live `/api/v1/capabilities` values against actual accepted inputs, measured limits, privacy notice, UI labels, and test matrix. The API's illustrated 8 MiB / 16 MiB / 15-page / 100-correction numbers are examples, not defaults proven by this document. The effective limits are whatever implementation and staging evidence justify, recorded in `DEPLOYMENT.md`.

## 5. Regression, CI, and failure triage

At each code change run fast comparison, schema, and API contract tests. At each change of extraction model, prompt, field registry, rule trigger, Sanity source version, KB build, or translation prompt, rerun the affected corpus and the full five-case staging smoke test. Rebaseline labels only after a documented human review; a new model output does not automatically redefine truth. On source edits, run programmatic content validation, refresh/rebuild the affected KB entries, then query them through the live MCP endpoint. Sanity KB refresh may report an issue while the old entry remains available; do not pass a source release until the active entry is checked.

CI job names and commands must be filled from the implemented repository; this specification does not claim a test runner or CI pipeline exists. Production smoke tests should use fictional samples only. For failures, preserve safe metadata (build, fixture ID, stage, error code, rule IDs) and a sanitized reproduction; never post real documents, full model prompts, or signed extractions in CI logs or issue trackers. Record owner, fix, and retest evidence for each release-blocking failure.
