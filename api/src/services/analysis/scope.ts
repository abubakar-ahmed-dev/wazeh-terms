/**
 * Scope applicability (docs/ADR-001, docs/TECHNICAL_ARCHITECTURE.md §3.2
 * step 4): declared route/category is checked against explicit contrary
 * clues in the extracted text. The regime is never inferred from an
 * employer name, logo, or address — no such inference exists here.
 */
import type { IssuedExtractionDocument, ScopeApplicability } from '../../contracts/index.js';

type Scope = {
  origin: 'PK';
  destination: 'AE';
  declaredRegime: 'uae_mainland_private' | 'unknown' | 'other';
  declaredWorkerCategory: 'non_domestic' | 'domestic' | 'unknown';
};

const CONTRARY_CLUE_PATTERNS: readonly RegExp[] = [
  /\bdomestic worker\b/i,
  /\bhousehold worker\b/i,
  /\bfree zone\b/i,
  /\bfree-zone\b/i,
];

export function scopeApplicability(scope: Scope, documents: readonly IssuedExtractionDocument[]): ScopeApplicability {
  // Extracted text is untrusted data; this scan is deliberately narrow and
  // deterministic — it only looks for explicit contrary phrases.
  const haystack = documents
    .flatMap((document) => document.fields.map((field) => field.rawText ?? ''))
    .join('\n');

  if (CONTRARY_CLUE_PATTERNS.some((pattern) => pattern.test(haystack))) {
    return 'conflicting';
  }

  if (scope.declaredRegime === 'uae_mainland_private' && scope.declaredWorkerCategory === 'non_domestic') {
    return 'supported';
  }
  return 'unknown';
}
