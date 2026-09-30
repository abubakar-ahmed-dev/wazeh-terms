import type {
  ExtractedField,
  IssuedExtractionDocument,
  MoneyValue,
  NormalizedValue,
} from '../../src/contracts/index.js';
import { FIELD_DEFINITIONS } from '../../src/contracts/index.js';
import { createHash } from 'node:crypto';

export function money(overrides: Partial<MoneyValue> = {}): MoneyValue {
  return {
    kind: 'money',
    amount: '2500.00',
    currency: 'AED',
    frequency: 'monthly',
    component: 'basic_salary',
    payer: null,
    ...overrides,
  };
}

export function field(
  fieldKey: string,
  state: ExtractedField['state'],
  value: NormalizedValue | null,
  options: {
    role?: 'offer' | 'contract';
    quote?: string;
    conditions?: Partial<ExtractedField>;
  } = {},
): ExtractedField {
  const role = options.role ?? 'offer';
  const quote = options.quote ?? 'Some verbatim passage';
  return {
    fieldKey,
    instanceId: `${fieldKey}:0`,
    state,
    rawText: state === 'present' ? quote : null,
    value,
    evidence:
      state === 'present'
        ? [{ documentId: `doc-${role}`, page: 1, quote, verification: 'matched_text' as const }]
        : [],
    qualityNotes: [],
    ...options.conditions,
  };
}

export function document(
  role: 'offer' | 'contract',
  fields: readonly ExtractedField[],
  extractionStatus: IssuedExtractionDocument['extractionStatus'] = 'completed',
): IssuedExtractionDocument {
  return {
    documentId: `doc-${role}`,
    role,
    mimeType: 'application/pdf',
    pageCount: 1,
    sha256: createHash('sha256').update(role).digest('hex'),
    extractionStatus,
    fields: [...fields],
    unreadablePages: [],
  };
}

/**
 * Extraction emits every registry key; fixtures do the same by filling
 * unmentioned keys as explicit `absent` entries.
 */
export function fullDocument(
  role: 'offer' | 'contract',
  fields: readonly ExtractedField[],
): IssuedExtractionDocument {
  const known = new Set(fields.map((f) => f.fieldKey));
  const filled = FIELD_DEFINITIONS.filter((def) => !known.has(def.fieldKey)).map((def) =>
    field(def.fieldKey, 'absent', null, { role }),
  );
  return document(role, [...fields, ...filled]);
}

export function findingsFor(
  result: ReturnType<typeof import('../../src/compare/index.js').compareDocuments>,
  fieldKey: string,
) {
  return result.findings.filter((finding) => finding.fieldKeys.includes(fieldKey));
}
