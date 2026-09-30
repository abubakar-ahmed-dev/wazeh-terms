import { describe, expect, it } from 'vitest';
import request from 'supertest';

import { FakeGemini, testConfig } from '../phase-03/helpers.js';
import { buildApp } from '../../src/server/app.js';
import type { SampleManifest } from '../../src/content/samples-manifest.js';
import { signIssuedExtraction } from '../../src/contracts/index.js';
import { validIssuedExtraction } from '../contracts/helpers.js';

const emptyManifest: SampleManifest = {
  rootDir: '/tmp',
  entries: [],
};

describe('Security: Signed-payload abuse tests (docs/SECURITY.md §3, §7 check 2)', () => {
  it('accepts replay within TTL (acknowledged documented limitation)', async () => {
    const config = testConfig();
    const app = buildApp({ config, gemini: new FakeGemini(), manifest: emptyManifest });

    const now = Date.now();
    const issuedExtraction = validIssuedExtraction();
    issuedExtraction.issuedAt = new Date(now).toISOString();
    issuedExtraction.expiresAt = new Date(now + 1800000).toISOString();

    const proof = signIssuedExtraction(issuedExtraction, {
      keyId: config.hmac.keyId,
      secret: config.hmac.secret!,
    });

    // First analysis request with the issued extraction
    const res1 = await request(app)
      .post('/api/v1/analyses')
      .send({ issuedExtraction, proof, corrections: [] });

    expect(res1.status).toBe(200);

    // Replay 1: same payload and proof sent again within TTL
    const res2 = await request(app)
      .post('/api/v1/analyses')
      .send({ issuedExtraction, proof, corrections: [] });

    expect(res2.status).toBe(200);

    // Replay 2: same payload and proof sent a third time
    const res3 = await request(app)
      .post('/api/v1/analyses')
      .send({ issuedExtraction, proof, corrections: [] });

    expect(res3.status).toBe(200);
  });

  it('rejects expired proof with 410 REVIEW_EXPIRED', async () => {
    const config = testConfig();
    const app = buildApp({ config, gemini: new FakeGemini(), manifest: emptyManifest });

    const issuedExtraction: Record<string, unknown> = {
      schemaVersion: 1,
      issuedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-01T00:30:00.000Z', // In the past
      scope: { origin: 'PK', destination: 'AE', declaredRegime: 'uae_mainland_private', declaredWorkerCategory: 'non_domestic' },
      sourceMode: 'custom',
      documents: [],
    };

    const proof = signIssuedExtraction(issuedExtraction, {
      keyId: config.hmac.keyId,
      secret: config.hmac.secret!,
    });

    const res = await request(app)
      .post('/api/v1/analyses')
      .send({ issuedExtraction, proof, corrections: [] });

    expect(res.status).toBe(410);
    expect(res.body.error.code).toBe('REVIEW_EXPIRED');
  });

  it('rejects unknown keyId with 422 REVIEW_INVALID without leaking internal key details', async () => {
    const config = testConfig();
    const app = buildApp({ config, gemini: new FakeGemini(), manifest: emptyManifest });

    const now = Date.now();
    const issuedExtraction: Record<string, unknown> = {
      schemaVersion: 1,
      issuedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 1800000).toISOString(),
      scope: { origin: 'PK', destination: 'AE', declaredRegime: 'uae_mainland_private', declaredWorkerCategory: 'non_domestic' },
      sourceMode: 'custom',
      documents: [],
    };

    const proof = signIssuedExtraction(issuedExtraction, {
      keyId: 'unknown-foreign-key-id',
      secret: config.hmac.secret!,
    });

    const res = await request(app)
      .post('/api/v1/analyses')
      .send({ issuedExtraction, proof, corrections: [] });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('REVIEW_INVALID');
    // Does not leak server's real keyId in response
    expect(JSON.stringify(res.body)).not.toContain(config.hmac.keyId);
  });

  it('rejects tampered fields and values with 422 REVIEW_INVALID', async () => {
    const config = testConfig();
    const app = buildApp({ config, gemini: new FakeGemini(), manifest: emptyManifest });

    const now = Date.now();
    const issuedExtraction = validIssuedExtraction();
    issuedExtraction.issuedAt = new Date(now).toISOString();
    issuedExtraction.expiresAt = new Date(now + 1800000).toISOString();

    const proof = signIssuedExtraction(issuedExtraction, {
      keyId: config.hmac.keyId,
      secret: config.hmac.secret!,
    });

    // Tamper with the salary text
    issuedExtraction.documents[0]!.fields[0]!.rawText = 'Tampered text AED 9,999';

    const res = await request(app)
      .post('/api/v1/analyses')
      .send({ issuedExtraction, proof, corrections: [] });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('REVIEW_INVALID');
  });

  it('rejects tampered scope with 422 REVIEW_INVALID', async () => {
    const config = testConfig();
    const app = buildApp({ config, gemini: new FakeGemini(), manifest: emptyManifest });

    const now = Date.now();
    const issuedExtraction: Record<string, unknown> = {
      schemaVersion: 1,
      issuedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 1800000).toISOString(),
      scope: { origin: 'PK', destination: 'AE', declaredRegime: 'uae_mainland_private', declaredWorkerCategory: 'non_domestic' },
      sourceMode: 'custom',
      documents: [],
    };

    const proof = signIssuedExtraction(issuedExtraction, {
      keyId: config.hmac.keyId,
      secret: config.hmac.secret!,
    });

    (issuedExtraction.scope as Record<string, unknown>).declaredRegime = 'free_zone';

    const res = await request(app)
      .post('/api/v1/analyses')
      .send({ issuedExtraction, proof, corrections: [] });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('REVIEW_INVALID');
  });

  it('rejects unsupported schemaVersion with 409 REVIEW_VERSION_UNSUPPORTED', async () => {
    const config = testConfig();
    const app = buildApp({ config, gemini: new FakeGemini(), manifest: emptyManifest });

    const now = Date.now();
    const issuedExtraction: Record<string, unknown> = {
      schemaVersion: 2, // Unsupported schemaVersion
      issuedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 1800000).toISOString(),
      scope: { origin: 'PK', destination: 'AE', declaredRegime: 'uae_mainland_private', declaredWorkerCategory: 'non_domestic' },
      sourceMode: 'custom',
      documents: [],
    };

    const proof = signIssuedExtraction(issuedExtraction, {
      keyId: config.hmac.keyId,
      secret: config.hmac.secret!,
    });

    const res = await request(app)
      .post('/api/v1/analyses')
      .send({ issuedExtraction, proof, corrections: [] });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('REVIEW_VERSION_UNSUPPORTED');
  });

  it('rejects oversized JSON request body before signature computation with 413 REQUEST_TOO_LARGE', async () => {
    const config = testConfig();
    const app = buildApp({ config, gemini: new FakeGemini(), manifest: emptyManifest });

    // Payload exceeding 512kb limit
    const hugePadding = 'x'.repeat(600 * 1024);
    const res = await request(app)
      .post('/api/v1/analyses')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ hugePadding }));

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('REQUEST_TOO_LARGE');
  });
});
