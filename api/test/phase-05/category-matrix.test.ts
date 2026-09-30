import { describe, expect, it } from 'vitest';

import { compareDocuments } from '../../src/compare/index.js';
import type { FieldState, IssuedExtractionDocument } from '../../src/contracts/index.js';
import { document, field, money } from './helpers.js';

const STATES: readonly FieldState[] = ['present', 'absent', 'unclear', 'unreadable'];

function side(role: 'offer' | 'contract', key: string, state: FieldState): IssuedExtractionDocument {
  const value = state === 'present' ? money() : null;
  return document(role, [field(key, state, value, { role, quote: `${role} quote` })]);
}

function run(key: string, stateA: FieldState, stateB: FieldState) {
  const result = compareDocuments({ offer: side('offer', key, stateA), contract: side('contract', key, stateB) });
  return { ...result, findings: result.findings.filter((finding) => finding.fieldKeys.includes(key)) };
}

function categoriesOf(key: string, stateA: FieldState, stateB: FieldState): string[] {
  return run(key, stateA, stateB).findings.map((finding) => finding.category);
}

describe('category matrix (present/absent/unclear/unreadable)', () => {
  it('present+present differs only on difference', () => {
    expect(categoriesOf('basic_salary', 'present', 'present')).toEqual([]);
  });

  it('present vs absent ⇒ missing_information, never a mismatch (absent ≠ denied)', () => {
    expect(categoriesOf('basic_salary', 'present', 'absent')).toEqual(['missing_information']);
    expect(categoriesOf('basic_salary', 'absent', 'present')).toEqual(['missing_information']);
    const finding = run('basic_salary', 'present', 'absent').findings[0]!;
    expect(finding.explanation).toContain('contract document');
    expect(finding.suggestedQuestionOrStep).toContain('not stated');
  });

  it('present vs unclear ⇒ needs_clarification', () => {
    expect(categoriesOf('basic_salary', 'present', 'unclear')).toEqual(['needs_clarification']);
    expect(categoriesOf('basic_salary', 'unclear', 'present')).toEqual(['needs_clarification']);
  });

  it('present vs unreadable ⇒ unable_to_determine (unreadable ≠ absent)', () => {
    expect(categoriesOf('basic_salary', 'present', 'unreadable')).toEqual(['unable_to_determine']);
  });

  it('absent+absent ⇒ missing_information only for importantIfAbsent keys', () => {
    expect(categoriesOf('basic_salary', 'absent', 'absent')).toEqual(['missing_information']);
    expect(categoriesOf('notice_terms', 'absent', 'absent')).toEqual(['missing_information']);
    expect(categoriesOf('employer_name', 'absent', 'absent')).toEqual([]);
    expect(categoriesOf('document_date', 'absent', 'absent')).toEqual([]);
  });

  it('unclear+unclear ⇒ needs_clarification', () => {
    expect(categoriesOf('basic_salary', 'unclear', 'unclear')).toEqual(['needs_clarification']);
  });

  it('absent+unclear ⇒ needs_clarification', () => {
    expect(categoriesOf('basic_salary', 'absent', 'unclear')).toEqual(['needs_clarification']);
  });

  it('absent+unreadable and unreadable+unreadable ⇒ unable_to_determine', () => {
    expect(categoriesOf('basic_salary', 'absent', 'unreadable')).toEqual(['unable_to_determine']);
    expect(categoriesOf('basic_salary', 'unreadable', 'unreadable')).toEqual(['unable_to_determine']);
  });

  it('a mismatch always carries exactly two document passages', () => {
    const result = pairMismatch();
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]!.documentEvidence).toHaveLength(2);
    expect(result.findings[0]!.comparisonRuleKey).toBe('money_equality');
  });

  it('absence from omission is recorded as uncertainty', () => {
    const offer = document('offer', [field('basic_salary', 'present', money(), { quote: 'q' })]);
    const contract = document('contract', []); // key entirely missing
    const result = compareDocuments({ offer, contract });
    const finding = result.findings.find((candidate) => candidate.fieldKeys.includes('basic_salary'))!;
    expect(finding.category).toBe('missing_information');
    expect(finding.uncertaintyReasons).toContain('field_not_returned_by_extraction_contract');
  });

  it('covers every state pair without crashing', () => {
    for (const stateA of STATES) {
      for (const stateB of STATES) {
        const result = run('basic_salary', stateA, stateB);
        expect(result.comparisonApplicable).toBe(true);
        for (const finding of result.findings) {
          if (finding.category === 'document_mismatch') {
            expect(finding.documentEvidence).toHaveLength(2);
          }
        }
      }
    }
  });
});

function pairMismatch() {
  const offer = document('offer', [field('basic_salary', 'present', money({ amount: '2400.00' }), { role: 'offer', quote: 'offer says 2400' })]);
  const contract = document('contract', [field('basic_salary', 'present', money({ amount: '1800.00' }), { role: 'contract', quote: 'contract says 1800' })]);
  const result = compareDocuments({ offer, contract });
  return { ...result, findings: result.findings.filter((finding) => finding.fieldKeys.includes('basic_salary')) };
}
