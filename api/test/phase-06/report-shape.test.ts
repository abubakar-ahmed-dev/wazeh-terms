import { describe, expect, it } from 'vitest';
import request from 'supertest';

import { AnalysisResponseSchema, type IssuedExtractionV1 } from '../../src/contracts/index.js';
import { OFFICIAL_NEXT_STEPS } from '../../src/services/analysis/next-steps.js';
import { buildTestApp } from '../phase-03/helpers.js';
import { issuedPayload, salaryDocument, signedReview } from './helpers.js';

const app = buildTestApp({});

describe('report shape (docs/API.md §6)', () => {
  it('every 200 response validates against the AnalysisResponse schema', async () => {
    const response = await request(app)
      .post('/api/v1/analyses')
      .send(signedReview(issuedPayload([salaryDocument('offer', '2400.00'), salaryDocument('contract', '1800.00')])));
    expect(response.status).toBe(200);
    const parsed = AnalysisResponseSchema.safeParse(response.body);
    expect(parsed.success, JSON.stringify(parsed.error?.issues ?? [])).toBe(true);
  });

  it('stages carry exactly the documented six keys', async () => {
    const response = await request(app)
      .post('/api/v1/analyses')
      .send(signedReview(issuedPayload([salaryDocument('offer', '2400.00')])));
    expect(Object.keys(response.body.stages).sort()).toEqual(
      ['applicability', 'comparison', 'explanation', 'extraction', 'retrieval', 'review'],
    );
  });

  it('official next steps come only from the server allowlist', async () => {
    const response = await request(app)
      .post('/api/v1/analyses')
      .send(signedReview(issuedPayload([salaryDocument('offer', '2400.00')])));
    const allowed = new Set(OFFICIAL_NEXT_STEPS.map((step) => step.url));
    for (const step of response.body.officialNextSteps as Array<{ url: string }>) {
      expect(allowed.has(step.url), step.url).toBe(true);
    }
  });

  it('partial reports always include the source-review limitation (D8 disclosure)', async () => {
    const issued: IssuedExtractionV1 = issuedPayload([salaryDocument('offer', '2400.00')]);
    const response = await request(app).post('/api/v1/analyses').send(signedReview(issued));
    const limitations = response.body.limitations as string[];
    expect(limitations.some((line) => line.includes('official-source check was not performed'))).toBe(true);
    expect(response.body.coverage.omittedChecks.join(' ')).toContain('official-source rule review');
  });
});
