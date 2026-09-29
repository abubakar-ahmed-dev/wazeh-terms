import { describe, expect, it } from 'vitest';

import { compareDocuments } from '../../src/compare/index.js';
import { document, field, money } from './helpers.js';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

describe('single document', () => {
  it('comparison is not applicable with zero findings', () => {
    const offer = document('offer', [field('basic_salary', 'present', money(), { quote: 'q' })]);
    const result = compareDocuments({ offer });
    expect(result.comparisonApplicable).toBe(false);
    expect(result.findings).toEqual([]);
    expect(result.checkedFieldKeys).toEqual([]);
  });

  it('no documents at all is also not applicable', () => {
    const result = compareDocuments({});
    expect(result.comparisonApplicable).toBe(false);
    expect(result.findings).toEqual([]);
  });
});

describe('module purity (zero I/O dependencies)', () => {
  it('compare/ imports no fs, env, network, or provider modules', () => {
    const dir = path.resolve(__dirname, '../../src/compare');
    const files = readdirSync(dir).filter((name) => name.endsWith('.ts'));
    expect(files.length).toBeGreaterThanOrEqual(6);

    for (const name of files) {
      const source = readFileSync(path.join(dir, name), 'utf8');
      for (const banned of ['node:fs', 'node:env', 'node:http', 'node:net', '@google/genai', 'dotenv', 'express', 'pdf-lib', 'pdfjs-dist']) {
        expect(source.includes(banned), `${name} must not import ${banned}`).toBe(false);
      }
      // Only contracts + sibling compare modules may be imported.
      const imports = [...source.matchAll(/from '([^']+)'/g)].map((match) => match[1]!);
      for (const specifier of imports) {
        expect(
          specifier.startsWith('.') || specifier.startsWith('../contracts/'),
          `${name} imports unexpected module ${specifier}`,
        ).toBe(true);
      }
    }
  });
});
