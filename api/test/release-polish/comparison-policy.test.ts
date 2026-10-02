/**
 * Comparison policy tests (release-polish WI-1/WI-2/WI-3): expected-to-differ
 * metadata fields never emit mismatches; emitted mismatches always explain
 * and evidence their own field; benefit conditional policies are pinned.
 */
import { describe, expect, it } from 'vitest';

import { compareDocuments } from '../../src/compare/index.js';
import { FIELD_DEFINITIONS } from '../../src/contracts/index.js';
import type { IssuedExtractionDocument, NormalizedValue } from '../../src/contracts/index.js';
import { field, findingsFor, fullDocument, money } from '../phase-05/helpers.js';

const EXPECTED_TO_DIFFER = ['document_date', 'document_reference', 'verification_reference', 'annex_reference'];

function pairDifferent(fieldKey: string, offerValue: NormalizedValue, contractValue: NormalizedValue) {
  const offer: IssuedExtractionDocument = fullDocument('offer', [
    field(fieldKey, 'present', offerValue, { role: 'offer', quote: `Offer ${fieldKey} line` }),
  ]);
  const contract: IssuedExtractionDocument = fullDocument('contract', [
    field(fieldKey, 'present', contractValue, { role: 'contract', quote: `Contract ${fieldKey} line` }),
  ]);
  return compareDocuments({ offer, contract });
}

describe('registry expectedToDiffer marking (WI-1)', () => {
  it('marks exactly the four document-details metadata fields', () => {
    const marked = FIELD_DEFINITIONS.filter((definition) => definition.expectedToDiffer).map((d) => d.fieldKey);
    expect([...marked].sort()).toEqual([...EXPECTED_TO_DIFFER].sort());
  });

  it('leaves must-match document details unmarked', () => {
    for (const key of ['document_language', 'signature_presence']) {
      expect(FIELD_DEFINITIONS.find((d) => d.fieldKey === key)?.expectedToDiffer).toBe(false);
    }
  });
});

describe('expected-to-differ metadata never emits document_mismatch (WI-1)', () => {
  const referenceText = (text: string): NormalizedValue => ({ kind: 'reference_text', text });

  it('ignores differing document_reference values', () => {
    const result = pairDifferent('document_reference', referenceText('TC-009-O'), referenceText('TC-009-C'));
    expect(findingsFor(result, 'document_reference')).toEqual([]);
  });

  it('ignores differing document_date values', () => {
    const result = pairDifferent(
      'document_date',
      { kind: 'date', date: '2026-01-10' },
      { kind: 'date', date: '2026-01-15' },
    );
    expect(findingsFor(result, 'document_date')).toEqual([]);
  });

  it('ignores differing verification_reference values', () => {
    const result = pairDifferent(
      'verification_reference',
      referenceText('MOHRE-VR-0001'),
      referenceText('MOHRE-VR-0002'),
    );
    expect(findingsFor(result, 'verification_reference')).toEqual([]);
  });

  it('ignores differing annex_reference values', () => {
    const result = pairDifferent(
      'annex_reference',
      referenceText('Annex A — accommodation policy'),
      referenceText('Annex B — housing policy'),
    );
    expect(findingsFor(result, 'annex_reference')).toEqual([]);
  });

  it('still reports a signature_presence difference as a real mismatch', () => {
    const result = pairDifferent(
      'signature_presence',
      { kind: 'boolean', value: true },
      { kind: 'boolean', value: false },
    );
    const findings = findingsFor(result, 'signature_presence');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.category).toBe('document_mismatch');
    expect(findings[0]!.fieldKeys).toEqual(['signature_presence']);
  });

  it('still reports a substantive text difference as a real mismatch (control)', () => {
    const result = pairDifferent('employer_name', { kind: 'text', text: 'Alpha LLC' }, { kind: 'text', text: 'Beta FZE' });
    const findings = findingsFor(result, 'employer_name');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.category).toBe('document_mismatch');
  });
});

describe('explanation/evidence stay bound to their own field (WI-2 pinning)', () => {
  it('multi-field mismatches never cross explanations or evidence', () => {
    const offer: IssuedExtractionDocument = fullDocument('offer', [
      field('basic_salary', 'present', money({ amount: '2400.00' }), { role: 'offer', quote: 'Offer salary line' }),
      field('start_date', 'present', { kind: 'date', date: '2026-03-01' }, { role: 'offer', quote: 'Offer start line' }),
    ]);
    const contract: IssuedExtractionDocument = fullDocument('contract', [
      field('basic_salary', 'present', money({ amount: '1800.00' }), { role: 'contract', quote: 'Contract salary line' }),
      field('start_date', 'present', { kind: 'date', date: '2026-04-01' }, { role: 'contract', quote: 'Contract start line' }),
    ]);
    const result = compareDocuments({ offer, contract });
    const relevant = [
      ...findingsFor(result, 'basic_salary'),
      ...findingsFor(result, 'start_date'),
    ];
    expect(relevant).toHaveLength(2);
    for (const finding of relevant) {
      const definition = FIELD_DEFINITIONS.find((d) => d.fieldKey === finding.fieldKeys[0]);
      expect(definition).toBeDefined();
      expect(finding.explanation.toLowerCase()).toContain(definition!.label.toLowerCase());
      expect(finding.documentEvidence).toHaveLength(2);
      expect(finding.documentEvidence[0]!.documentId).toBe('doc-offer');
      expect(finding.documentEvidence[1]!.documentId).toBe('doc-contract');
    }
    const salary = relevant.find((f) => f.fieldKeys[0] === 'basic_salary');
    expect(salary?.documentEvidence.map((e) => e.quote)).toEqual(['Offer salary line', 'Contract salary line']);
    const start = relevant.find((f) => f.fieldKeys[0] === 'start_date');
    expect(start?.documentEvidence.map((e) => e.quote)).toEqual(['Offer start line', 'Contract start line']);
  });
});

describe('benefit conditional policies (WI-3 pinning)', () => {
  it('emits a documented mismatch when an explicit benefit becomes conditional', () => {
    const result = pairDifferent(
      'accommodation_benefit',
      { kind: 'benefit_state', status: 'provided', conditions: null },
      { kind: 'benefit_state', status: 'conditional', conditions: 'Subject to availability at the company camp' },
    );
    const findings = findingsFor(result, 'accommodation_benefit');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.category).toBe('document_mismatch');
    expect(findings[0]!.documentEvidence).toHaveLength(2);
  });

  it('routes differing conditional wording to needs_clarification, not mismatch', () => {
    const result = pairDifferent(
      'food_benefit',
      { kind: 'benefit_state', status: 'conditional', conditions: 'Provided during probation only' },
      { kind: 'benefit_state', status: 'conditional', conditions: 'Provided after confirmation only' },
    );
    const findings = findingsFor(result, 'food_benefit');
    expect(findings).toHaveLength(1);
    expect(findings[0]!.category).toBe('needs_clarification');
    expect(findings[0]!.uncertaintyReasons).toContain('conditional_wording_differs');
  });
});
