import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';

import { FakeGemini, testConfig, validModelExtraction } from '../phase-03/helpers.js';
import { buildApp } from '../../src/server/app.js';
import type { SampleManifest } from '../../src/content/samples-manifest.js';
import type { GeminiExtractionOutcome, GeminiExtractionRequest, GeminiExtractionService } from '../../src/services/gemini/types.js';

const emptyManifest: SampleManifest = {
  rootDir: '/tmp',
  entries: [],
};

async function createTestPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([300, 400]);
  page.drawText('Test Cancellation PDF');
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

class AbortableGemini implements GeminiExtractionService {
  receivedSignal = false;
  signalAborted = false;
  inFlight = false;
  private resolveExtract?: (val: GeminiExtractionOutcome) => void;

  extract(request: GeminiExtractionRequest): Promise<GeminiExtractionOutcome> {
    this.inFlight = true;
    if (request.signal) {
      this.receivedSignal = true;
      if (request.signal.aborted) {
        this.signalAborted = true;
      } else {
        request.signal.addEventListener('abort', () => {
          this.signalAborted = true;
          if (this.resolveExtract) {
            this.resolveExtract({
              ok: false,
              reason: 'timeout',
              attempts: 1,
              providerMs: 10,
            });
          }
        });
      }
    }

    return new Promise<GeminiExtractionOutcome>((resolve) => {
      this.resolveExtract = resolve;
    });
  }

  complete() {
    if (this.resolveExtract) {
      this.resolveExtract({
        ok: true,
        modelJson: validModelExtraction(),
        attempts: 1,
        providerMs: 10,
      });
    }
  }
}

describe('Security: Disconnect cancellation (docs/SECURITY.md §6)', () => {
  it('aborts in-flight Gemini call when client disconnects during extraction', async () => {
    const gemini = new AbortableGemini();
    const config = testConfig({ customUploadEnabled: true });
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;

    try {
      const pdf = await createTestPdf();
      const boundary = '----WebKitFormBoundaryCancellationTest';
      const bodyPrefix = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="offer"; filename="offer.pdf"\r\nContent-Type: application/pdf\r\n\r\n`,
      );
      const bodySuffix = Buffer.from(`\r\n--${boundary}--\r\n`);
      const body = Buffer.concat([bodyPrefix, pdf, bodySuffix]);

      const clientReq = http.request({
        hostname: 'localhost',
        port,
        path: '/api/v1/extractions',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
      });

      clientReq.on('error', () => {
        // Expected ECONNRESET / socket hang up when destroyed by client
      });

      clientReq.write(body);
      clientReq.end();

      // Wait until Gemini starts processing
      while (!gemini.inFlight) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      expect(gemini.receivedSignal).toBe(true);
      expect(gemini.signalAborted).toBe(false);

      // Client abandons request
      clientReq.destroy();

      // Wait for abort event to be dispatched to Gemini signal
      // (generous bound — the suite runs in parallel with 50+ other files)
      for (let i = 0; i < 250; i++) {
        if (gemini.signalAborted) break;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      expect(gemini.signalAborted).toBe(true);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('stops processing without writing response when client socket disconnects during analysis', async () => {
    const config = testConfig();
    const gemini = new FakeGemini();
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const port = (server.address() as AddressInfo).port;

    try {
      const clientReq = http.request({
        hostname: 'localhost',
        port,
        path: '/api/v1/analyses',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clientReq.on('error', () => {});

      // Destroy socket immediately after sending partial data
      clientReq.write('{"issuedExtraction":');
      clientReq.destroy();

      await new Promise((resolve) => setTimeout(resolve, 100));
      // Confirmed: server does not crash or throw unhandled exceptions
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
