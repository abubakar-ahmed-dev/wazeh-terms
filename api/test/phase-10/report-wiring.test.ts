/**
 * HTTP-level wiring (plans/phase-10 §Test list items 1, 7, 8): a configured
 * app with a scripted RetrievalService surfaces gate-approved citations in
 * the report; an unconfigured app keeps the exact Phase 06 partial behavior;
 * the capabilities endpoint reports the real retrieval state.
 */
import { describe, expect, it } from 'vitest';
import request from 'supertest';

import { buildApp } from '../../src/server/app.js';
import type { RetrievalOutcome, RetrievalService } from '../../src/services/analysis/retrieval.js';
import { ALL_CLEAR_SUMMARY, PARTIAL_SUMMARY } from '../../src/services/analysis/report.js';
import type { AppConfig } from '../../src/config.js';
import { testConfig } from '../phase-03/helpers.js';
import { issuedPayload, salaryDocument, fieldFor, signedReview } from '../phase-06/helpers.js';
import { document } from '../phase-05/helpers.js';
import { validRuleRow } from './fixtures.js';

function configuredConfig(): AppConfig {
  const base = testConfig();
  return {
    ...base,
    sanity: {
      contextMcpUrl: 'https://mcp.example/sanity/context',
      organizationToken: 'org-token',
      projectId: '8g0kllu0',
      dataset: 'production',
      readToken: null,
    },
  };
}

function fakeRetrieval(outcome: Partial<RetrievalOutcome>): RetrievalService {
  return {
    run: async () => ({
      stage: 'completed',
      sourceFindings: [],
      withheld: [],
      ...outcome,
    }),
  };
}

function pairPayload() {
  const offer = salaryDocument('offer', '2500.00');
  const contract = salaryDocument('contract', '2200.00');
  return signedReview(issuedPayload([offer, contract]));
}

describe('configured retrieval flow', () => {
  it('surfaces a gate-approved source-backed concern with its citation', async () => {
    const citation = {
      ruleKey: validRuleRow.ruleKey,
      ruleRevision: validRuleRow.revision,
      sourceKey: validRuleRow.primarySource.sourceKey,
      versionKey: validRuleRow.primarySource.versionKey,
      issuingAuthority: validRuleRow.primarySource.issuingAuthorityName,
      officialUrl: validRuleRow.primarySource.officialUrl,
      pinpoint: validRuleRow.pinpoint,
      jurisdiction: 'AE' as const,
      responsibleParty: 'uae_employer',
      effectiveFrom: validRuleRow.effectiveFrom,
      effectiveTo: null,
      sourceCheckedAt: validRuleRow.sourceCheckedAt!,
      evidenceClass: 'binding_official_rule' as const,
    };
    const app = buildApp({
      config: configuredConfig(),
      gemini: { extract: async () => ({ ok: false, reason: 'unavailable', attempts: 0, providerMs: 0 }) },
      manifest: { rootDir: 'unused', entries: [] },
      retrieval: fakeRetrieval({
        stage: 'completed',
        sourceFindings: [
          {
            category: 'source_backed_concern',
            fieldKeys: ['visa_cost'],
            importance: 'high',
            explanation: 'The cited provision puts this charge on the employer.',
            documentEvidence: [],
            valueOrigins: ['document'],
            source: citation,
            uncertaintyReasons: [],
            suggestedQuestionOrStep: 'Ask the employer.',
          },
        ],
      }),
    });

    const response = await request(app).post('/api/v1/analyses').send(pairPayload());
    expect(response.status).toBe(200);
    expect(response.body.stages.retrieval).toBe('completed');
    expect(response.body.stages.applicability).toBe('completed');
    const concern = response.body.findings.find((finding: { category: string }) => finding.category === 'source_backed_concern');
    expect(concern).toBeDefined();
    expect(concern.source).toEqual(citation);
    // The mismatch finding stays intact alongside the rule-backed one.
    expect(response.body.findings.some((finding: { category: string }) => finding.category === 'document_mismatch')).toBe(true);
  });

  it('complete requires extraction + supported scope + clean retrieval', async () => {
    const app = buildApp({
      config: configuredConfig(),
      gemini: { extract: async () => ({ ok: false, reason: 'unavailable', attempts: 0, providerMs: 0 }) },
      manifest: { rootDir: 'unused', entries: [] },
      retrieval: fakeRetrieval({}),
    });
    const response = await request(app).post('/api/v1/analyses').send(pairPayload());
    // A mismatch exists, so the review is complete with findings.
    expect(response.body.status).toBe('complete');
    expect(response.body.summary).not.toBe(ALL_CLEAR_SUMMARY);
    expect(JSON.stringify(response.body.limitations)).not.toContain('not performed');
  });

  it('withheld candidates add a limitation and keep partial status', async () => {
    const app = buildApp({
      config: configuredConfig(),
      gemini: { extract: async () => ({ ok: false, reason: 'unavailable', attempts: 0, providerMs: 0 }) },
      manifest: { rootDir: 'unused', entries: [] },
      retrieval: fakeRetrieval({ withheld: [{ ruleKey: 'ae-recruitment-costs-employer-bears', reason: 'source_check_stale' }] }),
    });
    const response = await request(app).post('/api/v1/analyses').send(pairPayload());
    expect(response.body.status).toBe('partial');
    expect(JSON.stringify(response.body.limitations)).toContain('withheld');
    expect(JSON.stringify(response.body.findings)).not.toContain('source_backed_concern');
  });

  it('failed retrieval keeps the document findings in a 200 partial', async () => {
    const app = buildApp({
      config: configuredConfig(),
      gemini: { extract: async () => ({ ok: false, reason: 'unavailable', attempts: 0, providerMs: 0 }) },
      manifest: { rootDir: 'unused', entries: [] },
      retrieval: fakeRetrieval({ stage: 'failed', disclosure: 'The reference endpoint could not be reached, so no rule-backed concerns were checked.' }),
    });
    const response = await request(app).post('/api/v1/analyses').send(pairPayload());
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('partial');
    expect(response.body.stages.retrieval).toBe('failed');
    const mismatch = response.body.findings.find((finding: { category: string }) => finding.category === 'document_mismatch');
    expect(mismatch).toBeDefined();
  });

  it('capabilities reports the configured retrieval state', async () => {
    const configured = buildApp({
      config: configuredConfig(),
      gemini: { extract: async () => ({ ok: false, reason: 'unavailable', attempts: 0, providerMs: 0 }) },
      manifest: { rootDir: 'unused', entries: [] },
    });
    const response = await request(configured).get('/api/v1/capabilities');
    expect(response.body.sourceBackedChecks).toBe('available');

    const plain = buildApp({
      config: testConfig(),
      gemini: { extract: async () => ({ ok: false, reason: 'unavailable', attempts: 0, providerMs: 0 }) },
      manifest: { rootDir: 'unused', entries: [] },
    });
    const response2 = await request(plain).get('/api/v1/capabilities');
    expect(response2.body.sourceBackedChecks).toBe('unconfigured');
  });
});

