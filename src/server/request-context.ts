import { AsyncLocalStorage } from 'node:async_hooks';
import { makeErrorChain, type ErrorChainEntry } from './error-serializer.js';

/**
 * Canonical log line: tool call sub-event.
 *
 * Records only "which MCP tool was invoked, in what shape, with what
 * outcome". The HTTP-level details of any outgoing API request the tool
 * fired are kept on `ApiCallInfo` (one tool can issue zero or many api
 * calls), so this struct is intentionally narrow.
 *
 * Only operational metadata is accepted here. User input (body, query values)
 * MUST NOT be passed — the type intentionally omits any field that could hold
 * user-supplied content, so TypeScript rejects privacy regressions at compile time.
 */
export interface ToolCallInfo {
  tool: string;
  service?: string;
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
 *
 * `query_keys` lives here because the query string is an HTTP-level
 * property of the outgoing request, not of the MCP tool that issued it.
 * Names only, never values — Datadog operators should not be able to
 * reconstruct user input from this field.
 */
export interface ApiCallInfo {
  method: string;
  path_pattern: string;
  status_code: number | null;
  duration_ms: number;
  company_id?: string | null;
  user_id?: string | null;
  error_type: ApiCallErrorType | null;
  /** Names only, never values. Enforced by the type and by recorder callers. */
  query_keys?: string[];
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
  | 'auth'
  | 'response';

/**
 * Marker values for the fallback ErrorInfo synthesized by
 * `RequestRecorder.synthesizeFallbackErrorIfMissing`. Exported so dashboards,
 * alerting code, and tests can reference the same symbol — Datadog operators
 * filter on `@errors.error_type:unrecorded` to find canonical logs that hit
 * the universal safety net (i.e. some middleware bypassed `recordError`).
 */
export const UNRECORDED_ERROR_TYPE = 'unrecorded' as const;
export const UNRECORDED_ERROR_NAME = 'UnrecordedError' as const;

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
  /** Inbound HTTP User-Agent header from the MCP client, normalized and truncated. */
  user_agent?: string;
  user_id?: string;
  session_id?: string;
  method: string;
  path: string;
}

/**
 * Canonical log line: the complete payload emitted as one JSON log entry
 * per HTTP request at `res.on('finish')`. Consumers (pino, Datadog) see
 * exactly this shape.
 *
 * Section layout:
 * - Top-level scalars: identity (`request_id`, IP, agent, user, session).
 * - `http`: inbound MCP request properties (status, duration, path).
 * - `mcp`: MCP-protocol layer events (tool calls, counts).
 * - `api`: outbound freee/freee-sign HTTP calls (calls + count).
 * - `errors`: serialized error chains.
 *
 * Trace-related fields (`trace_id`, `span_id`, `trace_sampled`) are
 * intentionally NOT declared here. They are merged into the final pino log
 * record at runtime by `otelMixin` so the recorder layer stays orthogonal
 * to the OpenTelemetry layer.
 */
export interface CanonicalLogPayload {
  request_id: string;
  source_ip: string;
  user_agent: string | null;
  user_id: string | null;
  session_id: string | null;
  http: {
    method: string;
    path: string;
    status: number;
    duration_ms: number;
  };
  mcp: {
    tool_calls: ToolCallInfo[];
    tool_call_count: number;
  };
  api: {
    calls: ApiCallInfo[];
    call_count: number;
  };
  errors: ErrorInfo[];
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
  private readonly toolCalls: ToolCallInfo[] = [];
  private readonly apiCalls: ApiCallInfo[] = [];
  private readonly errors: ErrorInfo[] = [];
  private context: RequestRecorderContext;
  private flushed = false;

  constructor(initial: RequestRecorderContext) {
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

  /**
   * Synthesize a placeholder ErrorInfo when no explicit `recordError` was
   * called for a 4xx/5xx response. Universal safety net for any middleware
   * that responds without going through Express's error handler (and so
   * never gives our handler a chance to call `recordError`).
   *
   * No-op if `errors[]` is already non-empty — explicit recording wins,
   * preserving the more specific source/error_type that handlers know about.
   *
   * Why this exists: the canonical log promise is "1 line = full debug
   * context". Without this, a Datadog operator who filters `status:error`
   * sees the row but cannot drill down to know what went wrong.
   *
   * `status_code` here is the MCP server's outbound HTTP status (i.e.
   * `res.statusCode`), distinct from `api_calls[].status_code` which
   * records freee API responses to us. Datadog facets that overload these
   * across both directions need to disambiguate via `errors[].source`.
   */
  synthesizeFallbackErrorIfMissing(status: number): void {
    if (this.errors.length > 0) return;
    this.recordError({
      source: 'response',
      status_code: status,
      error_type: UNRECORDED_ERROR_TYPE,
      chain: makeErrorChain(
        UNRECORDED_ERROR_NAME,
        `HTTP ${status} response emitted without explicit recordError`,
      ),
    });
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
  buildPayload(http: { status: number; duration_ms: number }): CanonicalLogPayload {
    return {
      request_id: this.context.request_id,
      source_ip: this.context.source_ip,
      user_agent: this.context.user_agent ?? null,
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
      api: {
        calls: this.apiCalls,
        call_count: this.apiCalls.length,
      },
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
 * Derive `query_keys` for `ApiCallInfo` from a params object.
 *
 * PRIVACY: key names only, never values. Names are stable per endpoint
 * (`limit`, `type`, etc.), so they are safe to facet on in Datadog.
 * Returns `undefined` when no recorder is installed (CLI mode) or when
 * the params object has no keys, so Datadog doesn't index an empty-array
 * facet.
 */
export function deriveQueryKeys(
  recorder: RequestRecorder | undefined,
  params: Record<string, unknown> | undefined,
): string[] | undefined {
  if (!recorder || !params) return undefined;
  const keys = Object.keys(params);
  return keys.length > 0 ? keys : undefined;
}

/**
 * Run `fn` with `recorder` installed as the current request recorder.
 * All downstream async operations will see the recorder via
 * `getCurrentRecorder()` for the lifetime of the returned promise.
 */
export function withRequestRecorder<T>(recorder: RequestRecorder, fn: () => T): T {
  return requestContextStorage.run(recorder, fn);
}
