/**
 * Pure value lists shared by the Studio schema and the programmatic content
 * gate — deliberately free of any `sanity` imports so the gate (which runs
 * under the api workspace) can import them without the Studio toolchain.
 *
 * The field-key and strategy lists mirror `api/src/contracts/field-registry.ts`;
 * the gate asserts the mirror never drifts.
 */

export const JURISDICTION = ['PK', 'AE', 'international'] as const;
export const EMPLOYMENT_REGIME = ['uae_mainland_private', 'unknown', 'other'] as const;
export const WORKER_CATEGORY = ['non_domestic', 'domestic', 'unknown'] as const;
export const PARTY = ['worker', 'uae_employer', 'pakistan_recruiter', 'other', 'unknown'] as const;
export const REVIEW_STATUS = ['draft', 'approved', 'rejected'] as const;
export const RECORD_STATUS = ['current', 'superseded', 'historical', 'withdrawn'] as const;
export const EVIDENCE_CLASS = [
  'binding_official_rule',
  'official_guidance',
  'international_guidance',
] as const;
export const AUTHORITY_TYPE = ['government', 'intergovernmental', 'other_authorized'] as const;
export const SOURCE_KIND = [
  'law',
  'regulation',
  'official_guidance',
  'international_guidance',
  'other_authorized',
] as const;
export const MEDIA_TYPE = ['web_page', 'pdf', 'other'] as const;
export const RULE_KIND = ['obligation', 'prohibition', 'entitlement', 'guidance'] as const;

export const STUDIO_FIELD_KEYS = [
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
] as const;

export const STUDIO_COMPARISON_STRATEGIES = [
  'text_equality',
  'money_equality',
  'date_equality',
  'duration_equality',
  'benefit_state_equality',
  'boolean_equality',
  'reference_text_equality',
] as const;

export const STUDIO_VALUE_KINDS = [
  'text',
  'money',
  'date',
  'duration',
  'benefit_state',
  'boolean',
  'reference_text',
] as const;
