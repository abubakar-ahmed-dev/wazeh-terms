import { describe, expect, it } from 'vitest';

import { normalizeForMatch, verifyEvidence } from '../../src/services/evidence/matcher.js';

const pageTexts = [
  'Basic salary: AED 2,400 per month. Housing allowance AED 800.',
  'Contract duration: six months from the start date.',
  null,
];

describe('normalizeForMatch', () => {
  it('collapses whitespace, case, and typographic variants', () => {
    expect(normalizeForMatch('  Basic   SALARY:\nAED 2,400 ')).toBe('basic salary: aed 2,400');
    expect(normalizeForMatch('“Test’s” value — full‑time')).toBe('"test\'s" value - full-time');
  });
});

describe('verifyEvidence', () => {
  it('matches an exact quote on the claimed page', () => {
    const result = verifyEvidence('AED 2,400 per month', 1, pageTexts);
    expect(result).toEqual({ verification: 'matched_text', qualityNotes: [] });
  });

  it('matches a reformatted quote (line breaks, extra spaces, case)', () => {
    const result = verifyEvidence('basic   SALARY:\nAED 2,400 per month.', 1, pageTexts);
    expect(result.verification).toBe('matched_text');
  });

  it('matches typographic variants of quotes and dashes', () => {
    const texts = ['The worker’s contract — full‑time employment'];
    const result = verifyEvidence('worker’s contract — full‑time', 1, texts);
    expect(result.verification).toBe('matched_text');
  });

  it('never corrects the page: passage found elsewhere stays model_transcription', () => {
    const result = verifyEvidence('six months from the start date', 1, pageTexts);
    expect(result.verification).toBe('model_transcription');
    expect(result.qualityNotes).toEqual(['passage_found_on_page_2', 'passage_not_matched_on_claimed_page']);
  });

  it('reports an invented quote with the not-matched note', () => {
    const result = verifyEvidence('guaranteed lifetime pension', 1, pageTexts);
    expect(result.verification).toBe('model_transcription');
    expect(result.qualityNotes).toEqual(['passage_not_matched_on_claimed_page']);
  });

  it('flags a claimed page without a text layer', () => {
    const result = verifyEvidence('anything', 3, pageTexts);
    expect(result.verification).toBe('model_transcription');
    expect(result.qualityNotes).toEqual(['claimed_page_has_no_text_layer']);
  });

  it('keeps notes bounded to one finding per quote', () => {
    const result = verifyEvidence('six months', 3, pageTexts);
    expect(result.qualityNotes).toEqual(['claimed_page_has_no_text_layer', 'passage_found_on_page_2']);
  });
});
