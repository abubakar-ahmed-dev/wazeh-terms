/**
 * Schema for Gemini's model output (docs/TECHNICAL_ARCHITECTURE.md §3.1
 * step 3). Model output is untrusted data: unknown members are stripped,
 * every field is re-validated by the mapper before entering the issued
 * payload, and nothing from here is trusted as instruction.
 *
 * Deliberately NOT strict: the provider may add bookkeeping members; we read
 * only the documented ones.
 */
import { z } from 'zod';

export const ModelEvidenceSchema = z.object({
  page: z.number().int().min(1).max(1000),
  quote: z.string().min(1).max(2000),
});

export const ModelFieldSchema = z.object({
  fieldKey: z.string().min(1).max(64),
  state: z.enum(['present', 'absent', 'unclear', 'unreadable']),
  rawText: z.string().max(2000).nullish(),
  value: z.unknown().optional(),
  evidence: z.array(ModelEvidenceSchema).max(20).optional(),
  qualityNotes: z.array(z.string().max(500)).max(20).optional(),
});

export const ModelDocumentSchema = z.object({
  role: z.enum(['offer', 'contract']),
  fields: z.array(ModelFieldSchema).max(200).optional(),
  unreadablePages: z.array(z.number().int().min(1).max(1000)).max(1000).optional(),
  /** Document-level provider note (e.g. partial readability). */
  note: z.string().max(500).optional(),
});

export const ModelExtractionSchema = z.object({
  documents: z.array(ModelDocumentSchema).min(1).max(2),
});

export type ModelExtraction = z.infer<typeof ModelExtractionSchema>;
export type ModelField = z.infer<typeof ModelFieldSchema>;
export type ModelDocument = z.infer<typeof ModelDocumentSchema>;
