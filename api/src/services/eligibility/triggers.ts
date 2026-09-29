/**
 * Trigger predicates (docs/DATABASE_SCHEMA.md §6, docs/TECHNICAL_ARCHITECTURE
 * §5 "Rule checking"): the small set of reviewed topics with deterministic
 * code checks. Pure module — reconciled documents in, trigger results out;
 * no I/O, no model, no environment.
 *
 * The predicates only *flag* that a reviewed rule may apply; retrieval and
 * the canonical eligibility gate decide whether any claim is displayed.
 */
import { parseDecimalToMinorUnits } from '../../compare/money.js';
import type { ExtractedField, MoneyValue } from '../../contracts/index.js';

export interface ReconciledSide {
  readonly fields: readonly ExtractedField[];
}

/** Worker-charge-class field keys (recruitment_and_travel_costs + deductions). */
const WORKER_CHARGE_KEYS: readonly string[] = [
  'recruitment_cost',
  'visa_cost',
  'residency_cost',
  'medical_cost',
  'travel_cost',
  'other_worker_charge',
  'deduction_item',
];

export interface TriggerOutcome {
  /** The trigger fired on at least one document side. */
  readonly fired: boolean;
  /** Field keys whose state caused the firing (deduplicated, stable order). */
  readonly fieldKeys: readonly string[];
}

export interface TriggerEvaluation {
  readonly workerChargePayer: TriggerOutcome;
  readonly paymentFrequencyMonthly: TriggerOutcome;
  readonly statedTotalMatchesComponents: TriggerOutcome;
  readonly machineConditions: {
    readonly chargeClassPresent: boolean;
    readonly chargePayerStated: boolean;
    readonly frequencyCovered: boolean;
    readonly totalComponentsCheckable: boolean;
  };
}

export function evaluateTriggers(offer?: ReconciledSide, contract?: ReconciledSide): TriggerEvaluation {
  const sides = [offer, contract].filter((side): side is ReconciledSide => !!side);
  return {
    workerChargePayer: evaluateWorkerChargePayer(sides),
    paymentFrequencyMonthly: evaluatePaymentFrequency(sides),
    statedTotalMatchesComponents: evaluateStatedTotal(sides),
    machineConditions: {
      chargeClassPresent: sides.some((side) =>
        side.fields.some((field) => WORKER_CHARGE_KEYS.includes(field.fieldKey) && field.state === 'present'),
      ),
      chargePayerStated: sides.some((side) =>
        side.fields.some(
          (field) =>
            WORKER_CHARGE_KEYS.includes(field.fieldKey) &&
            field.state === 'present' &&
            (field.value as MoneyValue | null)?.kind === 'money' &&
            (field.value as MoneyValue | null)?.payer !== null,
        ),
      ),
      frequencyCovered: sides.some((side) =>
        side.fields.some((field) => field.fieldKey === 'payment_frequency' && field.state !== 'unreadable'),
      ),
      totalComponentsCheckable: sides.some((side) => statedTotalGap(side) !== null),
    },
  };
}

/**
 * `worker_charge.payer_must_be_uae_employer`: a stated charge of the
 * worker-charge class whose payer is the worker (or is not established)
 * fires. A charge explicitly carried by the UAE employer does not fire;
 * a Pakistan-recruiter payer stays a separate, Pakistan-side matter and is
 * not conflated here.
 */
function evaluateWorkerChargePayer(sides: readonly ReconciledSide[]): TriggerOutcome {
  const fieldKeys = new Set<string>();
  for (const side of sides) {
    for (const field of side.fields) {
      if (!WORKER_CHARGE_KEYS.includes(field.fieldKey) || field.state !== 'present') continue;
      const value = field.value;
      if (!value || value.kind !== 'money') continue;
      // This trigger covers the UAE-employer obligation: it fires when the
      // burden lands on the worker or responsibility is unestablished
      // (null/unknown/other). A stated UAE-employer payer does not fire; a
      // Pakistan-recruiter payer is a Pakistan-side matter, deliberately not
      // conflated here (root CLAUDE.md: keep the sides distinct).
      if (value.payer !== 'uae_employer' && value.payer !== 'pakistan_recruiter') {
        fieldKeys.add(field.fieldKey);
      }
    }
  }
  return { fired: fieldKeys.size > 0, fieldKeys: [...fieldKeys] };
}

