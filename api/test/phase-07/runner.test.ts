import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';

import type { IssuedExtractionV1 } from '../../src/contracts/index.js';
import { AnalysisResponseSchema, signIssuedExtraction, type AnalysisResponse } from '../../src/contracts/index.js';
import { buildIssuedPayload } from '../../src/corpus/generator.js';
import { buildTestApp } from '../phase-03/helpers.js';
import { SERVER_KEY } from '../phase-06/helpers.js';
import { CASE_IDS, CORPUS_ROOT, loadTruth } from './truth-schema.test.js';

let app: ReturnType<typeof buildTestApp>;
const reports = new Map<string, AnalysisResponse>();

beforeAll(async () => {
  app = buildTestApp({});
  for (const caseId of CASE_IDS) {
    const truth = loadTruth(caseId);
    const documents = JSON.parse(
      readFileSync(path.join(CORPUS_ROOT, caseId, 'extracted.json'), 'utf8'),
    ) as ReturnType<typeof import('../../src/corpus/generator.js').buildExtractionFixture>;
    const issued: IssuedExtractionV1 = buildIssuedPayload(truth, documents);
    const response = await request(app)
      .post('/api/v1/analyses')
      .send({
        issuedExtraction: issued,
        proof: signIssuedExtraction(issued, SERVER_KEY),
        corrections: [],
      });
    expect(response.status, `${caseId} analyses failed`).toBe(200);
    reports.set(caseId, AnalysisResponseSchema.parse(response.body));
  }
});

function report(caseId: string): AnalysisResponse {
  return reports.get(caseId)!;
}

function categoriesOf(caseId: string): string[] {
  return report(caseId).findings.map((finding) => finding.category);
}

describe('corpus runner (fixture extraction → analyses → truth assertions)', () => {
  it('every report stays inside its allowed categories', () => {
    for (const caseId of CASE_IDS) {
      const truth = loadTruth(caseId);
      const allowed = new Set<string>(truth.allowedFindingCategories);
      for (const category of categoriesOf(caseId)) {
        expect(allowed.has(category), `${caseId}: unexpected category ${category}`).toBe(true);
      }
    }
  });

  it('forbidden categories never appear (abstention safety)', () => {
    for (const caseId of CASE_IDS) {
      const truth = loadTruth(caseId);
      const categories = categoriesOf(caseId);
      for (const forbidden of truth.forbiddenFindingCategories as readonly string[]) {
        expect(categories, caseId).not.toContain(forbidden);
      }
    }
  });

  it('mismatch findings always carry two passages and a comparison rule', () => {
    for (const caseId of CASE_IDS) {
      for (const finding of report(caseId).findings) {
        if (finding.category !== 'document_mismatch') continue;
        expect(finding.documentEvidence, caseId).toHaveLength(2);
        expect(finding.comparisonRuleKey, caseId).toBeDefined();
      }
    }
  });

  it('consistent pairs emit zero mismatches', () => {
    for (const consistent of ['TC-001', 'TC-003', 'TC-004', 'TC-005']) {
      expect(categoriesOf(consistent), consistent).not.toContain('document_mismatch');
    }
  });

  it('every seeded value difference surfaces as a mismatch for its field', () => {
    const pairs: Array<[string, string]> = [
      ['TC-002', 'basic_salary'],
      ['TC-002', 'stated_total_pay'],
      ['TC-006', 'basic_salary'],
      ['TC-007', 'stated_total_pay'],
      ['TC-008', 'job_title'],
      ['TC-009', 'start_date'],
      ['TC-009', 'contract_duration'],
      ['TC-010', 'overtime_terms'],
      ['TC-012', 'deduction_item'],
    ];
    for (const [caseId, fieldKey] of pairs) {
      const finding = report(caseId).findings.find(
        (candidate) => candidate.fieldKeys.includes(fieldKey) && candidate.category === 'document_mismatch',
      );
      expect(finding, `${caseId}: no mismatch for ${fieldKey}`).toBeDefined();
    }
  });

  it('TC-011 benefit status yields a mismatch or clarification, never silence', () => {
    const categories = categoriesOf('TC-011').filter((category) =>
      ['document_mismatch', 'needs_clarification'].includes(category),
    );
    expect(categories.length).toBeGreaterThanOrEqual(1);
  });

  it('TC-013 emits missing_information for the absent term', () => {
    const finding = report('TC-013').findings.find(
      (candidate) => candidate.fieldKeys.includes('notice_terms'),
    );
    expect(finding?.category).toBe('missing_information');
  });

  it('TC-014: single document — comparison not applicable, unreadable coverage, no fabricated absence', () => {
    const body = report('TC-014');
    expect(body.stages.comparison).toBe('not_applicable');
    expect(body.coverage.documentIds).toHaveLength(1);
    expect(body.coverage.unreadableFieldKeys).toContain('basic_salary');
    expect(categoriesOf('TC-014')).not.toContain('missing_information');
  });

  it('TC-015: embedded instructions are data — no seeded-value effect, no injected content', () => {
    const body = report('TC-015');
    // Missing-information findings for unpinned important keys are expected;
    // what must never happen: a mismatch, a 9999 salary, or instruction text.
    expect(categoriesOf('TC-015')).not.toContain('document_mismatch');
    expect(categoriesOf('TC-015')).not.toContain('source_backed_concern');
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('9999');
    expect(serialized).not.toContain('SYSTEM INSTRUCTION');
    expect(serialized).not.toContain('NOTE TO AUTOMATED SYSTEMS');
  });

  it('every report is an honest partial with the D8 disclosure and no all-clear line', () => {
    for (const caseId of CASE_IDS) {
      const body = report(caseId);
      expect(body.status, caseId).toBe('partial');
      expect(body.stages.retrieval, caseId).toBe('not_started');
      expect(body.summary, caseId).not.toContain('No concern detected');
      expect(JSON.stringify(body.limitations), caseId).toContain('official-source check was not performed');
    }
  });

  it('TC-012 asserts the document-check layer only (no rule claims)', () => {
    const truth = loadTruth('TC-012');
    expect(truth.requiredRuleRefs).toEqual([]);
    expect(categoriesOf('TC-012')).not.toContain('source_backed_concern');
  });
});
