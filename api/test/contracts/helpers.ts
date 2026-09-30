import type {
  ExtractedFieldInput,
  HmacKey,
  IssuedExtractionV1,
  MoneyValue,
} from '../../src/contracts/index.js';

export const VALID_SHA256 = 'a'.repeat(64);
export const ISSUED_AT = '2026-09-28T10:00:00.000Z';
export const EXPIRES_AT = '2026-09-28T10:30:00.000Z';
export const NOW_BEFORE_EXPIRY = Date.parse('2026-09-28T10:15:00.000Z');
export const NOW_AFTER_EXPIRY = Date.parse('2026-09-28T11:00:00.000Z');

export function testKey(keyId = 'test-key'): HmacKey {
  return { keyId, secret: 'k'.repeat(48) };
}

export function moneyValue(overrides: Record<string, unknown> = {}): MoneyValue {
  return {
    kind: 'money',
    amount: '2500.00',
    currency: 'AED',
    frequency: 'monthly',
    component: 'basic_salary',
    payer: null,
    ...overrides,
  } as MoneyValue;
}

export function presentMoneyField(
  fieldOverrides: Partial<ExtractedFieldInput> = {},
  valueOverrides: Partial<MoneyValue> = {},
): ExtractedFieldInput {
  return {
    fieldKey: 'basic_salary',
    instanceId: 'basic_salary:0',
    state: 'present',
    rawText: 'Basic salary: AED 2,500 per month',
    value: moneyValue(valueOverrides),
    evidence: [
      { documentId: 'doc-offer-1', page: 1, quote: 'Basic salary: AED 2,500 per month', verification: 'matched_text' },
    ],
    qualityNotes: [],
    ...fieldOverrides,
  };
}

export function validIssuedExtraction(): IssuedExtractionV1 {
  return {
    schemaVersion: 1,
    issuedAt: ISSUED_AT,
    expiresAt: EXPIRES_AT,
    scope: {
      origin: 'PK',
      destination: 'AE',
      declaredRegime: 'uae_mainland_private',
      declaredWorkerCategory: 'non_domestic',
    },
    sourceMode: 'sample',
    documents: [
      {
        documentId: 'doc-offer-1',
        role: 'offer',
        mimeType: 'application/pdf',
        pageCount: 2,
        sha256: VALID_SHA256,
        extractionStatus: 'completed',
        fields: [presentMoneyField()],
        unreadablePages: [],
      },
    ],
  };
}

/** Deep copy for tamper tests: mutate the clone, keep the template pristine. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}
