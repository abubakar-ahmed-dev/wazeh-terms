/**
 * Retrieval query builder (docs/TECHNICAL_ARCHITECTURE.md §3.2 step 5): the
 * outgoing query carries topic and applicability facts only — never a name,
 * raw clause, image, identifier, or any part of the extraction. The payload
 * is a closed shape; a unit test asserts the exact key allowlist.
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
  /** Analysis date (ISO), used by the KB to consider temporal relevance. */
  readonly effectiveDate: string;
}

/** Root keys of the outgoing search payload; facts live under `filters`. */
const QUERY_ROOT_KEYS: readonly string[] = ['query', 'filters'];
const FILTER_KEYS: readonly string[] = [
  'topic',
  'jurisdiction',
  'employmentRegime',
  'workerCategory',
  'responsibleParty',
  'effectiveDate',
];

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
 * Search-tool arguments for a query. Grown from the closed fact shape only —
 * nothing else may enter the outgoing payload.
 */
export function kbSearchArguments(query: RetrievalQuery): Record<string, unknown> {
  return {
    query: `${query.topic} ${query.jurisdiction} ${query.employmentRegime} ${query.workerCategory}`,
    filters: {
      topic: query.topic,
      jurisdiction: query.jurisdiction,
      employmentRegime: query.employmentRegime,
      workerCategory: query.workerCategory,
      responsibleParty: query.responsibleParty,
      effectiveDate: query.effectiveDate,
    },
  };
}

/**
 * Test/ops assertion helper: the payload may carry only the fact query and
 * the closed filters object — anything else (names, excerpts, identifiers)
 * breaks the allowlist.
 */
export function isAllowlistedQueryPayload(payload: Record<string, unknown>): boolean {
  return Object.entries(payload).every(([key, value]) => {
    if (!QUERY_ROOT_KEYS.includes(key)) return false;
    if (key === 'query') return typeof value === 'string';
    return (
      !!value &&
      typeof value === 'object' &&
      Object.keys(value as Record<string, unknown>).every((filterKey) => FILTER_KEYS.includes(filterKey))
    );
  });
}
