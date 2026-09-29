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
 * Parse a KB tool result. Accepts a JSON array of structured entries or a
 * single text body; a bare text body yields one candidate with only a
 * snippet, which the gate will treat as unmappable unless the text carries a
 * labelled ruleKey/revision pair (data-only scan of the retrieved text).
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
    const parsed = RuleCandidateSchema.safeParse({
      entryId: `text-${hash(text)}`,
      ...extractLabelledIdentity(text),
      snippet: text.slice(0, 2000),
    });
    if (parsed.success && parsed.data.snippet.trim().length > 0) candidates.push(parsed.data);
    else dropped += 1;
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

/** Data-only scan for labelled identity fields inside retrieved prose. */
function extractLabelledIdentity(text: string): { ruleKey?: string; revision?: number } {
  const ruleKey = /\bruleKey\s*[:=]\s*"?([a-z0-9][a-z0-9._-]{0,99})"?/i.exec(text)?.[1];
  const revision = /\brevision\s*[:=]\s*"?(\d{1,4})"?/i.exec(text)?.[1];
  return {
    ...(ruleKey ? { ruleKey } : {}),
    ...(revision ? { revision: Number.parseInt(revision, 10) } : {}),
  };
}

function hash(text: string): string {
  // Deterministic non-crypto tag for provenance display only.
  let value = 0;
  for (let index = 0; index < text.length; index += 1) {
    value = (value * 31 + text.charCodeAt(index)) >>> 0;
  }
  return value.toString(36);
}
