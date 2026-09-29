/**
 * Trigger predicate unit suite (plans/phase-10 §Test list item 9): pure
 * document-state predicates — no model, no I/O.
 */
import { describe, expect, it } from 'vitest';

import { evaluateTriggers, type ReconciledSide } from '../../src/services/eligibility/triggers.js';
import { field, money } from '../phase-05/helpers.js';

const side = (fields: ReconciledSide['fields']): ReconciledSide => ({ fields });

describe('worker_charge.payer_must_be_uae_employer', () => {
  it('fires when a charge is worker-paid', () => {
    const result = evaluateTriggers(
      side([field('visa_cost', 'present', money({ amount: '500.00', component: 'worker_charge', payer: 'worker' }))]),
    );
    expect(result.workerChargePayer.fired).toBe(true);
    expect(result.workerChargePayer.fieldKeys).toContain('visa_cost');
  });

  it('fires when the payer is not established (null)', () => {
    const result = evaluateTriggers(
      side([field('recruitment_cost', 'present', money({ amount: '900.00', component: 'worker_charge', payer: null }))]),
    );
    expect(result.workerChargePayer.fired).toBe(true);
  });

  it('fires when the payer is stated as unknown', () => {
    const result = evaluateTriggers(
      side([field('travel_cost', 'present', money({ amount: '120.00', component: 'worker_charge', payer: 'unknown' }))]),
    );
    expect(result.workerChargePayer.fired).toBe(true);
  });

  it('does not fire when the UAE employer carries the charge', () => {
    const result = evaluateTriggers(
      side([field('visa_cost', 'present', money({ amount: '500.00', component: 'worker_charge', payer: 'uae_employer' }))]),
    );
    expect(result.workerChargePayer.fired).toBe(false);
  });

  it('does not fire on absent or unreadable charge fields', () => {
    const result = evaluateTriggers(
      side([
        field('visa_cost', 'absent', null),
        field('travel_cost', 'unreadable', null),
      ]),
    );
    expect(result.workerChargePayer.fired).toBe(false);
  });

  it('does not conflate a Pakistan-recruiter payer with the UAE employer concern', () => {
    // Recorded distinctly downstream; the UAE-employer trigger does not fire
    // on a Pakistan-side actor (root CLAUDE.md: keep the sides distinct).
    const result = evaluateTriggers(
      side([field('recruitment_cost', 'present', money({ amount: '400.00', component: 'worker_charge', payer: 'pakistan_recruiter' }))]),
    );
    expect(result.workerChargePayer.fired).toBe(false);
  });
});

describe('salary.payment_frequency_must_be_monthly', () => {
  it('fires on a stated non-monthly frequency', () => {
    const result = evaluateTriggers(
      side([field('payment_frequency', 'present', { kind: 'text', text: 'per contract milestone' })]),
    );
    expect(result.paymentFrequencyMonthly.fired).toBe(true);
  });

  it('fires on absent frequency with readable coverage', () => {
    const result = evaluateTriggers(side([field('payment_frequency', 'absent', null)]));
    expect(result.paymentFrequencyMonthly.fired).toBe(true);
  });

  it('never fires on unreadable coverage', () => {
    const result = evaluateTriggers(side([field('payment_frequency', 'unreadable', null)]));
    expect(result.paymentFrequencyMonthly.fired).toBe(false);
  });

  it('does not fire on monthly', () => {
    const result = evaluateTriggers(side([field('payment_frequency', 'present', { kind: 'text', text: 'Monthly' })]));
    expect(result.paymentFrequencyMonthly.fired).toBe(false);
  });
});

describe('salary.stated_total_must_match_components', () => {
  const salaryDocument = (total: string, allowances: string[]): ReconciledSide =>
    side([
      field('basic_salary', 'present', money({ amount: '1000.00', component: 'basic_salary' })),
      ...allowances.map((amount, index) =>
        field('allowance_item', 'present', money({ amount, component: 'allowance' }), {
          conditions: { instanceId: `allowance_item:${index}` },
        }),
      ),
      field('stated_total_pay', 'present', money({ amount: total, component: 'stated_total' })),
    ]);

  it('fires when total does not equal basic plus allowances', () => {
    const result = evaluateTriggers(salaryDocument('1600.00', ['400.00', '250.00']));
    expect(result.statedTotalMatchesComponents.fired).toBe(true);
    expect(result.statedTotalMatchesComponents.fieldKeys).toContain('stated_total_pay');
  });

  it('does not fire when the arithmetic holds', () => {
    const result = evaluateTriggers(salaryDocument('1650.00', ['400.00', '250.00']));
    expect(result.statedTotalMatchesComponents.fired).toBe(false);
  });

  it('checks per currency and never equates unlike currencies', () => {
    const mixed = side([
      field('basic_salary', 'present', money({ amount: '1000.00', currency: 'AED', component: 'basic_salary' })),
      field('stated_total_pay', 'present', money({ amount: '1000.00', currency: 'USD', component: 'stated_total' })),
    ]);
    const result = evaluateTriggers(mixed);
    // No checkable same-currency total pair → not checkable → no fire.
    expect(result.statedTotalMatchesComponents.fired).toBe(false);
    expect(result.machineConditions.totalComponentsCheckable).toBe(false);
  });

  it('does not fire without a stated total to check', () => {
    const result = evaluateTriggers(side([field('basic_salary', 'present', money({ amount: '1000.00' }))]));
    expect(result.statedTotalMatchesComponents.fired).toBe(false);
  });
});

describe('machine condition context', () => {
  it('reports charge presence, payer statement, and frequency coverage', () => {
    const result = evaluateTriggers(
      side([
        field('visa_cost', 'present', money({ component: 'worker_charge', payer: 'worker' })),
        field('payment_frequency', 'present', { kind: 'text', text: 'monthly' }),
      ]),
    );
    expect(result.machineConditions).toEqual({
      chargeClassPresent: true,
      chargePayerStated: true,
      frequencyCovered: true,
      totalComponentsCheckable: false,
    });
  });
});
