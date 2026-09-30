import { describe, expect, it } from 'vitest';

import { canonicalJson } from '../../src/contracts/index.js';

describe('canonical JSON serializer', () => {
  it('is independent of object key order at every nesting level', () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
    expect(canonicalJson({ x: { d: 1, c: 2 }, a: [] })).toBe(canonicalJson({ a: [], x: { c: 2, d: 1 } }));
  });

  it('produces the exact documented byte form', () => {
    expect(canonicalJson({ b: '2', a: [1, null, true], c: null })).toBe(
      '{"a":[1,null,true],"b":"2","c":null}',
    );
    // 'A' (65) sorts before 'a' (97) — UTF-16 code-unit order.
    expect(canonicalJson({ a: 1, A: 2 })).toBe('{"A":2,"a":1}');
  });

  it('treats array order as significant data', () => {
    expect(canonicalJson([1, 2])).not.toBe(canonicalJson([2, 1]));
    expect(canonicalJson([1, 2])).toBe('[1,2]');
  });

  it('escapes strings with standard JSON escaping', () => {
    expect(canonicalJson({ k: 'quote " backslash \\ newline \n' })).toBe(
      '{"k":"quote \\" backslash \\\\ newline \\n"}',
    );
  });

  it('round-trips through JSON.parse preserving structure and values', () => {
    const value = {
      z: 0,
      a: [{ nested: 'x', list: [true, false, null] }],
      m: { deep: { deeper: '∞ ünïcode' } },
    };
    expect(JSON.parse(canonicalJson(value))).toEqual(value);
  });

  it('rejects non-JSON and non-plain data', () => {
    expect(() => canonicalJson(Number.NaN)).toThrow();
    expect(() => canonicalJson(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => canonicalJson(1.5)).toThrow();
    expect(() => canonicalJson({ ok: 'x', stray: undefined })).toThrow();
    expect(() => canonicalJson(() => 1)).toThrow();
    expect(() => canonicalJson(new Date())).toThrow();
    expect(() => canonicalJson([1, undefined])).toThrow();
  });

  it('rejects cyclic structures', () => {
    const cyclic: Record<string, unknown> = { a: 1 };
    cyclic.self = cyclic;
    expect(() => canonicalJson(cyclic)).toThrow();
  });
});
