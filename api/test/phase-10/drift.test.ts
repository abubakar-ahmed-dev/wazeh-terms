/**
 * Trigger-key drift guard (plans/phase-10 §Test list item 11): the api-side
 * trigger registry must list exactly the keys the Studio schema allows —
 * same enforcement pattern as the field-key registry mirror.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { TRIGGER_KEY_VALUES } from '../../src/services/eligibility/trigger-keys.js';

const STUDIO_TRIGGER_KEYS_PATH = fileURLToPath(
  new URL('../../../sanity-studio/schemaTypes/trigger-keys.ts', import.meta.url),
);

describe('trigger-key registry mirror', () => {
  it('api keys equal the Studio allowlist exactly', () => {
    const studioSource = readFileSync(STUDIO_TRIGGER_KEYS_PATH, 'utf8');
    const studioKeys = [...studioSource.matchAll(/key:\s*'([^']+)'/g)].map((match) => match[1]);
    expect(studioKeys.length).toBeGreaterThan(0);
    expect(TRIGGER_KEY_VALUES).toEqual(studioKeys);
  });

  it('every api trigger documents its predicate text', () => {
    const studioSource = readFileSync(STUDIO_TRIGGER_KEYS_PATH, 'utf8');
    for (const trigger of TRIGGER_KEY_VALUES) {
      expect(studioSource, `Studio list must contain ${trigger}`).toContain(`'${trigger}'`);
    }
  });
});
