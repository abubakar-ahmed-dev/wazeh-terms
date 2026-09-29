/**
 * `authority` — one issuing organization (docs/DATABASE_SCHEMA.md §4).
 * Studio-side requiredness only; cross-record rules live in the content gate.
 */
import { defineField, defineType } from 'sanity';

import { AUTHORITY_TYPE, JURISDICTION, REVIEW_STATUS, enumField, schemaVersionField } from './enums';

export default defineType({
  name: 'authority',
  title: 'Authority',
  type: 'document',
  fields: [
    defineField({ name: 'authorityKey', title: 'Authority key', type: 'string', validation: (rule) => rule.required().regex(/^[a-z0-9][a-z0-9_-]{1,63}$/) }),
    defineField({ name: 'name', title: 'Official English name', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'shortName', title: 'Short name', type: 'string' }),
    enumField('jurisdiction', 'Jurisdiction', JURISDICTION),
    enumField('authorityType', 'Authority type', AUTHORITY_TYPE),
    defineField({ name: 'officialDomains', title: 'Official domains', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'officialHomepage', title: 'Official homepage', type: 'url' }),
    enumField('reviewStatus', 'Review status', REVIEW_STATUS),
    defineField({ name: 'reviewedAt', title: 'Reviewed at', type: 'datetime', validation: (rule) => rule.required() }),
    defineField({ name: 'reviewerCode', title: 'Reviewer code (public-safe)', type: 'string', validation: (rule) => rule.required() }),
    schemaVersionField,
  ],
});
