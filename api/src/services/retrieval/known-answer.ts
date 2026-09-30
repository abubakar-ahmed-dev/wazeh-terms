/**
 * Known-answer retrieval check (docs/SOURCES.md §4 step 7, §5 KB lag): an
 * ops/deploy verification — never a per-request call. A seeded query must
 * surface an entry carrying the expected canonical ruleKey before any claim
 * of a working retrieval path is made.
 */
import { initializeMcpClient, pickKbSearchTool } from './client.js';
import { mapEntryByPinpoint, type PinpointKey } from './candidates.js';
import { kbSearchArguments } from './query-builder.js';
import type { McpTransport } from './transport.js';

export interface KnownAnswerSeed {
  /** Natural-language query pointing at a known reviewed rule. */
  readonly query: string;
  /** The canonical ruleKey the result must carry. */
  readonly expectRuleKey: string;
  /** Nonsecret KB id addressed by the search tool. */
  readonly knowledgeBaseId: string;
  /** Approved pinpoints for entry→rule mapping (renderers drop key tokens). */
  readonly knownRules: readonly PinpointKey[];
}

export type KnownAnswerResult =
  | { readonly ok: true; readonly entryCount: number }
  | { readonly ok: false; readonly reason: 'unavailable' | 'wrong_mode' | 'no_entries' | 'rule_key_missing' };

export async function verifyKnownAnswer(
  transport: McpTransport,
  seed: KnownAnswerSeed,
): Promise<KnownAnswerResult> {
  const init = await initializeMcpClient(transport);
  if (init.status !== 'ready' || !init.kbTools?.length) {
    return { ok: false, reason: init.status === 'wrong_mode' ? 'wrong_mode' : 'unavailable' };
  }

  const facts = {
    topic: 'pay' as const,
    jurisdiction: 'AE' as const,
    employmentRegime: 'uae_mainland_private' as const,
    workerCategory: 'non_domestic' as const,
    responsibleParty: 'uae_employer' as const,
    effectiveDate: new Date().toISOString().slice(0, 10),
  };
  // The seed query replaces the fact-derived keyword line; the payload stays
  // inside the closed search-tool shape.
  const args = kbSearchArguments(facts, seed.knowledgeBaseId);
  args.query = seed.query;

  let result: unknown;
  try {
    result = await transport.request('tools/call', {
      name: pickKbSearchTool(init.kbTools)!.name,
      arguments: args,
    });
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  const texts = (result as { content?: Array<{ text?: string }> })?.content
    ?.map((item) => item.text ?? '')
    .filter((text) => text.length > 0) ?? [];
  if (texts.length === 0) return { ok: false, reason: 'no_entries' };
  // Map rendered entries back to canonical rules by reviewed pinpoint quote
  // (the same mapping the runtime orchestration uses).
  const mappedRuleKeys = new Set(
    texts.flatMap((text) => mapEntryByPinpoint(text, seed.knownRules).map((candidate) => candidate.ruleKey ?? '')),
  );
  const found = mappedRuleKeys.has(seed.expectRuleKey);
  return found ? { ok: true, entryCount: mappedRuleKeys.size } : { ok: false, reason: 'rule_key_missing' };
}
