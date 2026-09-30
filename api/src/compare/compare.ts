/**
 * Deterministic offer-vs-contract comparison (docs/ADR-005,
 * docs/TECHNICAL_ARCHITECTURE.md §5). Pure module: no I/O, no model, no
 * environment. It consumes already-validated issued documents and emits
 * plain finding drafts; a `document_mismatch` is produced only when both
 * sides are present and carry their own evidence.
 *
 * Corrections are not an input: the analyses step (Phase 06) reconciles the
 * original with correction deltas and hands the effective fields here,
 * passing `valueOrigins` through.
 */
import {
  FIELD_DEFINITIONS,
  type Evidence,
  type ExtractedField,
  type FieldDefinition,
  type FieldState,
  type FindingCategory,
} from '../contracts/index.js';
import { resolveCategory } from './category.js';
import { defaultImportance } from './importance.js';
import { normalizeValue } from './normalize.js';
import { compareTerm } from './strategies.js';

export interface FindingDraft {
  readonly category: string;
  readonly fieldKeys: readonly string[];
  readonly importance: 'high' | 'medium' | 'low' | 'unknown';
  readonly explanation: string;
  readonly documentEvidence: readonly Evidence[];
  readonly valueOrigins: readonly ('document' | 'user')[];
  readonly comparisonRuleKey?: string;
  /** Set only for a gate-approved source-backed concern (Phase 10). */
  readonly source?: import('../contracts/index.js').SourceCitation;
  readonly uncertaintyReasons: readonly string[];
  readonly suggestedQuestionOrStep: string;
}

export interface ComparisonResult {
  /** False when only one document was supplied — comparison is not applicable. */
  readonly comparisonApplicable: boolean;
  readonly findings: readonly FindingDraft[];
  /** Every registry key actually evaluated across the two documents. */
  readonly checkedFieldKeys: readonly string[];
}

/** Minimal side shape: the engine reads only the effective field list. */
export interface CompareDocumentInput {
  readonly role: 'offer' | 'contract';
  readonly fields: readonly ExtractedField[];
}

const HIGH_EXPLANATION = (label: string): string =>
  `The offer and the contract state different ${label.toLowerCase()} values.`;

export function compareDocuments(sides: {
  offer?: CompareDocumentInput;
  contract?: CompareDocumentInput;
}): ComparisonResult {
  const { offer, contract } = sides;
  if (!offer || !contract) {
    return { comparisonApplicable: false, findings: [], checkedFieldKeys: [] };
  }

  const findings: FindingDraft[] = [];
  const checkedFieldKeys: string[] = [];

  for (const definition of FIELD_DEFINITIONS) {
    const entriesA = offer.fields.filter((field) => field.fieldKey === definition.fieldKey);
    const entriesB = contract.fields.filter((field) => field.fieldKey === definition.fieldKey);
    checkedFieldKeys.push(definition.fieldKey);

    if (definition.repeatable) {
      compareRepeated(definition, entriesA, entriesB, findings);
      continue;
    }

    const stateA = stateOf(entriesA);
    const stateB = stateOf(entriesB);
    const uncertainty: string[] = [];
    if (stateA === 'absent' && entriesA.length === 0) uncertainty.push('field_not_returned_by_extraction_offer');
    if (stateB === 'absent' && entriesB.length === 0) uncertainty.push('field_not_returned_by_extraction_contract');
    if (stateA === 'unclear' || stateB === 'unclear') uncertainty.push('one_side_unclear');
    if (stateA === 'unreadable' || stateB === 'unreadable') uncertainty.push('one_side_unreadable');

    let compared: 'equal' | 'different' = 'equal';
    if (stateA === 'present' && stateB === 'present') {
      const termA = normalizeValue(entriesA[0]!.value!);
      const termB = normalizeValue(entriesB[0]!.value!);
      compared = compareTerm(termA, termB);
      // Conditional vs conditional with different condition text is a real
      // difference even when the status matches — but it is wording to
      // clarify, not a numeric mismatch.
      if (
        compared === 'equal' &&
        termA.kind === 'benefit' &&
        termB.kind === 'benefit' &&
        termA.status === 'conditional' &&
        termA.conditions !== termB.conditions
      ) {
        findings.push(
          draft(definition, 'needs_clarification', {
            uncertaintyReasons: ['conditional_wording_differs'],
            side: problemSide(stateA, stateB, 'unclear'),
          }),
        );
        continue;
      }
    }

    const category = resolveCategory({ stateA, stateB, compared, importantIfAbsent: definition.importantIfAbsent });
    if (category === null) continue;

    if (category === 'document_mismatch') {
      const evidenceA = entriesA[0]!.evidence[0];
      const evidenceB = entriesB[0]!.evidence[0];
      if (!evidenceA || !evidenceB) {
        // Present fields carry ≥1 evidence by contract; this is defensive.
        findings.push(
          draft(definition, 'needs_clarification', {
            uncertaintyReasons: ['mismatch_evidence_unavailable'],
            side: 'both',
          }),
        );
        continue;
      }
      findings.push({
        category,
        fieldKeys: [definition.fieldKey],
        importance: defaultImportance(definition.fieldKey),
        explanation: HIGH_EXPLANATION(definition.label),
        documentEvidence: [evidenceA, evidenceB],
        valueOrigins: ['document', 'document'],
        comparisonRuleKey: definition.comparisonStrategyKey,
        uncertaintyReasons: uncertainty,
        suggestedQuestionOrStep: `Ask the employer which ${definition.label.toLowerCase()} applies before you sign.`,
      });
      continue;
    }

    findings.push(
      draft(definition, category, {
        uncertaintyReasons: uncertainty,
        side: problemSide(stateA, stateB, problemStateOf(stateA, stateB)),
      }),
    );
  }

  return { comparisonApplicable: true, findings, checkedFieldKeys };
}

