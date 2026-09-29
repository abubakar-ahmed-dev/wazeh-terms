/**
 * MCP transport (docs/ADR-006, docs/TECHNICAL_ARCHITECTURE.md §3.2 step 5):
 * a minimal JSON-RPC 2.0 client for the application-facing Sanity Context MCP
 * endpoint. The endpoint must carry Knowledge Base sources only — a dataset
 * source selects GROQ mode and fails verification downstream, never silently.
 *
 * Like Gemini, retrieval lives behind a service interface; tests inject a
 * fake transport and no test touches the network.
 */

export interface McpTransport {
  /** One JSON-RPC request; resolves with the `result` member. */
  request(method: string, params: Record<string, unknown>): Promise<unknown>;
  /** Best-effort resource release (keep-alive sockets, pending aborts). */
  close(): void;
}

export interface FetchTransportOptions {
  readonly url: string;
  /** Organization Context Viewer token — sent only to the configured endpoint. */
  readonly bearerToken: string | null;
  readonly timeoutMs: number;
  readonly fetchImpl?: typeof fetch;
}

/** Coarse failure classes — never a provider response body. */
export type McpTransportErrorReason = 'unavailable' | 'timeout' | 'malformed';

export class McpTransportError extends Error {
  readonly reason: McpTransportErrorReason;

  constructor(reason: McpTransportErrorReason, message: string) {
    super(message);
    this.name = 'McpTransportError';
    this.reason = reason;
  }
}

interface JsonRpcResponse {
  readonly result?: unknown;
  readonly error?: { readonly code?: number; readonly message?: string };
  readonly id?: number | string | null;
}

export function createFetchMcpTransport(options: FetchTransportOptions): McpTransport {
  const doFetch = options.fetchImpl ?? fetch;
  let nextId = 1;
  let sessionId: string | null = null;
  const controller = new AbortController();

  async function request(method: string, params: Record<string, unknown>): Promise<unknown> {
    // JSON-RPC notifications carry no id and expect no response body.
    const isNotification = method.startsWith('notifications/');
    const id = isNotification ? null : nextId++;
    const timeout = AbortSignal.timeout(options.timeoutMs);
    // Combined signal so close() can cancel an in-flight call immediately.
    const signal = AbortSignal.any([timeout, controller.signal]);

    let response: Response;
    try {
      response = await doFetch(options.url, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'MCP-Protocol-Version': '2025-06-18',
          ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
          ...(options.bearerToken ? { Authorization: `Bearer ${options.bearerToken}` } : {}),
        },
        body: JSON.stringify({ jsonrpc: '2.0', ...(id !== null ? { id } : {}), method, params }),
      });
    } catch (error) {
      if (controller.signal.aborted) throw new McpTransportError('timeout', 'MCP call aborted.');
      if ((error as Error)?.name === 'TimeoutError') {
        throw new McpTransportError('timeout', 'MCP call timed out.');
      }
      throw new McpTransportError('unavailable', 'MCP endpoint could not be reached.');
    }

    // Streamable HTTP servers may hand out a session on initialize.
    const returnedSession = response.headers.get('mcp-session-id');
    if (returnedSession) sessionId = returnedSession;

    // Notifications answer 202/204 with no body — success, nothing to parse.
    if (response.status === 202 || response.status === 204) return {};
    const rawBody = await response.text();
    if (!rawBody.trim()) return {};
    let payload: JsonRpcResponse | undefined;
    try {
      payload = JSON.parse(rawBody) as JsonRpcResponse;
    } catch {
      throw new McpTransportError('malformed', 'MCP endpoint returned a non-JSON body.');
    }
    if (!payload || typeof payload !== 'object') {
      throw new McpTransportError('malformed', 'MCP endpoint returned a non-JSON body.');
    }
    if (payload.error) {
      // JSON-RPC-level errors (auth, bad method) read as unavailability; the
      // caller records the coarse class only.
      throw new McpTransportError('unavailable', 'MCP endpoint rejected the call.');
    }
    return payload.result ?? {};
  }

  return {
    request,
    close() {
      controller.abort();
    },
  };
}
