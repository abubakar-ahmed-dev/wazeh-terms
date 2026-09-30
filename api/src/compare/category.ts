/**
 * Finding-category resolution (docs/PRD.md §6, docs/API.md §6): state
 * distinctions are preserved — `absent` is not denial, `unreadable` is not
 * absence, and a mismatch requires both sides present and different.
 */
import type { FindingCategory, FieldState } from '../contracts/index.js';

export interface CategoryInput {
  readonly stateA: FieldState;
  readonly stateB: FieldState;
  readonly compared: 'equal' | 'different';
  readonly importantIfAbsent: boolean;
}

export function resolveCategory(input: CategoryInput): FindingCategory | null {
  const { stateA, stateB, compared, importantIfAbsent } = input;

  if (stateA === 'present' && stateB === 'present') {
    return compared === 'different' ? 'document_mismatch' : null;
  }

  const pair = [stateA, stateB];
  if (pair.includes('present')) {
    const other = stateA === 'present' ? stateB : stateA;
    switch (other) {
      case 'absent':
        return 'missing_information';
      case 'unclear':
        return 'needs_clarification';
      case 'unreadable':
        return 'unable_to_determine';
      case 'present':
        return null;
    }
  }

  // Neither side present.
  if (stateA === 'absent' && stateB === 'absent') {
    return importantIfAbsent ? 'missing_information' : null;
  }
  if (stateA === 'unclear' || stateB === 'unclear') {
    return 'needs_clarification';
  }
  return 'unable_to_determine';
}
