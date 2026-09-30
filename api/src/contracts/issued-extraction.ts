/**
 * `IssuedExtractionV1` from `docs/API.md` §4.2: the signed original
 * extraction payload. The client sends this object back unchanged; the HMAC
 * proof covers its canonical serialization (see `canonical-json.ts`).
 */
import { z } from 'zod';

import { DocumentIdSchema, PAGE_MAX } from './evidence.js';
import { ExtractedFieldSchema } from './extracted-field.js';

export const SHA256_REGEX = /^[0-9a-f]{64}$/;
export const MIME_TYPE_REGEX = /^[\w.+-]+\/[\w.+-]+$/;

/** UTC ISO 8601 timestamps only (docs/API.md §1). */
export const IsoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Not a valid datetime' });

export const DeclaredRegimeSchema = z.enum(['uae_mainland_private', 'unknown', 'other']);
export const DeclaredWorkerCategorySchema = z.enum(['non_domestic', 'domestic', 'unknown']);

export const ScopeSchema = z.strictObject({
  origin: z.literal('PK'),
  destination: z.literal('AE'),
  declaredRegime: DeclaredRegimeSchema,
  declaredWorkerCategory: DeclaredWorkerCategorySchema,
});
export type Scope = z.infer<typeof ScopeSchema>;


export const DocumentRoleSchema = z.enum(['offer', 'contract']);
export const ExtractionStatusSchema = z.enum(['completed', 'partial', 'failed']);
export const SourceModeSchema = z.enum(['sample', 'custom']);

const DocumentShape = z.strictObject({
  documentId: DocumentIdSchema,
  role: DocumentRoleSchema,
  mimeType: z.string().regex(MIME_TYPE_REGEX).max(100),
  pageCount: z.number().int().min(1).max(PAGE_MAX),
  sha256: z.string().regex(SHA256_REGEX),
  extractionStatus: ExtractionStatusSchema,
  fields: z.array(ExtractedFieldSchema).max(200),
  unreadablePages: z.array(z.number().int().min(1).max(PAGE_MAX)).max(PAGE_MAX),
});

type DocumentInput = z.infer<typeof DocumentShape>;


const IssuedExtractionShape = z.strictObject({
  schemaVersion: z.literal(1),
  issuedAt: IsoDateTimeSchema,
  expiresAt: IsoDateTimeSchema,
  scope: ScopeSchema,
  sourceMode: SourceModeSchema,
  documents: z.array(DocumentShape).min(1).max(2),
});

/**
 * Document- and payload-level invariants:
 * - `issuedAt`/`expiresAt` ordered; `expiresAt` is the proof TTL.
 * - Document IDs unique; duplicate roles rejected at admission (Phase 03)
 *   but duplicate IDs are structurally invalid here.
 * - `unreadablePages` unique ascending and within `pageCount`.
 * - Every evidence `page` lands inside its own document's `pageCount`.
 * - `state: "absent"` requires the owning document to have been read
 *   sufficiently (`extractionStatus` completed/partial); a failed document
 *   cannot support an absence claim.
 */
export const IssuedExtractionV1Schema = IssuedExtractionShape.superRefine((payload, ctx) => {
  const add = (message: string, path: (string | number)[]): void => {
    ctx.addIssue({ code: 'custom', message, path });
  };

  if (Date.parse(payload.expiresAt) < Date.parse(payload.issuedAt)) {
    add('expiresAt must not be earlier than issuedAt', ['expiresAt']);
  }

  const seenDocumentIds = new Set<string>();
  payload.documents.forEach((doc: DocumentInput, docIndex: number) => {
    if (seenDocumentIds.has(doc.documentId)) {
      add(`Duplicate documentId: ${doc.documentId}`, ['documents', docIndex, 'documentId']);
    }
    seenDocumentIds.add(doc.documentId);

    let previousPage = 0;
    doc.unreadablePages.forEach((page, pageIndex) => {
      if (page <= previousPage) {
        add('unreadablePages must be unique and ascending', ['documents', docIndex, 'unreadablePages', pageIndex]);
      }
      if (page > doc.pageCount) {
        add(`unreadablePages entry ${page} exceeds pageCount ${doc.pageCount}`, ['documents', docIndex, 'unreadablePages', pageIndex]);
      }
      previousPage = page;
    });

    doc.fields.forEach((field, fieldIndex) => {
      field.evidence.forEach((evidence, evidenceIndex) => {
        if (evidence.documentId === doc.documentId && evidence.page > doc.pageCount) {
          add(
            `Evidence page ${evidence.page} exceeds pageCount ${doc.pageCount}`,
            ['documents', docIndex, 'fields', fieldIndex, 'evidence', evidenceIndex, 'page'],
          );
        }
      });
      if (field.state === 'absent' && doc.extractionStatus === 'failed') {
        add(
          `An absent claim on ${field.fieldKey} requires a document that was read, not failed`,
          ['documents', docIndex, 'fields', fieldIndex, 'state'],
        );
      }
    });
  });
});

export type IssuedExtractionV1 = z.infer<typeof IssuedExtractionV1Schema>;
export type IssuedExtractionDocument = z.infer<typeof DocumentShape>;
