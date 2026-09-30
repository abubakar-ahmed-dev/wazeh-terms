/**
 * Correction delta shape from `docs/API.md` §5: a correction references an
 * existing `documentId` + `fieldKey` + `instanceId`, never modifies the
 * original evidence, and is stored separately from the signed original.
 *
 * A correction carries no evidence of its own — the original signed payload
 * remains the only evidence source — so only the shared value invariants
 * apply here. Matching corrections against the issued payload's existing
 * identities is the analyses endpoint's job (Phase 06).
 */
import { z } from 'zod';

import { DocumentIdSchema } from './evidence.js';
import {
  ExtractedFieldSchema,
  InstanceIdSchema,
  refineFieldValueInvariants,
} from './extracted-field.js';
import { NormalizedValueSchema } from './normalized-value.js';

const CorrectionDeltaShape = z.strictObject({
  documentId: DocumentIdSchema,
  fieldKey: ExtractedFieldSchema.shape.fieldKey,
  instanceId: InstanceIdSchema,
  state: ExtractedFieldSchema.shape.state,
  value: NormalizedValueSchema.nullable(),
});

export const CorrectionDeltaSchema = CorrectionDeltaShape.superRefine(refineFieldValueInvariants);
export type CorrectionDelta = z.infer<typeof CorrectionDeltaSchema>;

/** Matches the `maxCorrections` capability example in `docs/API.md` §3. */
export const MAX_CORRECTIONS = 100;

export const CorrectionsSchema = z.array(CorrectionDeltaSchema).max(MAX_CORRECTIONS);
