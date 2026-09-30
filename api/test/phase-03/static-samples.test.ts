import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import { buildTestApp, writeTestManifest } from './helpers.js';

const fixture = await writeTestManifest();
afterAll(async () => {
  await fixture.cleanup();
});

describe('fixed sample previews', () => {
  it('serves only manifest-listed fixture files as PDFs', async () => {
    const app = buildTestApp({ manifest: fixture.manifest });

    const response = await request(app).get('/samples/TC-002/sample-offer.pdf');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(Buffer.from(response.body).subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('returns 404 for unknown cases, unknown files, and path traversal', async () => {
    const app = buildTestApp({ manifest: fixture.manifest });

    expect((await request(app).get('/samples/TC-999/sample-offer.pdf')).status).toBe(404);
    expect((await request(app).get('/samples/TC-002/other.pdf')).status).toBe(404);
    expect((await request(app).get('/samples/TC-002/..%2F..%2F.env')).status).toBe(404);
    expect((await request(app).get('/samples/')).status).toBe(404);
  });
});
