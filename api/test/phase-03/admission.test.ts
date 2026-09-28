import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { FakeGemini, buildTestApp, testConfig, writeTestManifest } from './helpers.js';

const fixture = await writeTestManifest();
afterAll(async () => {
  await fixture.cleanup();
});

async function post(app: ReturnType<typeof buildTestApp>, body: string | object, contentType = 'application/json') {
  return request(app).post('/api/v1/extractions').set('content-type', contentType).send(body);
}

describe('extraction admission', () => {
  it('rejects unknown or malformed sample ids with 400 and never calls the provider', async () => {
    const gemini = new FakeGemini();
    const app = buildTestApp({ manifest: fixture.manifest, gemini });

    const unknown = await post(app, { sampleCaseId: 'TC-999' });
    expect(unknown.status).toBe(400);
    expect(unknown.body.error.code).toBe('BAD_REQUEST');

    const malformed = await post(app, { nope: true });
    expect(malformed.status).toBe(400);

    const wrongType = await post(app, { sampleCaseId: 42 });
    expect(wrongType.status).toBe(400);

    const pathLike = await post(app, { sampleCaseId: '../secrets' });
    expect(pathLike.status).toBe(400);

    expect(gemini.calls).toHaveLength(0);
  });

  it('rejects every arbitrary multipart upload with 403 CUSTOM_UPLOAD_DISABLED before parsing', async () => {
    const gemini = new FakeGemini();
    const app = buildTestApp({ manifest: fixture.manifest, gemini });

    const response = await request(app)
      .post('/api/v1/extractions')
      .set('content-type', 'multipart/form-data; boundary=x')
      .send('--x--');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('CUSTOM_UPLOAD_DISABLED');
    expect(gemini.calls).toHaveLength(0);
  });

  it('rejects oversized and structurally broken fixtures before the provider call', async () => {
    const gemini = new FakeGemini();
    const app = buildTestApp({ manifest: fixture.manifest, gemini });

    const tooManyPages = await post(app, { sampleCaseId: 'TC-LONG' });
    expect(tooManyPages.status).toBe(413);
    expect(tooManyPages.body.error.code).toBe('TOO_MANY_PAGES');

    const garbage = await post(app, { sampleCaseId: 'TC-GARBAGE' });
    expect(garbage.status).toBe(422);
    expect(garbage.body.error.code).toBe('UNREADABLE_DOCUMENT');

    const empty = await post(app, { sampleCaseId: 'TC-EMPTY' });
    expect(empty.status).toBe(415);
    expect(empty.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');

    const notPdf = await post(app, { sampleCaseId: 'TC-NOTPDF' });
    expect(notPdf.status).toBe(415);

    expect(gemini.calls).toHaveLength(0);
  });

  it('enforces per-file byte limits from config', async () => {
    const config = testConfig({ limits: { ...testConfig().limits, maxBytesPerFile: 10 } });
    const app = buildTestApp({ config, manifest: fixture.manifest });
    const response = await post(app, { sampleCaseId: 'TC-002' });
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('fails closed with 503 when sample mode or credentials are missing', async () => {
    const gemini = new FakeGemini();
    const disabled = buildTestApp({
      config: testConfig({ sampleModeEnabled: false }),
      manifest: fixture.manifest,
      gemini,
    });
    const off = await post(disabled, { sampleCaseId: 'TC-002' });
    expect(off.status).toBe(503);
    expect(off.body.error.code).toBe('EXTRACTION_UNAVAILABLE');

    const noKey = buildTestApp({
      config: testConfig({ gemini: { ...testConfig().gemini, apiKey: null } }),
      manifest: fixture.manifest,
      gemini,
    });
    const withoutKey = await post(noKey, { sampleCaseId: 'TC-002' });
    expect(withoutKey.status).toBe(503);
    expect(gemini.calls).toHaveLength(0);

    const noSecret = buildTestApp({
      config: testConfig({ hmac: { ...testConfig().hmac, secret: null } }),
      manifest: fixture.manifest,
      gemini,
    });
    const withoutSecret = await post(noSecret, { sampleCaseId: 'TC-002' });
    expect(withoutSecret.status).toBe(503);
    expect(gemini.calls).toHaveLength(0);
  });

  it('answers errors with the documented envelope and no-store', async () => {
    const app = buildTestApp({ manifest: fixture.manifest });
    const response = await post(app, { sampleCaseId: 'TC-999' });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.requestId).toMatch(/^req_/);
    expect(response.body.error).toMatchObject({ code: 'BAD_REQUEST', retryable: false });
  });
});
