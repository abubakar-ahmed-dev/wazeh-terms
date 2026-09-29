/**
 * Retrieval query builder (docs/TECHNICAL_ARCHITECTURE.md §3.2 step 5): the
 * outgoing query carries the KB address and a keyword line derived from
 * applicability facts only — never a name, raw clause, image, identifier, or
 * any part of the extraction. The payload shape matches the live
 * `knowledge_base_search` tool schema (knowledgeBase, query, return, limit).
 */

/** The only topics retrieval can ask about (mirror of the trigger registry). */
export const RETRIEVAL_TOPICS = ['worker_costs', 'pay'] as const;
export type RetrievalTopic = (typeof RETRIEVAL_TOPICS)[number];

export interface RetrievalQuery {
  readonly topic: RetrievalTopic;
  readonly jurisdiction: 'AE';
  readonly employmentRegime: 'uae_mainland_private';
  readonly workerCategory: 'non_domestic';
  readonly responsibleParty: 'uae_employer';
  /** Analysis date (ISO date), kept distinct from rule effective dates. */
  readonly effectiveDate: string;
}

const QUERY_KEYS: readonly string[] = ['knowledgeBase', 'query', 'return', 'limit'];

export function buildRetrievalQuery(topic: RetrievalTopic, analysisDate: Date): RetrievalQuery {
  return {
    topic,
    jurisdiction: 'AE',
    employmentRegime: 'uae_mainland_private',
    workerCategory: 'non_domestic',
    responsibleParty: 'uae_employer',
    effectiveDate: analysisDate.toISOString().slice(0, 10),
  };
}

/**
 * Search-tool arguments for a query. Matching is exact-word, so the keyword
 * line uses the controlled vocabulary tokens that appear in the projection
 * content. `return: 'entries'` so the gate can map ruleKey/revision labels.
 */
export function kbSearchArguments(
  query: RetrievalQuery,
  knowledgeBaseId: string,
): Record<string, unknown> {
  return {
    knowledgeBase: knowledgeBaseId,
    query: `${query.topic} ${query.jurisdiction} ${query.employmentRegime} ${query.workerCategory} ${query.responsibleParty}`,
    return: 'entries',
    limit: 5,
  };
}

/** Test/ops assertion helper: every key must come from the allowlist. */
export function isAllowlistedQueryPayload(payload: Record<string, unknown>): boolean {
  return (
    Object.keys(payload).every((key) => QUERY_KEYS.includes(key)) &&
    typeof payload.knowledgeBase === 'string' &&
    typeof payload.query === 'string' &&
    payload.query.length > 0
  );
}
