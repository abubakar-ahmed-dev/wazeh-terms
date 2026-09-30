import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { FIELD_DEFINITIONS } from '../../src/contracts/field-registry.js';
import { validateContent, type GateResult } from '../../../sanity-studio/scripts/validate-content.js';
import { STUDIO_FIELD_KEYS } from '../../../sanity-studio/schemaTypes/registry-mirror.js';
import { TRIGGER_KEY_VALUES } from '../../../sanity-studio/schemaTypes/trigger-keys.js';

const FIXTURES = path.resolve(__dirname, '../../../sanity-studio/scripts/fixtures');

function run(name: string): GateResult {
  return validateContent(JSON.parse(readFileSync(path.join(FIXTURES, name), 'utf8')));
}

function codes(result: GateResult): string[] {
  return result.findings.map((finding) => finding.code);
}

describe('programmatic content gate (docs/DATABASE_SCHEMA.md §9)', () => {
  it('passes the valid seed cleanly', () => {
    const result = run('valid-seed.json');
    expect(result.ok, JSON.stringify(result.findings)).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it('catches duplicate sourceKey+versionKey pairs', () => {
    const result = run('invalid-duplicate-key.json');
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain('natural_key');
  });

  it('catches two approved+current revisions of one ruleKey', () => {
    const result = run('invalid-two-approved.json');
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain('approved_current_uniqueness');
  });

  it('catches broken references (primarySource)', () => {
    const result = run('invalid-broken-reference.json');
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain('reference');
  });

  it('catches guidance-classed rules carrying a binding trigger', () => {
    const result = run('invalid-guidance-trigger.json');
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain('evidence_class');
  });

  it('catches approved rules without a usable pinpoint', () => {
    const result = run('invalid-missing-pinpoint.json');
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain('pinpoint');
  });

  it('catches out-of-vocabulary record statuses', () => {
    const result = run('invalid-bad-enum.json');
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain('enum');
  });

  it('catches inverted effective dates', () => {
    const result = run('invalid-date-order.json');
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain('date_order');
  });

  it('catches field keys outside the api registry', () => {
    const result = run('invalid-bad-fieldkey.json');
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain('registry');
  });

  it('catches a claimable (trigger-carrying) rule with unknown scope values', () => {
    const result = run('invalid-claimable-unknown-regime.json');
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain('scope');
  });

  it('allows unknown scope values only for informational (no-trigger) rules', () => {
    // valid-seed.json carries a fictional PK informational rule with
    // employmentRegime "unknown"; the seed passing cleanly is the assertion.
    const result = run('valid-seed.json');
    expect(result.ok, JSON.stringify(result.findings)).toBe(true);
  });

  it('rejects non-array input', () => {
    const result = validateContent({ nope: true });
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain('shape');
  });
});

describe('studio mirrors stay in sync with the code registry', () => {
  it('studio field keys equal the api registry keys in order', () => {
    expect(STUDIO_FIELD_KEYS).toEqual(FIELD_DEFINITIONS.map((field) => field.fieldKey));
  });

  it('every declared trigger key is documented with a predicate', () => {
    expect(TRIGGER_KEY_VALUES.length).toBeGreaterThanOrEqual(1);
    for (const key of TRIGGER_KEY_VALUES) {
      expect(typeof key).toBe('string');
      expect(key).toMatch(/^[a-z_]+\.[a-z_]+$/);
    }
  });
});
