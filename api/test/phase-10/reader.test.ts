/**
 * Canonical record reader suite (plans/phase-10 §Test list item 10): the
 * Content Lake fetch path with an injected fetch — ambiguity, missing
 * records, schema versions, and transport failures all map to closed reasons.
 */
import { describe, expect, it } from 'vitest';

import { readCanonicalRule, type CanonicalRule } from '../../src/services/canonical/reader.js';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchCapture: { url?: string; headers?: unknown } = {};

function fetchWith(result: readonly unknown[], status = 200): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    fetchCapture.url = typeof input === 'string' ? input : input.toString();
    fetchCapture.headers = init?.headers;
    return jsonResponse(status, { queryMs: 1, result });
  }) as unknown as typeof fetch;
}

const validRuleRow = {
  ruleKey: 'ae-recruitment-costs-employer-bears',
  revision: 1,
  title: 'Employer bears recruitment costs',
  claimText: 'The employer bears the recruitment cost.',
  topic: 'worker_costs',
  triggerKey: 'worker_charge.payer_must_be_uae_employer',
  ruleKind: 'obligation',
  evidenceClass: 'binding_official_rule',
  jurisdiction: 'AE',
  origin: 'PK',
  destination: 'AE',
  employmentRegime: 'uae_mainland_private',
  workerCategory: 'non_domestic',
  responsibleParty: 'uae_employer',
  conditions: [],
  exceptions: [],
  machineConditionKeys: [],
  effectiveFrom: '2022-02-02',
  effectiveTo: null,
  currentGuidanceVerifiedAt: null,
  pinpoint: { label: 'Article 8(2)', quote: 'The employer shall bear the recruitment cost.' },
  plainEnglish: 'Plain explanation.',
  sourceCheckedAt: '2026-09-29T08:00:00.000Z',
  recordStatus: 'current',
  reviewStatus: 'approved',
  schemaVersion: 1,
  primarySource: {
    sourceKey: 'uae-federal-decree-law-33-2021',
    versionKey: 'mohre-pdf-2026',
    title: 'Federal Decree-Law No. 33 of 2021',
    evidenceClass: 'binding_official_rule',
    jurisdiction: 'AE',
    officialUrl: 'https://www.mohre.gov.ae/example.pdf',
    issuingAuthorityName: 'MOHRE',
    effectiveFrom: '2022-02-02',
    effectiveTo: null,
    recordStatus: 'current',
    reviewStatus: 'approved',
    retrievedAt: '2026-09-29T08:00:00.000Z',
    lastVerifiedAt: '2026-09-29T08:00:00.000Z',
    schemaVersion: 1,
  },
} satisfies CanonicalRule;

const options = {
  projectId: '8g0kllu0',
  dataset: 'production',
  readToken: null,
  timeoutMs: 2000,
};

describe('readCanonicalRule', () => {
  it('returns the single approved current rule with its primary source', async () => {
    const read = await readCanonicalRule({ ...options, fetchImpl: fetchWith([validRuleRow]) }, 'ae-recruitment-costs-employer-bears', null);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.rule.ruleKey).toBe('ae-recruitment-costs-employer-bears');
    expect(read.source.versionKey).toBe('mohre-pdf-2026');
    // Params travel as $-prefixed query arguments (URL-encoded).
    expect(decodeURIComponent(fetchCapture.url!)).toContain('$ruleKey=');
    expect(fetchCapture.url).toContain('/data/query/production');
  });

  it('pins the requested revision in the query', async () => {
    await readCanonicalRule({ ...options, fetchImpl: fetchWith([validRuleRow]) }, 'ae-recruitment-costs-employer-bears', 3);
    expect(decodeURIComponent(fetchCapture.url!)).toContain('$revision=');
  });

  it('reports not_found on an empty result', async () => {
    const read = await readCanonicalRule({ ...options, fetchImpl: fetchWith([]) }, 'missing-rule', null);
    expect(read).toEqual({ ok: false, reason: 'not_found' });
  });

  it('reports ambiguity when two approved current revisions exist', async () => {
    const read = await readCanonicalRule(
      { ...options, fetchImpl: fetchWith([validRuleRow, { ...validRuleRow, revision: 2 }]) },
      'ae-recruitment-costs-employer-bears',
      null,
    );
    expect(read).toEqual({ ok: false, reason: 'ambiguous_record' });
  });

  it('rejects an unsupported rule schema version', async () => {
    const read = await readCanonicalRule(
      { ...options, fetchImpl: fetchWith([{ ...validRuleRow, schemaVersion: 2 }]) },
      'ae-recruitment-costs-employer-bears',
      null,
    );
    expect(read).toEqual({ ok: false, reason: 'schema_version_unsupported' });
  });

  it('rejects a malformed row instead of guessing', async () => {
    const read = await readCanonicalRule(
      { ...options, fetchImpl: fetchWith([{ ruleKey: 'broken' }]) },
      'ae-recruitment-costs-employer-bears',
      null,
    );
    expect(read).toEqual({ ok: false, reason: 'schema_version_unsupported' });
  });

  it('maps HTTP errors and bad JSON to unavailable', async () => {
    const unauthorized = (async () => jsonResponse(401, { error: 'denied' })) as unknown as typeof fetch;
    expect(await readCanonicalRule({ ...options, fetchImpl: unauthorized }, 'k', null)).toEqual({
      ok: false,
      reason: 'unavailable',
    });

    const garbage = (async () => new Response('not json', { status: 200 })) as unknown as typeof fetch;
    expect(await readCanonicalRule({ ...options, fetchImpl: garbage }, 'k', null)).toEqual({
      ok: false,
      reason: 'unavailable',
    });

    const throws = (async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;
    expect(await readCanonicalRule({ ...options, fetchImpl: throws }, 'k', null)).toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });

  it('sends the read token only when configured', async () => {
    await readCanonicalRule({ ...options, readToken: 'secret-read-token', fetchImpl: fetchWith([validRuleRow]) }, 'k', null);
    expect((fetchCapture.headers as Record<string, string>).Authorization).toBe('Bearer secret-read-token');
  });
});
