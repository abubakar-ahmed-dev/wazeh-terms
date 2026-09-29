/**
 * Canonical record reader (docs/DATABASE_SCHEMA.md §9 "Runtime eligibility",
 * docs/SOURCES.md §5): a narrowly scoped direct read of approved, current
 * rule revisions and source versions. MCP candidates are hints; only these
 * records can back a displayed concern. Plain fetch against the Content Lake
 * HTTP query endpoint — no SDK dependency.
 */

import { z } from 'zod';

export type CanonicalReadFailure =
  | 'unavailable'
  | 'not_found'
  | 'ambiguous_record'
  | 'schema_version_unsupported';

const SUPPORTED_SCHEMA_VERSION = 1;

const SanityDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected ISO date')
  .nullable();
const SanityDateTimeSchema = z.string().min(10).max(40).nullable();

export const CanonicalSourceSchema = z.strictObject({
  sourceKey: z.string().min(1).max(100),
  versionKey: z.string().min(1).max(100),
  title: z.string().min(1).max(300),
  evidenceClass: z.enum(['binding_official_rule', 'official_guidance', 'international_guidance']),
  jurisdiction: z.enum(['PK', 'AE', 'international']),
  officialUrl: z.string().url().max(2048),
  issuingAuthorityName: z.string().min(1).max(200),
  effectiveFrom: SanityDateSchema,
  effectiveTo: SanityDateSchema,
  recordStatus: z.enum(['current', 'superseded', 'historical', 'withdrawn']),
  reviewStatus: z.enum(['draft', 'approved', 'rejected']),
  retrievedAt: SanityDateTimeSchema,
  lastVerifiedAt: SanityDateTimeSchema,
  schemaVersion: z.number().int().min(1),
});
export type CanonicalSource = z.infer<typeof CanonicalSourceSchema>;

export const CanonicalRuleSchema = z.strictObject({
  ruleKey: z.string().min(1).max(100),
  revision: z.number().int().min(1),
  title: z.string().min(1).max(300),
  claimText: z.string().min(1).max(2000),
  topic: z.string().min(1).max(100),
  triggerKey: z.string().min(1).max(100).nullable(),
  ruleKind: z.enum(['obligation', 'prohibition', 'entitlement', 'guidance']),
  evidenceClass: z.enum(['binding_official_rule', 'official_guidance', 'international_guidance']),
  jurisdiction: z.enum(['PK', 'AE']),
  origin: z.enum(['PK', 'AE']),
  destination: z.enum(['PK', 'AE']),
  employmentRegime: z.enum(['uae_mainland_private', 'unknown', 'other']),
  workerCategory: z.enum(['non_domestic', 'domestic', 'unknown']),
  responsibleParty: z.enum(['worker', 'uae_employer', 'pakistan_recruiter', 'other', 'unknown']),
  conditions: z.array(z.string().max(500)).max(20),
  exceptions: z.array(z.string().max(500)).max(20),
  machineConditionKeys: z.array(z.string().min(1).max(100)).max(10),
  effectiveFrom: SanityDateSchema,
  effectiveTo: SanityDateSchema,
  currentGuidanceVerifiedAt: SanityDateTimeSchema,
  pinpoint: z.strictObject({
    label: z.string().min(1).max(200),
    page: z.number().int().min(1).optional(),
    clause: z.string().max(100).optional(),
    quote: z.string().min(1).max(2000),
  }),
  primarySource: CanonicalSourceSchema,
  plainEnglish: z.string().min(1).max(2000),
  sourceCheckedAt: SanityDateTimeSchema,
  recordStatus: z.enum(['current', 'superseded', 'historical', 'withdrawn']),
  reviewStatus: z.enum(['draft', 'approved', 'rejected']),
  schemaVersion: z.number().int().min(1),
});
export type CanonicalRule = z.infer<typeof CanonicalRuleSchema>;

export interface CanonicalRead {
  readonly ok: true;
  readonly rule: CanonicalRule;
  readonly source: CanonicalSource;
}
export interface CanonicalReadFailed {
  readonly ok: false;
  readonly reason: CanonicalReadFailure;
}

