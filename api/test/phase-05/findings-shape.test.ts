import { describe, expect, it } from 'vitest';

import { compareDocuments } from '../../src/compare/index.js';
import { FindingSchema, type IssuedExtractionDocument } from '../../src/contracts/index.js';
import { document, field, money } from './helpers.js';

function fullPair(): { offer: IssuedExtractionDocument; contract: IssuedExtractionDocument } {
  const offer = document('offer', [
    field('basic_salary', 'present', money({ amount: '2400.00' }), { role: 'offer', quote: 'offer basic 2400' }),
    field('employer_name', 'present', { kind: 'text', text: 'Gulf Horizon Facilities Services LLC' }, { role: 'offer', quote: 'Gulf Horizon offer' }),
    field('accommodation_benefit', 'present', { kind: 'benefit_state', status: 'provided', conditions: null }, { role: 'offer', quote: 'housing provided offer' }),
    field('contract_duration', 'absent', null, { role: 'offer' }),
  ]);
  const contract = document('contract', [
    field('basic_salary', 'present', money({ amount: '1800.00' }), { role: 'contract', quote: 'contract basic 1800' }),
    field('employer_name', 'absent', null, { role: 'contract' }),
    field('accommodation_benefit', 'present', { kind: 'benefit_state', status: 'conditional', conditions: 'if available' }, { role: 'contract', quote: 'housing conditional contract' }),
  ]);
  return { offer, contract };
}

describe('finding drafts validate against the API.md §6 Finding schema', () => {
  it('every emitted draft parses', () => {
    const result = compareDocuments(fullPair());
    expect(result.comparisonApplicable).toBe(true);
    expect(result.findings.length).toBeGreaterThanOrEqual(3);
    for (const finding of result.findings) {
      const parsed = FindingSchema.safeParse({
        ...finding,
        id: `finding-${finding.fieldKeys.join('-')}-${finding.category}`,
        uncertaintyReasons: finding.uncertaintyReasons.length > 0 ? finding.uncertaintyReasons : [],
      });
      expect(parsed.success, JSON.stringify(parsed.error?.issues ?? [])).toBe(true);
    }
  });

  it('mismatches carry comparisonRuleKey; non-mismatch categories never do', () => {
    const result = compareDocuments(fullPair());
    for (const finding of result.findings) {
      if (finding.category === 'document_mismatch') {
        expect(finding.comparisonRuleKey).toBeDefined();
        expect(finding.documentEvidence).toHaveLength(2);
      } else {
        expect(finding.comparisonRuleKey).toBeUndefined();
      }
    }
  });

  it('coverage lists every evaluated key when comparison applies', () => {
    const result = compareDocuments(fullPair());
    expect(result.checkedFieldKeys).toHaveLength(33);
  });
});
