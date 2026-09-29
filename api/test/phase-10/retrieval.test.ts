/**
 * Retrieval orchestration suite (plans/phase-10 §Test list items 1–3, 6–8):
 * fake transport + fake canonical reader — no network anywhere.
 */
import { describe, expect, it } from 'vitest';

import type { AppConfig } from '../../src/config.js';
import type { CanonicalRead, CanonicalReadFailed } from '../../src/services/canonical/reader.js';
import { createRetrievalService } from '../../src/services/analysis/retrieval.js';
import type { McpTransport } from '../../src/services/retrieval/transport.js';
import { isAllowlistedQueryPayload, kbSearchArguments } from '../../src/services/retrieval/query-builder.js';
import { testConfig } from '../phase-03/helpers.js';
import { document, field, money } from '../phase-05/helpers.js';
import { reconcileCorrections } from '../../src/services/analysis/reconcile.js';
import { validRuleRow } from './fixtures.js';

function sanityConfig(overrides: Partial<AppConfig['sanity']> = {}): AppConfig {
  const base = testConfig();
  return {
    ...base,
    sanity: {
      contextMcpUrl: 'https://mcp.example/sanity/context',
      organizationToken: 'org-token',
      projectId: '8g0kllu0',
      dataset: 'production',
      readToken: null,
      ...overrides,
    },
  };
}

/** Scripted MCP transport: records calls, answers per a canned queue. */
function fakeTransport(handlers: {
  toolsList?: unknown;
  onSearch?: (args: Record<string, unknown>) => unknown;
  onSearchThrow?: Error;
}): { transport: McpTransport; calls: Array<{ method: string; params: Record<string, unknown> }> } {
  const calls: Array<{ method: string; params: Record<string, unknown> }> = [];
  return {
    calls,
    transport: {
      async request(method: string, params: Record<string, unknown>) {
        calls.push({ method, params });
        if (method === 'initialize') return { protocolVersion: '2025-06-18' };
        if (method === 'notifications/initialized') return {};
        if (method === 'tools/list') {
          const list = handlers.toolsList ?? { tools: [{ name: 'kb_search' }, { name: 'kb_read' }] };
          return list;
        }
        if (method === 'tools/call') {
          if (handlers.onSearchThrow) throw handlers.onSearchThrow;
          return handlers.onSearch?.((params.arguments ?? {}) as Record<string, unknown>) ?? { content: [] };
        }
        return {};
      },
      close() {},
    },
  };
}

const readerOk = (rule = validRuleRow): CanonicalRead => {
  // The canonical reader output type expects full validation; tests feed a
  // prebuilt row through the gate via the service's reader hook.
  return { ok: true, rule, source: rule.primarySource } as unknown as CanonicalRead;
};

function workerChargeDocuments() {
  const offerFields = [
    field('visa_cost', 'present', money({ amount: '500.00', component: 'worker_charge', payer: 'worker' })),
  ];
  return {
    offer: { document: document('offer', offerFields), fields: offerFields },
    contract: undefined,
  };
}

const supportedInput = {
  scopeApplicability: 'supported' as const,
  analysisDate: new Date('2026-09-29T10:00:00Z'),
  deadlineMs: 8_000,
};

describe('mode verification', () => {
  it('fails as wrong_mode when no Knowledge Base tool exists', async () => {
    const { transport } = fakeTransport({ toolsList: { tools: [{ name: 'query_documents' }, { name: 'groq_query' }] } });
    const service = createRetrievalService({ config: sanityConfig(), transport, reader: () => Promise.resolve(readerOk()) });
    const outcome = await service.run({ ...supportedInput, reconciliation: reconcileCorrections([document('offer', workerChargeDocuments().offer.fields)], []) });
    expect(outcome.stage).toBe('failed');
    expect(outcome.disclosure).toContain('not in Knowledge Base mode');
    expect(outcome.sourceFindings).toEqual([]);
  });

  it('fails as unavailable when the endpoint errors', async () => {
    const { transport } = fakeTransport({ onSearchThrow: new Error('connection refused') });
    const service = createRetrievalService({ config: sanityConfig(), transport, reader: () => Promise.resolve(readerOk()) });
    const outcome = await service.run({ ...supportedInput, reconciliation: reconcileCorrections([document('offer', workerChargeDocuments().offer.fields)], []) });
    expect(outcome.stage).toBe('failed');
    expect(outcome.disclosure).toContain('could not be reached');
  });
});

