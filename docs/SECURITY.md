# WazehTerms — Security and Privacy Design

**Status:** Target MVP controls; operational evidence must be recorded before public release  
**Applies to:** `PRD.md`, ADR-001–011, `TECHNICAL_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `SOURCES.md`, and `API.md`  
**Release posture:** Synthetic sample mode first. Real custom uploads, JPG/PNG, and Urdu have separate gates.

## 1. Trust boundaries and assets

The system has no worker accounts, durable case database, or server-side review session. A single public Cloud Run service hosts the React build and Express API. Sanity Studio is a separate editor surface. Treat browser input, uploaded documents, model output, and MCP results as untrusted; treat an approved Sanity rule as *eligible for checking*, not automatically applicable.

| Boundary | Sensitive material crossing it | Required control |
| --- | --- | --- |
| Browser → API | Document bytes or allowlisted sample ID, declared scope, signed original extraction, correction deltas. | HTTPS, strict request schemas, size and type limits, no request-body logging, `Cache-Control: no-store` for API responses. |
| API → Gemini | Bounded document content inline; optional previously checked findings for phrasing. | Server credential, approved model/account path, bounded payload, no arbitrary tools, no provider-side file upload in the MVP. |
| API → Sanity Context MCP | Issue topic and nonidentifying applicability facts. | Dedicated Knowledge Base-only endpoint, server-side organization Context Viewer credential, no raw document passages or identities. |
| API → Sanity Content Lake | Rule/source IDs and narrow read queries. | Least-privilege read access, explicit approval/version checks, no worker records or API write credential. |
| Editors → Sanity | Official/authorized reference records and public-safe review metadata. | Restricted Studio roles, two-person review where practical, schema plus programmatic content validation. |

Protect worker and employer identifiers in uploads and excerpts, the HMAC signing secret, Gemini/Sanity credentials, editorial rule provenance, and availability/cost of the public service. A public sample may be served as a static asset only after confirming every identity and document is fictional.

## 2. Data handling and honest notice

| Item | Location and lifetime | Rule |
| --- | --- | --- |
| Local selected file and preview | Browser memory for active review. | Clear on reset/navigation; revoke created object URLs; no `localStorage`, `sessionStorage`, IndexedDB, service-worker cache, URL parameters, analytics payloads, or browser error-report attachment. A page refresh loses the review. |
| Received document bytes | API memory during extraction; temporary filesystem only if an implementation needs it. | Never persist to an application DB, Sanity, shared bucket, normal logs, crash dumps, or backups. Delete local temporary files on success, error, abort, and deadline; verify this with tests. Cloud Run's writable filesystem is not durable storage. |
| Issued extraction and proof | API response and browser memory; echoed in analysis request. | Contains potentially sensitive passages even though signed. Never log, persist, share by link, or cache it. Reject after short server-configured expiry. |
| Report | API response and browser memory. | No server case history. Warn before the user chooses to download or share any local copy; remove transient state on reset. |
| Sanity Content Lake/KB | Persistent approved reference material only. | No worker uploads, excerpts from private cases, corrections, reports, or identifying retrieval queries. |
| Provider processing | Gemini API receives inline content. | Check and document the actual account tier, API path, provider logging and retention terms, and public notice **before** real custom uploads. Inline avoids a separately managed Files API object; it does not mean zero provider retention. If Interactions API is used, set `store: false` where applicable and verify behavior. |

`GET /api/v1/capabilities` exposes the actual `customUploadEnabled`, accepted MIME types, limits, languages, and `privacyNoticeVersion`. In sample mode, the backend rejects **every arbitrary file**, even one claimed to be synthetic, with `403 CUSTOM_UPLOAD_DISABLED`; only server-allowlisted fictional samples run. The notice explains that selected documents go to a model provider for extraction, names the configured provider/API behavior accurately, and suggests redacting unnecessary identifiers. Do not claim instant provider deletion, zero retention, complete confidentiality, or a guarantee of legal accuracy. Real-document evaluation also needs explicit consent and a separate retention/access decision.

## 3. Signed review handoff

`POST /api/v1/extractions` returns the complete `IssuedExtractionV1` and `{keyId, signature}`. The API uses HMAC-SHA256 over one documented canonical serialization of **all** issued fields, including schema version, issue and expiry times, declared scope, source mode, document roles/IDs/digests, field values, and evidence states. Use a cryptographically random high-entropy secret held in Secret Manager; reject unsupported key IDs, malformed data, oversize payloads, bad signatures, and expired proofs. Verify signatures with a timing-safe comparison, then validate the runtime schema and limits again. Never silently reserialize an attacker-controlled subset or let unknown fields bypass signing.

The canonical serializer is implemented once in `api/src/contracts/canonical-json.ts` and shared by issuance and verification. Its exact behavior:

1. Input must be plain JSON data — string, safe-integer number, boolean, null, array, or plain object. `undefined`, functions, symbols, BigInt, non-integer or unsafe numbers, class instances, and cyclic structures are rejected rather than coerced.
2. Object keys are sorted lexicographically by UTF-16 code unit, recursively at every nesting level.
3. Output contains no whitespace; `,` separates members, `:` separates keys; strings use standard `JSON.stringify` escaping; `null` is the literal.
4. Array element order is preserved and is significant data.
5. The signature input is the canonical JSON of the two-key envelope `{ "issuedExtraction": <payload>, "keyId": <keyId> }`; `signature` is base64url(`HMAC-SHA256(secret, UTF-8(canonical bytes))`).
6. Verification re-canonicalizes the **received** payload object — it never trusts client byte order or a client-serialized subset. Check order in `api/src/contracts/hmac-proof.ts`: proof shape → payload shape and `schemaVersion` → key-ID allowlist → constant-time signature compare → expiry. Signature failures return `REVIEW_INVALID` without key-validation detail; expiry maps to `REVIEW_EXPIRED`; `schemaVersion !== 1` maps to `REVIEW_VERSION_UNSUPPORTED`.

`POST /api/v1/analyses` receives that unchanged signed object plus distinct corrections. Validate each correction's existing `documentId`, `fieldKey`, and `instanceId`, type, length, allowed enum, count, and uniqueness. Preserve the original excerpt and verification state. A correction without documentary support remains user supplied and can yield `needs_clarification` with `user_reported_difference`, not a confirmed document mismatch or source-backed rule claim. The digest binds an issued extraction to the bytes processed in that request; it does not establish whether a document is authentic.

HMAC provides **integrity only**: it does not hide sensitive text, establish a worker identity, or prevent replay during the TTL. Choose and measure a short TTL and maximum review size before launch; display expiry in the UI. Rotate by issuing with a new key ID and, if safe, accepting the previous key only through the maximum outstanding TTL. If an old key is compromised, revoke it immediately and require re-extraction; `REVIEW_INVALID` must not reveal key-validation details. Change the payload/schema version deliberately and return `409 REVIEW_VERSION_UNSUPPORTED` to unsupported clients.

## 4. Upload, parser, and browser controls

Enforce total request bytes during streaming before buffering, per-file limits, two roles maximum, page counts, decompression/resource limits, and supported MIME *and* magic bytes. Reject empty, encrypted, malformed, or unsupported files before provider submission where detectable. Treat PDF page text as untrusted, bound text extraction memory and time, and do not run macros/scripts or arbitrary embedded links. A PDF preview uses only the local selected file or the fixed synthetic same-origin sample path; do not pass filenames into filesystem paths. An allowlisted `sampleCaseId` maps to a manifest entry, never a client-supplied path. No route fetches arbitrary URLs or uses user-provided source URLs, preventing server-side request forgery via this flow.

The English PDF path still abstains on scanned or unreadable pages. JPG/PNG handling and its limits remain disabled until tested independently. Render excerpts and model wording as escaped text, never trusted HTML or markdown with active content. Apply a practical Content Security Policy, restrictive framing policy, safe referrer policy, and HTTPS; audit the PDF preview implementation for active content, downloaded filenames, and object URL cleanup. The same-origin arrangement avoids a cross-origin API grant; do not treat an `Origin` or `Referer` header as client authentication. If cookies or accounts are ever added, design CSRF/session controls in a new decision.

## 5. Model and source manipulation

- Treat text inside contracts, offers, model completions, official pages, and KB entries as **data**, including text that says to ignore instructions, call another tool, leak secrets, or change a result. Fix the allowed tool set in server code; the model has no write tool or permission to fetch arbitrary sites.
- Runtime-validate typed extraction and check quoted PDF passages against their claimed text-layer page where feasible. For scans, label `model_transcription`; user review is not independent quote verification. `absent`, `unclear`, and `unreadable` do not mean an employer expressly denied a benefit.
- Compute field differences in application code. The model may phrase already established findings but cannot alter categories, evidence, comparison keys, applicability, or citations. Never infer a Pakistan-side fee rule from a UAE employer-cost rule or the reverse.
- Query Context MCP with issue topics and scope only. Attach **only the Knowledge Base** to the agent endpoint; a filtered dataset source may feed the KB separately. Resolve each candidate against exactly matching published, `reviewStatus: approved`, `recordStatus: current`, versioned canonical Sanity records. Validate trigger, actor, regime, worker category, dates, conditions/exceptions, reviewed official passage, and last-check date. A KB summary, bare URL, stale entry, international guidance, or unverified scan cannot manufacture a binding-law finding. See `SOURCES.md`.
- Sanity Studio validation does not protect programmatic imports. Run the same content gate at import/publish time and at runtime; hold suspect source/rule revisions out of the KB. The MCP credential is a server-side **organization** token with the required Context Viewer permission; scope its endpoint and datasets to approved public-safe material. The canonical read credential is separate and read-only when required. Keep Studio write permissions with editors, never in the public runtime.

## 6. Abuse, failures, and operations

The unauthenticated public endpoints can consume model quota and Cloud Run capacity. Use bounded rate and concurrent-job admission, application deadlines shorter than Cloud Run's request timeout, capped retries/tool calls, provider budget alerts, and max-instance/quota controls. A per-instance memory counter does not enforce a fleet-wide rate limit: before opening custom uploads at scale, measure abuse and add a shared/edge control if needed. Reject overload with `429 RATE_LIMITED` or `SERVICE_BUSY` and a known `Retry-After`. Cancel upstream work where supported after disconnect or deadline and free local bytes; Cloud Run may continue container work after an HTTP 504.

Keep logs to random request ID, coarse stage/result code, timings, provider error class, and resource counters. Prohibit raw bodies, full filenames, worker or employer names, passages, signed extractions, proof values, full prompts, provider completions, and secrets. Disable SDK/body/HTTP tracing that violates this rule; audit exception handlers and telemetry before launch. No normal log retention promise substitutes for verifying Cloud Run, provider, and Sanity settings.

| Incident | Immediate response | Recovery evidence |
| --- | --- | --- |
| HMAC or provider credential exposed | Rotate/revoke secret, invalidate impacted proofs, investigate bounded logs without copying private material. | New secret version deployed, old access removed, replay and error tests pass. |
| Wrong/stale source claim | Disable affected rule/content release or source-backed output, mark affected report path partial, review official passage and conflict. | New approved source/rule revision, KB reconciliation, known-answer and citation test pass. |
| Provider or Sanity outage | Return valid document-only `200 partial` when possible; otherwise safe `502`/`503`/`504`. | Stage metrics and user-facing limitation reflect what actually ran. |
| Suspected worker data in logs/Sanity | Stop the affected ingestion path, restrict access, follow provider/project incident process, remove unauthorized copies under verified retention controls. | Scope of exposure documented without reproducing documents in incident tickets. |

## 7. Security release checklist

1. Public samples are fictional; custom upload stays disabled until the provider tier/API handling, privacy notice, consent, cleanup, and log audit are approved. Capabilities, API rejection, and UI wording agree.
2. Tampered, expired, replay-within-TTL, changed-scope, unknown-key, and oversized signed payloads behave as specified; replay is acknowledged as a limitation, not silently promised away.
3. Malicious PDFs, MIME mismatches, too many pages, strange filenames, embedded instructions, and exhausted resources are rejected or produce bounded partial results.
4. Sanity MCP returns candidates through the Knowledge Base mode, and runtime rejects a draft, superseded, conflicted, unmappable, or unsupported official pinpoint. Public Sanity records contain no worker data.
5. Real configuration uses secret bindings, least-privilege identities, measured limits, safe error envelopes, no sensitive normal logs, and an incident owner. Findings never deliver a global safe/legal/fraud verdict.

Operational deployment steps and the evidence ledger belong in `DEPLOYMENT.md`; executable test cases and measured outcomes belong in `TESTING.md`.

**Platform references:** [Gemini file input methods](https://ai.google.dev/gemini-api/docs/file-input-methods), [Gemini data-retention guidance](https://ai.google.dev/gemini-api/docs/zdr), [Sanity Context security](https://www.sanity.io/docs/ai/sanity-context-security), [Sanity schema validation](https://www.sanity.io/docs/content-lake/schema-validation-and-the-content-lake), and [Cloud Run request timeouts](https://cloud.google.com/run/docs/configuring/request-timeout). Verify the deployed account and settings rather than assuming the documents' examples are its effective policy.
