import { describe, expect, it } from 'vitest';

import { EvidenceSchema, ExtractedFieldSchema } from '../../src/contracts/index.js';
import { moneyValue, presentMoneyField } from './helpers.js';

describe('Evidence', () => {
  it('requires a one-based page, non-empty quote, and a known verification value', () => {
    const valid = { documentId: 'doc-offer-1', page: 1, quote: 'Salary AED 2,500', verification: 'matched_text' };
    expect(EvidenceSchema.safeParse(valid).success).toBe(true);
    expect(EvidenceSchema.safeParse({ ...valid, page: 0 }).success).toBe(false);
    expect(EvidenceSchema.safeParse({ ...valid, page: 1.5 }).success).toBe(false);
    expect(EvidenceSchema.safeParse({ ...valid, quote: '' }).success).toBe(false);
    expect(EvidenceSchema.safeParse({ ...valid, verification: 'verified' }).success).toBe(false);
    expect(
      EvidenceSchema.safeParse({ ...valid, verification: 'model_transcription' }).success,
    ).toBe(true);
  });
});

describe('ExtractedField state invariants', () => {
  it('accepts a well-formed present money field', () => {
    expect(ExtractedFieldSchema.safeParse(presentMoneyField()).success).toBe(true);
  });

  it('rejects present without a typed value or without evidence', () => {
    expect(ExtractedFieldSchema.safeParse(presentMoneyField({ value: null })).success).toBe(false);
    expect(ExtractedFieldSchema.safeParse(presentMoneyField({ evidence: [] })).success).toBe(false);
  });

  it('rejects non-present states carrying a typed value', () => {
    for (const state of ['absent', 'unclear', 'unreadable'] as const) {
      expect(
        ExtractedFieldSchema.safeParse(presentMoneyField({ state, value: moneyValue() })).success,
        state,
      ).toBe(false);
      expect(
        ExtractedFieldSchema.safeParse(presentMoneyField({ state, value: null })).success,
        state,
      ).toBe(true);
    }
  });

  it('rejects unknown field keys', () => {
    expect(
      ExtractedFieldSchema.safeParse(presentMoneyField({ fieldKey: 'monthly_wage' })).success,
    ).toBe(false);
  });

  it('rejects value kinds that do not match the registry valueKind', () => {
    expect(
      ExtractedFieldSchema.safeParse(
        presentMoneyField({ fieldKey: 'employer_name', value: moneyValue() }),
      ).success,
    ).toBe(false);
    expect(
      ExtractedFieldSchema.safeParse(
        presentMoneyField({ fieldKey: 'employer_name', value: { kind: 'text', text: 'Falcon Metals LLC' } }),
      ).success,
    ).toBe(true);
  });

  it('rejects money components that do not match the registry mapping', () => {
    expect(
      ExtractedFieldSchema.safeParse(
        presentMoneyField({
          fieldKey: 'deduction_item',
          instanceId: 'deduction_item:0',
          value: moneyValue({ component: 'worker_charge', amount: '3100.00' }),
        }),
      ).success,
    ).toBe(true);
    expect(
      ExtractedFieldSchema.safeParse(
        presentMoneyField({ value: moneyValue({ component: 'worker_charge' }) }),
      ).success,
    ).toBe(false);
  });

  it('enforces instanceId and qualityNote bounds', () => {
    expect(
      ExtractedFieldSchema.safeParse(presentMoneyField({ instanceId: 'bad id with spaces' })).success,
    ).toBe(false);
    expect(
      ExtractedFieldSchema.safeParse(
        presentMoneyField({ qualityNotes: Array.from({ length: 21 }, () => 'note') }),
      ).success,
    ).toBe(false);
  });
});
