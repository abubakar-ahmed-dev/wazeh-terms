/**
 * Report assembly (docs/API.md §6, docs/ADR-010): findings, stages,
 * coverage, limitations, and the summary line are constructed from evidence
 * and decisions — never from a raw model completion. Honest partial states
 * outrank invented completeness.
 */
import {
  AnalysisResponseSchema,
  type AnalysisResponse,
  type Finding,
  type IssuedExtractionV1,
  type StageStatus,
} from '../../contracts/index.js';
import type { FindingDraft } from '../../compare/compare.js';
import { defaultImportance } from '../../compare/importance.js';
import { getFieldDefinition } from '../../contracts/index.js';
import { OFFICIAL_NEXT_STEPS } from './next-steps.js';
import { isCorrected, type Reconciliation } from './reconcile.js';
import { scopeApplicability } from './scope.js';

export const ALL_CLEAR_SUMMARY = 'No concern detected in the fields checked.';
export const PARTIAL_SUMMARY =
  'Partial review: the document comparison finished, but the official-source check was not performed.';

const SOURCE_REVIEW_LIMITATION =
  'The official-source check was not performed: no Knowledge Base endpoint is configured on this deployment, so no rule-backed concerns are shown.';
const SCOPE_LIMITATIONS: Partial<Record<string, string>> = {
  conflicting:
    'The documents contain wording that conflicts with the declared employment category, so category-specific rules were withheld.',
  unknown:
    'The employment category could not be established from your declaration, so category-specific rules were withheld.',
};

export interface AssembleInput {
  readonly issued: IssuedExtractionV1;
  readonly reconciliation: Reconciliation;
  readonly drafts: readonly FindingDraft[];
  readonly comparisonApplicable: boolean;
  readonly checkedFieldKeys: readonly string[];
  readonly requestId: string;
  readonly reviewedAsOf: Date;
}

/** A user-corrected side can never support a confirmed mismatch (API.md §6). */
export function downgradeUserCorrectedMismatches(
  drafts: readonly FindingDraft[],
  issued: IssuedExtractionV1,
  reconciliation: Reconciliation,
): FindingDraft[] {
  const documentByRole = new Map(issued.documents.map((document) => [document.role, document]));

  const correctedSidesFor = (fieldKey: string): Set<'offer' | 'contract'> => {
    const corrected = new Set<'offer' | 'contract'>();
    for (const role of ['offer', 'contract'] as const) {
      const document = documentByRole.get(role);
      const reconciled = role === 'offer' ? reconciliation.offer : reconciliation.contract;
      if (!document || !reconciled) continue;
      const touched = reconciled.fields.some(
        (field) => field.fieldKey === fieldKey && isCorrected(reconciliation, document.documentId, field.fieldKey, field.instanceId),
      );
      if (touched) corrected.add(role);
    }
    return corrected;
  };

  return drafts.map((draft) => {
    if (draft.category !== 'document_mismatch') return draft;

    const correctedSides = correctedSidesFor(draft.fieldKeys[0]!);
    if (correctedSides.size === 0) return draft;

    const valueOrigins =
      correctedSides.has('offer') && correctedSides.has('contract')
        ? (['user', 'user'] as const)
        : correctedSides.has('offer')
          ? (['user', 'document'] as const)
          : (['document', 'user'] as const);

    return {
      ...draft,
      category: 'needs_clarification' as const,
      comparisonRuleKey: undefined,
      uncertaintyReasons: [...draft.uncertaintyReasons, 'user_reported_difference'],
      explanation: `${draft.explanation} One side of this difference comes from your correction, so it is not confirmed by the documents alone.`,
      valueOrigins,
    };
  });
}

/**
 * Every applied correction surfaces once as a labelled user-reported
 * difference — even when it equalizes the two documents (the documents'
 * original wording still says otherwise). Skipped when the downgrade pass
 * already attached `user_reported_difference` to a mismatch-derived finding
 * for the same field.
 */
