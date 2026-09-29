import { describe, expect, it } from 'vitest';

import { IssuedExtractionV1Schema } from '../../src/contracts/index.js';
import { mapModelExtraction, type MapperDocumentInput } from '../../src/services/extraction/mapper.js';

const pageTexts = ['Basic salary AED 2,400 per month stated clearly', null];

function input(overrides: Partial<MapperDocumentInput> = {}): MapperDocumentInput {
  return {
    role: 'offer',
    pdfBytes: Buffer.from('%PDF-fixture'),
    pageCount: 2,
    pageTexts,
    ...overrides,
  };
}

function modelField(quote: string, page: number) {
  return {
    fieldKey: 'basic_salary',
    state: 'present' as const,
    rawText: quote,
    value: { kind: 'money', amount: '2400.00', currency: 'AED', frequency: 'monthly', component: 'basic_salary', payer: null },
    evidence: [{ page, quote }],
    qualityNotes: [],
  };
}

describe('mapper evidence verification', () => {
  it('marks quotes present in the text layer as matched_text', () => {
    const result = mapModelExtraction(
      [{ role: 'offer', fields: [modelField('Basic salary AED 2,400 per month', 1)] }],
      [input()],
    );
    const field = result.documents[0]!.document.fields[0]!;
    expect(field.evidence[0]!.verification).toBe('matched_text');
    expect(field.state).toBe('present');
    expect(result.status).toBe('complete');
  });

  it('keeps unmatched quotes as model_transcription with notes, without degrading status', () => {
    const result = mapModelExtraction(
      [{ role: 'offer', fields: [modelField('Invented generous bonus', 1)] }],
      [input()],
    );
    const field = result.documents[0]!.document.fields[0]!;
    expect(field.evidence[0]!.verification).toBe('model_transcription');
    expect(field.qualityNotes).toContain('passage_not_matched_on_claimed_page');
    expect(field.state).toBe('present');
    expect(result.status).toBe('complete');
  });

  it('flags an unmatched present field on a textless page as unverified transcription', () => {
    const result = mapModelExtraction(
      [{ role: 'offer', fields: [modelField('Scanned bonus wording', 2)] }],
      [input()],
    );
    const field = result.documents[0]!.document.fields[0]!;
    expect(field.evidence[0]!.verification).toBe('model_transcription');
    expect(field.qualityNotes).toContain('claimed_page_has_no_text_layer');
    expect(field.qualityNotes).toContain('transcription_unverified_scan');
    expect(field.state).toBe('present');
  });

  it('still validates the issued payload against the phase-02 schemas', () => {
    const result = mapModelExtraction(
      [{ role: 'offer', fields: [modelField('Basic salary AED 2,400 per month', 1)] }],
      [input()],
    );
    const issued = {
      schemaVersion: 1,
      issuedAt: '2026-09-29T10:00:00.000Z',
      expiresAt: '2026-09-29T10:30:00.000Z',
      scope: { origin: 'PK', destination: 'AE', declaredRegime: 'uae_mainland_private', declaredWorkerCategory: 'non_domestic' },
      sourceMode: 'sample',
      documents: result.documents.map((entry) => entry.document),
    };
    expect(IssuedExtractionV1Schema.safeParse(issued).success).toBe(true);
  });
});
