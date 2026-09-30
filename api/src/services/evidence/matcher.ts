/**
 * Passage corroboration (docs/ADR-004, docs/TECHNICAL_ARCHITECTURE.md §3.1
 * step 4): a reported quote is `matched_text` only when its normalized form
 * appears verbatim on the claimed page's text layer. Anything else stays
 * `model_transcription` with a stable note token. A quote is never rewritten
 * and a page number is never corrected to force a match.
 *
 * Stable note tokens (UI maps them to plain English later):
 * - `claimed_page_has_no_text_layer`
 * - `passage_not_matched_on_claimed_page`
 * - `passage_found_on_page_<N>`
 * - `transcription_unverified_scan`
 */

export type EvidenceVerification = 'matched_text' | 'model_transcription';

export interface EvidenceMatchResult {
  readonly verification: EvidenceVerification;
  readonly qualityNotes: readonly string[];
}

export function normalizeForMatch(text: string): string {
  return text
    .normalize('NFC')
    // Soft hyphen and zero-width characters.
    .replace(/[­­​-‍﻿]/g, '')
    // Curly quotes, apostrophes → ASCII apostrophe.
    .replace(/[‘’‛]/g, "'")
    // Curly double quotes → ASCII double quote.
    .replace(/[“”]/g, '"')
    // Unicode hyphens/dashes (hyphen, non-breaking, figure, en, em, horizontal bar, minus) → ASCII hyphen.
    .replace(/[‐‑‒–—―−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function pageContainsQuote(pageText: string | null | undefined, normalizedQuote: string): boolean {
  if (!pageText) return false;
  return normalizeForMatch(pageText).includes(normalizedQuote);
}

export function verifyEvidence(
  quote: string,
  claimedPage: number,
  pageTexts: readonly (string | null)[],
): EvidenceMatchResult {
  const normalizedQuote = normalizeForMatch(quote);
  const claimedIndex = claimedPage - 1;

  if (pageContainsQuote(pageTexts[claimedIndex], normalizedQuote)) {
    return { verification: 'matched_text', qualityNotes: [] };
  }

  const qualityNotes: string[] = [];
  const claimedText = pageTexts[claimedIndex];
  if (claimedText === undefined || claimedText === null) {
    qualityNotes.push('claimed_page_has_no_text_layer');
  }

  for (let index = 0; index < pageTexts.length; index++) {
    if (index === claimedIndex) continue;
    if (pageContainsQuote(pageTexts[index], normalizedQuote)) {
      qualityNotes.push(`passage_found_on_page_${index + 1}`);
      break;
    }
  }

  if (!qualityNotes.includes('claimed_page_has_no_text_layer')) {
    qualityNotes.push('passage_not_matched_on_claimed_page');
  }

  return { verification: 'model_transcription', qualityNotes };
}

/** True when every entry is a model transcription (no corroboration at all). */
export function allUnmatched(results: readonly EvidenceMatchResult[]): boolean {
  return results.length > 0 && results.every((result) => result.verification === 'model_transcription');
}

/** True when the claimed pages of every entry lack a text layer. */
export function claimedPagesWithoutTextLayer(
  claimedPages: readonly number[],
  pageTexts: readonly (string | null)[],
): boolean {
  return (
    claimedPages.length > 0 &&
    claimedPages.every((page) => {
      const text = pageTexts[page - 1];
      return text === undefined || text === null;
    })
  );
}