export function synthesizeCorrectionClarifications(
  issued: IssuedExtractionV1,
  reconciliation: Reconciliation,
  existingDrafts: readonly FindingDraft[],
): FindingDraft[] {
  const alreadyReported = new Set(
    existingDrafts
      .filter((draft) => draft.uncertaintyReasons.includes('user_reported_difference'))
      .map((draft) => draft.fieldKeys[0]),
  );

  const drafts: FindingDraft[] = [];
  for (const role of ['offer', 'contract'] as const) {
    const reconciled = role === 'offer' ? reconciliation.offer : reconciliation.contract;
    if (!reconciled) continue;
    const otherRole = role === 'offer' ? 'contract' : 'offer';
    const otherReconciled = otherRole === 'offer' ? reconciliation.offer : reconciliation.contract;

    for (const field of reconciled.fields) {
      if (!isCorrected(reconciliation, reconciled.document.documentId, field.fieldKey, field.instanceId)) continue;
      if (alreadyReported.has(field.fieldKey)) continue;
      alreadyReported.add(field.fieldKey);

      const original = reconciled.document.fields.find(
        (candidate) => candidate.instanceId === field.instanceId && candidate.fieldKey === field.fieldKey,
      );
      // A correction identical to the original says nothing new.
      if (original && original.state === field.state && JSON.stringify(original.value) === JSON.stringify(field.value)) {
        continue;
      }

      const otherEvidence = otherReconciled?.document.fields
        .find((candidate) => candidate.fieldKey === field.fieldKey && candidate.state === 'present')
        ?.evidence ?? [];
      // Evidence stays offer-first so the UI can pair the passages; origins
      // follow the same order.
      const [evidence, origins] =
        role === 'offer'
          ? [[...(original?.evidence ?? []), ...otherEvidence].slice(0, 2), ['user', ...(otherEvidence.length > 0 ? (['document'] as const) : [])] as const]
          : [[...otherEvidence, ...(original?.evidence ?? [])].slice(0, 2), [...(otherEvidence.length > 0 ? (['document'] as const) : []), 'user'] as const];

      drafts.push({
        category: 'needs_clarification',
        fieldKeys: [field.fieldKey],
        importance: defaultImportance(field.fieldKey),
        explanation: `Your change to the ${defaultLabel(field.fieldKey)} is shown against the original wording. It is labelled as yours and is not confirmed by the documents alone.`,
        documentEvidence: evidence,
        valueOrigins: origins,
        uncertaintyReasons: ['user_reported_difference'],
        suggestedQuestionOrStep: `Confirm the ${defaultLabel(field.fieldKey)} with the employer before you sign.`,
      });
    }
  }
  return drafts;
}

function defaultLabel(fieldKey: string): string {
  return getFieldDefinition(fieldKey)?.label?.toLowerCase() ?? fieldKey;
}

export function assembleReport(input: AssembleInput): AnalysisResponse {
  const { issued, reconciliation, requestId, reviewedAsOf } = input;
  const downgraded = downgradeUserCorrectedMismatches(input.drafts, issued, reconciliation);
  const synthesized = synthesizeCorrectionClarifications(issued, reconciliation, downgraded);
  const drafts = [...downgraded, ...synthesized];

  const findings: Finding[] = drafts.map((draft, index) => ({
    id: `finding-${index + 1}`,
    category: draft.category as Finding['category'],
    fieldKeys: [...draft.fieldKeys],
    importance: draft.importance,
    explanation: draft.explanation,
    documentEvidence: [...draft.documentEvidence],
    valueOrigins: [...draft.valueOrigins],
    ...(draft.comparisonRuleKey ? { comparisonRuleKey: draft.comparisonRuleKey } : {}),
    uncertaintyReasons: [...draft.uncertaintyReasons],
    suggestedQuestionOrStep: draft.suggestedQuestionOrStep,
  }));

  const extraction: StageStatus = issued.documents.every((document) => document.extractionStatus === 'completed')
    ? 'completed'
    : issued.documents.every((document) => document.extractionStatus === 'failed')
      ? 'failed'
      : 'partial';

  const applicability = scopeApplicability(issued.scope, issued.documents);

  const stages: AnalysisResponse['stages'] = {
    extraction,
    review: 'completed',
    comparison: input.comparisonApplicable ? 'completed' : 'not_applicable',
    retrieval: 'not_started',
    applicability: 'partial',
    explanation: 'completed',
  };

  const unreadableFieldKeys = issued.documents
    .flatMap((document) =>
      document.fields.filter((field) => field.state === 'unreadable').map((field) => field.fieldKey),
    )
    .filter((key, index, all) => all.indexOf(key) === index);

  const limitations: string[] = [SOURCE_REVIEW_LIMITATION];
  const scopeLimitation = SCOPE_LIMITATIONS[applicability];
  if (scopeLimitation) limitations.push(scopeLimitation);
  if (extraction === 'partial') {
    limitations.push('Some parts of the documents could not be read with confidence; the affected fields are marked.');
  }

  const omittedChecks = ['official-source rule review (no Knowledge Base endpoint configured)'];

  // The all-clear sentence is reserved for a completed review with no
  // findings. Retrieval never runs in this phase (D8), so the report is
  // always partial here and the sentence must not appear.
  const summary = PARTIAL_SUMMARY;

  return AnalysisResponseSchema.parse({
    requestId,
    // Retrieval never runs in this phase (D8): the sample-only deployment
    // always reports an honest partial.
    status: 'partial',
    reviewedAsOf: reviewedAsOf.toISOString(),
    scopeApplicability: applicability,
    stages,
    coverage: {
      documentIds: issued.documents.map((document) => document.documentId),
      checkedFieldKeys: [...input.checkedFieldKeys],
      unreadableFieldKeys,
      omittedChecks,
    },
    findings,
    summary,
    limitations,
    officialNextSteps: OFFICIAL_NEXT_STEPS.map((step) => ({ ...step })),
  });
}
