import { describe, expect, it } from 'vitest';

import { compareDocuments } from '../../src/compare/index.js';
import { parseDecimalToMinorUnits } from '../../src/compare/index.js';
import type { IssuedExtractionDocument } from '../../src/contracts/index.js';
import { findingsFor, fullDocument, field, money } from './helpers.js';

function pair(offerValue: ReturnType<typeof money>, contractValue: ReturnType<typeof money>) {
  const offer: IssuedExtractionDocument = fullDocument('offer', [field('basic_salary', 'present', offerValue, { role: 'offer', quote: 'Offer salary line' })]);
  const contract: IssuedExtractionDocument = fullDocument('contract', [field('basic_salary', 'present', contractValue, { role: 'contract', quote: 'Contract salary line' })]);
  const result = compareDocuments({ offer, contract });
  return { ...result, findings: findingsFor(result, 'basic_salary') };
}

describe('money normalization', () => {
  it('parses decimal strings to exact minor units', () => {
    expect(parseDecimalToMinorUnits('2500')).toBe(250000);
    expect(parseDecimalToMinorUnits('2500.5')).toBe(250050);
    expect(parseDecimalToMinorUnits('2500.00')).toBe(250000);
    expect(parseDecimalToMinorUnits('0.99')).toBe(99);
    expect(parseDecimalToMinorUnits('123456789012.34')).toBe(12345678901234);
    expect(parseDecimalToMinorUnits('-5')).toBeNull();
    expect(parseDecimalToMinorUnits('1.999')).toBeNull();
    expect(parseDecimalToMinorUnits('')).toBeNull();
  });

  it('treats 2500 and 2500.00 as the same amount', () => {
    expect(pair(money({ amount: '2500' }), money({ amount: '2500.00' })).findings).toEqual([]);
  });

  it('emits a mismatch with two passages for different amounts', () => {
    const result = pair(money({ amount: '2400.00' }), money({ amount: '1800.00' }));
    expect(result.findings).toHaveLength(1);
    const finding = result.findings[0]!;
    expect(finding.category).toBe('document_mismatch');
    expect(finding.comparisonRuleKey).toBe('money_equality');
    expect(finding.documentEvidence).toHaveLength(2);
    expect(finding.documentEvidence[0]!.quote).toBe('Offer salary line');
    expect(finding.documentEvidence[1]!.quote).toBe('Contract salary line');
    expect(finding.valueOrigins).toEqual(['document', 'document']);
    expect(finding.importance).toBe('high');
  });

  it('never equates unlike currencies, even at identical amounts', () => {
    const result = pair(money({ currency: 'AED' }), money({ currency: 'USD' }));
    expect(result.findings[0]!.category).toBe('document_mismatch');
  });

  it('treats null vs stated currency as different (never coerced)', () => {
    const result = pair(money({ currency: null }), money({ currency: 'AED' }));
    expect(result.findings[0]!.category).toBe('document_mismatch');
  });

  it('compares frequency only when both sides state it', () => {
    expect(
      pair(money({ frequency: null }), money({ frequency: 'yearly' })).findings,
    ).toEqual([]);
    expect(
      pair(money({ frequency: 'monthly' }), money({ frequency: 'yearly' })).findings[0]!.category,
    ).toBe('document_mismatch');
  });

  it('keeps pakistan-side charges and uae employer costs distinct by component/payer', () => {
    // The registry forces deduction components to worker_charge; a stated
    // payer on one side only is data, never coerced for equality.
    const offer = fullDocument('offer', [
      field('deduction_item', 'present', money({ amount: '3100.00', component: 'worker_charge', payer: 'pakistan_recruiter' }), { quote: 'Recruiter fee PKR' }),
    ]);
    const contract = fullDocument('contract', [
      field('deduction_item', 'present', money({ amount: '3100.00', component: 'worker_charge', payer: 'uae_employer' }), { role: 'contract', quote: 'Employer cost AED' }),
    ]);
    // payer is not part of money equality — the documents still agree on the amount.
    const result = compareDocuments({ offer, contract });
    expect(result.findings.filter((finding) => finding.fieldKeys.includes('deduction_item'))).toEqual([]);
  });
});
