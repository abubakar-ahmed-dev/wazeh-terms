/**
 * Stage tracking types from `docs/API.md` §6 and `docs/TECHNICAL_ARCHITECTURE.md` §6:
 * extraction, review, comparison, retrieval, applicability, explanation each
 * report their own honest state; a top-level report is complete only for the
 * checks its scope calls for and that actually ran.
 */
import { z } from 'zod';

export const StageStatusSchema = z.enum(['not_started', 'completed', 'partial', 'failed', 'not_applicable']);
export type StageStatus = z.infer<typeof StageStatusSchema>;

export const StageStatusesSchema = z.strictObject({
  extraction: StageStatusSchema,
  review: StageStatusSchema,
  comparison: StageStatusSchema,
  retrieval: StageStatusSchema,
  applicability: StageStatusSchema,
  explanation: StageStatusSchema,
});
export type StageStatuses = z.infer<typeof StageStatusesSchema>;
