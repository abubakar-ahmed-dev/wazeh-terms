import { describe, expect, it } from 'vitest';
import request from 'supertest';

import { buildTestApp, writeTestManifest } from './helpers.js';

describe('read-only endpoints', () => {
  it('answers /health minimally with no-store', async () => {
    const response = await request(buildTestApp()).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', version: expect.any(String) });
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('advertises capabilities from config with no-store', async () => {
    const response = await request(buildTestApp()).get('/api/v1/capabilities');
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toMatchObject({
      apiVersion: 'v1',
      sampleModeEnabled: true,
      customUploadEnabled: false,
      acceptedCustomMimeTypes: ['application/pdf'],
      supportedAnalysisLanguages: ['en'],
      maxDocuments: 2,
      maxBytesPerFile: 8 * 1024 * 1024,
      maxTotalBytes: 16 * 1024 * 1024,
      maxPagesPerPdf: 15,
      maxCorrections: 100,
      privacyNoticeVersion: '2026-09-28-draft',
    });
  });

  it('lists only manifest sample metadata with fixed same-origin previews', async () => {
    const { manifest, cleanup } = await writeTestManifest();
    try {
      const response = await request(buildTestApp({ manifest })).get('/api/v1/samples');
      expect(response.status).toBe(200);
      const samples = response.body.samples as Array<{ sampleCaseId: string; documents: Array<{ role: string; previewUrl: string }> }>;
      const tc002 = samples.find((s) => s.sampleCaseId === 'TC-002');
      expect(tc002).toBeDefined();
      expect(tc002!.documents).toEqual([
        { role: 'offer', previewUrl: '/samples/TC-002/sample-offer.pdf' },
        { role: 'contract', previewUrl: '/samples/TC-002/sample-contract.pdf' },
      ]);
      expect(JSON.stringify(response.body)).not.toContain('rootDir');
    } finally {
      await cleanup();
    }
  });
});
