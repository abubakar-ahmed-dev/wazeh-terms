/**
 * Controlled vocabularies from docs/DATABASE_SCHEMA.md §2 — Sanity-side
 * fields over the pure lists in `registry-mirror.ts`. The programmatic
 * content gate re-checks every value server-side.
 */
import { defineField } from 'sanity';

import {
  AUTHORITY_TYPE,
  EVIDENCE_CLASS,
  JURISDICTION,
  MEDIA_TYPE,
  RECORD_STATUS,
  REVIEW_STATUS,
  RULE_KIND,
  SOURCE_KIND,
} from './registry-mirror';

export {
  AUTHORITY_TYPE,
  EVIDENCE_CLASS,
  EMPLOYMENT_REGIME,
  JURISDICTION,
  MEDIA_TYPE,
  PARTY,
  RECORD_STATUS,
  REVIEW_STATUS,
  RULE_KIND,
  SOURCE_KIND,
  WORKER_CATEGORY,
} from './registry-mirror';

export function enumField(
  name: string,
  title: string,
  values: readonly string[],
): ReturnType<typeof defineField> {
  return defineField({
    name,
    title,
    type: 'string',
    options: { list: values.map((value) => ({ title: value, value })) },
    validation: (rule) => rule.required(),
  });
}

export const schemaVersionField = defineField({
  name: 'schemaVersion',
  title: 'Schema version',
  type: 'number',
  initialValue: 1,
  validation: (rule) => rule.required().min(1),
});
