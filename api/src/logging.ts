/**
 * Coarse operational logging (docs/SECURITY.md §6): one JSON line per
 * request with requestId, route, stage, outcome, duration, and error class.
 * Never document bodies, quotes, filenames, prompts, signed payloads,
 * provider responses, or secrets. This is the only module permitted to call
 * `console` (see eslint override).
 */
export type LogLevel = 'info' | 'warn' | 'error';

export interface RequestLogEntry {
  readonly requestId: string;
  readonly route: string;
  readonly method: string;
  readonly outcome: 'ok' | 'error';
  readonly status: number;
  readonly durationMs: number;
  readonly errorClass?: string;
}

function emit(level: LogLevel, event: string, fields: Record<string, unknown>): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields });
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function logRequest(entry: RequestLogEntry): void {
  emit(entry.status >= 500 ? 'error' : 'info', 'request', { ...entry });
}

export function logStartup(fields: Record<string, unknown>): void {
  emit('info', 'startup', fields);
}

/** Coarse operational event (stage/result codes only — never content). */
export function logEvent(event: string, fields: Record<string, unknown>): void {
  emit('info', event, fields);
}
