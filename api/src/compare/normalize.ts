/**
 * Normalization for comparison (docs/TECHNICAL_ARCHITECTURE.md §5): each
 * `NormalizedValue` becomes a `ComparableTerm`. Original `rawText` and
 * evidence are untouched — normalization only feeds the equality decision.
 * Self-contained on purpose: the comparison engine has zero dependencies on
 * services or I/O (the text rules mirror `services/evidence/matcher.ts`).
 */
import { parseDecimalToMinorUnits } from './money.js';
import type { NormalizedValue } from '../contracts/index.js';

export type ComparableTerm =
  | { readonly kind: 'text'; readonly normalized: string }
  | {
      readonly kind: 'money';
      readonly minorUnits: number | null;
      readonly currency: string | null;
      readonly frequency: string | null;
    }
  | { readonly kind: 'date'; readonly iso: string }
  | { readonly kind: 'duration'; readonly minorUnits: number | null; readonly unit: string }
  | { readonly kind: 'benefit'; readonly status: string; readonly conditions: string | null }
  | { readonly kind: 'boolean'; readonly value: boolean };

/** Whitespace/case/typographic normalization for text equality. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[­­​-‍﻿]/g, '')
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐‑‒–—―−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function normalizeValue(value: NormalizedValue): ComparableTerm {
  switch (value.kind) {
    case 'text':
    case 'reference_text':
      return { kind: 'text', normalized: normalizeText(value.text) };
    case 'money':
      return {
        kind: 'money',
        minorUnits: parseDecimalToMinorUnits(value.amount),
        currency: value.currency,
        frequency: value.frequency,
      };
    case 'date':
      return { kind: 'date', iso: value.date };
    case 'duration':
      return {
        kind: 'duration',
        minorUnits: parseDecimalToMinorUnits(value.amount),
        unit: value.unit,
      };
    case 'benefit_state':
      return { kind: 'benefit', status: value.status, conditions: value.conditions };
    case 'boolean':
      return { kind: 'boolean', value: value.value };
  }
}
