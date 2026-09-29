import { signIssuedExtraction, type ExtractedField, type IssuedExtractionDocument, type IssuedExtractionV1, type NormalizedValue } from '../../src/contracts/index.js';
import { TEST_SECRET } from '../phase-03/helpers.js';
import { document } from '../phase-05/helpers.js';

export const SERVER_KEY = { keyId: 'key-1', secret: TEST_SECRET };

export function fieldFor(
  fieldKey: string,
  state: ExtractedField['state'],
  value: NormalizedValue | null,
  role: 'offer' | 'contract',
  quote = `${role} passage for ${fieldKey}`,
): ExtractedField {
  return {
    fieldKey,
    instanceId: `${fieldKey}:0`,
    state,
    rawText: state === 'present' ? quote : null,
    value,
    evidence: state === 'present' ? [{ documentId: `doc-${role}`, page: 1, quote, verification: 'matched_text' as const }] : [],
    qualityNotes: [],
  };
}

export function issuedPayload(
  documents: IssuedExtractionDocument[],
  scopeOverrides: Partial<Pick<IssuedExtractionV1['scope'], 'declaredRegime' | 'declaredWorkerCategory'>> = {},
): IssuedExtractionV1 {
  const issuedAt = new Date();
  return {
    schemaVersion: 1,
    issuedAt: issuedAt.toISOString(),
    expiresAt: new Date(issuedAt.getTime() + 30 * 60 * 1000).toISOString(),
    scope: {
      origin: 'PK',
      destination: 'AE',
      declaredRegime: 'uae_mainland_private',
      declaredWorkerCategory: 'non_domestic',
      ...scopeOverrides,
    },
    sourceMode: 'sample',
    documents,
  };
}

export function signedReview(
  issued: IssuedExtractionV1,
  corrections: unknown[] = [],
): Record<string, unknown> {
  return {
    issuedExtraction: issued,
    proof: signIssuedExtraction(issued, SERVER_KEY),
    corrections,
  };
}

export function salaryDocument(
  role: 'offer' | 'contract',
  amount: string,
  extra: IssuedExtractionDocument['fields'] = [],
): IssuedExtractionDocument {
  const fields = [
    fieldFor('basic_salary', 'present', { kind: 'money', amount, currency: 'AED', frequency: 'monthly', component: 'basic_salary', payer: null }, role, `${role} states basic salary AED ${amount} per month`),
    ...extra,
  ];
  return document(role, fields);
}
