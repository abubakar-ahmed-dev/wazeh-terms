import { describe, expect, it } from 'vitest';

import { compareDocuments } from '../../src/compare/index.js';
import type { IssuedExtractionDocument } from '../../src/contracts/index.js';
import { findingsFor, fullDocument, field, money } from './helpers.js';

function allowance(amount: string, role: 'offer' | 'contract', ordinal: number, quote: string) {
  return field('allowance_item', 'present', money({ amount, component: 'allowance' }), {
    role,
    quote,
    conditions: { instanceId: `allowance_item:${ordinal}` },
  });
}

function pair(offerEntries: ReturnType<typeof allowance>[], contractEntries: ReturnType<typeof allowance>[]) {
  const offer: IssuedExtractionDocument = fullDocument('offer', offerEntries);
  const contract: IssuedExtractionDocument = fullDocument('contract', contractEntries);
  const result = compareDocuments({ offer, contract });
  return { ...result, findings: findingsFor(result, 'allowance_item') };
}

describe('repeated items (allowance/deduction lists)', () => {
  it('pairs equal-count lists by ordinal; only differing entries mismatch', () => {
    const result = pair(
      [allowance('500.00', 'offer', 0, 'transport 500'), allowance('300.00', 'offer', 1, 'food 300')],
      [allowance('500.00', 'contract', 0, 'transport 500 c'), allowance('250.00', 'contract', 1, 'food 250 c')],
    );
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]!.category).toBe('document_mismatch');
    expect(result.findings[0]!.explanation).toContain('entry 2 of 2');
    expect(result.findings[0]!.documentEvidence.map((e) => e.quote)).toEqual(['food 300', 'food 250 c']);
  });

  it('unequal counts ⇒ one clarification, never a forced mismatch', () => {
    const result = pair(
      [allowance('500.00', 'offer', 0, 'a'), allowance('300.00', 'offer', 1, 'b')],
      [allowance('500.00', 'contract', 0, 'c')],
    );
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]!.category).toBe('needs_clarification');
    expect(result.findings[0]!.uncertaintyReasons).toContain('repeated_items_count_mismatch');
  });

  it('repeated vs missing ⇒ missing_information with no passages', () => {
    const result = pair([allowance('500.00', 'offer', 0, 'a')], []);
    expect(result.findings[0]!.category).toBe('missing_information');
    expect(result.findings[0]!.documentEvidence).toEqual([]);
  });

  it('identical equal-count lists produce nothing', () => {
    const result = pair(
      [allowance('500.00', 'offer', 0, 'x'), allowance('300.00', 'offer', 1, 'y')],
      [allowance('500.00', 'contract', 0, 'x c'), allowance('300.00', 'contract', 1, 'y c')],
    );
    expect(result.findings).toEqual([]);
  });
});
