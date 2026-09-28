/**
 * Evidence schema from `docs/API.md` §4.2: the reported original passage with
 * its one-based page and how it was corroborated.
 */
import { z } from 'zod';

export const PAGE_MAX = 1000;

/** Opaque per-request identifier; never a filename (docs/TECHNICAL_ARCHITECTURE.md §3). */
export const DocumentIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

export const EvidenceVerificationSchema = z.enum(['matched_text', 'model_transcription']);

export const EvidenceSchema = z.strictObject({
  documentId: DocumentIdSchema,
  page: z.number().int().min(1).max(PAGE_MAX),
  quote: z.string().min(1).max(2000),
  verification: EvidenceVerificationSchema,
});

export type Evidence = z.infer<typeof EvidenceSchema>;
export type EvidenceVerification = z.infer<typeof EvidenceVerificationSchema>;
