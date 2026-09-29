/**
 * `rule` — one narrow reviewed proposition at one revision
 * (docs/DATABASE_SCHEMA.md §6). `ruleKey`+`revision` unique; trigger keys
 * restricted to the code-owned allowlist; claimable scope fields exclude
 * `unknown` (a claimable rule must be explicit).
 */
import { defineField, defineType } from 'sanity';

import {
  EVIDENCE_CLASS,
  JURISDICTION,
  PARTY,
  RECORD_STATUS,
  REVIEW_STATUS,
  RULE_KIND,
  enumField,
  schemaVersionField,
} from './enums';
import { TRIGGER_KEY_VALUES } from './trigger-keys';

const referenceTo = (type: string) => [{ type }];

const EMPLOYMENT_REGIME_CLAIMABLE = ['uae_mainland_private'] as const;
const WORKER_CATEGORY_CLAIMABLE = ['non_domestic'] as const;
const PARTY_CLAIMABLE = ['worker', 'uae_employer', 'pakistan_recruiter', 'other'] as const;

export default defineType({
  name: 'rule',
  title: 'Rule',
  type: 'document',
  fields: [
    defineField({ name: 'ruleKey', title: 'Rule key', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'revision', title: 'Revision', type: 'number', validation: (rule) => rule.required().integer().min(1) }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'claimText', title: 'Claim text', type: 'text', validation: (rule) => rule.required().max(500) }),
    defineField({ name: 'topic', title: 'Topic', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'relatedFieldKeys', title: 'Related field keys', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'triggerKey',
      title: 'Trigger key (code-owned allowlist)',
      type: 'string',
      options: { list: TRIGGER_KEY_VALUES.map((value) => ({ title: value, value })) } as never,
      description: 'Leave empty for informational/guidance rules.',
    }),
    enumField('ruleKind', 'Rule kind', RULE_KIND),
    enumField('evidenceClass', 'Evidence class', EVIDENCE_CLASS),
    enumField('jurisdiction', 'Jurisdiction', JURISDICTION),
    defineField({ name: 'origin', title: 'Origin', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'destination', title: 'Destination', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'employmentRegime',
      title: 'Employment regime',
      type: 'string',
      options: { list: EMPLOYMENT_REGIME_CLAIMABLE.map((value) => ({ title: value, value })) } as never,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'workerCategory',
      title: 'Worker category',
      type: 'string',
      options: { list: WORKER_CATEGORY_CLAIMABLE.map((value) => ({ title: value, value })) } as never,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'responsibleParty',
      title: 'Responsible party',
      type: 'string',
      options: { list: PARTY_CLAIMABLE.map((value) => ({ title: value, value })) } as never,
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'conditions', title: 'Conditions', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'exceptions', title: 'Exceptions', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'machineConditionKeys', title: 'Machine condition keys', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'effectiveFrom', title: 'Effective from', type: 'date' }),
    defineField({ name: 'effectiveTo', title: 'Effective to (exclusive)', type: 'date' }),
    defineField({ name: 'currentGuidanceVerifiedAt', title: 'Guidance verified at', type: 'datetime' }),
    defineField({ name: 'primarySource', title: 'Primary source version', type: 'reference', to: referenceTo('sourceDocument'), validation: (rule) => rule.required() }),
    defineField({
      name: 'pinpoint',
      title: 'Pinpoint',
      type: 'object',
      fields: [
        defineField({ name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required() }),
        defineField({ name: 'page', title: 'Page', type: 'number' }),
        defineField({ name: 'clause', title: 'Clause', type: 'string' }),
        defineField({ name: 'quote', title: 'Exact passage', type: 'text', validation: (rule) => rule.required() }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'supportingSources', title: 'Supporting sources', type: 'array', of: [{ type: 'reference', to: referenceTo('sourceDocument') }] }),
    defineField({ name: 'plainEnglish', title: 'Plain English', type: 'text', validation: (rule) => rule.required() }),
    defineField({ name: 'plainUrdu', title: 'Plain Urdu (gated — keep empty until validated)', type: 'text' }),
    defineField({ name: 'sourceCheckedAt', title: 'Source checked at', type: 'datetime', validation: (rule) => rule.required() }),
    defineField({ name: 'reviewedAt', title: 'Reviewed at', type: 'datetime', validation: (rule) => rule.required() }),
    defineField({ name: 'reviewerCode', title: 'Reviewer code (public-safe)', type: 'string', validation: (rule) => rule.required() }),
    enumField('recordStatus', 'Record status', RECORD_STATUS),
    enumField('reviewStatus', 'Review status', REVIEW_STATUS),
    defineField({ name: 'supersededBy', title: 'Superseded by', type: 'reference', to: referenceTo('rule') }),
    defineField({ name: 'resolutionNotes', title: 'Resolution notes', type: 'array', of: [{ type: 'reference', to: referenceTo('resolutionNote') }] }),
    schemaVersionField,
  ],
});
