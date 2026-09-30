/**
 * Correction reconciliation (docs/API.md §5, docs/ADR-002): the original
 * issued extraction stays immutable; each correction produces an effective
 * field value labelled `user` while the original evidence remains visible.
 * A correction can never create or strengthen documentary evidence.
 */
import {
  type CorrectionDelta,
  type ExtractedField,
  type IssuedExtractionDocument,
} from '../../contracts/index.js';

export interface ReconciledDocument {
  readonly document: IssuedExtractionDocument;
  readonly fields: readonly ExtractedField[];
}

export interface Reconciliation {
  readonly offer?: ReconciledDocument;
  readonly contract?: ReconciledDocument;
  /** `documentId:fieldKey:instanceId` for every applied correction. */
  readonly correctedKeys: ReadonlySet<string>;
}

export class InvalidCorrectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCorrectionError';
  }
}

const correctionKey = (delta: CorrectionDelta): string =>
  `${delta.documentId}:${delta.fieldKey}:${delta.instanceId}`;

export function reconcileCorrections(
  documents: readonly IssuedExtractionDocument[],
  corrections: readonly CorrectionDelta[],
): Reconciliation {
  const correctedKeys = new Set<string>();
  const seenTargets = new Set<string>();

  // Every correction must reference an existing issued identity triple.
  for (const delta of corrections) {
    const key = correctionKey(delta);
    if (seenTargets.has(key)) {
      throw new InvalidCorrectionError('Duplicate correction target.');
    }
    seenTargets.add(key);

    const document = documents.find((candidate) => candidate.documentId === delta.documentId);
    if (!document) {
      throw new InvalidCorrectionError('Correction references an unknown document.');
    }
    const target = document.fields.find(
      (field) => field.fieldKey === delta.fieldKey && field.instanceId === delta.instanceId,
    );
    if (!target) {
      throw new InvalidCorrectionError('Correction references an unknown field entry.');
    }
  }

  let offer: ReconciledDocument | undefined;
  let contract: ReconciledDocument | undefined;
  for (const role of ['offer', 'contract'] as const) {
    const document = documents.find((candidate) => candidate.role === role);
    if (!document) continue;
    const reconciledDocument: ReconciledDocument = {
      document,
      fields: document.fields.map((field) => {
        const delta = corrections.find(
          (candidate) =>
            candidate.documentId === document.documentId &&
            candidate.fieldKey === field.fieldKey &&
            candidate.instanceId === field.instanceId,
        );
        if (!delta) return field;
        correctedKeys.add(`${document.documentId}:${field.fieldKey}:${field.instanceId}`);
        return {
          ...field,
          state: delta.state,
          value: delta.value,
          qualityNotes: [...field.qualityNotes, 'corrected_by_user'],
        } satisfies ExtractedField;
      }),
    };
    if (role === 'offer') offer = reconciledDocument;
    else contract = reconciledDocument;
  }
  return { offer, contract, correctedKeys };
}

export function isCorrected(
  reconciliation: Reconciliation,
  documentId: string,
  fieldKey: string,
  instanceId: string,
): boolean {
  return reconciliation.correctedKeys.has(`${documentId}:${fieldKey}:${instanceId}`);
}
