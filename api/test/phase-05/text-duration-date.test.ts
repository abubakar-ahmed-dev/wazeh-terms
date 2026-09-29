import { describe, expect, it } from 'vitest';

import { compareDocuments } from '../../src/compare/index.js';
import type { IssuedExtractionDocument } from '../../src/contracts/index.js';
import { findingsFor, fullDocument, field } from './helpers.js';

function pair(
  key: string,
  a: { state: ExtractedState; value: unknown; quote?: string },
  b: { state: ExtractedState; value: unknown; quote?: string },
) {
  const offer: IssuedExtractionDocument = fullDocument('offer', [field(key, a.state, a.value as never, { role: 'offer', quote: a.quote })]);
  const contract: IssuedExtractionDocument = fullDocument('contract', [field(key, b.state, b.value as never, { role: 'contract', quote: b.quote })]);
  const result = compareDocuments({ offer, contract });
  return { ...result, findings: findingsFor(result, key) };
}

type ExtractedState = 'present' | 'absent' | 'unclear' | 'unreadable';

describe('text / date / duration / boolean comparisons', () => {
  it('ignores case and whitespace differences in text', () => {
    const result = pair('job_title', { state: 'present', value: { kind: 'text', text: 'Site  ENGINEER' }, quote: 'Site ENGINEER' }, { state: 'present', value: { kind: 'text', text: 'site engineer' }, quote: 'site engineer' });
    expect(result.findings).toEqual([]);
  });

  it('flags real wording differences', () => {
    const result = pair('job_title', { state: 'present', value: { kind: 'text', text: 'Site engineer' }, quote: 'Site engineer' }, { state: 'present', value: { kind: 'text', text: 'Site supervisor' }, quote: 'Site supervisor' });
    expect(result.findings[0]!.category).toBe('document_mismatch');
    expect(result.findings[0]!.comparisonRuleKey).toBe('text_equality');
    expect(result.findings[0]!.importance).toBe('medium');
  });

  it('compares dates exactly', () => {
    expect(
      pair('start_date', { state: 'present', value: { kind: 'date', date: '2026-03-01' }, quote: '1 March 2026' }, { state: 'present', value: { kind: 'date', date: '2026-03-01' }, quote: '01.03.2026' }).findings,
    ).toEqual([]);
    expect(
      pair('start_date', { state: 'present', value: { kind: 'date', date: '2026-03-01' }, quote: 'a' }, { state: 'present', value: { kind: 'date', date: '2026-04-01' }, quote: 'b' }).findings[0]!.category,
    ).toBe('document_mismatch');
  });

  it('never converts duration units', () => {
    expect(
      pair('contract_duration', { state: 'present', value: { kind: 'duration', amount: '6', unit: 'month' }, quote: 'six months' }, { state: 'present', value: { kind: 'duration', amount: '6', unit: 'month' }, quote: '6 months' }).findings,
    ).toEqual([]);
    expect(
      pair('contract_duration', { state: 'present', value: { kind: 'duration', amount: '6', unit: 'month' }, quote: 'a' }, { state: 'present', value: { kind: 'duration', amount: '180', unit: 'day' }, quote: 'b' }).findings[0]!.category,
    ).toBe('document_mismatch');
  });

  it('compares booleans strictly', () => {
    expect(
      pair('signature_presence', { state: 'present', value: { kind: 'boolean', value: true }, quote: 'signed' }, { state: 'present', value: { kind: 'boolean', value: true }, quote: 'signed' }).findings,
    ).toEqual([]);
    expect(
      pair('signature_presence', { state: 'present', value: { kind: 'boolean', value: true }, quote: 'a' }, { state: 'present', value: { kind: 'boolean', value: false }, quote: 'b' }).findings[0]!.category,
    ).toBe('document_mismatch');
  });
});
