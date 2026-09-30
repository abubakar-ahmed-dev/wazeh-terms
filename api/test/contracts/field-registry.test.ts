import { describe, expect, it } from 'vitest';

import {
  FIELD_DEFINITIONS,
  FIELD_GROUP_KEYS,
  FIELD_GROUP_LABELS,
  FIELD_KEYS,
  FieldKeySchema,
  getFieldKeysForGroup,
  type ComparisonStrategyKey,
  type ValueKind,
} from '../../src/contracts/index.js';

/** Exact keys and order from docs/DATABASE_SCHEMA.md §7. */
const EXPECTED_KEYS: readonly string[] = [
  'employer_name',
  'job_title',
  'work_location',
  'basic_salary',
  'allowance_item',
  'stated_total_pay',
  'payment_frequency',
  'start_date',
  'contract_duration',
  'renewal_terms',
  'probation_period',
  'ordinary_hours',
  'overtime_terms',
  'notice_terms',
  'termination_terms',
  'deduction_item',
  'other_worker_charge',
  'recruitment_cost',
  'visa_cost',
  'residency_cost',
  'medical_cost',
  'travel_cost',
  'accommodation_benefit',
  'food_benefit',
  'transport_benefit',
  'medical_benefit',
  'return_ticket_benefit',
  'document_language',
  'signature_presence',
  'document_date',
  'document_reference',
  'verification_reference',
  'annex_reference',
];

const ALL_VALUE_KINDS: readonly ValueKind[] = [
  'text',
  'money',
  'date',
  'duration',
  'benefit_state',
  'boolean',
  'reference_text',
];

const ALL_STRATEGIES: readonly ComparisonStrategyKey[] = [
  'text_equality',
  'money_equality',
  'date_equality',
  'duration_equality',
  'benefit_state_equality',
  'boolean_equality',
  'reference_text_equality',
];

describe('field registry', () => {
  it('defines exactly the 33 documented keys in documented order', () => {
    expect(FIELD_DEFINITIONS).toHaveLength(33);
    expect(FIELD_KEYS).toEqual(EXPECTED_KEYS);
  });

  it('maps every key into exactly one of the 12 groups', () => {
    expect(FIELD_GROUP_KEYS).toHaveLength(12);
    expect(new Set(Object.keys(FIELD_GROUP_LABELS))).toEqual(new Set(FIELD_GROUP_KEYS));
    for (const group of FIELD_GROUP_KEYS) {
      expect(getFieldKeysForGroup(group).length, `group ${group}`).toBeGreaterThan(0);
    }
    const totalInGroups = FIELD_GROUP_KEYS.reduce(
      (sum, group) => sum + getFieldKeysForGroup(group).length,
      0,
    );
    expect(totalInGroups).toBe(33);
  });

  it('flags only allowance_item and deduction_item as repeatable', () => {
    const repeatable = FIELD_DEFINITIONS.filter((f) => f.repeatable).map((f) => f.fieldKey);
    expect(repeatable).toEqual(['allowance_item', 'deduction_item']);
  });

  it('uses known value kinds and strategy keys only', () => {
    for (const field of FIELD_DEFINITIONS) {
      expect(ALL_VALUE_KINDS, field.fieldKey).toContain(field.valueKind);
      expect(ALL_STRATEGIES, field.fieldKey).toContain(field.comparisonStrategyKey);
    }
  });

  it('ties money fields to a component and leaves other kinds without one', () => {
    for (const field of FIELD_DEFINITIONS) {
      if (field.valueKind === 'money') {
        expect(field.expectedMoneyComponent, field.fieldKey).not.toBeNull();
      } else {
        expect(field.expectedMoneyComponent, field.fieldKey).toBeNull();
      }
    }
    expect(FIELD_DEFINITIONS.find((f) => f.fieldKey === 'basic_salary')?.expectedMoneyComponent).toBe('basic_salary');
    expect(FIELD_DEFINITIONS.find((f) => f.fieldKey === 'allowance_item')?.expectedMoneyComponent).toBe('allowance');
    expect(FIELD_DEFINITIONS.find((f) => f.fieldKey === 'stated_total_pay')?.expectedMoneyComponent).toBe('stated_total');
    expect(FIELD_DEFINITIONS.find((f) => f.fieldKey === 'deduction_item')?.expectedMoneyComponent).toBe('worker_charge');
    expect(FIELD_DEFINITIONS.find((f) => f.fieldKey === 'other_worker_charge')?.expectedMoneyComponent).toBe('worker_charge');
    expect(FIELD_DEFINITIONS.find((f) => f.fieldKey === 'travel_cost')?.expectedMoneyComponent).toBe('worker_charge');
  });

  it('rejects keys that are not in the registry', () => {
    expect(FieldKeySchema.safeParse('basic_salary').success).toBe(true);
    expect(FieldKeySchema.safeParse('monthly_wage').success).toBe(false);
    expect(FieldKeySchema.safeParse('').success).toBe(false);
  });

  it('flags exactly the eight material keys as importantIfAbsent', () => {
    const flagged = FIELD_DEFINITIONS.filter((f) => f.importantIfAbsent).map((f) => f.fieldKey);
    expect(flagged).toEqual([
      'basic_salary',
      'stated_total_pay',
      'payment_frequency',
      'start_date',
      'contract_duration',
      'ordinary_hours',
      'notice_terms',
      'signature_presence',
    ]);
  });
});
