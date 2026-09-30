import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import {
  FakeGemini,
  buildTestApp,
  writeTestManifest,
} from '../phase-03/helpers.js';

const fixture = await writeTestManifest();
afterAll(async () => {
  await fixture.cleanup();
});

describe('evidence verification through the API (fake Gemini, real text layer)', () => {
  it('returns matched_text for quotes drawn from the actual PDF text', async () => {
    const gemini = new FakeGemini();
    gemini.enqueueValid({
      documents: [
        {
          role: 'offer',
          fields: [
            {
              fieldKey: 'basic_salary',
              state: 'present',
              rawText: 'Basic salary AED 2,400 per month',
              value: { kind: 'money', amount: '2400.00', currency: 'AED', frequency: 'monthly', component: 'basic_salary', payer: null },
              evidence: [{ page: 1, quote: 'Basic salary AED 2,400 per month' }],
              qualityNotes: [],
            },
          ],
          unreadablePages: [],
          note: '',
        },
      ],
    });

    const response = await request(buildTestApp({ manifest: fixture.manifest, gemini }))
      .post('/api/v1/extractions')
      .send({ sampleCaseId: 'TC-TEXT' });

    expect(response.status).toBe(200);
    const offer = response.body.issuedExtraction.documents.find(
      (d: { role: string }) => d.role === 'offer',
    );
    const field = offer.fields.find((f: { fieldKey: string }) => f.fieldKey === 'basic_salary');
    expect(field.evidence[0].verification).toBe('matched_text');
    expect(field.qualityNotes).toEqual([]);
  });

  it('returns model_transcription with notes for invented quotes', async () => {
    const gemini = new FakeGemini();
    gemini.enqueueValid({
      documents: [
        {
          role: 'offer',
          fields: [
            {
              fieldKey: 'basic_salary',
              state: 'present',
              rawText: 'totally invented',
              value: { kind: 'money', amount: '9999.00', currency: 'AED', frequency: 'monthly', component: 'basic_salary', payer: null },
              evidence: [{ page: 1, quote: 'totally invented salary clause' }],
              qualityNotes: [],
            },
            {
              fieldKey: 'contract_duration',
              state: 'present',
              rawText: 'Contract duration six months',
              value: { kind: 'duration', amount: '6', unit: 'month' },
              evidence: [{ page: 1, quote: 'Contract duration six months' }],
              qualityNotes: [],
            },
          ],
          unreadablePages: [],
          note: '',
        },
      ],
    });

    const response = await request(buildTestApp({ manifest: fixture.manifest, gemini }))
      .post('/api/v1/extractions')
      .send({ sampleCaseId: 'TC-TEXT' });

    expect(response.status).toBe(200);
    const offer = response.body.issuedExtraction.documents.find(
      (d: { role: string }) => d.role === 'offer',
    );
    const salary = offer.fields.find((f: { fieldKey: string }) => f.fieldKey === 'basic_salary');
    expect(salary.evidence[0].verification).toBe('model_transcription');
    expect(salary.qualityNotes).toContain('passage_not_matched_on_claimed_page');
    // Wrong page: the passage lives on page 2, claimed on page 1.
    const duration = offer.fields.find((f: { fieldKey: string }) => f.fieldKey === 'contract_duration');
    expect(duration.evidence[0].verification).toBe('model_transcription');
    expect(duration.qualityNotes).toContain('passage_found_on_page_2');
    expect(duration.evidence[0].page).toBe(1);
  });
});
