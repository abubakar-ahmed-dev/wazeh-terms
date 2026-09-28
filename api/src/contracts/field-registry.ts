/**
 * Code-owned field registry: the 12 groups and 33 active `fieldKey`
 * components from `docs/DATABASE_SCHEMA.md` §7.
 *
 * This registry is the authority for which components may appear in an
 * `ExtractedField`. Studio content (`contractFieldDefinition` records) can
 * only supply labels/hints for keys that already exist here — it can never
 * add, remove, or re-type a key. Comparison strategies are named here but
 * implemented in Phase 05 (`api/src/compare/`).
 */
import { z } from 'zod';

export const FIELD_GROUP_KEYS = [
  'employer',
  'occupation',
  'location',
  'pay',
  'term',
  'probation',
  'working_time',
  'ending_terms',
  'deductions',
  'recruitment_and_travel_costs',
  'benefits',
  'document_details',
] as const;

export type FieldGroupKey = (typeof FIELD_GROUP_KEYS)[number];

export const FIELD_GROUP_LABELS: Readonly<Record<FieldGroupKey, string>> = {
  employer: 'Employer',
  occupation: 'Occupation',
  location: 'Work location',
  pay: 'Pay',
  term: 'Term',
  probation: 'Probation',
  working_time: 'Working time',
  ending_terms: 'Ending terms',
  deductions: 'Deductions and worker charges',
  recruitment_and_travel_costs: 'Recruitment and travel costs',
  benefits: 'Benefits',
  document_details: 'Document details',
};

export type ValueKind =
  | 'text'
  | 'money'
  | 'date'
  | 'duration'
  | 'benefit_state'
  | 'boolean'
  | 'reference_text';

export type ComparisonStrategyKey =
  | 'text_equality'
  | 'money_equality'
  | 'date_equality'
  | 'duration_equality'
  | 'benefit_state_equality'
  | 'boolean_equality'
  | 'reference_text_equality';

export type MoneyComponent =
  | 'basic_salary'
  | 'allowance'
  | 'stated_total'
  | 'worker_charge';

/**
 * The schema-level `valueKind: "charge"` from `docs/DATABASE_SCHEMA.md` §7 is
 * represented at runtime as the `money` union with
 * `component: "worker_charge"` (documented mapping). The registry records the
 * expected money component so validation can tie a field's value shape to its
 * declared kind.
 */
export interface FieldDefinition {
  readonly fieldKey: string;
  readonly groupKey: FieldGroupKey;
  readonly label: string;
  readonly valueKind: ValueKind;
  readonly comparisonStrategyKey: ComparisonStrategyKey;
  readonly repeatable: boolean;
  /** Non-null only for `valueKind: "money"` fields. */
  readonly expectedMoneyComponent: MoneyComponent | null;
}

const text = (
  fieldKey: string,
  groupKey: FieldGroupKey,
  label: string,
): FieldDefinition => ({
  fieldKey,
  groupKey,
  label,
  valueKind: 'text',
  comparisonStrategyKey: 'text_equality',
  repeatable: false,
  expectedMoneyComponent: null,
});

const money = (
  fieldKey: string,
  groupKey: FieldGroupKey,
  label: string,
  component: MoneyComponent,
  repeatable = false,
): FieldDefinition => ({
  fieldKey,
  groupKey,
  label,
  valueKind: 'money',
  comparisonStrategyKey: 'money_equality',
  repeatable,
  expectedMoneyComponent: component,
});