describe('unconfigured regression (Phase 06 behavior byte-stable)', () => {
  it('keeps the exact partial report shape without a retrieval service', async () => {
    const app = buildApp({
      config: testConfig(),
      gemini: { extract: async () => ({ ok: false, reason: 'unavailable', attempts: 0, providerMs: 0 }) },
      manifest: { rootDir: 'unused', entries: [] },
    });
    const response = await request(app).post('/api/v1/analyses').send(pairPayload());
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('partial');
    expect(response.body.summary).toBe(PARTIAL_SUMMARY);
    expect(response.body.stages.retrieval).toBe('not_started');
    expect(response.body.stages.applicability).toBe('partial');
    expect(JSON.stringify(response.body.limitations)).toContain('official-source check was not performed');
    expect(response.body.coverage.omittedChecks).toEqual([
      'official-source rule review (no Knowledge Base endpoint configured)',
    ]);
  });

  it('a supported scope alone never marks applicability complete', async () => {
    const offer = salaryDocument('offer', '2500.00');
    const contract = salaryDocument('contract', '2500.00');
    const app = buildApp({
      config: testConfig(),
      gemini: { extract: async () => ({ ok: false, reason: 'unavailable', attempts: 0, providerMs: 0 }) },
      manifest: { rootDir: 'unused', entries: [] },
    });
    const response = await request(app)
      .post('/api/v1/analyses')
      .send(signedReview(issuedPayload([offer, contract])));
    expect(response.body.scopeApplicability).toBe('supported');
    expect(response.body.stages.applicability).toBe('partial');
    expect(response.body.status).toBe('partial');
  });

  it('an unreadable critical field keeps the report partial even with clean retrieval', async () => {
    const contract = salaryDocument('contract', '2500.00');
    const offer = document('offer', [fieldFor('basic_salary', 'unreadable', null, 'offer')]);
    const app = buildApp({
      config: configuredConfig(),
      gemini: { extract: async () => ({ ok: false, reason: 'unavailable', attempts: 0, providerMs: 0 }) },
      manifest: { rootDir: 'unused', entries: [] },
      retrieval: fakeRetrieval({}),
    });
    const response = await request(app)
      .post('/api/v1/analyses')
      .send(signedReview(issuedPayload([offer, contract])));
    expect(response.body.status).toBe('partial');
    expect(response.body.coverage.unreadableFieldKeys).toContain('basic_salary');
  });
});
