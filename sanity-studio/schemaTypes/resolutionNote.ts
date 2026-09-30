/**
 * `resolutionNote` — documented editorial handling of conflicting or
 * superseded material (docs/DATABASE_SCHEMA.md §8). Draft notes resolve
 * nothing; the gate only checks shape and references.
 */
import { defineField, defineType } from 'sanity';

import { REVIEW_STATUS, enumField, schemaVersionField } from './enums';

const referenceTo = (type: string) => [{ type }];

export default defineType({
  name: 'resolutionNote',
  title: 'Resolution note',
  type: 'document',
  fields: [
    defineField({ name: 'resolutionKey', title: 'Resolution key', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'affectedRules', title: 'Affected rules', type: 'array', of: [{ type: 'reference', to: referenceTo('rule') }] }),
    defineField({ name: 'affectedSources', title: 'Affected sources', type: 'array', of: [{ type: 'reference', to: referenceTo('sourceDocument') }] }),
    defineField({ name: 'claimsInConflict', title: 'Claims in conflict', type: 'array', of: [{ type: 'string' }], validation: (rule) => rule.required().min(1) }),
    defineField({ name: 'selectedTreatment', title: 'Selected treatment', type: 'text', validation: (rule) => rule.required() }),
    defineField({ name: 'reasoning', title: 'Reasoning', type: 'text', validation: (rule) => rule.required() }),
    defineField({ name: 'reviewedAt', title: 'Reviewed at', type: 'datetime', validation: (rule) => rule.required() }),
    defineField({ name: 'reviewerCode', title: 'Reviewer code (public-safe)', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'nextReviewAt', title: 'Next review', type: 'date' }),
    enumField('reviewStatus', 'Review status', REVIEW_STATUS),
    schemaVersionField,
  ],
});
