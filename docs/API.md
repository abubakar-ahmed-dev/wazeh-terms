# WazehTerms — Public API Contract

**Status:** Proposed v1 contract for implementation; examples are illustrative and no deployed endpoint is claimed  
**Base:** Same-origin `/api/v1` on the public Cloud Run service  
**Related:** `PRD.md`, `ADR.md`, `TECHNICAL_ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `SOURCES.md`, `SECURITY.md`

## 1. Design rules

- The API has **two steps**: extract into a signed, reviewable object, then analyze that object with separate user corrections. There are no user accounts, server sessions, saved reports, or report-by-ID reads.
- `sampleCaseId` mode uses bundled **synthetic** server-controlled files. Custom multipart upload is enabled only after the PRD's real-document processing gate; when disabled, the server rejects arbitrary uploads. The UI reads current capability flags instead of assuming that visible controls imply support.
- PDF is the assured format once validated. JPG/PNG and Urdu are independent release flags; their presence in a type or schema does not imply production availability.
- The server makes document comparisons in code and uses Sanity Context MCP for candidate rules, then checks the approved canonical Sanity rule and official pinpoint before producing a source-backed concern.
- All endpoint responses use `Cache-Control: no-store`. Do not put document text, signed extraction, corrections, or provider credentials in URLs or logs. Use UTC ISO 8601 timestamps and one-based page numbers.

The `v1` HTTP path is versioned separately from the `IssuedExtractionV1` payload schema. Breaking changes to either require an explicit versioned migration. A request ID supports safe operations tracing but is **not** a stored report ID.

## 2. Endpoints

| Method and path | Purpose | Input | Result |
| --- | --- | --- | --- |
| `GET /api/v1/capabilities` | Advertise enabled modes, types, languages, limits, and privacy notice version. | None | Current configuration, `200`. |
| `GET /api/v1/samples` | List bundled, fictional cases. | None | IDs, descriptions, declared scope and same-origin preview URLs, `200`. |
| `POST /api/v1/extractions` | Validate and extract one or two documents. | JSON sample selection **or** multipart custom upload. | `IssuedExtractionV1`, server proof, and extraction stage state, `200`; no server-side case is created. |
| `POST /api/v1/analyses` | Analyze an issued extraction and separately supplied corrections. | JSON issued payload, proof, correction deltas. | Structured report, `200`, including when some checks were partial. |
| `GET /health` | Container health probe. | None | Minimal healthy response; no credentials or provider details. |

Sample preview assets, if served, use fixed same-origin `/samples/...` URLs returned by the samples API. There is no endpoint accepting an arbitrary file URL, fetching arbitrary web pages, writing to Sanity, or retrieving another user's analysis. Route names above are the target contract to implement and verify; `DEPLOYMENT.md` will record the actual live base URL.

## 3. Capabilities and sample modes

`GET /api/v1/capabilities` responds with enabled capabilities, **actual deployed limits** and a stable public privacy-notice version. Example values below show shape only; file/page/time values must be set from deployed tests, not copied blindly:

```json
{
  "apiVersion": "v1",
  "sampleModeEnabled": true,
  "customUploadEnabled": false,
  "acceptedCustomMimeTypes": ["application/pdf"],
  "supportedAnalysisLanguages": ["en"],
  "maxDocuments": 2,
  "maxBytesPerFile": 8388608,
  "maxTotalBytes": 16777216,
  "maxPagesPerPdf": 15,
  "maxCorrections": 100,
  "sourceBackedChecks": "unconfigured",
  "privacyNoticeVersion": "2026-09-28-draft"
}
```

`sourceBackedChecks` reports the real retrieval state: `"available"` only when the Knowledge Base-only Context MCP endpoint and canonical dataset are configured; `"unconfigured"` deployments show no rule-backed concerns and say so. `customUploadEnabled: false` means the API rejects **all arbitrary user files**; it cannot infer whether an arbitrary PDF is fictional by reading it. Sample mode remains usable through a server allowlist. If images or Urdu pass their gates, update this response, frontend copy, tests, and deployment notes together.

`GET /api/v1/samples` returns only safe metadata, such as `{ "samples": [{ "sampleCaseId": "TC-002", "title": "Fictional salary change", "scope": { ... }, "documents": [{ "role": "offer", "previewUrl": "/samples/TC-002/offer.pdf" }] }] }`. A `sampleCaseId` must match an allowlisted manifest entry; it is not a filesystem path. Samples contain no real worker details.

## 4. Extract documents

### 4.1 Request modes

**Synthetic sample:** `POST /api/v1/extractions`, `Content-Type: application/json`:

```json
{ "sampleCaseId": "TC-002" }
```

The server loads the allowlisted sample file(s) and scope from its manifest. The caller cannot substitute a URL, raw path, or different file while keeping that sample ID.

**Custom upload, only when enabled:** `Content-Type: multipart/form-data` with:

| Part | Type | Rule |
| --- | --- | --- |
| `scope` | JSON string | `{ "origin": "PK", "destination": "AE", "declaredRegime": "uae_mainland_private", "declaredWorkerCategory": "non_domestic" }`; `declaredRegime` may be `unknown`/`other`, and category `unknown`/`domestic` for a limited document-only review. |
| `offer` | file | Optional; at most one. |
| `contract` | file | Optional; at most one. |

Exactly one or both file parts are required. Reject unknown file fields, duplicate roles, empty files, and unsupported MIME/signatures. Preserve the declared document role; do not treat the filename as proof that a document is an offer or contract. If the internal text contradicts its selected role, flag it for review. Enforce total request size **before** buffering large content. The server checks PDF structure and page limits before a model call. Image parts are accepted only if the image gate is enabled.

### 4.2 Response

The response shape is:

```ts
type FieldState = "present" | "absent" | "unclear" | "unreadable";
type EvidenceVerification = "matched_text" | "model_transcription";
type StageStatus = "not_started" | "completed" | "partial" | "failed" | "not_applicable";

