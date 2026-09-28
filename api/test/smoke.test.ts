import { describe, expect, it } from 'vitest';

import { API_NAME, API_VERSION } from '../src/version.js';

describe('phase 01 smoke', () => {
  it('exposes placeholder identity exports', () => {
    expect(API_NAME).toBe('wazeh-terms-api');
    expect(API_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
