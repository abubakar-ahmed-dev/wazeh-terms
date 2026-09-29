/**
 * Code-owned `triggerKey` allowlist (docs/DATABASE_SCHEMA.md §6): a rule may
 * carry a trigger only when its key appears here, and each entry documents
 * the deterministic predicate Phase 10 implements and tests. Editors can
 * never invent triggers; the content gate re-checks this list server-side.
 */
export interface TriggerKeyDefinition {
  readonly key: string;
  readonly topic: string;
  /** The code predicate Phase 10 must implement for this trigger. */
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