interface Evidence {
  documentId: string;
  page: number;                    // one-based and within pageCount
  quote: string;                   // reported original passage, bounded length
  verification: EvidenceVerification;
}

interface ExtractedField {
  fieldKey: string;                // one of the active 33 component keys
  instanceId: string;              // stable within issued payload for repeated items
  state: FieldState;
  rawText: string | null;
  value: NormalizedValue | null;
  evidence: Evidence[];
  qualityNotes: string[];
}

interface IssuedExtractionV1 {
  schemaVersion: 1;
  issuedAt: string;
  expiresAt: string;
  scope: {
    origin: "PK";
    destination: "AE";
    declaredRegime: "uae_mainland_private" | "unknown" | "other";
    declaredWorkerCategory: "non_domestic" | "domestic" | "unknown";
  };
  sourceMode: "sample" | "custom";
  documents: Array<{
    documentId: string;
    role: "offer" | "contract";
    mimeType: string;
    pageCount: number;
    sha256: string;                // processing digest, not an authenticity verdict
    extractionStatus: "completed" | "partial" | "failed";
    fields: ExtractedField[];
    unreadablePages: number[];
  }>;
}

interface ExtractionResponse {
  requestId: string;
  status: "complete" | "partial";
  issuedExtraction: IssuedExtractionV1;
  proof: { keyId: string; signature: string }; // server-produced HMAC-SHA256
  stages: { extraction: StageStatus };
  notices: string[];
}
```

`NormalizedValue` is a **discriminated union** validated at runtime:

| `kind` | Essential members | Constraints |
| --- | --- | --- |
| `text` / `reference_text` | `text` | Bounded text; reference IDs are displayed carefully and never treated as externally verified. |
| `money` | `amount`, `currency`, `frequency`, `component`, `payer?` | Decimal amount as a **string**, never a JS float; currency/frequency/payer may be null if not explicit, which may force an unclear result. Each salary/allowance/charge item carries its own units. |
| `date` | `date` | ISO `YYYY-MM-DD` only if unambiguous; preserve the original text. |
| `duration` | `amount`, `unit` | No conversion without an explicit unit. |
| `benefit_state` | `status`, `conditions?` | `provided`, `not_provided`, `allowance`, or `conditional`; missing text is a separate `FieldState`, not `not_provided`. |
| `boolean` | `value` | For presence checks such as signatures; never implies authenticity. |

For a `present` field, require a typed value and at least one reported page passage; if a passage is not corroborated, set `model_transcription` and carry a quality note. Without a usable passage, classify the value `unclear` or `unreadable`. For `absent`, require the relevant pages to have been sufficiently read and no positive evidence; `unclear` and `unreadable` do not silently become absence. One repeated `fieldKey` may have several `instanceId`s, such as separate allowances. The 33 active component keys and 12 group mappings are defined in `DATABASE_SCHEMA.md`.

The union referenced above is:

```ts
type NormalizedValue =
  | { kind: "text" | "reference_text"; text: string }
  | {
      kind: "money";
      amount: string;             // decimal string
      currency: string | null;    // ISO code when established
      frequency: "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "per_contract" | null;
      component: "basic_salary" | "allowance" | "stated_total" | "worker_charge";
      payer: "worker" | "uae_employer" | "pakistan_recruiter" | "other" | "unknown" | null;
    }
  | { kind: "date"; date: string } // ISO YYYY-MM-DD
  | { kind: "duration"; amount: string; unit: "hour" | "day" | "week" | "month" | "year" }
  | { kind: "benefit_state"; status: "provided" | "not_provided" | "allowance" | "conditional"; conditions: string | null }
  | { kind: "boolean"; value: boolean };