export interface ReaderOptions {
  readonly projectId: string;
  readonly dataset: string;
  readonly readToken: string | null;
  readonly timeoutMs: number;
  readonly fetchImpl?: typeof fetch;
}

const RULE_PROJECTION = /* groq */ `{
  ruleKey, revision, title, claimText, topic, triggerKey, ruleKind,
  evidenceClass, jurisdiction, origin, destination,
  employmentRegime, workerCategory, responsibleParty,
  conditions, exceptions, machineConditionKeys,
  effectiveFrom, effectiveTo, currentGuidanceVerifiedAt,
  pinpoint,
  plainEnglish, sourceCheckedAt, recordStatus, reviewStatus, schemaVersion,
  primarySource->{
    sourceKey, versionKey, title, evidenceClass, jurisdiction, officialUrl,
    "issuingAuthorityName": issuer->name,
    effectiveFrom, effectiveTo, recordStatus, reviewStatus,
    retrievedAt, lastVerifiedAt, schemaVersion
  }
}`;

const RULES_BY_KEY_QUERY = /* groq */ `*[
  _type == "rule" && ruleKey == $ruleKey &&
  reviewStatus == "approved" && recordStatus == "current"
] | order(revision desc)[0...2] ${RULE_PROJECTION}`;

const RULE_BY_KEY_AND_REVISION_QUERY = /* groq */ `*[
  _type == "rule" && ruleKey == $ruleKey && revision == $revision &&
  reviewStatus == "approved" && recordStatus == "current"
][0...2] ${RULE_PROJECTION}`;

/**
 * Read the one approved current revision for a candidate mapping. A pinned
 * revision that no longer matches an approved current record fails as
 * `not_found` — the eligibility gate reports it as a revision mismatch.
 */
export async function readCanonicalRule(
  options: ReaderOptions,
  ruleKey: string,
  revision: number | null,
): Promise<CanonicalRead | CanonicalReadFailed> {
  const raw = await runQuery(
    options,
    revision === null ? RULES_BY_KEY_QUERY : RULE_BY_KEY_AND_REVISION_QUERY,
    revision === null ? { ruleKey } : { ruleKey, revision },
  );
  if (!raw.ok) return raw;

  if (raw.result.length === 0) return { ok: false, reason: 'not_found' };
  if (raw.result.length > 1) return { ok: false, reason: 'ambiguous_record' };

  const parsed = CanonicalRuleSchema.safeParse(raw.result[0]);
  if (!parsed.success) return { ok: false, reason: 'schema_version_unsupported' };
  const rule = parsed.data;
  if (rule.schemaVersion > SUPPORTED_SCHEMA_VERSION) {
    return { ok: false, reason: 'schema_version_unsupported' };
  }
  return { ok: true, rule, source: rule.primarySource };
}

interface QueryOk {
  readonly ok: true;
  /** Already-JSON rows straight from the Content Lake; validated downstream. */
  readonly result: readonly unknown[];
}
interface QueryFailed {
  readonly ok: false;
  readonly reason: Extract<CanonicalReadFailure, 'unavailable'>;
}

async function runQuery(
  options: ReaderOptions,
  query: string,
  params: Record<string, string | number>,
): Promise<QueryOk | QueryFailed> {
  const search = new URLSearchParams({ query });
  for (const [key, value] of Object.entries(params)) {
    search.set(`$${key}`, JSON.stringify(value));
  }
  const url = `https://${options.projectId}.api.sanity.io/v2024-10-01/data/query/${options.dataset}?${search.toString()}`;

  let response: Response;
  try {
    response = await (options.fetchImpl ?? fetch)(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.readToken ? { Authorization: `Bearer ${options.readToken}` } : {}),
      },
      signal: AbortSignal.timeout(options.timeoutMs),
    });
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
  if (!response.ok) return { ok: false, reason: 'unavailable' };

  const body = (await response.json().catch(() => undefined)) as { result?: unknown } | undefined;
  if (!body || !Array.isArray(body.result)) return { ok: false, reason: 'unavailable' };
  return { ok: true, result: body.result };
}
