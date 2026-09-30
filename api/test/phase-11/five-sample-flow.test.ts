import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import request from 'supertest';

import { loadBundledSampleManifest, type SampleManifest } from '../../src/content/samples-manifest.js';
import { buildApp } from '../../src/server/app.js';
import { ModelExtractionSchema, type ModelExtraction } from '../../src/services/extraction/model-output.js';
import type { GeminiExtractionRequest, GeminiExtractionService } from '../../src/services/gemini/types.js';
import { testConfig } from '../phase-03/helpers.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const corpusDir = path.resolve(here, '../../../test-corpus');

interface RenderedReport {
  readonly status: string;
  readonly summary: string;
  readonly stages: Record<string, string>;
  readonly coverage: {
    readonly unreadableFieldKeys: readonly string[];
  };
  readonly findings: ReadonlyArray<{
    readonly category: string;
    readonly fieldKeys: readonly string[];
  }>;
}

function fixtureSha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function buildCaseIndex(manifest: SampleManifest): Map<string, string> {
  const index = new Map<string, string>();
  for (const entry of manifest.entries) {
    for (const document of entry.documents) {
      index.set(fixtureSha256(path.join(manifest.rootDir, entry.sampleCaseId, document.file)), entry.sampleCaseId);
    }
  }
  return index;
}

function modelExtractionFor(sampleCaseId: string): ModelExtraction {
  const raw = JSON.parse(readFileSync(path.join(corpusDir, sampleCaseId, 'extracted.json'), 'utf8')) as Record<
    string,
    { role: 'offer' | 'contract'; fields?: unknown[]; unreadablePages?: number[]; note?: string }
  >;
  return ModelExtractionSchema.parse({
    documents: Object.values(raw).map((document) => ({
      role: document.role,
      fields: document.fields ?? [],
      unreadablePages: document.unreadablePages ?? [],
      note: document.note,
    })),
  });
}

function fakeGemini(manifest: SampleManifest): GeminiExtractionService {
  const index = buildCaseIndex(manifest);
  return {
    async extract(request: GeminiExtractionRequest) {
      const started = Date.now();
      const sampleCaseId = request.documents
        .map((document) => index.get(createHash('sha256').update(Buffer.from(document.pdfBase64, 'base64')).digest('hex')))
        .find((caseId): caseId is string => caseId !== undefined);
      if (!sampleCaseId) {
        return { ok: false, reason: 'unavailable', attempts: 1, providerMs: Date.now() - started };
      }
      return { ok: true, modelJson: modelExtractionFor(sampleCaseId), attempts: 1, providerMs: Date.now() - started };
    },
  };
}

describe('Phase 11 five-sample local flow', () => {
  const manifest = loadBundledSampleManifest();
  const app = buildApp({
    config: testConfig(),
    gemini: fakeGemini(manifest),
    manifest,
  });

  it('lists exactly the five allowlisted fictional production samples', async () => {
    const response = await request(app).get('/api/v1/samples');
    expect(response.status).toBe(200);
    expect(response.body.samples.map((sample: { sampleCaseId: string }) => sample.sampleCaseId)).toEqual([
      'TC-001',
      'TC-002',
      'TC-012',
      'TC-013',
      'TC-014',
    ]);
    for (const sample of response.body.samples as Array<{ documents: Array<{ previewUrl: string }> }>) {
      for (const document of sample.documents) {
        expect(document.previewUrl).toMatch(/^\/samples\/TC-\d{3}\//);
      }
    }
  });

  it('runs choose -> extract -> analyze for all five samples with truthful outcomes', async () => {
    const reports = new Map<string, RenderedReport>();
    for (const sampleCaseId of ['TC-001', 'TC-002', 'TC-012', 'TC-013', 'TC-014']) {
      const extraction = await request(app).post('/api/v1/extractions').send({ sampleCaseId });
      expect(extraction.status, `${sampleCaseId} extraction`).toBe(200);
      expect(extraction.body.issuedExtraction.sourceMode).toBe('sample');
      expect(extraction.body.proof.signature).toMatch(/^[A-Za-z0-9_-]{43}$/);

      const analysis = await request(app)
        .post('/api/v1/analyses')
        .send({
          issuedExtraction: extraction.body.issuedExtraction,
          proof: extraction.body.proof,
          corrections: [],
        });
      expect(analysis.status, `${sampleCaseId} analysis`).toBe(200);
      reports.set(sampleCaseId, analysis.body as RenderedReport);
    }

    expect(reports.get('TC-001')!.findings.some((finding: { category: string }) => finding.category === 'document_mismatch')).toBe(false);
    expect(reports.get('TC-002')!.findings.some((finding) => finding.category === 'document_mismatch' && finding.fieldKeys.includes('basic_salary'))).toBe(true);
    expect(reports.get('TC-012')!.findings.some((finding) => finding.category === 'document_mismatch' && finding.fieldKeys.includes('deduction_item'))).toBe(true);
    expect(reports.get('TC-013')!.findings.some((finding) => finding.category === 'missing_information' && finding.fieldKeys.includes('notice_terms'))).toBe(true);
    expect(reports.get('TC-014')!.stages.comparison).toBe('not_applicable');
    expect(reports.get('TC-014')!.coverage.unreadableFieldKeys).toContain('basic_salary');

    for (const [sampleCaseId, report] of reports) {
      expect(report.status, sampleCaseId).toBe('partial');
      expect(report.summary, sampleCaseId).not.toContain('No concern detected');
      expect(JSON.stringify(report), sampleCaseId).not.toContain('safe');
      expect(JSON.stringify(report), sampleCaseId).not.toContain('fraudulent');
    }
  });

  it('keeps reserved /samples paths outside the SPA fallback', async () => {
    expect((await request(app).get('/samples/')).status).toBe(404);
    expect((await request(app).get('/samples/TC-001/offer.pdf')).headers['content-type']).toContain('application/pdf');
  });
});
