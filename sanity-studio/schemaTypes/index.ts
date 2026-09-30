import type { SchemaTypeDefinition } from 'sanity';

import authority from './authority';
import contractFieldDefinition from './contractFieldDefinition';
import resolutionNote from './resolutionNote';
import rule from './rule';
import sourceDocument from './sourceDocument';

export const schemaTypes: SchemaTypeDefinition[] = [
  authority,
  sourceDocument,
  rule,
  contractFieldDefinition,
  resolutionNote,
];

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
  STUDIO_COMPARISON_STRATEGIES,
  STUDIO_FIELD_KEYS,
  STUDIO_VALUE_KINDS,
  WORKER_CATEGORY,
} from './registry-mirror';
export { TRIGGER_KEY_VALUES, TRIGGER_KEYS } from './trigger-keys';
