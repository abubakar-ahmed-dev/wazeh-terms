import { describe, expect, it } from 'vitest';

import { WEB_NAME, WEB_VERSION } from './version';

describe('phase 01 smoke', () => {
  it('exposes placeholder identity exports', () => {
    expect(WEB_NAME).toBe('wazeh-terms-web');
    expect(WEB_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
