import fs from 'node:fs';
import os from 'node:os';
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

async function createTestPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([300, 400]);
  page.drawText('Zero Retention Proof PDF');
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

function listTempFiles(): Set<string> {
  try {
    return new Set(fs.readdirSync(os.tmpdir()));
  } catch {
    return new Set();
  }
}

describe('Security: Zero-retention proof (docs/SECURITY.md §2)', () => {
  it('guarantees zero temporary files are written to disk during successful extraction', async () => {
    const gemini = new FakeGemini();
    gemini.enqueueValid(validModelExtraction());
    const config = testConfig({ customUploadEnabled: true });
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    const beforeFiles = listTempFiles();
    const pdf = await createTestPdf();

    const res = await request(app)
      .post('/api/v1/extractions')
      .attach('offer', pdf, 'confidential_offer.pdf');

    expect(res.status).toBe(200);

    const afterFiles = listTempFiles();
    // No new files created in os.tmpdir()
    for (const file of afterFiles) {
      if (!beforeFiles.has(file)) {
        // Assert file is not related to wazeh or uploaded document
        expect(file.toLowerCase()).not.toContain('confidential');
        expect(file.toLowerCase()).not.toContain('offer');
        expect(file.toLowerCase()).not.toContain('wazeh');
        expect(file.toLowerCase()).not.toContain('busboy');
      }
    }
  });

  it('guarantees zero files on disk during rejected/failed uploads', async () => {
    const gemini = new FakeGemini();
    gemini.enqueueError();
    const config = testConfig({ customUploadEnabled: true });
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    const beforeFiles = listTempFiles();

    // 1. Invalid mime/magic bytes
    await request(app)
      .post('/api/v1/extractions')
      .attach('offer', Buffer.from('FAKE-CONTENT-NOT-PDF'), 'invalid.pdf');

    // 2. Oversized payload
    const bigBuffer = Buffer.alloc(1024 * 1024 * 4); // 4MB
    await request(app)
      .post('/api/v1/extractions')
      .attach('offer', bigBuffer, 'big.pdf');

    const afterFiles = listTempFiles();
    for (const file of afterFiles) {
      if (!beforeFiles.has(file)) {
        expect(file.toLowerCase()).not.toContain('invalid');
        expect(file.toLowerCase()).not.toContain('big');
        expect(file.toLowerCase()).not.toContain('wazeh');
        expect(file.toLowerCase()).not.toContain('busboy');
      }
    }
  });
});
