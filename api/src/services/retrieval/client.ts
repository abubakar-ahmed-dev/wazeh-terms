/**
 * Context MCP client (docs/ADR-006, docs/TECHNICAL_ARCHITECTURE.md §3.2 step
 * 5). Verifies the endpoint is in Knowledge Base mode before any use: a
 * dataset-source endpoint exposes only dataset/GROQ tools, which would
 * displace the KB tools — that configuration fails as `wrong_mode` instead of
 * quietly degrading retrieval quality.
 */
import { McpTransportError, type McpTransport } from './transport.js';

export type McpClientStatus = 'ready' | 'wrong_mode' | 'unavailable';

export interface McpToolSummary {
  readonly name: string;
  readonly description?: string;
}

export interface McpClientInit {
  readonly status: McpClientStatus;
  /** Present only when `status === 'ready'`. */
  readonly kbTools?: readonly McpToolSummary[];
}

/** Knowledge Base tool names are discovered, never hardcoded. */
const KB_TOOL_PATTERN = /knowledge|(^|[-_.])kb([-_.]|$)|context[-_ ]?search/i;
/** Dataset-mode markers: only these and no KB tool ⇒ GROQ mode ⇒ wrong_mode. */
const DATASET_TOOL_PATTERN = /groq|dataset|query[-_ ]?documents|raw[-_ ]?query/i;

export async function initializeMcpClient(transport: McpTransport): Promise<McpClientInit> {
  let tools: unknown;
  try {
    await transport.request('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'wazeh-terms-api', version: '1.0' },
    });
    await transport.request('notifications/initialized', {});
    tools = await transport.request('tools/list', {});
  } catch (error) {
    if (error instanceof McpTransportError) {
      return { status: error.reason === 'malformed' ? 'wrong_mode' : 'unavailable' };
    }
    return { status: 'unavailable' };
  }

  const names = extractToolNames(tools);
  if (names === null) return { status: 'wrong_mode' };

  const kbTools = names
    .filter((name) => KB_TOOL_PATTERN.test(name))
    .map((name) => ({ name }));
  if (kbTools.length === 0) {
    // No Knowledge Base tool at all: either a dataset-source endpoint
    // (GROQ mode) or an unexpected toolset — both fail closed.
    return { status: 'wrong_mode' };
  }
  return { status: 'ready', kbTools };
}

function extractToolNames(tools: unknown): readonly string[] | null {
  if (!tools || typeof tools !== 'object') return null;
  const list = (tools as { tools?: unknown }).tools;
  if (!Array.isArray(list)) return null;
  const names: string[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') continue;
    const name = (entry as { name?: unknown }).name;
    if (typeof name === 'string' && name.length > 0 && name.length <= 200) names.push(name);
  }
  return names;
}

export function isDatasetOnlyTool(name: string): boolean {
  return DATASET_TOOL_PATTERN.test(name) && !KB_TOOL_PATTERN.test(name);
}

/** Bounded tools/call wrapper: names must come from the verified listing. */
export async function callKbTool(
  transport: McpTransport,
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  return transport.request('tools/call', { name: toolName, arguments: args });
}
