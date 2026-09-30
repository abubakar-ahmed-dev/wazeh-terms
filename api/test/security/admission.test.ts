import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { PDFDocument } from 'pdf-lib';
import type { Request, Response } from 'express';

import { FakeGemini, testConfig, validModelExtraction } from '../phase-03/helpers.js';
import { buildApp } from '../../src/server/app.js';
import type { SampleManifest } from '../../src/content/samples-manifest.js';
import { InMemoryRateLimiter } from '../../src/server/admission.js';
import type { GeminiExtractionOutcome, GeminiExtractionRequest, GeminiExtractionService } from '../../src/services/gemini/types.js';

const emptyManifest: SampleManifest = {
  rootDir: '/tmp',
  entries: [],
};

async function createTestPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([300, 400]);
  page.drawText('Test Admission Control PDF');
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

class DelayGemini implements GeminiExtractionService {
  private resolver?: () => void;
  inFlight = false;

  extract(_request: GeminiExtractionRequest): Promise<GeminiExtractionOutcome> {
    this.inFlight = true;
    return new Promise<GeminiExtractionOutcome>((resolve) => {
      this.resolver = () => {
        this.inFlight = false;
        resolve({
          ok: true,
          modelJson: validModelExtraction(),
          attempts: 1,
          providerMs: 50,
        });
      };
    });
  }

  release() {
    if (this.resolver) {
      this.resolver();
    }
  }
}

describe('Security: Admission control (docs/SECURITY.md §6)', () => {
  it('enforces fixed-window rate limit on extractions and returns 429 with Retry-After', async () => {
    const gemini = new FakeGemini();
    const config = testConfig({
      sampleModeEnabled: true,
      security: {
        rateLimitMax: 2,
        rateLimitWindowMs: 5000,
        maxConcurrentExtractions: 10,
      },
    });
    const app = buildApp({ config, gemini, manifest: emptyManifest });

    // Request 1: allowed (400 because body is missing sampleCaseId, but passed admission)
    const res1 = await request(app).post('/api/v1/extractions').send({});
    expect(res1.status).toBe(400);

    // Request 2: allowed
    const res2 = await request(app).post('/api/v1/extractions').send({});
    expect(res2.status).toBe(400);

    // Request 3: blocked by rate limiter
    const res3 = await request(app).post('/api/v1/extractions').send({});
    expect(res3.status).toBe(429);
    expect(res3.body.error).toBeDefined();
    expect(res3.body.error.code).toBe('RATE_LIMITED');
    expect(res3.body.error.retryable).toBe(true);
    expect(res3.headers['retry-after']).toBeDefined();
    const retryAfter = Number(res3.headers['retry-after']);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(5);
  });

  it('enforces rate limit on analyses route', async () => {
    const config = testConfig({
      security: {
        rateLimitMax: 1,
        rateLimitWindowMs: 5000,
        maxConcurrentExtractions: 10,
      },
    });
    const app = buildApp({ config, gemini: new FakeGemini(), manifest: emptyManifest });

    const res1 = await request(app).post('/api/v1/analyses').send({});
    expect(res1.status).toBe(400);

    const res2 = await request(app).post('/api/v1/analyses').send({});
    expect(res2.status).toBe(429);
    expect(res2.body.error.code).toBe('RATE_LIMITED');
    expect(res2.headers['retry-after']).toBeDefined();
  });

  it('enforces in-flight concurrency limit on extractions returning 503 SERVICE_BUSY', async () => {
    const delayGemini = new DelayGemini();
    const config = testConfig({
      customUploadEnabled: true,
      security: {
        rateLimitMax: 100,
        rateLimitWindowMs: 60000,
        maxConcurrentExtractions: 1,
      },
    });

    const app = buildApp({ config, gemini: delayGemini, manifest: emptyManifest });
    const pdf = await createTestPdf();

    // Start extraction 1 (hangs in DelayGemini)
    let p1Response: request.Response | undefined;
    const p1Promise = request(app)
      .post('/api/v1/extractions')
      .attach('offer', pdf, 'offer.pdf')
      .then((res) => {
        p1Response = res;
        return res;
      });

    // Yield so p1 reaches DelayGemini.extract
    while (!delayGemini.inFlight) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    expect(delayGemini.inFlight).toBe(true);

    // Extraction 2 arrives while extraction 1 is in-flight: should hit concurrency limit (503)
    const res2 = await request(app)
      .post('/api/v1/extractions')
      .attach('offer', pdf, 'offer.pdf');

    expect(res2.status).toBe(503);
    expect(res2.body.error.code).toBe('SERVICE_BUSY');
    expect(res2.body.error.retryable).toBe(true);
    expect(res2.body.error.stage).toBe('extraction');
    expect(res2.headers['retry-after']).toBe('5');

    // Release extraction 1
    delayGemini.release();
    await p1Promise;
    expect(p1Response?.status).toBe(200);

    // After release, new request is admitted
    let p3Response: request.Response | undefined;
    const p3Promise = request(app)
      .post('/api/v1/extractions')
      .attach('offer', pdf, 'offer.pdf')
      .then((res) => {
        p3Response = res;
        return res;
      });

    while (!delayGemini.inFlight) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    delayGemini.release();
    await p3Promise;
    expect(p3Response?.status).toBe(200);
  });

  it('unit test: InMemoryRateLimiter tracks per-IP and resets correctly', () => {
    const limiter = new InMemoryRateLimiter({ max: 2, windowMs: 1000 });
    let passed = 0;
    let blocked = 0;

    const fakeReq = { ip: '192.168.1.1', socket: {} } as unknown as Request;
    const fakeRes = { set: (_k: string, _v: string) => fakeRes } as unknown as Response;

    const run = () => {
      limiter.middleware()(fakeReq, fakeRes, (err?: unknown) => {
        if (err) blocked++;
        else passed++;
      });
    };

    run(); // 1
    run(); // 2
    run(); // 3 -> blocked
    expect(passed).toBe(2);
    expect(blocked).toBe(1);

    limiter.reset();
    run(); // 1 after reset
    expect(passed).toBe(3);
    limiter.destroy();
  });
});
