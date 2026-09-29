/**
 * Code-owned trigger registry (docs/DATABASE_SCHEMA.md §6): a rule may carry
 * an automated concern only when its `triggerKey` appears here with a
 * tested, deterministic predicate. This list mirrors
 * `sanity-studio/schemaTypes/trigger-keys.ts`; a drift test fails when the
 * two sides diverge. Editors can never invent triggers.
 */

export interface TriggerKeyDefinition {
  readonly key: string;
  /** Retrieval topic this trigger queries the Knowledge Base about. */
  readonly topic: 'worker_costs' | 'pay';
  /** The deterministic predicate implemented in `triggers.ts`. */
  readonly predicate: string;
}

export const TRIGGER_KEYS: readonly TriggerKeyDefinition[] = [
  {
    key: 'worker_charge.payer_must_be_uae_employer',
    topic: 'worker_costs',
    predicate:
      'For a UAE-mainland non-domestic hire, a recruitment/visa/residency/medical/travel charge stated in the documents must be carried by the UAE employer; a worker-paid charge of that class raises a concern.',
  },
  {
    key: 'salary.payment_frequency_must_be_monthly',
    topic: 'pay',
    predicate:
      'Both documents must state monthly payment frequency for the basic salary; a different or missing stated frequency raises a clarification-backed concern.',
  },
  {
    key: 'salary.stated_total_must_match_components',
    topic: 'pay',
    predicate:
      'The stated total monthly pay must equal basic salary plus itemized allowances within each document; an inconsistency raises a concern.',
  },
];

export const TRIGGER_KEY_VALUES: readonly string[] = TRIGGER_KEYS.map((trigger) => trigger.key);

export function triggerDefinition(key: string): TriggerKeyDefinition | undefined {
  return TRIGGER_KEYS.find((trigger) => trigger.key === key);
}

/**
 * Evaluable `machineConditionKeys` (docs/DATABASE_SCHEMA.md §6): each key a
 * rule may require, with its tested code predicate over the reconciled
 * documents. An unregistered key is unverifiable → the concern is withheld,
 * never guessed.
 */
export type MachineConditionEvaluation = boolean | 'unverifiable';

export interface MachineConditionContext {
  /** True when at least one worker-charge-class field is present. */
  readonly chargeClassPresent: boolean;
  /** True when the triggering charge field states its payer explicitly. */
  readonly chargePayerStated: boolean;
  /** True when payment frequency has readable coverage in the documents. */
  readonly frequencyCovered: boolean;
  /** True when each document's stated total could be arithmetically checked. */
  readonly totalComponentsCheckable: boolean;
}

export const MACHINE_CONDITIONS: Readonly<Record<string, (context: MachineConditionContext) => MachineConditionEvaluation>> = {
  worker_charge_class_present: (context) => context.chargeClassPresent,
  worker_charge_payer_identified: (context) => context.chargePayerStated,
  payment_frequency_covered_by_documents: (context) => context.frequencyCovered,
  stated_total_checkable_against_components: (context) => context.totalComponentsCheckable,
};
