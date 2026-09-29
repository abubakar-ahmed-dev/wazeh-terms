import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { FakeGemini, buildTestApp, testConfig, writeTestManifest } from '../phase-03/helpers.js';

const fixture = await writeTestManifest();
afterAll(async () => {
  await fixture.cleanup();
});

describe('end-to-end two-step flow over HTTP (fake Gemini, no Sanity)', () => {
  it('extraction → analyses: the returned payload+proof are accepted unchanged', async () => {
    const gemini = new FakeGemini();
    gemini.enqueueValid({
      documents: [
        {
          role: 'offer',
          fields: [
            {
              fieldKey: 'basic_salary',
              state: 'present',
              rawText: 'Basic salary AED 2,400 per month',
              value: { kind: 'money', amount: '2400.00', currency: 'AED', frequency: 'monthly', component: 'basic_salary', payer: null },
              evidence: [{ page: 1, quote: 'Basic salary AED 2,400 per month' }],
              qualityNotes: [],
            },
          ],
          unreadablePages: [],
          note: '',
        },
      ],
    });

    const serverOrigin = buildTestApp({ manifest: fixture.manifest, gemini });

    // Step 1: extraction (always through the provider interface — D2).
    const extraction = await request(serverOrigin)
      .post('/api/v1/extractions')
      .send({ sampleCaseId: 'TC-TEXT' });
    expect(extraction.status).toBe(200);

    const { issuedExtraction, proof } = extraction.body;

    // Step 2: analyses with the unchanged payload + proof, no corrections.
    const analysis = await request(serverOrigin)
      .post('/api/v1/analyses')
      .send({ issuedExtraction, proof, corrections: [] });

    expect(analysis.status).toBe(200);
    expect(analysis.headers['cache-control']).toBe('no-store');
    expect(analysis.body.status).toBe('partial');
    expect(analysis.body.stages.comparison).toBe('not_applicable');
    expect(analysis.body.coverage.documentIds).toEqual(issuedExtraction.documents.map((d: { documentId: string }) => d.documentId));
    // The report carries no proof and no signed payload echo.
    expect(analysis.body.proof).toBeUndefined();
    expect(analysis.body.issuedExtraction).toBeUndefined();
  });

  it('config without HMAC secret still answers analyses fail-closed', async () => {
    const app = buildTestApp({
      config: testConfig({ hmac: { ...testConfig().hmac, secret: null } }),
    });
    const issued = issuedPayloadForNoSecret();
    const response = await request(app).post('/api/v1/analyses').send({
      issuedExtraction: issued,
      proof: { keyId: 'key-1', signature: 'A'.repeat(43) },
      corrections: [],
    });
    expect([422, 503]).toContain(response.status);
  });
});

function issuedPayloadForNoSecret() {
  // Shape-only payload; the app must reject it before trusting anything.
  return {
    schemaVersion: 1,
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    scope: { origin: 'PK', destination: 'AE', declaredRegime: 'uae_mainland_private', declaredWorkerCategory: 'non_domestic' },
    sourceMode: 'sample',
    documents: [],
  } as unknown as Record<string, unknown>;
}
