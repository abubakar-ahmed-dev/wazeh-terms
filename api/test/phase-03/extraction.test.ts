import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import {
  IssuedExtractionV1Schema,
  verifyIssuedExtraction,
} from '../../src/contracts/index.js';
import {
  FakeGemini,
  TEST_SECRET,
  buildTestApp,
  testConfig,
  validModelExtraction,
  writeTestManifest,
} from './helpers.js';

const fixture = await writeTestManifest();
afterAll(async () => {
  await fixture.cleanup();
});

function extract(app: ReturnType<typeof buildTestApp>) {
  return request(app).post('/api/v1/extractions').send({ sampleCaseId: 'TC-002' });
}

describe('extraction contract (fake Gemini)', () => {
  it('always calls the provider for the sample pair and returns a signed issued extraction', async () => {
    const gemini = new FakeGemini();
    gemini.enqueueValid();
    const response = await extract(buildTestApp({ manifest: fixture.manifest, gemini }));

    expect(response.status).toBe(200);
    // D2: the runtime sample path always goes through Gemini — one bounded
    // call carrying both inline PDFs.
    expect(gemini.calls).toHaveLength(1);
    expect(gemini.calls[0]!.documents.map((d) => d.role)).toEqual(['offer', 'contract']);
    expect(Buffer.from(gemini.calls[0]!.documents[0]!.pdfBase64, 'base64').subarray(0, 5).toString()).toBe('%PDF-');

    expect(response.body.status).toBe('complete');
    expect(response.body.stages.extraction).toBe('completed');
    expect(response.body.requestId).toMatch(/^req_/);
    expect(response.body.notices.length).toBeGreaterThanOrEqual(2);

    const issued = IssuedExtractionV1Schema.parse(response.body.issuedExtraction);
    expect(issued.sourceMode).toBe('sample');
    expect(issued.scope).toMatchObject({ origin: 'PK', destination: 'AE' });

    const [offer, contract] = issued.documents;
    expect(offer!.role).toBe('offer');
    expect(offer!.extractionStatus).toBe('completed');
    expect(offer!.pageCount).toBe(1);
    expect(offer!.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(contract!.role).toBe('contract');
    expect(offer!.documentId).not.toBe(contract!.documentId);
    expect(offer!.documentId).toMatch(/^doc_[0-9a-f]{16}$/);

    const salary = offer!.fields.find((field) => field.fieldKey === 'basic_salary');
    expect(salary?.state).toBe('present');
    expect(salary?.instanceId).toBe('basic_salary:0');
    expect(salary?.evidence[0]?.verification).toBe('model_transcription');

    // Proof verifies against the exact returned payload with the test key.
    const verification = verifyIssuedExtraction(
      issued,
      response.body.proof,
      [{ keyId: 'key-1', secret: TEST_SECRET }],
      Date.now(),
    );
    expect(verification).toEqual({ ok: true });
    expect(response.body.proof.keyId).toBe('key-1');
  });

  it('marks the report partial when a document role is missing from the model output', async () => {
    const gemini = new FakeGemini();
    const partial = validModelExtraction();
    partial.documents = partial.documents.filter((d) => d.role === 'offer');
    gemini.enqueueValid(partial);

    const response = await extract(buildTestApp({ manifest: fixture.manifest, gemini }));
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('partial');
    expect(response.body.stages.extraction).toBe('partial');
    const contract = response.body.issuedExtraction.documents.find(
      (d: { role: string }) => d.role === 'contract',
    );
    expect(contract.extractionStatus).toBe('failed');
    expect(contract.fields).toHaveLength(0);
  });

  it('drops unknown field keys and downgrades invalid values instead of trusting them', async () => {
    const gemini = new FakeGemini();
    const withJunk = validModelExtraction();
    withJunk.documents[0]!.fields!.push({
      fieldKey: 'salary_history',
      state: 'present',
      rawText: 'invented',
      value: { kind: 'text', text: 'invented' },
      evidence: [{ page: 1, quote: 'invented' }],
    });
    withJunk.documents[0]!.fields!.push({
      fieldKey: 'start_date',
      state: 'present',
      rawText: 'not a date',
      value: { kind: 'date', date: '2026-02-30' },
      evidence: [{ page: 1, quote: 'not a date' }],
    });
    gemini.enqueueValid(withJunk);

    const response = await extract(buildTestApp({ manifest: fixture.manifest, gemini }));
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('partial');
    const offer = response.body.issuedExtraction.documents.find(
      (d: { role: string }) => d.role === 'offer',
    );
    const fieldKeys = offer.fields.map((f: { fieldKey: string }) => f.fieldKey);
    expect(fieldKeys).not.toContain('salary_history');
    const startDate = offer.fields.find((f: { fieldKey: string }) => f.fieldKey === 'start_date');
    expect(startDate.state).toBe('unclear');
    expect(startDate.value).toBeNull();
  });

  it('answers 422 with no proof when nothing is usable', async () => {
    const gemini = new FakeGemini();
    gemini.enqueueValid({ documents: [{ role: 'offer', fields: [] }, { role: 'contract', fields: [] }] });
    const response = await extract(buildTestApp({ manifest: fixture.manifest, gemini }));

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('UNREADABLE_DOCUMENT');
    expect(response.body.proof).toBeUndefined();
    expect(response.body.issuedExtraction).toBeUndefined();
  });

  it('answers 503 EXTRACTION_UNAVAILABLE when the provider fails', async () => {
    const gemini = new FakeGemini();
    gemini.enqueueError();
    const response = await extract(buildTestApp({ manifest: fixture.manifest, gemini }));

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('EXTRACTION_UNAVAILABLE');
    expect(response.body.error.retryable).toBe(true);
    expect(response.body.proof).toBeUndefined();
  });

  it('reports an honest extraction stage when degradation happened', async () => {
    const config = testConfig();
    const gemini = new FakeGemini();
    const withNote = validModelExtraction();
    withNote.documents[0]!.note = 'some pages hard to read';
    gemini.enqueueValid(withNote);

    const response = await extract(buildTestApp({ config, manifest: fixture.manifest, gemini }));
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('partial');
    expect(response.body.notices.join(' ')).toContain('Provider note');
  });
});
