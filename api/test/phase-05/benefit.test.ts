import { describe, expect, it } from 'vitest';

import { compareDocuments } from '../../src/compare/index.js';
import type { IssuedExtractionDocument } from '../../src/contracts/index.js';
import { findingsFor, fullDocument, field } from './helpers.js';

function benefitPair(aStatus: string, aConditions: string | null, bStatus: string, bConditions: string | null) {
  const offer: IssuedExtractionDocument = fullDocument('offer', [
    field('accommodation_benefit', 'present', { kind: 'benefit_state', status: aStatus as never, conditions: aConditions }, { role: 'offer', quote: 'Offer benefit line' }),
  ]);
  const contract: IssuedExtractionDocument = fullDocument('contract', [
    field('accommodation_benefit', 'present', { kind: 'benefit_state', status: bStatus as never, conditions: bConditions }, { role: 'contract', quote: 'Contract benefit line' }),
  ]);
  const result = compareDocuments({ offer, contract });
  return { ...result, findings: findingsFor(result, 'accommodation_benefit') };
}

describe('benefit_state comparison', () => {
  it('provided vs not_provided is a mismatch, not silence', () => {
    expect(benefitPair('provided', null, 'not_provided', null).findings[0]!.category).toBe('document_mismatch');
  });

  it('provided vs conditional is a mismatch — conditional wording is a real difference', () => {
    expect(benefitPair('provided', null, 'conditional', 'if accommodation is available').findings[0]!.category).toBe('document_mismatch');
  });

  it('allowance vs provided is a mismatch', () => {
    expect(benefitPair('allowance', null, 'provided', null).findings[0]!.category).toBe('document_mismatch');
  });

  it('conditional vs conditional with different conditions is a clarification, not a mismatch', () => {
    const result = benefitPair('conditional', 'subject to availability', 'conditional', 'for single workers only');
    expect(result.findings[0]!.category).toBe('needs_clarification');
    expect(result.findings[0]!.uncertaintyReasons).toContain('conditional_wording_differs');
  });

  it('identical conditional wording produces nothing', () => {
    expect(benefitPair('conditional', 'same text', 'conditional', 'same text').findings).toEqual([]);
  });
});
