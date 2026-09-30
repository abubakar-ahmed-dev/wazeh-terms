# Phase 13 — Custom File Uploads & Security Admission

Branch: `phase-13-custom-uploads` from `dev` @ `1fd40b5`. Date: 2026-09-30.

Authority: `docs/API.md` (§4.1), `docs/SECURITY.md`, `docs/PRD.md` (§4), `docs/ADR.md` (ADR-002, ADR-003), `plans/master-plan.md` (Phase 13).

## Scope

1. **Backend Multipart Parsing & Admission Pipeline (`api/`):**
   - Install `busboy` (and `@types/busboy`) for zero-disk, streaming multipart body parsing.
   - Enforce strict size limits: $\le 8\text{ MB}$ per file (`413 FILE_TOO_LARGE`), $\le 16\text{ MB}$ total request (`413 REQUEST_TOO_LARGE`).
   - Parse `scope` JSON string (defaulting to Pakistan → UAE mainland private non-domestic route).
   - Require exactly one or both of `offer` and `contract` PDF parts.
   - Reject unknown field names (`400 BAD_REQUEST`), duplicate roles (`400 DUPLICATE_DOCUMENT_ROLE`), and empty files.
   - Validate magic bytes (`%PDF-`), reject non-PDF MIME/content (`415 UNSUPPORTED_MEDIA_TYPE`).
   - Run `inspectPdf(bytes)` to reject encrypted or corrupted PDFs (`422 UNREADABLE_DOCUMENT`) or PDFs $>15$ pages (`413 TOO_MANY_PAGES`).
   - Extract text layer using `extractPdfPageTexts(bytes)`.
   - Call Gemini extraction service inline with base64 PDF bytes.
   - Map extraction to `IssuedExtractionV1` with `sourceMode: "custom"`.
   - Sign extraction with HMAC-SHA256 (`proof`).

2. **Frontend Upload Interface & In-Memory Previews (`web/`):**
   - Read `/api/v1/capabilities`: dynamically activate upload controls when `customUploadEnabled: true`.
   - Create `Upload.tsx` view with:
     - Dual drag-and-drop slots: **Job Offer** and **Employment Contract** (PDF only, max 8MB, up to 15 pages).
     - File metadata chips (name, size, remove button `✕`).
     - Route & scope confirmation card.
     - Privacy & redaction callout (informing users that files are transiently processed in memory and never stored).
     - "Extract & Review Terms →" primary CTA.
   - Update `Home.tsx` to feature "Review your documents →" primary CTA when enabled.
   - Update `App.tsx` to handle custom upload flow:
     - Maintain `File` objects in memory.
     - Create ephemeral Blob URLs (`URL.createObjectURL(file)`) for iframe previews in `Review.tsx`.
     - Revoke Blob URLs (`URL.revokeObjectURL`) when review finishes or resets.

3. **Downstream Integration:**
   - Review and Findings views seamlessly operate on the HMAC-signed custom extraction without modifications.

## Verification Targets
- `npm run typecheck`: clean pass.
- `npm run lint`: 0 errors.
- `npm run test`: unit and contract tests for multipart upload, size/page bounds, role checks, and full regression pass.
- `npm run build`: successful production build.
- Visual inspection via Headless Edge CDP.