```

An explicit user confirmation that they inspected an image can be recorded as a **correction/review action** in the UI, but it does not turn the model's transcription into an independently matched source passage. A high-impact rule concern based only on an uncorroborated scan must be withheld or expressed as `needs_clarification` until the documentary term is substantiated.

On a partial extraction, return usable fields and identify failed/unreadable pages or documents. If **nothing** is usable, return a `422` error without an issued proof. The `sha256` stays only in this short-lived client payload and is not logged or stored as a document registry.

## 5. Integrity proof and reviewed corrections

The server signs the canonical JSON serialization of `IssuedExtractionV1`, including schema version, scope, document IDs/digests, original fields and evidence, and expiry. `proof.keyId` identifies the signing key; the MAC covers the key ID and payload. Verification uses an allowlisted key and constant-time comparison after enforcing request size. The payload is **signed, not encrypted**, and the proof provides no user identity or protection against replay during its validity window. The exact canonical serializer and key rotation policy must be shared by issuance and verification code and specified in `SECURITY.md`.

`POST /api/v1/analyses` accepts `application/json`:

```json
{
  "issuedExtraction": { "schemaVersion": 1, "issuedAt": "...", "expiresAt": "...", "scope": {}, "sourceMode": "sample", "documents": [] },
  "proof": { "keyId": "active-key-id", "signature": "server-issued-base64url-value" },
  "corrections": [
    {
      "documentId": "doc-offer-1",
      "fieldKey": "basic_salary",
      "instanceId": "basic_salary:0",
      "state": "present",
      "value": { "kind": "money", "amount": "2500.00", "currency": "AED", "frequency": "monthly", "component": "basic_salary", "payer": null }
    }
  ]
}
```

The abbreviated `issuedExtraction` above is **not a valid signed payload**; the client must send the exact object and proof it received from `/extractions`. A correction references an existing `documentId` + `fieldKey` + `instanceId`, never modifies the original evidence, and is validated for type, size, enum, and duplicate target. A user cannot add a new source passage through a correction. When a corrected `state` or value is not supported by original evidence, the report labels it user supplied and uses `needs_clarification` with reason `user_reported_difference` rather than a confirmed document mismatch. The client should offer a fresh upload/review if the user needs to replace the actual document.

Expiry is server-configured and returned in `expiresAt`; the UI warns before expiry and asks for re-extraction after it. Rotation may invalidate a still-unexpired proof, in which case the API gives a safe retry-by-upload message. Never send this payload through query strings, analytics, crash reports, or browser storage.

## 6. Analysis report

`POST /api/v1/analyses` returns `200` with a complete or explicitly partial report. Logical shape:

```ts
type FindingCategory =
  | "document_mismatch"
  | "source_backed_concern"
  | "missing_information"
  | "needs_clarification"
  | "unable_to_determine";

interface SourceCitation {
  ruleKey: string;
  ruleRevision: number;
  sourceKey: string;
  versionKey: string;
  issuingAuthority: string;
  officialUrl: string;
  pinpoint: { label: string; quote: string };
  jurisdiction: "PK" | "AE";
  responsibleParty: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;     // exclusive if set
  sourceCheckedAt: string;
  evidenceClass: "binding_official_rule" | "official_guidance";
}

interface Finding {
  id: string;                     // stable only within this response
  category: FindingCategory;
  fieldKeys: string[];
  importance: "high" | "medium" | "low" | "unknown";
  explanation: string;
  documentEvidence: Evidence[];
  valueOrigins: Array<"document" | "user">;
  comparisonRuleKey?: string;     // code-owned rule for an explicit mismatch
  source?: SourceCitation;         // required exactly for source_backed_concern
  uncertaintyReasons: string[];
  suggestedQuestionOrStep: string;
}

