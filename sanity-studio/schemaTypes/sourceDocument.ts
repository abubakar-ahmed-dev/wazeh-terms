/**
 * `sourceDocument` — one identified VERSION of an official source
 * (docs/DATABASE_SCHEMA.md §5). `sourceKey`+`versionKey` form the unique
 * pair; superseded versions keep their records and link forward.
 */
import { defineField, defineType } from 'sanity';

import {
  EVIDENCE_CLASS,
  EMPLOYMENT_REGIME,
  JURISDICTION,
  MEDIA_TYPE,
  RECORD_STATUS,
  REVIEW_STATUS,
  SOURCE_KIND,
  WORKER_CATEGORY,
  enumField,
  schemaVersionField,
} from './enums';

const referenceTo = (type: string) => [{ type }];

export default defineType({
  name: 'sourceDocument',
  title: 'Source document',
  type: 'document',
  fields: [
    defineField({ name: 'sourceKey', title: 'Source key', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'versionKey', title: 'Version key', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'issuer', title: 'Issuer', type: 'reference', to: referenceTo('authority'), validation: (rule) => rule.required() }),
    enumField('jurisdiction', 'Jurisdiction', JURISDICTION),
    enumField('evidenceClass', 'Evidence class', EVIDENCE_CLASS),
    defineField({ name: 'officialUrl', title: 'Official URL', type: 'url', validation: (rule) => rule.required() }),
    defineField({ name: 'authorizedFile', title: 'Authorized file', type: 'file' }),
    enumField('sourceKind', 'Source kind', SOURCE_KIND),
    enumField('mediaType', 'Media type', MEDIA_TYPE),
    defineField({ name: 'publicationDate', title: 'Publication date', type: 'date' }),
    defineField({ name: 'effectiveFrom', title: 'Effective from', type: 'date' }),
    defineField({ name: 'effectiveTo', title: 'Effective to (exclusive)', type: 'date' }),
    defineField({ name: 'retrievedAt', title: 'Retrieved at', type: 'datetime', validation: (rule) => rule.required() }),
    defineField({ name: 'lastVerifiedAt', title: 'Last verified at', type: 'datetime', validation: (rule) => rule.required() }),
    defineField({ name: 'contentHash', title: 'Content hash (stable files)', type: 'string' }),
    defineField({ name: 'versionNote', title: 'Version note', type: 'string' }),
    defineField({
      name: 'applicableRegimes',
      title: 'Applicable regimes',
      type: 'array',
      of: [{ type: 'string', options: { list: EMPLOYMENT_REGIME.map((value) => ({ title: value, value })) } as never }],
    }),
    defineField({
      name: 'applicableCategories',
      title: 'Applicable worker categories',
      type: 'array',
      of: [{ type: 'string', options: { list: WORKER_CATEGORY.map((value) => ({ title: value, value })) } as never }],
    }),
    enumField('recordStatus', 'Record status', RECORD_STATUS),
    enumField('reviewStatus', 'Review status', REVIEW_STATUS),
    defineField({ name: 'supersededBy', title: 'Superseded by', type: 'reference', to: referenceTo('sourceDocument') }),
    defineField({ name: 'reviewedAt', title: 'Reviewed at', type: 'datetime', validation: (rule) => rule.required() }),
    defineField({ name: 'reviewerCode', title: 'Reviewer code (public-safe)', type: 'string', validation: (rule) => rule.required() }),
    schemaVersionField,
  ],
});
