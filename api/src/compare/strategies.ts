/**
 * Code-implemented comparison strategies (docs/ADR-005): one predicate per
 * registry `comparisonStrategyKey`. Deterministic — the model never decides
 * a mismatch. Money compares amount, currency, and (when both sides state
 * it) frequency separately; unlike currencies are never equal and frequency
 * is otherwise deferred to the `payment_frequency` field.
 */
import type { ComparableTerm } from './normalize.js';

export type ComparisonOutcome = 'equal' | 'different';

export function compareTerm(a: ComparableTerm, b: ComparableTerm): ComparisonOutcome {
  if (a.kind !== b.kind) return 'different';

  switch (a.kind) {
    case 'text':
      return a.normalized === (b as ComparableTerm & { kind: 'text' }).normalized ? 'equal' : 'different';
    case 'date':
      return a.iso === (b as ComparableTerm & { kind: 'date' }).iso ? 'equal' : 'different';
    case 'boolean':
      return a.value === (b as ComparableTerm & { kind: 'boolean' }).value ? 'equal' : 'different';
    case 'duration': {
      const other = b as ComparableTerm & { kind: 'duration' };
      // No unit conversion: `6 month` never equals `180 day`.
      return a.unit === other.unit && a.minorUnits === other.minorUnits ? 'equal' : 'different';
    }
    case 'benefit': {
      const other = b as ComparableTerm & { kind: 'benefit' };
      return a.status === other.status ? 'equal' : 'different';
    }
    case 'money': {
      const other = b as ComparableTerm & { kind: 'money' };
      // Unlike currencies (including null vs stated) are never equal.
      if (a.currency !== other.currency) return 'different';
      if (a.minorUnits !== other.minorUnits) return 'different';
      // Frequency deferral: judged only when both sides state it; otherwise
      // the separate `payment_frequency` field is the single source of truth.
      if (a.frequency !== null && other.frequency !== null && a.frequency !== other.frequency) {
        return 'different';
      }
      return 'equal';
    }
  }
}
