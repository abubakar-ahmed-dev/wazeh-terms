import { afterAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

import {
  FakeGemini,
  buildTestApp,
  writeTestManifest,
} from './helpers.js';

const fixture = await writeTestManifest();
afterAll(async () => {
  await fixture.cleanup();
});

describe('operational logging redaction', () => {
  it('logs coarse request lines only — no quotes, values, filenames, or payloads', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const gemini = new FakeGemini();
      gemini.enqueueValid();
      const app = buildTestApp({ manifest: fixture.manifest, gemini });

      await request(app).post('/api/v1/extractions').send({ sampleCaseId: 'TC-002' });
      await request(app).post('/api/v1/extractions').send({ sampleCaseId: 'TC-999' });

      const lines = [
        ...logSpy.mock.calls.map((call) => String(call[0])),
        ...warnSpy.mock.calls.map((call) => String(call[0])),
        ...errorSpy.mock.calls.map((call) => String(call[0])),
      ];
      expect(lines.length).toBeGreaterThanOrEqual(2);

      for (const line of lines) {
        // Every line parses as JSON with only coarse fields.
        const entry = JSON.parse(line) as Record<string, unknown>;
        expect(Object.keys(entry)).toEqual(
          expect.arrayContaining(['ts', 'level', 'event', 'requestId', 'route', 'status', 'durationMs']),
        );
        // No fixture content, no model values, no base64 PDFs, no prompts.
        expect(line).not.toContain('Gulf Horizon');
        expect(line).not.toContain('AED');
        expect(line).not.toContain('sample-offer.pdf');
        expect(line).not.toContain('JVBER'); // base64 of "%PDF"
        expect(line).not.toContain('FIELD REGISTRY');
      }
    } finally {
      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});
