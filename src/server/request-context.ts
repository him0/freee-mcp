import { AsyncLocalStorage } from 'node:async_hooks';
import type { ErrorChainEntry } from './error-serializer.js';

/**
 * Canonical log line: tool call sub-event.
 *
 * Only operational metadata is accepted here. User input (body, query values)
 * MUST NOT be passed — the type intentionally omits any field that could hold
 * user-supplied content, so TypeScript rejects privacy regressions at compile time.
 */
export interface ToolCallInfo {
  tool: string;
  service?: string;
  api_method?: string;
  api_path_pattern?: string;
  /** Names only, never values. Enforced by the type and by recorder callers. */
  query_keys?: string[];
  status: 'success' | 'error';
  duration_ms: number;
}

export type ApiCallErrorType =
  | 'timeout'
  | 'network_error'
  | 'auth_error'
  | 'forbidden'
  | 'http_error'
  | 'json_parse_error';

/**
 * Canonical log line: outgoing HTTP API call sub-event.
 */
export interface ApiCallInfo {
  method: string;
  path_pattern: string;
  status_code: number | null;
  duration_ms: number;
  company_id?: string | null;
  user_id?: string | null;
  error_type: ApiCallErrorType | null;
  /** Upload size (bytes). Not user data; safe to log for debugging file uploads. */
  file_size_bytes?: number;
}

export type ErrorSource =
  | 'api_client'
  | 'sign_client'
  | 'file_upload'
  | 'tool_handler'
  | 'mcp_handler'
  | 'middleware'
  | 'validation'
  | 'redis_unavailable'
  | 'auth';

export interface ErrorInfo {
  source: ErrorSource;
  status_code?: number;
  error_type?: string;
  timestamp: number;
  chain: ErrorChainEntry[];
}

export interface RequestRecorderContext {
  request_id: string;
  source_ip: string;
  user_id?: string;
  session_id?: string;
  method: string;
  path: string;
}

/**
 * RequestRecorder is the single place that buffers all per-request observability
 * data for the duration of one HTTP request. At request end the recorder is
 * flushed as a single "canonical log line" JSON log entry.
 *
 * Design notes:
 * - Stored in an AsyncLocalStorage so every async downstream context (tool
 *   handlers, fetch calls, etc.) can reach it via `getCurrentRecorder()`.
 * - All mutation methods accept typed inputs that intentionally exclude user
 *   input. Callers must construct the input with metadata only.
 * - `flushOnce()` provides idempotency for the `res.on('finish')` /
 *   `res.on('close')` race.
 */
export class RequestRecorder {
  private readonly startTimeMs: number;
  private readonly toolCalls: ToolCallInfo[] = [];
  private readonly apiCalls: ApiCallInfo[] = [];
  private readonly errors: ErrorInfo[] = [];
  private context: RequestRecorderContext;
  private flushed = false;

  constructor(initial: RequestRecorderContext) {
    this.startTimeMs = Date.now();
    this.context = initial;
  }

  /**
   * Patch context fields that become known after the recorder was created
   * (typically `user_id` and `session_id` are only available after the bearer
   * auth middleware runs).
   */
  updateContext(patch: Partial<Pick<RequestRecorderContext, 'user_id' | 'session_id'>>): void {
    this.context = { ...this.context, ...patch };
  }

  recordToolCall(info: ToolCallInfo): void {
    this.toolCalls.push(info);
  }

  recordApiCall(info: ApiCallInfo): void {
    this.apiCalls.push(info);
  }

  recordError(info: Omit<ErrorInfo, 'timestamp'>): void {
    this.errors.push({ ...info, timestamp: Date.now() });
  }

  /** @returns milliseconds elapsed since recorder construction */
  elapsedMs(): number {
    return Date.now() - this.startTimeMs;
  }

  /**
   * Return true on the first call, false afterwards. Used by the HTTP
   * middleware to ensure the canonical log line is emitted exactly once
   * even when both `res.on('finish')` and `res.on('close')` fire.
   */
  flushOnce(): boolean {
    if (this.flushed) return false;
    this.flushed = true;
    return true;
  }

  /**
   * Build the canonical log line payload. Does not emit anything — the
   * caller is responsible for passing this object to pino.
   */
  buildPayload(http: { status: number; duration_ms: number }): Record<string, unknown> {
    return {
      request_id: this.context.request_id,
      source_ip: this.context.source_ip,
      user_id: this.context.user_id ?? null,
      session_id: this.context.session_id ?? null,
      http: {
        method: this.context.method,
        path: this.context.path,
        status: http.status,
        duration_ms: http.duration_ms,
      },
      mcp: {
        tool_calls: this.toolCalls,
        tool_call_count: this.toolCalls.length,
      },
      api_calls: this.apiCalls,
      api_call_count: this.apiCalls.length,
      errors: this.errors,
    };
  }
}

const requestContextStorage = new AsyncLocalStorage<RequestRecorder>();

/**
 * Returns the RequestRecorder associated with the current async context,
 * or `undefined` if called outside any request (CLI mode, server startup,
 * background tasks).
 *
 * Callers must treat this as optional and use the `?.` operator:
 *   getCurrentRecorder()?.recordApiCall({...})
 */
export function getCurrentRecorder(): RequestRecorder | undefined {
  return requestContextStorage.getStore();
}

/**
 * Run `fn` with `recorder` installed as the current request recorder.
 * All downstream async operations will see the recorder via
 * `getCurrentRecorder()` for the lifetime of the returned promise.
 */
export function withRequestRecorder<T>(recorder: RequestRecorder, fn: () => T): T {
  return requestContextStorage.run(recorder, fn);
}
