/**
 * Money handling for the comparison engine (docs/ADR-005): decimal strings
 * are parsed by string slicing into integer minor units. No floats, no
 * currency conversion, no rounding — `2500` and `2500.00` are the same
 * amount; `AED` and `USD` are never equated at any amount.
 */

const DECIMAL_PARTS = /^(\d{1,12})(?:\.(\d{1,2}))?$/;

/** `"2500.50"` → `250050`. Returns null for out-of-contract shapes. */
export function parseDecimalToMinorUnits(amount: string): number | null {
  const match = DECIMAL_PARTS.exec(amount);
  if (!match) return null;
  const whole = match[1]!;
  const fraction = (match[2] ?? '').padEnd(2, '0');
  const minorUnits = Number(whole) * 100 + Number(fraction);
  return Number.isSafeInteger(minorUnits) ? minorUnits : null;
}
