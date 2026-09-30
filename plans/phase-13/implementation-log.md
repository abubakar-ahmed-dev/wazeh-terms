# Phase 13 — Implementation Log

Branch: `phase-13-custom-uploads`
Date: 2026-09-30

## What Changed

1. **Backend Multipart Streaming Parser (`api/src/services/multipart.ts`)**
   - Implemented `parseMultipartUpload(req, limits)` using `busboy`.
   - Streaming in-memory parsing with zero disk retention (ADR-002 & ADR-003).
   - Enforces per-file limit (`maxBytesPerFile = 8MB`) and aggregate limit (`maxTotalBytes = 16MB`), failing immediately with `413 PAYLOAD_TOO_LARGE`.
   - Rejects non-PDF files, duplicate file roles (`offer`, `contract`), or unexpected field names with `400 BAD_REQUEST` / `415 UNSUPPORTED_MEDIA_TYPE`.
   - Parses and validates optional `scope` JSON string using Zod `ScopeSchema` with defaults to `{ origin: 'PK', destination: 'AE', declaredRegime: 'uae_mainland_private', declaredWorkerCategory: 'unknown' }`.

2. **API Contracts (`api/src/contracts/issued-extraction.ts`)**
   - Exported `Scope` TypeScript type inferred from `ScopeSchema` for use in route and service interfaces.

3. **Extraction Route (`api/src/routes/extractions.ts`)**
   - Extended `POST /api/v1/extractions` to support both JSON (`sampleCaseId`) and `multipart/form-data` uploads.
   - Enforces capability gate: rejects arbitrary uploads with `403 CUSTOM_UPLOAD_DISABLED` when `customUploadEnabled` is false.
   - Checks PDF magic bytes (`%PDF-`), runs `inspectPdf` to reject encrypted, corrupted, or $>15$ page documents.
   - Extracts text layers with `pdfjs`, packages document inputs, runs Gemini extraction, signs HMAC proof (`sourceMode: "custom"`), and performs cryptographic self-check.

4. **API Integration Tests (`api/test/phase-13/custom-upload.test.ts`)**
   - Authored 9 test cases covering:
     - Single job offer custom upload
     - Single employment contract custom upload
     - Offer + contract pair upload
     - Closed gate (`customUploadEnabled: false`) returns `403 CUSTOM_UPLOAD_DISABLED`
     - Missing files / no valid fields returns `400 BAD_REQUEST`
     - Duplicate roles returns `400 BAD_REQUEST`
     - Non-PDF mime / magic bytes returns `415 UNSUPPORTED_MEDIA_TYPE`
     - PDF exceeding 15 pages returns `413 PAYLOAD_TOO_LARGE`
     - End-to-end handoff into `POST /api/v1/analyses` accepting signed proof and producing valid analysis report.

5. **Frontend API Client (`web/src/lib/api.ts`)**
   - Added `extractCustom(files, scope, signal)` using browser `FormData`.

6. **Frontend Upload View (`web/src/views/Upload.tsx`)**
   - Created dedicated Dark Mode `Upload` view adhering to Obsidian & Brass design system.
   - Dual drag-and-drop slots for Job Offer Letter and Employment Contract.
   - File preview cards with document icon, formatted file size, and `✕ Remove` button.
   - Jurisdiction confirmation chip (`Pakistan → UAE Mainland Private`).
   - Clear privacy advisory: zero disk retention callout and recommendation to redact personal identifiers (CNIC, passport number, bank details).
   - Dynamic CTA button with loading spinner state and fallback link to fictional samples.

7. **Frontend App Integration & Styles (`web/src/App.tsx`, `web/src/views/Home.tsx`, `web/src/styles.css`)**
   - Added `Upload` view routing in `App.tsx` and updated nav header (`Upload & Review`).
   - Created in-memory `URL.createObjectURL(file)` blob previews for local document viewing in Step 3 Review workspace, cleanly revoking them with `URL.revokeObjectURL` on reset.
   - Updated stepper label dynamically: `1. Upload Documents` vs `1. Choose Sample`.
   - Updated `Home.tsx` primary CTA to "Review your documents →" when `customUploadEnabled` is true, while preserving strict Phase 11 disabled-gate test invariants.
   - Added CSS styles for upload grid, dropzones, drag-over highlights, and preview cards.