interface AnalysisResponse {
  requestId: string;
  status: "complete" | "partial";
  reviewedAsOf: string;
  scopeApplicability: "supported" | "conflicting" | "unknown";
  stages: {
    extraction: StageStatus;
    review: StageStatus;
    comparison: StageStatus;
    retrieval: StageStatus;
    applicability: StageStatus;
    explanation: StageStatus;
  };
  coverage: { documentIds: string[]; checkedFieldKeys: string[]; unreadableFieldKeys: string[]; omittedChecks: string[] };
  findings: Finding[];
  summary: string;
  limitations: string[];
  officialNextSteps: Array<{ label: string; url: string }>;
}
```

In this public response, `ruleRevision` is the approved Sanity `rule.revision`; `sourceKey` and `versionKey` identify the exact `sourceDocument` version. No generated Knowledge Base entry ID is treated as a canonical rule ID.

An explicit document mismatch has **two** readable document-evidence passages for the same component, one from each role, and a code-owned `comparisonRuleKey`. A user-only correction may produce a clarification finding; it cannot manufacture the missing documentary passage. A source-backed concern has an official, reviewed `source` object whose claim, actor, category, conditions, pinpoint, status, and dates passed the canonical-rule gate; a Knowledge Base citation by itself is insufficient. International guidance, if shown, is separately labelled supplementary context and never uses the `source_backed_concern` source slot to imply binding national law.

`review: completed` means the user advanced past the review screen; it does **not** certify that every quote was independently verified. `comparison: not_applicable` is normal for one document. If the route or UAE employment regime is uncertain, a report may still contain a document mismatch but must mark the missing rule check and avoid a mainland conclusion. A failed MCP or source read yields a `partial` response with the document findings intact. A model-explanation failure may use checked deterministic wording; report a limitation if an expected explanation remains incomplete. `officialNextSteps` URLs come from reviewed official sources or a server-side allowlist, not from raw document or model output. Never use “No concern detected in the fields checked” unless the relevant fields and checks completed; never return a global safe/legal/fraud verdict.

## 7. Errors and transport safeguards

Error body for non-`200` responses:

```json
{
  "error": {
    "code": "REVIEW_EXPIRED",
    "message": "This review expired. Upload the documents again to continue.",
    "stage": "review",
    "retryable": false
  },
  "requestId": "public-request-id"
}
```

| HTTP | Code examples | When |
| --- | --- | --- |
| `400` | `BAD_REQUEST`, `DUPLICATE_DOCUMENT_ROLE` | Malformed JSON/multipart or wrong field structure. |
| `403` | `CUSTOM_UPLOAD_DISABLED` | Arbitrary upload is not enabled on this deployment. |
| `409` | `REVIEW_VERSION_UNSUPPORTED` | Payload/schema version is no longer supported; re-extract. |
| `410` | `REVIEW_EXPIRED` | Server-issued extraction is past its expiry. |
| `413` | `FILE_TOO_LARGE`, `REQUEST_TOO_LARGE`, `TOO_MANY_PAGES` | Bound admission before the provider call. |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Unsupported MIME or file signature. |
| `422` | `UNREADABLE_DOCUMENT`, `INVALID_CORRECTION`, `REVIEW_INVALID` | No usable extraction, invalid correction, or unverifiable proof. Avoid exposing HMAC details. |
| `429` | `RATE_LIMITED`, `SERVICE_BUSY` | Rate or concurrency limit; include `Retry-After` when known. |
| `502`/`503` | `EXTRACTION_UNAVAILABLE`, `REFERENCE_UNAVAILABLE` | Upstream unavailable **and no useful result can be returned**; otherwise return an explicit `200 partial` report. |
| `504` | `ANALYSIS_TIMEOUT` | Application deadline before a useful partial report can be assembled. |

Errors and partial responses never echo raw document text, full filename, original quotes, signed extraction, provider response, or credentials in the error envelope or normal logs. Authenticate no user account; public abuse controls include same-origin browser restrictions, server-side admission limits, request throttling, and controlled concurrency. A forged `Origin` outside a browser is not an authentication mechanism; rate and cost controls still apply. Security details and provider data-handling gates belong in `SECURITY.md`.

## 8. Contract checks before declaring v1 implemented

1. One fictional single-document sample returns no false comparison; a pair with two different explicit salary passages returns a deterministic mismatch with both pages.
2. A changed signed field, changed scope, expired proof, wrong schema, duplicate correction, and invented field are rejected without leaking HMAC details.
3. An uncorroborated user correction remains user supplied and cannot generate a confirmed mismatch or official-rule claim by itself.
4. The deployed MCP returns candidates, but only a matching approved current Sanity rule/source version can produce `source_backed_concern`; stale, conflicting, or missing pinpoints are withheld.
5. Simulate Gemini and Sanity failures: retain valid document-only findings in `200 partial`, and never show a positive complete-review summary for incomplete checks.
6. Verify `/capabilities`, UI copy, actual accepted formats, feature gates, upload limits, and production response times agree. No API claim of implementation is made until these checks pass.
