/**
 * `ExtractedField` schema and state invariants from `docs/API.md` §4.2 and
 * `docs/PRD.md` §5: present/absent/unclear/unreadable are distinct states;
 * a present value carries typed data plus at least one evidence passage;
 * non-present states never carry a typed value.
 */
import { z } from 'zod';

import { EvidenceSchema } from './evidence.js';
import { getFieldDefinition, type FieldKey } from './field-registry.js';
import { NormalizedValueSchema, type NormalizedValue } from './normalized-value.js';

export const INSTANCE_ID_REGEX = /^[A-Za-z0-9_:-]{1,64}$/;

export const FieldStateSchema = z.enum(['present', 'absent', 'unclear', 'unreadable']);
export type FieldState = z.infer<typeof FieldStateSchema>;

const RawTextSchema = z.string().max(2000).nullable();

export const InstanceIdSchema = z.string().regex(INSTANCE_ID_REGEX);

const ExtractedFieldShape = z.strictObject({
  fieldKey: z.string().min(1).max(64),
  instanceId: InstanceIdSchema,
  state: FieldStateSchema,
  rawText: RawTextSchema,
  value: NormalizedValueSchema.nullable(),
  evidence: z.array(EvidenceSchema).max(20),
  qualityNotes: z.array(z.string().min(1).max(500)).max(20),
});

export type ExtractedFieldInput = z.infer<typeof ExtractedFieldShape>;

/** Minimal shape shared by extracted fields and correction deltas. */
export interface StateBearingValue {
  readonly fieldKey: string;
  readonly state: FieldState;
  readonly value: NormalizedValue | null;
}

/**
 * Value invariants shared by extracted fields and corrections:
 * 1. `present` requires a typed value; non-present states force `value: null`.
 * 2. The value's `kind` must match the registry `valueKind` for the
 *    `fieldKey` (the registry is the authority; unknown keys are rejected).
 * 3. Money values carry the registry's expected `component` for the key
 *    (e.g. `deduction_item` values are `worker_charge`, never `basic_salary`).
 */
export function refineFieldValueInvariants(
  field: StateBearingValue,
  ctx: z.RefinementCtx,
): void {
  const add = (message: string, path: (string | number)[]): void => {
    ctx.addIssue({ code: 'custom', message, path });
  };

  if (field.state === 'present') {
    if (field.value === null) {
      add('A present field requires a typed value', ['value']);
    }
  } else if (field.value !== null) {
    add(`A ${field.state} field must not carry a typed value`, ['value']);
  }

  const definition = getFieldDefinition(field.fieldKey);
  if (!definition) {
    add(`Unknown fieldKey: ${field.fieldKey}`, ['fieldKey']);
    return;
  }

  if (field.value !== null) {
    const expectedKind: string = definition.valueKind;
    if (field.value.kind !== expectedKind) {
      add(
        `fieldKey ${field.fieldKey} expects value kind ${expectedKind}, received ${field.value.kind}`,
        ['value', 'kind'],
      );
    }
    if (
      definition.expectedMoneyComponent !== null &&
      field.value.kind === 'money' &&
      field.value.component !== definition.expectedMoneyComponent
    ) {
      add(
        `fieldKey ${field.fieldKey} expects money component ${definition.expectedMoneyComponent}`,
        ['value', 'component'],
      );
    }
  }
}

/** Full extracted-field invariants: value invariants plus the evidence requirement. */
export function refineFieldStateInvariants(
  field: ExtractedFieldInput,
  ctx: z.RefinementCtx,
): void {
  refineFieldValueInvariants(field, ctx);
  if (field.state === 'present' && field.evidence.length < 1) {
    ctx.addIssue({
      code: 'custom',
      message: 'A present field requires at least one evidence passage',
      path: ['evidence'],
    });
  }
}

export const ExtractedFieldSchema = ExtractedFieldShape.superRefine(refineFieldStateInvariants);

export type ExtractedField = z.infer<typeof ExtractedFieldSchema>;
export type { FieldKey };
