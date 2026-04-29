import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
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

// Datadog facet: @errors.error_type:unrecorded identifies requests where a
// middleware bypassed recordError and the fallback safety net fired instead.
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
  /**
   * Client-supplied correlation ID, propagated through the canonical log line
   * so log entries for one request can be grep'd together when the OTel trace
   * backend is unavailable. Sourced from `X-Correlation-ID` / `X-Request-ID`
   * headers via {@link resolveCid}, or a freshly generated UUID when neither
   * header is supplied.
   */
  cid: string;
  source_ip: string;
  /** Inbound HTTP User-Agent header from the MCP client, normalized and truncated. */
  user_agent?: string;
  user_id?: string;
  session_id?: string;
  method: string;
  path: string;
}

/** Charset accepted in client-supplied correlation IDs. Matches the Stripe /
 * W3C convention: alphanumerics plus `.`, `_`, `:`, `-`. Anything else
 * (whitespace, control chars, quotes, brackets) is rejected to prevent log
 * injection — a client could otherwise smuggle JSON syntax or ANSI escapes
 * into the canonical log line and confuse log parsers / terminal viewers. */
const CID_PATTERN = /^[A-Za-z0-9._:-]+$/;

/** Hard cap on the length of a client-supplied correlation ID. Long enough to
 * fit a UUIDv4 (36), ULID (26), or `<service>:<uuid>` composite, but short
 * enough that a malicious client can't blow up Datadog facet cardinality or
 * the per-line log size. */
const CID_MAX_LENGTH = 200;

/** Returns true iff `value` is a single non-empty string within {@link CID_MAX_LENGTH}
 * and matching {@link CID_PATTERN}. Rejects array-valued headers (Node types
 * `req.headers['x-correlation-id']` as `string | string[] | undefined`) and
 * non-string inputs as a defense-in-depth guard. */
function isValidCid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= CID_MAX_LENGTH &&
    CID_PATTERN.test(value)
  );
}

/**
 * Pure helper that picks a correlation ID for one request.
 *
 * Precedence (first valid value wins):
 *   1. `X-Correlation-ID` header (preferred — explicitly correlation-flavored).
 *   2. `X-Request-ID` header (fallback — common upstream proxy convention).
 *   3. Freshly generated UUIDv4 via `crypto.randomUUID()`.
 *
 * Invalid values (wrong type, empty string, oversize, disallowed characters,
 * array-valued header) FALL THROUGH to the next source rather than being
 * sanitized. Partial sanitization would let a hostile client inject crafted
 * substrings; falling through guarantees the cid is either a verbatim
 * client-supplied value that passes validation, or an internally generated
 * UUID that the client never touched.
 *
 * The function is total — it always returns a non-empty string — so callers
 * can assign the result directly to `RequestRecorderContext.cid`.
 */
export function resolveCid(correlationIdHeader: unknown, requestIdHeader: unknown): string {
  if (isValidCid(correlationIdHeader)) return correlationIdHeader;
  if (isValidCid(requestIdHeader)) return requestIdHeader;
  return randomUUID();
}

/**
 * Inbound transport classification for a single MCP request.
 *
 * - `sse`: a long-lived SSE GET (Streamable-HTTP transport). Duration tracks
 *   the connection lifetime, not the time to produce a JSON-RPC response.
 * - `jsonrpc`: a short POST that yields a single JSON-RPC response.
 *
 * This distinction matters operationally because a 9-minute SSE connection
 * looks identical to a 9-minute slow JSON-RPC call when filtering on
 * duration alone.
 */
export type CanonicalRequestTransport = 'sse' | 'jsonrpc';

/**
 * How the response stream actually ended.
 *
 * - `completed`: server emitted the full response and `res.on('finish')` fired.
 * - `client_disconnect`: client closed the socket before completion;
 *   `res.on('close')` fired without prior `finish`.
 *
 * Distinguishes legitimate SSE max-stream timeouts (`completed` at the route's
 * stream limit) from client-side aborts.
 */
export type CanonicalCloseReason = 'completed' | 'client_disconnect';

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
  /**
   * Client correlation ID. Independent from `request_id` (server-assigned).
   * Always present — sourced from inbound headers when valid, otherwise a
   * freshly generated UUID. See {@link resolveCid}.
   */
  cid: string;
  source_ip: string;
  user_agent: string | null;
  user_id: string | null;
  session_id: string | null;
  http: {
    method: string;
    path: string;
    status: number;
    duration_ms: number;
    transport: CanonicalRequestTransport;
    close_reason: CanonicalCloseReason;
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
 * Buffers per-request observability data and flushes it as a single canonical
 * log line at request end. Stored in AsyncLocalStorage so downstream async
 * contexts can reach it via `getCurrentRecorder()`.
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

  /** Patch fields available only after bearer auth runs (user_id, session_id). */
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
   * Safety net for middleware (e.g. MCP SDK bearerAuth) that calls
   * `res.status().json()` directly, bypassing the Express error handler and
   * leaving `errors[]` empty. No-op when `errors[]` is already non-empty.
   */
  synthesizeFallbackErrorIfMissing(status: number): void {
    if (this.errors.length > 0) return;
    this.recordError({
      source: 'response',
      status_code: status,
      error_type: UNRECORDED_ERROR_TYPE,
      chain: makeErrorChain(
        UNRECORDED_ERROR_NAME,
        `HTTP ${status} ${this.context.method} ${this.context.path} response emitted without explicit recordError`,
      ),
    });
  }

  /** Returns true on the first call, false afterwards — guards the finish/close race. */
  flushOnce(): boolean {
    if (this.flushed) return false;
    this.flushed = true;
    return true;
  }

  /** Builds the canonical log payload; caller passes it to pino. */
  buildPayload(http: {
    status: number;
    duration_ms: number;
    transport: CanonicalRequestTransport;
    close_reason: CanonicalCloseReason;
  }): CanonicalLogPayload {
    return {
      request_id: this.context.request_id,
      cid: this.context.cid,
      source_ip: this.context.source_ip,
      user_agent: this.context.user_agent ?? null,
      user_id: this.context.user_id ?? null,
      session_id: this.context.session_id ?? null,
      http: {
        method: this.context.method,
        path: this.context.path,
        status: http.status,
        duration_ms: http.duration_ms,
        transport: http.transport,
        close_reason: http.close_reason,
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

/** Returns the recorder for the current async context, or `undefined` outside a request. */
export function getCurrentRecorder(): RequestRecorder | undefined {
  return requestContextStorage.getStore();
}

/**
 * Derive `query_keys` for `ApiCallInfo` from a params object.
 *
 * PRIVACY: key names only, never values. Returns `undefined` when no recorder
 * is installed (CLI mode) or when params has no keys, so Datadog doesn't
 * index an empty-array facet.
 */
export function deriveQueryKeys(
  recorder: RequestRecorder | undefined,
  params: Record<string, unknown> | undefined,
): string[] | undefined {
  if (!recorder || !params) return undefined;
  const keys = Object.keys(params);
  return keys.length > 0 ? keys : undefined;
}

/** Runs `fn` with `recorder` as the current request recorder in AsyncLocalStorage. */
export function withRequestRecorder<T>(recorder: RequestRecorder, fn: () => T): T {
  return requestContextStorage.run(recorder, fn);
}