describe('query sanitization', () => {
  it('outgoing payloads carry only allowlisted fact keys', () => {
    const query = {
      topic: 'worker_costs' as const,
      jurisdiction: 'AE' as const,
      employmentRegime: 'uae_mainland_private' as const,
      workerCategory: 'non_domestic' as const,
      responsibleParty: 'uae_employer' as const,
      effectiveDate: '2026-09-29',
    };
    expect(isAllowlistedQueryPayload(kbSearchArguments(query))).toBe(true);
    // Any injected personal field breaks the allowlist.
    expect(isAllowlistedQueryPayload({ ...kbSearchArguments(query), workerName: 'X' })).toBe(false);
  });

  it('search arguments never embed document text', async () => {
    let seen: Record<string, unknown> | undefined;
    const { transport } = fakeTransport({
      onSearch: (args) => {
        seen = args;
        return { content: [{ type: 'text', text: '[]' }] };
      },
    });
    const service = createRetrievalService({ config: sanityConfig(), transport, reader: () => Promise.resolve(readerOk()) });
    await service.run({ ...supportedInput, reconciliation: reconcileCorrections([document('offer', workerChargeDocuments().offer.fields)], []) });
    const serialized = JSON.stringify(seen);
    expect(serialized).not.toContain('500.00');
    expect(serialized).not.toContain('visa');
  });
});

describe('boundedness', () => {
  it('caps KB tool calls at the configured budget', async () => {
    const { transport, calls } = fakeTransport({
      onSearch: () => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              Array.from({ length: 10 }, (_, index) => ({
                entryId: `entry-${index}`,
                ruleKey: 'unknown-key',
                snippet: 's',
              })),
            ),
          },
        ],
      }),
    });
    let reads = 0;
    const config = sanityConfig();
    const reader = (): Promise<CanonicalReadFailed> => {
      reads += 1;
      return Promise.resolve({ ok: false, reason: 'not_found' });
    };
    const bounded = createRetrievalService({
      config: { ...config, retrieval: { ...config.retrieval, maxToolCalls: 3 } },
      transport,
      reader,
    });
    const outcome = await bounded.run({ ...supportedInput, reconciliation: reconcileCorrections([document('offer', workerChargeDocuments().offer.fields)], []) });
    const searchCalls = calls.filter((call) => call.method === 'tools/call').length;
    expect(searchCalls).toBeLessThanOrEqual(3);
    expect(reads).toBeLessThanOrEqual(3);
    expect(outcome.withheld.length).toBeLessThanOrEqual(3);
  });
});

