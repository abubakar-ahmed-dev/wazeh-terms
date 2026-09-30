import { describe, expect, it } from 'vitest';
import request from 'supertest';

import { FakeGemini, testConfig } from '../phase-03/helpers.js';
import { buildApp } from '../../src/server/app.js';
import type { SampleManifest } from '../../src/content/samples-manifest.js';

const emptyManifest: SampleManifest = {
  rootDir: '/tmp',
  entries: [],
};

describe('Security: Headers & Same-Origin CORS posture (docs/SECURITY.md §4, ADR-008)', () => {
  it('attaches strict security headers to all responses', async () => {
    const config = testConfig();
    const app = buildApp({ config, gemini: new FakeGemini(), manifest: emptyManifest });

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);

    // X-Content-Type-Options: nosniff
    expect(res.headers['x-content-type-options']).toBe('nosniff');

    // X-Frame-Options: DENY
    expect(res.headers['x-frame-options']).toBe('DENY');

    // Referrer-Policy: no-referrer
    expect(res.headers['referrer-policy']).toBe('no-referrer');

    // Content-Security-Policy
    const csp = res.headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-src 'self' blob:");
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);

    // Cache-Control: no-store for API / health
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('guarantees zero permissive CORS headers on API endpoints', async () => {
    const config = testConfig();
    const app = buildApp({ config, gemini: new FakeGemini(), manifest: emptyManifest });

    const res = await request(app)
      .get('/api/v1/capabilities')
      .set('Origin', 'https://attacker.example.com');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.headers['access-control-allow-credentials']).toBeUndefined();
    expect(res.headers['access-control-allow-methods']).toBeUndefined();
    expect(res.headers['access-control-allow-headers']).toBeUndefined();
  });

  it('rejects CORS OPTIONS preflight without permissive grants', async () => {
    const config = testConfig();
    const app = buildApp({ config, gemini: new FakeGemini(), manifest: emptyManifest });

    const res = await request(app)
      .options('/api/v1/extractions')
      .set('Origin', 'https://malicious-site.example')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type');

    // Express default OPTIONS handler or 404/204, but crucially without Access-Control-Allow-Origin
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.headers['access-control-allow-methods']).toBeUndefined();
  });

  it('hostile Origin or Referer header never alters server processing or injects CORS', async () => {
    const gemini = new FakeGemini();
    const config = testConfig({ sampleModeEnabled: true });
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    const res = await request(app)
      .post('/api/v1/extractions')
      .set('Origin', 'https://evil.corp')
      .set('Referer', 'https://evil.corp/phishing')
      .send({ sampleCaseId: 'UNKNOWN' });

    expect(res.status).toBe(400);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
