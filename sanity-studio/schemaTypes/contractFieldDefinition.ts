/**
 * `contractFieldDefinition` — display/extraction metadata for the registry
 * keys (docs/DATABASE_SCHEMA.md §7). Key/strategy lists come from
 * `registry-mirror.ts` (mirroring the api registry; the gate asserts sync).
 */
import { defineField, defineType } from 'sanity';

import { RECORD_STATUS, REVIEW_STATUS, enumField, schemaVersionField } from './enums';
import { STUDIO_COMPARISON_STRATEGIES, STUDIO_FIELD_KEYS, STUDIO_VALUE_KINDS } from './registry-mirror';

const FIELD_GROUP_KEYS = [
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

export default defineType({
  name: 'contractFieldDefinition',
  title: 'Contract field definition',
  type: 'document',
  fields: [
    defineField({
      name: 'fieldKey',
      title: 'Field key',
      type: 'string',
      options: { list: STUDIO_FIELD_KEYS.map((value) => ({ title: value, value })) } as never,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'groupKey',
      title: 'Group key',
      type: 'string',
      options: { list: FIELD_GROUP_KEYS.map((value) => ({ title: value, value })) } as never,
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'label', title: 'English label', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'valueKind',
      title: 'Value kind',
      type: 'string',
      options: { list: STUDIO_VALUE_KINDS.map((value) => ({ title: value, value })) } as never,
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'acceptedLabels', title: 'Accepted labels (hints)', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'comparisonStrategyKey',
      title: 'Comparison strategy',
      type: 'string',
      options: { list: STUDIO_COMPARISON_STRATEGIES.map((value) => ({ title: value, value })) } as never,
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'importantIfAbsent', title: 'Important if absent', type: 'boolean', initialValue: false }),
    defineField({ name: 'relatedRuleTopics', title: 'Related rule topics', type: 'array', of: [{ type: 'string' }] }),
    enumField('recordStatus', 'Record status', RECORD_STATUS),
    enumField('reviewStatus', 'Review status', REVIEW_STATUS),
    schemaVersionField,
  ],
});
