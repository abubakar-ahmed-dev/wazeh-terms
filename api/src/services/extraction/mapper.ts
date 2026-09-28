/**
 * Model output → `IssuedExtractionV1` documents (docs/API.md §4.2). The
 * mapper decides nothing about legal meaning; it validates, downgrades
 * honestly (never rewrites a quote or invents evidence), assigns opaque
 * document IDs and server-owned instance IDs, and reports degradation.
 */
import { createHash, randomBytes } from 'node:crypto';

import {
  ExtractedFieldSchema,
  NormalizedValueSchema,
  type ExtractedFieldInput,
  type IssuedExtractionDocument,
  type NormalizedValue,
} from '../../contracts/index.js';
import { isKnownFieldKey } from '../../contracts/index.js';
import type { ModelDocument, ModelField } from './model-output.js';

export interface MapperDocumentInput {
  readonly role: 'offer' | 'contract';
  readonly pdfBytes: Buffer;
  readonly pageCount: number;
}

export interface MappedDocument {
  readonly document: IssuedExtractionDocument;
  readonly degraded: boolean;
}

export interface MappedExtraction {
  readonly documents: readonly MappedDocument[];
  readonly status: 'complete' | 'partial';
  readonly notices: readonly string[];
}

export class NothingUsableError extends Error {
  constructor() {
    super('No usable extraction was produced');
    this.name = 'NothingUsableError';
  }
}

function opaqueDocumentId(): string {
  return `doc_${randomBytes(8).toString('hex')}`;
}

function instanceIdFor(fieldKey: string, usedCounts: Map<string, number>): string {
  const ordinal = usedCounts.get(fieldKey) ?? 0;
  usedCounts.set(fieldKey, ordinal + 1);
  return `${fieldKey}:${ordinal}`;
}

function assembleValue(field: ModelField): { value: NormalizedValue | null; degraded: boolean; note?: string } {
  if (field.value === undefined || field.value === null) {
    return { value: null, degraded: false };
  }
  const parsed = NormalizedValueSchema.safeParse(field.value);
  if (!parsed.success) {
    return { value: null, degraded: true, note: 'Model value failed runtime validation' };
  }
  return { value: parsed.data, degraded: false };
}

function mapField(
  field: ModelField,
  documentId: string,
  usedCounts: Map<string, number>,
): { field: ExtractedFieldInput | null; degraded: boolean } {
  if (!isKnownFieldKey(field.fieldKey)) {
    return { field: null, degraded: true };
  }

  const { value, degraded: valueDegraded, note } = assembleValue(field);
  const qualityNotes = [...(field.qualityNotes ?? [])];
  if (note) qualityNotes.push(note);

  const evidence = (field.evidence ?? []).map((entry) => ({
    documentId,
    page: entry.page,
    quote: entry.quote,
    // Text-layer corroboration arrives in Phase 04; before it runs, every
    // passage is honestly a model transcription.
    verification: 'model_transcription' as const,
  }));

  let state = field.state;
  let degraded = valueDegraded;

  if (valueDegraded && state === 'present') {
    state = 'unclear';
  }

  const candidate: ExtractedFieldInput = {
    fieldKey: field.fieldKey,
    instanceId: instanceIdFor(field.fieldKey, usedCounts),
    state,
    rawText: field.rawText ?? null,
    value,
    evidence,
    qualityNotes,
  };

  // Drop evidence that would violate the contract (e.g. bad page numbers)
  // rather than rewriting it; a present field left without evidence degrades
  // to "unclear" with a note.
  if (state === 'present' && candidate.evidence.length === 0) {
    candidate.state = 'unclear';
    candidate.qualityNotes.push('Present field had no usable evidence passage');
    degraded = true;
  }

  // Registry-contract violations that survive the steps above (e.g. a money
  // component that does not match the key) degrade honestly: the typed value
  // is dropped, never silently rewritten.
  const validated = ExtractedFieldSchema.safeParse(candidate);
  if (!validated.success) {
    degraded = true;
    candidate.value = null;
    if (candidate.state === 'present') candidate.state = 'unclear';
    candidate.qualityNotes.push('Field failed contract validation');
    const recovered = ExtractedFieldSchema.safeParse(candidate);
    if (!recovered.success) {
      return { field: null, degraded: true };
    }
    return { field: recovered.data, degraded };
  }

  return { field: validated.data, degraded };
}

function mapDocument(
  modelDocument: ModelDocument,
  input: MapperDocumentInput,
  notices: string[],
): MappedDocument {
  const documentId = opaqueDocumentId();
  const usedCounts = new Map<string, number>();
  let degraded = false;

  const fields: ExtractedFieldInput[] = [];
  for (const modelField of modelDocument.fields ?? []) {
    const { field, degraded: fieldDegraded } = mapField(modelField, documentId, usedCounts);
    if (field !== null) {
      fields.push(field);
    }
    degraded = degraded || fieldDegraded;
  }

  const unreadablePages = Array.from(
    new Set((modelDocument.unreadablePages ?? []).filter((page) => page <= input.pageCount)),
  ).sort((a, b) => a - b);
  if ((modelDocument.unreadablePages ?? []).some((page) => page > input.pageCount)) {
    degraded = true;
  }

  if (modelDocument.note) {
    notices.push(`Provider note on the ${input.role} document was recorded.`);
    degraded = true;
  }

  return {
    degraded,
    document: {
      documentId,
      role: input.role,
      mimeType: 'application/pdf',
      pageCount: input.pageCount,
      sha256: createHash('sha256').update(input.pdfBytes).digest('hex'),
      extractionStatus: degraded ? 'partial' : 'completed',
      fields,
      unreadablePages,
    },
  };
}

export function mapModelExtraction(
  modelDocuments: readonly ModelDocument[],
  inputs: readonly MapperDocumentInput[],
  notices: string[] = [],
): MappedExtraction {
  const mapped: MappedDocument[] = [];
  for (const input of inputs) {
    const modelDocument = modelDocuments.find((candidate) => candidate.role === input.role);
    if (!modelDocument) {
      // Provider did not return this role at all: an honest partial, not a
      // fabricated document.
      notices.push(`No extraction was returned for the ${input.role} document.`);
      mapped.push({
        degraded: true,
        document: {
          documentId: opaqueDocumentId(),
          role: input.role,
          mimeType: 'application/pdf',
          pageCount: input.pageCount,
          sha256: createHash('sha256').update(input.pdfBytes).digest('hex'),
          extractionStatus: 'failed',
          fields: [],
          unreadablePages: [],
        },
      });
      continue;
    }
    mapped.push(mapDocument(modelDocument, input, notices));
  }

  const usable = mapped.some((entry) => entry.document.fields.length > 0);
  if (!usable) {
    throw new NothingUsableError();
  }

  const status = mapped.every((entry) => !entry.degraded) ? 'complete' : 'partial';
  return { documents: mapped, status, notices };
}
