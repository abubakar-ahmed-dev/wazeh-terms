/**
 * Analysis report shape from `docs/API.md` §6. The report is assembled from
 * evidence and decisions server-side; it is never a raw model completion.
 */
import { z } from 'zod';

import { DocumentIdSchema } from './evidence.js';
import { FindingSchema } from './finding.js';
import { StageStatusesSchema } from './stage-status.js';

export const AnalysisStatusSchema = z.enum(['complete', 'partial']);
export const ScopeApplicabilitySchema = z.enum(['supported', 'conflicting', 'unknown']);

export const OfficialNextStepSchema = z.strictObject({
  label: z.string().min(1).max(200),
  url: z.url().max(2048),
});

export const AnalysisResponseSchema = z.strictObject({
  requestId: z.string().min(1).max(64),
  status: AnalysisStatusSchema,
  reviewedAsOf: z.string().min(1),
  scopeApplicability: ScopeApplicabilitySchema,
  stages: StageStatusesSchema,
  coverage: z.strictObject({
    documentIds: z.array(DocumentIdSchema).max(2),
    checkedFieldKeys: z.array(z.string().max(64)).max(200),
    unreadableFieldKeys: z.array(z.string().max(64)).max(200),
    omittedChecks: z.array(z.string().min(1).max(200)).max(50),
  }),
  findings: z.array(FindingSchema).max(200),
  summary: z.string().max(1000),
  limitations: z.array(z.string().min(1).max(500)).max(20),
  officialNextSteps: z.array(OfficialNextStepSchema).max(20),
});

export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;
