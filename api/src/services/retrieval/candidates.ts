/**
 * RuleCandidate parsing (docs/DATABASE_SCHEMA.md §1: the Knowledge Base is
 * rebuildable retrieval output, not a canonical database). Retrieved text is
 * untrusted data: everything is validated through a schema before the gate
 * sees it, and a KB entry ID is never treated as a rule ID.
 */
import { z } from 'zod';

export const RuleCandidateSchema = z.strictObject({
  /** Generated KB entry identity — provenance only, never a rule ID. */
  entryId: z.string().min(1).max(200),
  ruleKey: z.string().min(1).max(100).optional(),
  revision: z.number().int().min(1).optional(),
  sourceKey: z.string().min(1).max(100).optional(),
  versionKey: z.string().min(1).max(100).optional(),
  /** Bounded excerpt of the retrieved text; data, never instructions. */
  snippet: z.string().min(1).max(2000),
});
export type RuleCandidate = z.infer<typeof RuleCandidateSchema>;

export interface ParsedToolResult {
  readonly candidates: readonly RuleCandidate[];
  /** Candidate-shaped items dropped for malformed content. */
  readonly dropped: number;
}

/**
 * Parse a KB tool result. Accepts a JSON array of structured entries or text
 * bodies. KB renderers prose-ify records, so for text bodies we scan —
 * data-only, deterministic — for stable identity tokens (`ae-…`/`pk-…` key
 * shapes) and emit one candidate per token. Every candidate is still mapped
 * through the canonical reader + gate; a token that is not a rule key simply
 * fails the canonical read. Multiple tokens never merge into one claim.
 */
export function parseKbToolResult(result: unknown): ParsedToolResult {
  const texts = extractTexts(result);
  const candidates: RuleCandidate[] = [];
  let dropped = 0;

  for (const text of texts) {
    const structured = tryParseJsonArray(text);
    if (structured) {
      for (const entry of structured) {
        const parsed = RuleCandidateSchema.safeParse(entry);
        if (parsed.success) candidates.push(parsed.data);
        else dropped += 1;
      }
      continue;
    }

    const identity = extractIdentityTokens(text);
    if (identity.length === 0) {
      const parsed = RuleCandidateSchema.safeParse({
        entryId: `text-${hash(text)}`,
        snippet: text.slice(0, 2000),
      });
      if (parsed.success && parsed.data.snippet.trim().length > 0) candidates.push(parsed.data);
      else dropped += 1;
      continue;
    }
    for (const ruleKey of identity) {
      const parsed = RuleCandidateSchema.safeParse({
        entryId: `text-${hash(text)}#${ruleKey}`,
        ruleKey,
        snippet: text.slice(0, 2000),
      });
      if (parsed.success) candidates.push(parsed.data);
      else dropped += 1;
    }
  }

  return { candidates, dropped };
}

function extractTexts(result: unknown): readonly string[] {
  // MCP tools/call result: { content: [{ type: 'text', text }, ...] }.
  if (result && typeof result === 'object') {
    const content = (result as { content?: unknown }).content;
    if (Array.isArray(content)) {
      return content
        .filter(
          (item): item is { type: 'text'; text: string } =>
            !!item &&
            typeof item === 'object' &&
            (item as { type?: unknown }).type === 'text' &&
            typeof (item as { text?: unknown }).text === 'string',
        )
        .map((item) => item.text);
    }
  }
  if (typeof result === 'string') return [result];
  return [];
}

function tryParseJsonArray(text: string): readonly unknown[] | null {
  if (!text.trimStart().startsWith('[')) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Data-only scan for stable key tokens in retrieved prose (seed keys look
 * like `ae-recruitment-costs-employer-bears`). Word-bounded, lowercase
 * hyphenated ids with an `ae-`/`pk-` prefix; deduplicated in first-seen order.
 */
export function extractIdentityTokens(text: string): readonly string[] {
  const matches = text.match(/\b(?:ae|pk)-[a-z0-9]+(?:-[a-z0-9]+)*\b/g) ?? [];
  return [...new Set(matches)];
}

export interface PinpointKey {
  readonly ruleKey: string;
  readonly revision: number;
  readonly pinpointQuote: string;
}

const normalizeForMatch = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[‐-―]/g, '-')
    .replace(/[‘’“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Map a rendered KB entry back to canonical rules by their reviewed
 * pinpoint quotes — exact reviewed passage, data-only containment against
 * the normalized entry text. Renderers paraphrase metadata and drop stable
 * key tokens, but the reviewed quote is the one string the entry must carry
 * to stand for the claim at all.
 */
export function mapEntryByPinpoint(entryText: string, knownRules: readonly PinpointKey[]): readonly RuleCandidate[] {
  const normalized = normalizeForMatch(entryText);
  return knownRules
    .filter((rule) => normalized.includes(normalizeForMatch(rule.pinpointQuote)))
    .map((rule) => ({
      entryId: `pinpoint-${hash(rule.ruleKey)}`,
      ruleKey: rule.ruleKey,
      revision: rule.revision,
      snippet: entryText.slice(0, 2000),
    }));
}

function hash(text: string): string {
  // Deterministic non-crypto tag for provenance display only.
  let value = 0;
  for (let index = 0; index < text.length; index += 1) {
    value = (value * 31 + text.charCodeAt(index)) >>> 0;
  }
  return value.toString(36);
}
