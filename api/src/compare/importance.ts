/**
 * Default finding importance per field (docs/API.md §6): ordering inside a
 * category only — never a red/yellow/green verdict
 * (docs/FRONTEND_SPECIFICATION.md §4.7).
 */
import type { FieldKey } from '../contracts/index.js';

const HIGH_IMPORTANCE_KEYS: ReadonlySet<string> = new Set<string>([
  'basic_salary',
  'allowance_item',
  'stated_total_pay',
  'payment_frequency',
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
]);

export function defaultImportance(fieldKey: FieldKey | string): 'high' | 'medium' {
  return HIGH_IMPORTANCE_KEYS.has(fieldKey) ? 'high' : 'medium';
}
