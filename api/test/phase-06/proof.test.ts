import { describe, expect, it } from 'vitest';
import request from 'supertest';

import { buildTestApp } from '../phase-03/helpers.js';
import { issuedPayload, SERVER_KEY, salaryDocument, signedReview } from './helpers.js';
import { signIssuedExtraction } from '../../src/contracts/index.js';

const app = buildTestApp({});
const pair = () => issuedPayload([salaryDocument('offer', '2400.00'), salaryDocument('contract', '1800.00')]);

async function post(body: string | object) {
  return request(app).post('/api/v1/analyses').send(body);
}

describe('proof verification (API.md §8 check 2)', () => {
  it('accepts a valid signed review', async () => {
    const response = await post(signedReview(pair()));
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('rejects a tampered payload with REVIEW_INVALID and no key detail', async () => {
    const issued = pair();
    const review = signedReview(issued);
    (review.issuedExtraction as typeof issued).documents[0]!.fields[0]!.value = {
      kind: 'money', amount: '9999.00', currency: 'AED', frequency: 'monthly', component: 'basic_salary', payer: null,
    };
    const response = await post(review);
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('REVIEW_INVALID');
    expect(response.body.error.message).not.toMatch(/hmac|key|signatur/i);
  });

  it('rejects tampered scope, digest, and expiry each as REVIEW_INVALID', async () => {
    for (const mutate of [
      (issued: ReturnType<typeof pair>) => { (issued.scope as { declaredRegime: string }).declaredRegime = 'unknown'; },
      (issued: ReturnType<typeof pair>) => { issued.documents[0]!.sha256 = 'b'.repeat(64); },
      (issued: ReturnType<typeof pair>) => { issued.expiresAt = '2027-01-01T00:00:00.000Z'; },
    ] as const) {
      const review = signedReview(pair());
      mutate(review.issuedExtraction as ReturnType<typeof pair>);
      const response = await post(review);
      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('REVIEW_INVALID');
    }
  });

  it('rejects an unknown keyId without leaking validation detail', async () => {
    const issued = pair();
    const review = signedReview(issued);
    review.proof = { keyId: 'other-key', signature: 'A'.repeat(43) };
    const response = await post(review);
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('REVIEW_INVALID');
    expect(response.body.error.message).not.toMatch(/allowlist|keyId|secret/i);
  });

  it('treats a malformed proof as REVIEW_INVALID', async () => {
    const review = signedReview(pair());
    review.proof = { keyId: 'key-1', signature: 'short' };
    expect((await post(review)).status).toBe(422);
    expect((await post({ issuedExtraction: pair(), proof: null })).status).toBe(422);
  });

  it('answers 409 for an unsupported schema version (signed)', async () => {
    const issued = pair();
    const wrongVersion = { ...issued, schemaVersion: 2 as unknown as 1 };
    const review = {
      issuedExtraction: wrongVersion,
      proof: signIssuedExtraction(wrongVersion, SERVER_KEY),
      corrections: [],
    };
    const response = await post(review);
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('REVIEW_VERSION_UNSUPPORTED');
  });

  it('answers 410 for an expired proof', async () => {
    const issued = pair();
    const past = new Date(Date.now() - 60 * 1000).toISOString();
    const older = { ...issued, issuedAt: new Date(Date.now() - 120 * 1000).toISOString(), expiresAt: past };
    const review = {
      issuedExtraction: older,
      proof: signIssuedExtraction(older, SERVER_KEY),
      corrections: [],
    };
    const response = await post(review);
    expect(response.status).toBe(410);
    expect(response.body.error.code).toBe('REVIEW_EXPIRED');
  });

  it('answers 400 for a malformed body', async () => {
    expect((await post({ nope: true })).status).toBe(400);
    expect((await post({ issuedExtraction: 'text', proof: {} })).status).toBe(400);
  });
});
