import { afterEach, describe, expect, it, vi } from 'vitest';

import { createGeminiHttpService } from '../../src/services/gemini/gemini-http.js';
import { validModelExtraction } from './helpers.js';

function apiResponse(modelJson: unknown): Response {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(modelJson) }] } }],
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('gemini-http service', () => {
  it('retries schema-invalid output within the two-attempt budget', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(apiResponse({ nope: true })) // schema-invalid
      .mockResolvedValueOnce(new Response('not-json', { status: 200 })) // malformed JSON
      .mockResolvedValueOnce(apiResponse(validModelExtraction())); // never reached
    vi.stubGlobal('fetch', fetchMock);

    const service = createGeminiHttpService({ apiKey: 'k'.repeat(10), model: 'gemini-3.5-flash' });
    const outcome = await service.extract({
      documents: [{ role: 'offer', pdfBase64: 'AAAA' }],
      deadlineMs: 10_000,
    });

    expect(outcome).toMatchObject({ ok: false, reason: 'unavailable', attempts: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('recovers when the second attempt returns valid output', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(apiResponse({ unexpected: true }))
      .mockResolvedValueOnce(apiResponse(validModelExtraction()));
    vi.stubGlobal('fetch', fetchMock);

    const service = createGeminiHttpService({ apiKey: 'k'.repeat(10), model: 'gemini-3.5-flash' });
    const outcome = await service.extract({
      documents: [{ role: 'offer', pdfBase64: 'AAAA' }],
      deadlineMs: 10_000,
    });

    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.attempts).toBe(2);
    }
  });

  it('fails closed when every attempt returns schema-invalid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"nope": true}', { status: 200 })),
    );

    const service = createGeminiHttpService({ apiKey: 'k'.repeat(10), model: 'gemini-3.5-flash' });
    const outcome = await service.extract({
      documents: [{ role: 'offer', pdfBase64: 'AAAA' }],
      deadlineMs: 10_000,
    });

    expect(outcome).toMatchObject({ ok: false, reason: 'unavailable' });
  });

  it('fails closed without retry when the provider errors', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED'));
    vi.stubGlobal('fetch', fetchMock);

    const service = createGeminiHttpService({ apiKey: 'k'.repeat(10), model: 'gemini-3.5-flash' });
    const outcome = await service.extract({
      documents: [{ role: 'offer', pdfBase64: 'AAAA' }],
      deadlineMs: 10_000,
    });

    expect(outcome).toMatchObject({ ok: false, reason: 'unavailable' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps deadline aborts to a timeout outcome', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: unknown, init: { signal: AbortSignal }) => {
        return new Promise<Response>((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('The operation was aborted')));
        });
      }),
    );

    const service = createGeminiHttpService({ apiKey: 'k'.repeat(10), model: 'gemini-3.5-flash' });
    const outcome = await service.extract({
      documents: [{ role: 'offer', pdfBase64: 'AAAA' }],
      deadlineMs: 50,
    });

    expect(outcome).toMatchObject({ ok: false, reason: 'timeout' });
  });
});
