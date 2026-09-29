/**
 * Truth-file schema (v1) for the synthetic corpus (`test-corpus/<case>/truth.json`).
 * Versioned: a breaking change to annotation shape bumps `schemaVersion` and
 * migrates every truth file in the same commit. Truth assertions are
 * category-level; `requiredRuleRefs` stays empty until approved content
 * exists (Phases 09/10).
 */
import { z } from 'zod';

import {
  FindingCategorySchema,
  NormalizedValueSchema,
  type FindingCategory,
  type NormalizedValue,
} from '../contracts/index.js';

export const TRUTH_SCHEMA_VERSION = 1;

export const TruthRoleSchema = z.enum(['offer', 'contract']);
export type TruthRole = z.infer<typeof TruthRoleSchema>;

export const TruthDocumentSchema = z.object({
  role: TruthRoleSchema,
  file: z.string().regex(/^[\w.-]+\.pdf$/),
  pageCount: z.number().int().min(1).max(15),
  readablePages: z.array(z.number().int().min(1)).min(1),
});

export const TruthExpectedFieldSchema = z.object({
  role: TruthRoleSchema,
  fieldKey: z.string().min(1).max(64),
  state: z.enum(['present', 'absent', 'unclear', 'unreadable']),
  value: NormalizedValueSchema.nullable(),
  /** Where the evidence quote lives inside this case's sample-text.json. */
  evidence: z
    .object({
      page: z.number().int().min(1),
      role: TruthRoleSchema,
      line: z.number().int().min(0),
    })
    .optional(),
});
export type TruthExpectedField = z.infer<typeof TruthExpectedFieldSchema>;

export const TruthSeededDifferenceSchema = z.object({
  fieldKey: z.string().min(1).max(64),
  kind: z.enum(['value', 'missing', 'conditional', 'clue', 'document_absent']),
  note: z.string().min(1).max(500),
});

export const TruthSchema = z.object({
  schemaVersion: z.literal(TRUTH_SCHEMA_VERSION),
  caseId: z.string().regex(/^TC-\d{3}$/),
  route: z.object({
    origin: z.literal('PK'),
    destination: z.literal('AE'),
    declaredRegime: z.enum(['uae_mainland_private', 'unknown', 'other']),
    declaredWorkerCategory: z.enum(['non_domestic', 'domestic', 'unknown']),
  }),
  documents: z.array(TruthDocumentSchema).min(1).max(2),
  expectedFields: z.array(TruthExpectedFieldSchema),
  seededDifferences: z.array(TruthSeededDifferenceSchema),
  allowedFindingCategories: z.array(FindingCategorySchema),
  forbiddenFindingCategories: z.array(FindingCategorySchema),
  requiredRuleRefs: z.array(z.never()), // empty until approved content exists
  expectedAbstentions: z.array(z.string().min(1).max(64)),
  notes: z.string().max(2000),
});

export type Truth = z.infer<typeof TruthSchema>;
export type { FindingCategory, NormalizedValue };