/**
 * `salary.payment_frequency_must_be_monthly`: a stated non-monthly basic
 * salary frequency fires; an absent frequency (readable coverage recorded)
 * fires as a clarification-backed concern; unreadable coverage never fires.
 */
function evaluatePaymentFrequency(sides: readonly ReconciledSide[]): TriggerOutcome {
  const fieldKeys = new Set<string>();
  for (const side of sides) {
    for (const field of side.fields) {
      if (field.fieldKey !== 'payment_frequency') continue;
      if (field.state === 'present' && field.value?.kind === 'text' && field.value.text.toLowerCase() !== 'monthly') {
        fieldKeys.add(field.fieldKey);
      } else if (field.state === 'absent') {
        fieldKeys.add(field.fieldKey);
      }
    }
  }
  return { fired: fieldKeys.size > 0, fieldKeys: [...fieldKeys] };
}

/**
 * `salary.stated_total_must_match_components`: within one document, the
 * stated total must equal basic salary plus itemized allowances (minor-unit
 * math, per-currency). Fires when a checkable document shows a gap.
 */
function evaluateStatedTotal(sides: readonly ReconciledSide[]): TriggerOutcome {
  const fieldKeys = new Set<string>();
  for (const side of sides) {
    const gap = statedTotalGap(side);
    if (gap) fieldKeys.add(gap);
  }
  return { fired: fieldKeys.size > 0, fieldKeys: [...fieldKeys] };
}

/** Returns the triggering field key when the document's totals disagree. */
function statedTotalGap(side: ReconciledSide): string | null {
  const totals = side.fields.filter(
    (field) => field.fieldKey === 'stated_total_pay' && field.state === 'present' && field.value?.kind === 'money',
  );
  const basics = side.fields.filter(
    (field) => field.fieldKey === 'basic_salary' && field.state === 'present' && field.value?.kind === 'money',
  );
  const allowances = side.fields.filter(
    (field) => field.fieldKey === 'allowance_item' && field.state === 'present' && field.value?.kind === 'money',
  );
  if (totals.length === 0 || basics.length === 0) return null;

  for (const total of totals as ReadonlyArray<{ value: MoneyValue }>) {
    const currency = total.value.currency;
    if (!currency) continue;
    const totalMinor = parseDecimalToMinorUnits(total.value.amount);
    if (totalMinor === null) continue;

    const basic = basics
      .map((field) => field.value as MoneyValue)
      .filter((value) => value.currency === currency)
      .map((value) => parseDecimalToMinorUnits(value.amount));
    const allowance = allowances
      .map((field) => field.value as MoneyValue)
      .filter((value) => value.currency === currency)
      .map((value) => parseDecimalToMinorUnits(value.amount));
    // An unparseable amount makes the check untestable, not failing.
    if (basic.some((amount) => amount === null) || allowance.some((amount) => amount === null)) continue;

    const basicAmounts = basic.filter((amount): amount is number => amount !== null);
    const allowanceAmounts = allowance.filter((amount): amount is number => amount !== null);
    // A total in a currency with no stated basic salary cannot be checked —
    // uncheckable is not a mismatch (unlike currencies are never equated).
    if (basicAmounts.length === 0) continue;
    const sum =
      basicAmounts.reduce((accumulator, amount) => accumulator + amount, 0) +
      allowanceAmounts.reduce((accumulator, amount) => accumulator + amount, 0);
    if (sum !== totalMinor) return 'stated_total_pay';
  }
  return null;
}
