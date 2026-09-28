/**
 * Runtime schemas for the `NormalizedValue` discriminated union from
 * `docs/API.md` §4.2.
 *
 * Money amounts are decimal strings, never JavaScript floats. Currency,
 * frequency, and payer stay null when the document does not establish them;
 * a missing member is a data-quality fact, not a default.
 */
import { z } from 'zod';

/** Hard schema ceiling; measured runtime limits come from config (Phase 03). */
export const BOUNDED_TEXT_MAX = 2000;

/** Decimal string: 1–12 integer digits, optional 1–2 fraction digits, non-negative. */
export const DECIMAL_AMOUNT_REGEX = /^\d{1,12}(\.\d{1,2})?$/;
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const BoundedTextSchema = z.string().min(1).max(BOUNDED_TEXT_MAX);

export const CurrencySchema = z.string().regex(/^[A-Z]{3}$/).nullable();
export const PaymentFrequencySchema = z
  .enum(['hourly', 'daily', 'weekly', 'monthly', 'yearly', 'per_contract'])
  .nullable();
export const MoneyComponentSchema = z.enum(['basic_salary', 'allowance', 'stated_total', 'worker_charge']);
export const PayerSchema = z
  .enum(['worker', 'uae_employer', 'pakistan_recruiter', 'other', 'unknown'])
  .nullable();
export const DurationUnitSchema = z.enum(['hour', 'day', 'week', 'month', 'year']);
export const BenefitStatusSchema = z.enum(['provided', 'not_provided', 'allowance', 'conditional']);

const DecimalAmountSchema = z.string().regex(DECIMAL_AMOUNT_REGEX);

/** Calendar-valid ISO date (`YYYY-MM-DD`), e.g. rejects `2026-02-30`. */
export const IsoDateSchema = z
  .string()
  .regex(ISO_DATE_REGEX)
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number) as [number, number, number];
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    );
  }, { message: 'Not a valid calendar date' });

export const TextValueSchema = z.strictObject({
  kind: z.literal('text'),
  text: BoundedTextSchema,
});

export const ReferenceTextValueSchema = z.strictObject({
  kind: z.literal('reference_text'),
  text: BoundedTextSchema,
});

export const MoneyValueSchema = z.strictObject({
  kind: z.literal('money'),
  amount: DecimalAmountSchema,
  currency: CurrencySchema,
  frequency: PaymentFrequencySchema,
  component: MoneyComponentSchema,
  payer: PayerSchema,
});

export const DateValueSchema = z.strictObject({
  kind: z.literal('date'),
  date: IsoDateSchema,
});

export const DurationValueSchema = z.strictObject({
  kind: z.literal('duration'),
  amount: DecimalAmountSchema,
  unit: DurationUnitSchema,
});

export const BenefitStateValueSchema = z.strictObject({
  kind: z.literal('benefit_state'),
  status: BenefitStatusSchema,
  conditions: z.string().max(1000).nullable(),
});

export const BooleanValueSchema = z.strictObject({
  kind: z.literal('boolean'),
  value: z.boolean(),
});

export const NormalizedValueSchema = z.discriminatedUnion('kind', [
  TextValueSchema,
  ReferenceTextValueSchema,
  MoneyValueSchema,
  DateValueSchema,
  DurationValueSchema,
  BenefitStateValueSchema,
  BooleanValueSchema,
]);

export type NormalizedValue = z.infer<typeof NormalizedValueSchema>;
export type MoneyValue = z.infer<typeof MoneyValueSchema>;
export type BenefitStateValue = z.infer<typeof BenefitStateValueSchema>;
