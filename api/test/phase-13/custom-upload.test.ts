import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { PDFDocument } from 'pdf-lib';

import { FakeGemini, testConfig, validModelExtraction } from '../phase-03/helpers.js';
import { buildApp } from '../../src/server/app.js';
import type { SampleManifest } from '../../src/content/samples-manifest.js';

const emptyManifest: SampleManifest = {
  rootDir: '/tmp',
  entries: [],
};

async function createTestPdf(pageCount = 1): Promise<Buffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([300, 400]);
    page.drawText(`Test Page ${i + 1}`);
  }
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

describe('Phase 13: Custom document upload API', () => {
  it('rejects multipart upload with 403 when customUploadEnabled is false', async () => {
    const gemini = new FakeGemini();
    const config = testConfig({ customUploadEnabled: false });
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    const pdf = await createTestPdf(1);
    const res = await request(app)
      .post('/api/v1/extractions')
      .attach('offer', pdf, 'offer.pdf');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CUSTOM_UPLOAD_DISABLED');
    expect(gemini.calls).toHaveLength(0);
  });

  it('accepts a valid single offer PDF and returns signed IssuedExtraction with sourceMode: custom', async () => {
    const gemini = new FakeGemini();
    gemini.enqueueValid(validModelExtraction());
    const config = testConfig({ customUploadEnabled: true });
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    const pdf = await createTestPdf(1);
    const res = await request(app)
      .post('/api/v1/extractions')
      .attach('offer', pdf, 'offer.pdf');

    expect(res.status).toBe(200);
    expect(res.body.issuedExtraction).toBeDefined();
    expect(res.body.issuedExtraction.sourceMode).toBe('custom');
    expect(res.body.issuedExtraction.documents).toHaveLength(1);
    expect(res.body.issuedExtraction.documents[0].role).toBe('offer');
    expect(res.body.proof).toBeDefined();
    expect(res.body.proof.keyId).toBe(config.hmac.keyId);
    expect(gemini.calls).toHaveLength(1);
  });

  it('accepts both offer and contract PDFs and respects a custom scope JSON string', async () => {
    const gemini = new FakeGemini();
    gemini.enqueueValid(validModelExtraction());
    const config = testConfig({ customUploadEnabled: true });
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    const offerPdf = await createTestPdf(1);
    const contractPdf = await createTestPdf(1);
    const customScope = {
      origin: 'PK',
      destination: 'AE',
      declaredRegime: 'other',
      declaredWorkerCategory: 'domestic',
    };

    const res = await request(app)
      .post('/api/v1/extractions')
      .field('scope', JSON.stringify(customScope))
      .attach('offer', offerPdf, 'my-offer.pdf')
      .attach('contract', contractPdf, 'my-contract.pdf');

    expect(res.status).toBe(200);
    expect(res.body.issuedExtraction.sourceMode).toBe('custom');
    expect(res.body.issuedExtraction.scope).toEqual(customScope);
    expect(res.body.issuedExtraction.documents).toHaveLength(2);
    expect(res.body.issuedExtraction.documents.map((d: { role: string }) => d.role)).toEqual(['offer', 'contract']);
  });

  it('rejects multipart upload with no files with 400 BAD_REQUEST', async () => {
    const gemini = new FakeGemini();
    const config = testConfig({ customUploadEnabled: true });
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    const res = await request(app)
      .post('/api/v1/extractions')
      .field('scope', '{}');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('rejects unexpected file fields with 400 BAD_REQUEST', async () => {
    const gemini = new FakeGemini();
    const config = testConfig({ customUploadEnabled: true });
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    const pdf = await createTestPdf(1);
    const res = await request(app)
      .post('/api/v1/extractions')
      .attach('resume', pdf, 'resume.pdf');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('rejects duplicate document role submissions with 400 DUPLICATE_DOCUMENT_ROLE', async () => {
    const gemini = new FakeGemini();
    const config = testConfig({ customUploadEnabled: true });
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    const pdf1 = await createTestPdf(1);
    const pdf2 = await createTestPdf(1);
    const res = await request(app)
      .post('/api/v1/extractions')
      .attach('offer', pdf1, 'offer1.pdf')
      .attach('offer', pdf2, 'offer2.pdf');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('DUPLICATE_DOCUMENT_ROLE');
  });

  it('rejects non-PDF files with 415 UNSUPPORTED_MEDIA_TYPE', async () => {
    const gemini = new FakeGemini();
    const config = testConfig({ customUploadEnabled: true });
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    const fakeFile = Buffer.from('This is a plain text file, not a valid PDF.');
    const res = await request(app)
      .post('/api/v1/extractions')
      .attach('offer', fakeFile, 'document.txt');

    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('rejects a PDF exceeding the configured page limit with 413 TOO_MANY_PAGES', async () => {
    const gemini = new FakeGemini();
    const config = testConfig({
      customUploadEnabled: true,
      limits: { maxPagesPerPdf: 3, maxBytesPerFile: 8 * 1024 * 1024, maxTotalBytes: 16 * 1024 * 1024, maxCorrections: 100, applicationDeadlineMs: 30000 },
    });
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    const longPdf = await createTestPdf(4); // 4 pages > 3 page limit
    const res = await request(app)
      .post('/api/v1/extractions')
      .attach('offer', longPdf, 'long-offer.pdf');

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('TOO_MANY_PAGES');
  });

  it('end-to-end downstream: custom issued extraction verifies in POST /api/v1/analyses', async () => {
    const gemini = new FakeGemini();
    gemini.enqueueValid(validModelExtraction());
    const config = testConfig({ customUploadEnabled: true });
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    const offerPdf = await createTestPdf(1);
    const contractPdf = await createTestPdf(1);

    const extRes = await request(app)
      .post('/api/v1/extractions')
      .attach('offer', offerPdf, 'offer.pdf')
      .attach('contract', contractPdf, 'contract.pdf');

    expect(extRes.status).toBe(200);

    const anaRes = await request(app)
      .post('/api/v1/analyses')
      .send({
        issuedExtraction: extRes.body.issuedExtraction,
        proof: extRes.body.proof,
        corrections: [],
      });

    expect(anaRes.status).toBe(200);
    expect(anaRes.body.stages.extraction).toBe('completed');
    expect(anaRes.body.stages.comparison).toBe('completed');
    expect(anaRes.body.findings).toBeDefined();
    expect(Array.isArray(anaRes.body.findings)).toBe(true);
  });
});