interface DraftOptions {
  readonly side: 'offer' | 'contract' | 'both';
  readonly uncertaintyReasons?: readonly string[];
}

function draft(
  definition: FieldDefinition,
  category: Exclude<FindingCategory, 'document_mismatch'>,
  options: DraftOptions,
): FindingDraft {
  const { side, uncertaintyReasons = [] } = options;
  const where = side === 'both' ? 'either document' : `${side} document`;
  const label = definition.label;
  const lower = label.toLowerCase();

  const explanations: Record<string, string> = {
    missing_information: `No ${lower} was found in the ${where}.`,
    needs_clarification: `The ${lower} wording is unclear or conditional in the ${where}.`,
    unable_to_determine: `The ${lower} could not be read in the ${where}.`,
  };
  const questions: Record<string, string> = {
    missing_information: `Ask why the ${lower} is not stated in the ${where}.`,
    needs_clarification: `Ask for the exact ${lower} wording, including any conditions.`,
    unable_to_determine: `Check the ${where} page for the ${lower}; it could not be read here.`,
  };

  return {
    category,
    fieldKeys: [definition.fieldKey],
    importance: defaultImportance(definition.fieldKey),
    explanation: explanations[category]!,
    documentEvidence: [],
    valueOrigins: ['document', 'document'],
    uncertaintyReasons,
    suggestedQuestionOrStep: questions[category]!,
  };
}

function compareRepeated(
  definition: FieldDefinition,
  entriesA: readonly ExtractedField[],
  entriesB: readonly ExtractedField[],
  findings: FindingDraft[],
): void {
  const stateA = stateOf(entriesA);
  const stateB = stateOf(entriesB);

  if (stateA !== 'present' || stateB !== 'present') {
    const uncertainty: string[] = [];
    if (stateA === 'absent' && entriesA.length === 0) uncertainty.push('field_not_returned_by_extraction_offer');
    if (stateB === 'absent' && entriesB.length === 0) uncertainty.push('field_not_returned_by_extraction_contract');
    if (stateA === 'unclear' || stateB === 'unclear') uncertainty.push('one_side_unclear');
    if (stateA === 'unreadable' || stateB === 'unreadable') uncertainty.push('one_side_unreadable');
    const category = resolveCategory({
      stateA,
      stateB,
      compared: 'equal',
      importantIfAbsent: definition.importantIfAbsent,
    });
    if (category !== null && category !== 'document_mismatch') {
      findings.push(
        draft(definition, category, {
          uncertaintyReasons: uncertainty,
          side: problemSide(stateA, stateB, problemStateOf(stateA, stateB)),
        }),
      );
    }
    return;
  }

  if (entriesA.length !== entriesB.length) {
    findings.push(
      draft(definition, 'needs_clarification', {
        uncertaintyReasons: ['repeated_items_count_mismatch'],
        side: 'both',
      }),
    );
    return;
  }

  for (let index = 0; index < entriesA.length; index++) {
    const entryA = entriesA[index]!;
    const entryB = entriesB[index]!;
    if (entryA.state !== 'present' || entryB.state !== 'present') {
      const category = resolveCategory({
        stateA: entryA.state,
        stateB: entryB.state,
        compared: 'equal',
        importantIfAbsent: definition.importantIfAbsent,
      });
      findings.push(
        draft(definition, category === 'document_mismatch' || category === null ? 'needs_clarification' : category, {
          uncertaintyReasons: ['repeated_item_state_gap'],
          side: entryA.state !== 'present' ? 'offer' : 'contract',
        }),
      );
      continue;
    }
    if (compareTerm(normalizeValue(entryA.value!), normalizeValue(entryB.value!)) === 'different') {
      const evidenceA = entryA.evidence[0];
      const evidenceB = entryB.evidence[0];
      if (!evidenceA || !evidenceB) {
        findings.push(
          draft(definition, 'needs_clarification', {
            uncertaintyReasons: ['mismatch_evidence_unavailable'],
            side: 'both',
          }),
        );
        continue;
      }
      findings.push({
        category: 'document_mismatch',
        fieldKeys: [definition.fieldKey],
        importance: defaultImportance(definition.fieldKey),
        explanation: `${HIGH_EXPLANATION(definition.label)} (entry ${index + 1} of ${entriesA.length})`,
        documentEvidence: [evidenceA, evidenceB],
        valueOrigins: ['document', 'document'],
        comparisonRuleKey: definition.comparisonStrategyKey,
        uncertaintyReasons: [],
        suggestedQuestionOrStep: `Ask the employer which ${definition.label.toLowerCase()} applies before you sign.`,
      });
    }
  }
}

function stateOf(entries: readonly ExtractedField[]): FieldState {
  const first = entries[0];
  if (!first) return 'absent';
  return first.state;
}

function problemStateOf(stateA: FieldState, stateB: FieldState): FieldState {
  if (stateA !== 'present') return stateA;
  if (stateB !== 'present') return stateB;
  return 'present';
}

function problemSide(stateA: FieldState, stateB: FieldState, problem: FieldState): 'offer' | 'contract' | 'both' {
  if (stateA === problem && stateB === problem) return 'both';
  if (stateA === problem) return 'offer';
  if (stateB === problem) return 'contract';
  return 'both';
}
