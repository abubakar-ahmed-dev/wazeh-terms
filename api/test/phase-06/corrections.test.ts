import { describe, expect, it } from 'vitest';
import request from 'supertest';

import { buildTestApp } from '../phase-03/helpers.js';
import { issuedPayload, salaryDocument, signedReview } from './helpers.js';

const app = buildTestApp({});
const pair = () => issuedPayload([salaryDocument('offer', '2400.00'), salaryDocument('contract', '1800.00')]);

describe('correction validation (API.md §8 check 2)', () => {
  it('rejects corrections referencing unknown documents, fields, or instances', async () => {
    const base = [
      { documentId: 'doc-offer', fieldKey: 'basic_salary', instanceId: 'basic_salary:0', state: 'present', value: null },
    ];

    const unknownDoc = signedReview(pair(), [{ ...base[0]!, documentId: 'doc-nowhere', value: base[0]!.value }]);
    expect((await request(app).post('/api/v1/analyses').send(unknownDoc)).body.error.code).toBe('INVALID_CORRECTION');

    const unknownField = signedReview(pair(), [{ ...base[0]!, fieldKey: 'nope_field' }]);
    expect((await request(app).post('/api/v1/analyses').send(unknownField)).body.error.code).toBe('INVALID_CORRECTION');

    const unknownInstance = signedReview(pair(), [{ ...base[0]!, instanceId: 'basic_salary:7' }]);
    const response = await request(app).post('/api/v1/analyses').send(unknownInstance);
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('INVALID_CORRECTION');
  });

  it('rejects duplicate correction targets', async () => {
    const correction = {
      documentId: 'doc-contract',
      fieldKey: 'basic_salary',
      instanceId: 'basic_salary:0',
      state: 'present',
      value: { kind: 'money', amount: '2000.00', currency: 'AED', frequency: 'monthly', component: 'basic_salary', payer: null },
    };
    const response = await request(app)
      .post('/api/v1/analyses')
      .send(signedReview(pair(), [correction, { ...correction }]));
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('INVALID_CORRECTION');
  });

  it('rejects invalid correction shapes and the 100-correction cap', async () => {
    const badState = signedReview(pair(), [{
      documentId: 'doc-contract', fieldKey: 'basic_salary', instanceId: 'basic_salary:0', state: 'absent',
      value: { kind: 'money', amount: '1', currency: 'AED', frequency: 'monthly', component: 'basic_salary', payer: null },
    }]);
    expect((await request(app).post('/api/v1/analyses').send(badState)).body.error.code).toBe('INVALID_CORRECTION');

    const cap = Array.from({ length: 101 }, (_, i) => ({
      documentId: 'doc-offer',
      fieldKey: 'basic_salary',
      instanceId: `basic_salary:${i}`,
      state: 'present',
      value: null,
    }));
    expect((await request(app).post('/api/v1/analyses').send(signedReview(pair(), cap))).body.error.code).toBe('INVALID_CORRECTION');
  });

  it('accepts a valid correction and never echoes the proof into the report', async () => {
    const correction = {
      documentId: 'doc-contract',
      fieldKey: 'basic_salary',
      instanceId: 'basic_salary:0',
      state: 'present',
      value: { kind: 'money', amount: '2400.00', currency: 'AED', frequency: 'monthly', component: 'basic_salary', payer: null },
    };
    const response = await request(app)
      .post('/api/v1/analyses')
      .send(signedReview(pair(), [correction]));
    expect(response.status).toBe(200);
    expect(response.body.proof).toBeUndefined();
  });
});
