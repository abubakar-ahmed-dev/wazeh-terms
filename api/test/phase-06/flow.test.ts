import { describe, expect, it } from 'vitest';
import request from 'supertest';

import { buildTestApp } from '../phase-03/helpers.js';
import { fieldFor, issuedPayload, salaryDocument, signedReview } from './helpers.js';
import { ALL_CLEAR_SUMMARY, PARTIAL_SUMMARY } from '../../src/services/analysis/report.js';

const app = buildTestApp({});
const post = (body: string | object) => request(app).post('/api/v1/analyses').send(body);

describe('analysis flow (API.md §8 checks 1–3, 5)', () => {
  it('§8-1: a single document produces no comparison and comparison is not_applicable', async () => {
    const response = await post(signedReview(issuedPayload([salaryDocument('offer', '2400.00')])));
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('partial');
    expect(response.body.stages.comparison).toBe('not_applicable');
    expect(response.body.findings.filter((f: { category: string }) => f.category === 'document_mismatch')).toEqual([]);
    expect(response.body.scopeApplicability).toBe('supported');
    expect(response.body.coverage.documentIds).toEqual(['doc-offer']);
  });

  it('§8-1: two explicit different salary passages produce one deterministic mismatch', async () => {
    const response = await post(signedReview(issuedPayload([salaryDocument('offer', '2400.00'), salaryDocument('contract', '1800.00')])));
    expect(response.status).toBe(200);
    const mismatches = response.body.findings.filter((f: { category: string }) => f.category === 'document_mismatch');
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]!.comparisonRuleKey).toBe('money_equality');
    expect(mismatches[0]!.documentEvidence).toHaveLength(2);
    expect(mismatches[0]!.documentEvidence.map((e: { page: number }) => e.page)).toEqual([1, 1]);
    expect(mismatches[0]!.valueOrigins).toEqual(['document', 'document']);
    expect(response.body.stages.comparison).toBe('completed');
  });

  it('§8-3: a user-corrected side downgrades the result to a user-reported difference, never a mismatch', async () => {
    const correction = {
      documentId: 'doc-contract',
      fieldKey: 'basic_salary',
      instanceId: 'basic_salary:0',
      state: 'present',
      value: { kind: 'money', amount: '2400.00', currency: 'AED', frequency: 'monthly', component: 'basic_salary', payer: null },
    };
    const response = await post(signedReview(issuedPayload([salaryDocument('offer', '2400.00'), salaryDocument('contract', '1800.00')]), [correction]));
    expect(response.status).toBe(200);
    const mismatches = response.body.findings.filter((f: { category: string }) => f.category === 'document_mismatch');
    expect(mismatches).toEqual([]);
    const clarification = response.body.findings.find(
      (f: { uncertaintyReasons: string[] }) => f.uncertaintyReasons.includes('user_reported_difference'),
    );
    expect(clarification).toBeDefined();
    expect(clarification.valueOrigins).toEqual(['document', 'user']);
    expect(clarification.documentEvidence).toHaveLength(2);
    expect(clarification.comparisonRuleKey).toBeUndefined();
  });

  it('§8-3: a correction that keeps the difference stays unconfirmed', async () => {
    const correction = {
      documentId: 'doc-contract',
      fieldKey: 'basic_salary',
      instanceId: 'basic_salary:0',
      state: 'present',
      value: { kind: 'money', amount: '2000.00', currency: 'AED', frequency: 'monthly', component: 'basic_salary', payer: null },
    };
    const response = await post(signedReview(issuedPayload([salaryDocument('offer', '2400.00'), salaryDocument('contract', '1800.00')]), [correction]));
    const mismatches = response.body.findings.filter((f: { category: string }) => f.category === 'document_mismatch');
    expect(mismatches).toEqual([]);
    expect(
      response.body.findings.some((f: { uncertaintyReasons: string[] }) => f.uncertaintyReasons.includes('user_reported_difference')),
    ).toBe(true);
  });

  it('§8-5: retrieval is honestly not started and the report stays partial with document findings intact', async () => {
    const response = await post(signedReview(issuedPayload([salaryDocument('offer', '2400.00'), salaryDocument('contract', '1800.00')])));
    expect(response.body.stages.retrieval).toBe('not_started');
    expect(response.body.stages.applicability).toBe('partial');
    expect(response.body.status).toBe('partial');
    expect(response.body.findings.length).toBeGreaterThan(0);
    expect(JSON.stringify(response.body.limitations)).toContain('official-source check was not performed');
    expect(response.body.omittedChecks ?? response.body.coverage.omittedChecks).toEqual(
      response.body.coverage.omittedChecks,
    );
  });

  it('the all-clear sentence never appears on a partial report', async () => {
    for (const body of [
      signedReview(issuedPayload([salaryDocument('offer', '2400.00')])),
      signedReview(issuedPayload([salaryDocument('offer', '2400.00'), salaryDocument('contract', '1800.00')])),
    ]) {
      const response = await post(body);
      expect(response.body.summary).not.toBe(ALL_CLEAR_SUMMARY);
      expect(response.body.summary).toBe(PARTIAL_SUMMARY);
    }
  });

  it('scopeApplicability is unknown for unknown declarations and conflicting on contrary clues', async () => {
    const unknownScope = await post(
      signedReview(issuedPayload([salaryDocument('offer', '2400.00')], { declaredRegime: 'unknown', declaredWorkerCategory: 'unknown' })),
    );
    expect(unknownScope.body.scopeApplicability).toBe('unknown');
    expect(JSON.stringify(unknownScope.body.limitations)).toContain('category-specific rules were withheld');

    const domesticField = fieldFor(
      'job_title',
      'present',
      { kind: 'text', text: 'Domestic worker' },
      'contract',
      'Hired as a domestic worker in a private household',
    );
    const conflicting = await post(
      signedReview(issuedPayload([salaryDocument('offer', '2400.00'), salaryDocument('contract', '1800.00', [domesticField])])),
    );
    expect(conflicting.body.scopeApplicability).toBe('conflicting');
  });

  it('unreadable fields surface in coverage and keep the summary partial', async () => {
    const unreadable = fieldFor('basic_salary', 'unreadable', null, 'contract');
    const response = await post(
      signedReview(issuedPayload([salaryDocument('offer', '2400.00'), { ...salaryDocument('contract', '1800.00'), fields: [unreadable] }])),
    );
    expect(response.body.coverage.unreadableFieldKeys).toContain('basic_salary');
    expect(response.body.summary).not.toBe(ALL_CLEAR_SUMMARY);
  });
});
