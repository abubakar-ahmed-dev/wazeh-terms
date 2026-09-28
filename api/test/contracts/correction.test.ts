import { describe, expect, it } from 'vitest';

import { CorrectionDeltaSchema, CorrectionsSchema } from '../../src/contracts/index.js';
import { moneyValue } from './helpers.js';

const validCorrection = () => ({
  documentId: 'doc-offer-1',
  fieldKey: 'basic_salary',
  instanceId: 'basic_salary:0',
  state: 'present',
  value: moneyValue({ amount: '2750.00' }),
});

describe('Correction deltas', () => {
  it('accepts a present-state correction with no evidence of its own', () => {
    expect(CorrectionDeltaSchema.safeParse(validCorrection()).success).toBe(true);
  });

  it('rejects present without a value and non-present with a value', () => {
    expect(CorrectionDeltaSchema.safeParse({ ...validCorrection(), value: null }).success).toBe(false);
    expect(
      CorrectionDeltaSchema.safeParse({ ...validCorrection(), state: 'absent' }).success,
    ).toBe(false);
    expect(
      CorrectionDeltaSchema.safeParse({ ...validCorrection(), state: 'unclear', value: null }).success,
    ).toBe(true);
  });

  it('rejects unknown field keys and bad identities', () => {
    expect(CorrectionDeltaSchema.safeParse({ ...validCorrection(), fieldKey: 'pay' }).success).toBe(false);
    expect(
      CorrectionDeltaSchema.safeParse({ ...validCorrection(), documentId: '../etc/passwd' }).success,
    ).toBe(false);
  });

  it('keeps value-kind consistency with the registry', () => {
    expect(
      CorrectionDeltaSchema.safeParse({ ...validCorrection(), value: { kind: 'text', text: '2750' } })
        .success,
    ).toBe(false);
  });

  it('caps the corrections array', () => {
    const hundred = CorrectionsSchema.safeParse(Array.from({ length: 100 }, validCorrection));
    const hundredOne = CorrectionsSchema.safeParse(Array.from({ length: 101 }, validCorrection));
    expect(hundred.success).toBe(true);
    expect(hundredOne.success).toBe(false);
  });
});
