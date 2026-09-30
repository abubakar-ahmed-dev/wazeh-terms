import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { PDFDocument } from 'pdf-lib';

import { FakeGemini, testConfig, validModelExtraction, TEST_SECRET } from '../phase-03/helpers.js';
import { buildApp } from '../../src/server/app.js';
import type { SampleManifest } from '../../src/content/samples-manifest.js';

const emptyManifest: SampleManifest = {
  rootDir: '/tmp',
  entries: [],
};

async function createSensitivePdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([300, 400]);
  page.drawText('Candidate: Muhammad Iqbal. Basic salary AED 2400.');
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

describe('Security: Logging redaction assertions (docs/SECURITY.md §6)', () => {
  const capturedLogs: string[] = [];
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    capturedLogs.length = 0;
    const capture = (...args: unknown[]) => {
      capturedLogs.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    };
    logSpy = vi.spyOn(console, 'log').mockImplementation(capture);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(capture);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(capture);
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('guarantees structured logs contain coarse fields only and zero sensitive data across extraction and analysis', async () => {
    const gemini = new FakeGemini();
    gemini.enqueueValid(validModelExtraction());
    const config = testConfig({ customUploadEnabled: true });
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    const sensitivePdf = await createSensitivePdf();
    const sensitiveFilename = 'sensitive_worker_muhammad_iqbal_offer.pdf';

    // 1. Successful extraction
    const extRes = await request(app)
      .post('/api/v1/extractions')
      .attach('offer', sensitivePdf, sensitiveFilename);

    expect(extRes.status).toBe(200);

    // 2. Successful analysis
    const analysisRes = await request(app)
      .post('/api/v1/analyses')
      .send({
        issuedExtraction: extRes.body.issuedExtraction,
        proof: extRes.body.proof,
        corrections: [],
      });

    expect(analysisRes.status).toBe(200);

    // 3. Various error classes
    // 400 Bad Request
    await request(app).post('/api/v1/analyses').send({ invalid: 'field' });

    // 415 Unsupported Media Type
    await request(app)
      .post('/api/v1/extractions')
      .attach('offer', Buffer.from('NOT_A_PDF_STREAM'), 'bad.pdf');

    // 422 Invalid review proof
    await request(app)
      .post('/api/v1/analyses')
      .send({
        issuedExtraction: extRes.body.issuedExtraction,
        proof: { keyId: 'key-1', signature: 'tampered-signature-value' },
        corrections: [],
      });

    expect(capturedLogs.length).toBeGreaterThan(0);

    const sensitivePatterns = [
      'Muhammad Iqbal',
      'sensitive_worker',
      'muhammad_iqbal',
      'Gulf Horizon',
      'AED 2,400',
      '2400.00',
      TEST_SECRET,
      'tampered-signature-value',
    ];

    const allowedKeys = new Set([
      'ts',
      'level',
      'event',
      'requestId',
      'route',
      'method',
      'outcome',
      'status',
      'durationMs',
      'errorClass',
    ]);

    for (const logLine of capturedLogs) {
      // Check for sensitive string leaks
      for (const pattern of sensitivePatterns) {
        expect(logLine).not.toContain(pattern);
      }

      // Verify log structure is clean JSON
      const parsed = JSON.parse(logLine);
      expect(parsed.event).toBe('request');
      expect(typeof parsed.requestId).toBe('string');
      expect(typeof parsed.route).toBe('string');
      expect(typeof parsed.method).toBe('string');
      expect(typeof parsed.status).toBe('number');
      expect(typeof parsed.durationMs).toBe('number');

      for (const key of Object.keys(parsed)) {
        expect(allowedKeys.has(key)).toBe(true);
      }
    }
  });
});