describe('candidate mapping and gating', () => {
  it('produces a source-backed finding on the happy path', async () => {
    const entry = { entryId: 'kb-1', ruleKey: validRuleRow.ruleKey, revision: validRuleRow.revision, snippet: 's' };
    const { transport } = fakeTransport({ onSearch: () => ({ content: [{ type: 'text', text: JSON.stringify([entry]) }] }) });
    const service = createRetrievalService({
      config: sanityConfig(),
      transport,
      reader: () => Promise.resolve(readerOk()),
    });
    const outcome = await service.run({ ...supportedInput, reconciliation: reconcileCorrections([document('offer', workerChargeDocuments().offer.fields)], []) });
    expect(outcome.stage).toBe('completed');
    expect(outcome.sourceFindings).toHaveLength(1);
    expect(outcome.sourceFindings[0]!.category).toBe('source_backed_concern');
    expect(outcome.sourceFindings[0]!.source?.ruleKey).toBe(validRuleRow.ruleKey);
    expect(outcome.withheld).toEqual([]);
  });

  it('withholds an unmappable snippet without spending a canonical read', async () => {
    const { transport } = fakeTransport({ onSearch: () => ({ content: [{ type: 'text', text: 'prose only, no labelled key' }] }) });
    let reads = 0;
    const service = createRetrievalService({
      config: sanityConfig(),
      transport,
      reader: () => {
        reads += 1;
        return Promise.resolve(readerOk());
      },
    });
    const outcome = await service.run({ ...supportedInput, reconciliation: reconcileCorrections([document('offer', workerChargeDocuments().offer.fields)], []) });
    expect(reads).toBe(0);
    expect(outcome.withheld).toEqual([{ ruleKey: null, reason: 'unmappable_candidate' }]);
  });

  it('withholds a stale KB revision with its reason', async () => {
    const entry = { entryId: 'kb-1', ruleKey: validRuleRow.ruleKey, revision: 99, snippet: 's' };
    const { transport } = fakeTransport({ onSearch: () => ({ content: [{ type: 'text', text: JSON.stringify([entry]) }] }) });
    const service = createRetrievalService({
      config: sanityConfig(),
      transport,
      reader: () => Promise.resolve({ ok: false, reason: 'not_found' }),
    });
    const outcome = await service.run({ ...supportedInput, reconciliation: reconcileCorrections([document('offer', workerChargeDocuments().offer.fields)], []) });
    expect(outcome.withheld).toEqual([{ ruleKey: validRuleRow.ruleKey, reason: 'revision_mismatch' }]);
    expect(outcome.sourceFindings).toEqual([]);
  });

  it('keeps retrieval short-circuited when unconfigured or scope unsupported', async () => {
    const unconfigured = createRetrievalService({ config: sanityConfig(), transport: null, reader: null });
    const outcomeA = await unconfigured.run({ ...supportedInput, reconciliation: reconcileCorrections([document('offer', workerChargeDocuments().offer.fields)], []) });
    expect(outcomeA.stage).toBe('not_started');

    const { transport } = fakeTransport({});
    const service = createRetrievalService({ config: sanityConfig(), transport, reader: () => Promise.resolve(readerOk()) });
    const outcomeB = await service.run({
      ...supportedInput,
      scopeApplicability: 'unknown',
      reconciliation: reconcileCorrections([document('offer', workerChargeDocuments().offer.fields)], []),
    });
    expect(outcomeB.stage).toBe('not_started');
    expect(outcomeB.sourceFindings).toEqual([]);
  });
});

describe('known-answer check', () => {
  it('passes only when the expected rule key surfaces', async () => {
    const { verifyKnownAnswer } = await import('../../src/services/retrieval/known-answer.js');

    const good = fakeTransport({
      onSearch: () => ({
        content: [{ type: 'text', text: JSON.stringify([{ entryId: 'e', ruleKey: 'ae-recruitment-costs-employer-bears', snippet: 's' }]) }],
      }),
    });
    const pass = await verifyKnownAnswer(good.transport, { query: 'recruitment costs', expectRuleKey: 'ae-recruitment-costs-employer-bears' });
    expect(pass).toEqual({ ok: true, entryCount: 1 });

    const bad = fakeTransport({
      onSearch: () => ({ content: [{ type: 'text', text: JSON.stringify([{ entryId: 'e', ruleKey: 'other-rule', snippet: 's' }]) }] }),
    });
    const fail = await verifyKnownAnswer(bad.transport, { query: 'recruitment costs', expectRuleKey: 'ae-recruitment-costs-employer-bears' });
    expect(fail).toEqual({ ok: false, reason: 'rule_key_missing' });

    const wrongMode = fakeTransport({ toolsList: { tools: [{ name: 'groq_query' }] } });
    const modeFail = await verifyKnownAnswer(wrongMode.transport, { query: 'q', expectRuleKey: 'k' });
    expect(modeFail).toEqual({ ok: false, reason: 'wrong_mode' });
  });
});
