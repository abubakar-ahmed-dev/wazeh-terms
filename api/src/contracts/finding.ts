/**
 * Finding shapes from `docs/API.md` §6. A document mismatch needs two
 * readable evidence passages and a code-owned `comparisonRuleKey`; a
 * source-backed concern needs a complete `SourceCitation` that already passed
 * the canonical-rule gate — and no other category may carry one.
 */
import { z } from 'zod';

import { EvidenceSchema } from './evidence.js';
import { FieldKeySchema } from './field-registry.js';
import { IsoDateTimeSchema } from './issued-extraction.js';
import { IsoDateSchema } from './normalized-value.js';

export const FindingCategorySchema = z.enum([
  'document_mismatch',
  'source_backed_concern',
  'missing_information',
  'needs_clarification',
  'unable_to_determine',
]);
export type FindingCategory = z.infer<typeof FindingCategorySchema>;

export const EvidenceClassSchema = z.enum(['binding_official_rule', 'official_guidance']);
export type EvidenceClass = z.infer<typeof EvidenceClassSchema>;

export const PinpointSchema = z.strictObject({
  label: z.string().min(1).max(200),
  quote: z.string().min(1).max(2000),
});

export const SourceCitationSchema = z.strictObject({
  ruleKey: z.string().min(1).max(100),
  ruleRevision: z.number().int().min(1),
  sourceKey: z.string().min(1).max(100),
  versionKey: z.string().min(1).max(100),
  issuingAuthority: z.string().min(1).max(200),
  officialUrl: z.url().max(2048),
  pinpoint: PinpointSchema,
  jurisdiction: z.enum(['PK', 'AE']),
  responsibleParty: z.string().min(1).max(100),
  effectiveFrom: IsoDateSchema.nullable(),
  /** Exclusive if set (docs/API.md §6). */
  effectiveTo: IsoDateSchema.nullable(),
  sourceCheckedAt: IsoDateTimeSchema,
  evidenceClass: EvidenceClassSchema,
});
export type SourceCitation = z.infer<typeof SourceCitationSchema>;

const FindingShape = z.strictObject({
  id: z.string().min(1).max(64),
  category: FindingCategorySchema,
  fieldKeys: z.array(FieldKeySchema).min(1).max(33),
  importance: z.enum(['high', 'medium', 'low', 'unknown']),
  explanation: z.string().min(1).max(2000),
  documentEvidence: z.array(EvidenceSchema).max(50),
  valueOrigins: z.array(z.enum(['document', 'user'])).min(1).max(2),
  comparisonRuleKey: z.string().min(1).max(100).optional(),
  source: SourceCitationSchema.optional(),
  uncertaintyReasons: z.array(z.string().min(1).max(500)).max(10),
  suggestedQuestionOrStep: z.string().min(1).max(1000),
});

export const FindingSchema = FindingShape.superRefine((finding, ctx) => {
  const add = (message: string, path: (string | number)[]): void => {
    ctx.addIssue({ code: 'custom', message, path });
  };

  if (finding.category === 'source_backed_concern') {
    if (!finding.source) {
      add('A source-backed concern requires a source citation', ['source']);
    }
  } else if (finding.source) {
    add(`A ${finding.category} finding must not carry a source citation`, ['source']);
  }

  if (finding.category === 'document_mismatch') {
    if (!finding.comparisonRuleKey) {
      add('A document mismatch requires a code-owned comparisonRuleKey', ['comparisonRuleKey']);
    }
    if (finding.documentEvidence.length !== 2) {
      add('A document mismatch requires exactly two evidence passages', ['documentEvidence']);
    }
  }
});
export type Finding = z.infer<typeof FindingSchema>;