export const FIELD_DEFINITIONS: readonly FieldDefinition[] = [
  text('employer_name', 'employer', 'Employer name'),
  text('job_title', 'occupation', 'Job title or occupation'),
  text('work_location', 'location', 'Work location'),
  money('basic_salary', 'pay', 'Basic salary', 'basic_salary'),
  money('allowance_item', 'pay', 'Allowance item', 'allowance', true),
  money('stated_total_pay', 'pay', 'Stated total pay', 'stated_total'),
  text('payment_frequency', 'pay', 'Payment frequency'),
  {
    fieldKey: 'start_date',
    groupKey: 'term',
    label: 'Start date',
    valueKind: 'date',
    comparisonStrategyKey: 'date_equality',
    repeatable: false,
    expectedMoneyComponent: null,
  },
  {
    fieldKey: 'contract_duration',
    groupKey: 'term',
    label: 'Contract duration',
    valueKind: 'duration',
    comparisonStrategyKey: 'duration_equality',
    repeatable: false,
    expectedMoneyComponent: null,
  },
  text('renewal_terms', 'term', 'Renewal wording'),
  {
    fieldKey: 'probation_period',
    groupKey: 'probation',
    label: 'Probation period',
    valueKind: 'duration',
    comparisonStrategyKey: 'duration_equality',
    repeatable: false,
    expectedMoneyComponent: null,
  },
  text('ordinary_hours', 'working_time', 'Ordinary working hours'),
  text('overtime_terms', 'working_time', 'Overtime wording'),
  text('notice_terms', 'ending_terms', 'Notice terms'),
  text('termination_terms', 'ending_terms', 'Termination wording'),
  money('deduction_item', 'deductions', 'Deduction item', 'worker_charge', true),
  money('other_worker_charge', 'deductions', 'Other worker charge', 'worker_charge'),
  money('recruitment_cost', 'recruitment_and_travel_costs', 'Recruitment cost', 'worker_charge'),
  money('visa_cost', 'recruitment_and_travel_costs', 'Visa or residency charge', 'worker_charge'),
  money('residency_cost', 'recruitment_and_travel_costs', 'Residency cost', 'worker_charge'),
  money('medical_cost', 'recruitment_and_travel_costs', 'Medical cost', 'worker_charge'),
  money('travel_cost', 'recruitment_and_travel_costs', 'Travel cost', 'worker_charge'),
  {
    fieldKey: 'accommodation_benefit',
    groupKey: 'benefits',
    label: 'Accommodation benefit',
    valueKind: 'benefit_state',
    comparisonStrategyKey: 'benefit_state_equality',
    repeatable: false,
    expectedMoneyComponent: null,
  },
  {
    fieldKey: 'food_benefit',
    groupKey: 'benefits',
    label: 'Food benefit',
    valueKind: 'benefit_state',
    comparisonStrategyKey: 'benefit_state_equality',
    repeatable: false,
    expectedMoneyComponent: null,
  },
  {
    fieldKey: 'transport_benefit',
    groupKey: 'benefits',
    label: 'Transport benefit',
    valueKind: 'benefit_state',
    comparisonStrategyKey: 'benefit_state_equality',
    repeatable: false,
    expectedMoneyComponent: null,
  },
  {
    fieldKey: 'medical_benefit',
    groupKey: 'benefits',
    label: 'Medical coverage benefit',
    valueKind: 'benefit_state',
    comparisonStrategyKey: 'benefit_state_equality',
    repeatable: false,
    expectedMoneyComponent: null,
  },
  {
    fieldKey: 'return_ticket_benefit',
    groupKey: 'benefits',
    label: 'Travel or return ticket benefit',
    valueKind: 'benefit_state',
    comparisonStrategyKey: 'benefit_state_equality',
    repeatable: false,
    expectedMoneyComponent: null,
  },
  text('document_language', 'document_details', 'Document language'),
  {
    fieldKey: 'signature_presence',
    groupKey: 'document_details',
    label: 'Signature presence',
    valueKind: 'boolean',
    comparisonStrategyKey: 'boolean_equality',
    repeatable: false,
    expectedMoneyComponent: null,
  },
  {
    fieldKey: 'document_date',
    groupKey: 'document_details',
    label: 'Document date',
    valueKind: 'date',
    comparisonStrategyKey: 'date_equality',
    repeatable: false,
    expectedMoneyComponent: null,
  },
  {
    fieldKey: 'document_reference',
    groupKey: 'document_details',
    label: 'Document reference',
    valueKind: 'reference_text',
    comparisonStrategyKey: 'reference_text_equality',
    repeatable: false,
    expectedMoneyComponent: null,
  },
  {
    fieldKey: 'verification_reference',
    groupKey: 'document_details',
    label: 'Verification reference',
    valueKind: 'reference_text',
    comparisonStrategyKey: 'reference_text_equality',
    repeatable: false,
    expectedMoneyComponent: null,
  },
  {
    fieldKey: 'annex_reference',
    groupKey: 'document_details',
    label: 'Annex or policy reference',
    valueKind: 'reference_text',
    comparisonStrategyKey: 'reference_text_equality',
    repeatable: false,
    expectedMoneyComponent: null,
  },
];

export type FieldKey = (typeof FIELD_DEFINITIONS)[number]['fieldKey'];

export const FIELD_KEYS: readonly FieldKey[] = FIELD_DEFINITIONS.map((f) => f.fieldKey);

/** Runtime guard: only registry keys may appear in payloads. Content cannot add keys. */
export const FieldKeySchema = z.enum(FIELD_KEYS);

const definitionsByKey: ReadonlyMap<string, FieldDefinition> = new Map(
  FIELD_DEFINITIONS.map((f) => [f.fieldKey, f]),
);

export function getFieldDefinition(fieldKey: string): FieldDefinition | undefined {
  return definitionsByKey.get(fieldKey);
}

export function isKnownFieldKey(fieldKey: string): fieldKey is FieldKey {
  return definitionsByKey.has(fieldKey);
}

/** Convenience: registry entries for one group, in declared order. */
export function getFieldKeysForGroup(groupKey: FieldGroupKey): readonly FieldDefinition[] {
  return FIELD_DEFINITIONS.filter((f) => f.groupKey === groupKey);
}
