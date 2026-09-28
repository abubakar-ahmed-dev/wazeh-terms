import { describe, expect, it } from 'vitest';

import { IsoDateSchema, NormalizedValueSchema } from '../../src/contracts/index.js';
import { moneyValue } from './helpers.js';

describe('NormalizedValue discriminated union', () => {
  it('accepts a well-formed money value', () => {
    expect(NormalizedValueSchema.safeParse(moneyValue()).success).toBe(true);
  });

  it('rejects numeric amounts — money is a decimal string, never a float', () => {
    const numeric = moneyValue();
    expect(
      NormalizedValueSchema.safeParse({ ...numeric, amount: 2500 }).success,
    ).toBe(false);
  });

  it('enforces the decimal-string amount format', () => {
    for (const bad of ['2,500.00', '-500', '2500.000', 'AED 2500', '', '1e3']) {
      expect(NormalizedValueSchema.safeParse({ ...moneyValue(), amount: bad }).success, bad).toBe(false);
    }
    for (const good of ['0', '2500', '2500.5', '123456789012.34']) {
      expect(NormalizedValueSchema.safeParse({ ...moneyValue(), amount: good }).success, good).toBe(true);
    }
  });

  it('allows null currency/frequency/payer and rejects unknown enums', () => {
    expect(NormalizedValueSchema.safeParse(moneyValue({ currency: null })).success).toBe(true);
    expect(NormalizedValueSchema.safeParse(moneyValue({ frequency: null })).success).toBe(true);
    expect(NormalizedValueSchema.safeParse(moneyValue({ payer: null })).success).toBe(true);
    expect(NormalizedValueSchema.safeParse(moneyValue({ currency: 'aed' })).success).toBe(false);
    expect(NormalizedValueSchema.safeParse(moneyValue({ currency: 'AE' })).success).toBe(false);
    expect(NormalizedValueSchema.safeParse(moneyValue({ frequency: 'fortnightly' })).success).toBe(false);
    expect(NormalizedValueSchema.safeParse(moneyValue({ payer: 'employer' })).success).toBe(false);
    expect(NormalizedValueSchema.safeParse(moneyValue({ component: 'housing' })).success).toBe(false);
  });

  it('validates ISO calendar dates', () => {
    expect(IsoDateSchema.safeParse('2026-02-28').success).toBe(true);
    expect(IsoDateSchema.safeParse('2024-02-29').success).toBe(true);
    expect(IsoDateSchema.safeParse('2026-02-30').success).toBe(false);
    expect(IsoDateSchema.safeParse('2026-13-01').success).toBe(false);
    expect(IsoDateSchema.safeParse('2026-00-10').success).toBe(false);
    expect(IsoDateSchema.safeParse('2026-9-3').success).toBe(false);
    expect(IsoDateSchema.safeParse('28-09-2026').success).toBe(false);
  });

  it('validates duration, benefit_state, boolean, and text kinds', () => {
    expect(NormalizedValueSchema.safeParse({ kind: 'duration', amount: '6', unit: 'month' }).success).toBe(true);
    expect(NormalizedValueSchema.safeParse({ kind: 'duration', amount: '6', unit: 'fortnight' }).success).toBe(false);
    expect(
      NormalizedValueSchema.safeParse({ kind: 'benefit_state', status: 'conditional', conditions: 'If visa granted' })
        .success,
    ).toBe(true);
    expect(
      NormalizedValueSchema.safeParse({ kind: 'benefit_state', status: 'maybe', conditions: null }).success,
    ).toBe(false);
    expect(NormalizedValueSchema.safeParse({ kind: 'boolean', value: true }).success).toBe(true);
    expect(NormalizedValueSchema.safeParse({ kind: 'text', text: 'Site engineer' }).success).toBe(true);
    expect(NormalizedValueSchema.safeParse({ kind: 'text', text: '' }).success).toBe(false);
    expect(
      NormalizedValueSchema.safeParse({ kind: 'reference_text', text: 'Ref: HRD/2026/117' }).success,
    ).toBe(true);
  });

  it('rejects unknown kinds and unknown members (strict objects)', () => {
    expect(NormalizedValueSchema.safeParse({ kind: 'percentage', value: 90 }).success).toBe(false);
    expect(
      NormalizedValueSchema.safeParse({ ...moneyValue(), extraField: 'nope' }).success,
    ).toBe(false);
  });
});
