import { randomUUID } from 'node:crypto';
import { SpanKind, SpanStatusCode, context, trace, type Span } from '@opentelemetry/api';
import type { NextFunction, Request, Response } from 'express';
import { scrubErrorMessage } from '../server/error-serializer.js';
import { getClientIp } from '../server/http-utils.js';
import { getLogger } from '../server/logger.js';
import { RequestRecorder, withRequestRecorder } from '../server/request-context.js';
import { isOtelEnabled } from './init.js';
import { getHttpRequestDuration, getHttpRequestErrorCount } from './metrics.js';

/**
 * Hard cap on the inbound User-Agent string length before it is logged.
 *
 * A well-behaved MCP client sends a UA well under 100 chars, but a malicious
 * or buggy client could send arbitrary-length headers and blow up the log
 * stream size. 256 is generous enough for every real user-agent we expect
 * to see (browser/OS/version combinations rarely exceed 200).
 */
const MAX_USER_AGENT_LENGTH = 256;

export type CanonicalLogLevel = 'info' | 'warn' | 'error';

/**
 * Map an HTTP response status code to the pino log level used for the
 * canonical log line of that request.
 *
 * - 5xx → `error` so Datadog's default Status Remapper raises severity and
 *   on-call alerts can fire on `status:error`.
 * - 4xx → `warn` including 401/403/404/422. All client errors become
 *   warnings per ECS / Datadog convention — the server is healthy but the
 *   caller misused it, which is still an observability signal worth
 *   tracking in dashboards.
 * - Everything else → `info`.
 */
export function levelFor(status: number): CanonicalLogLevel {
  if (status >= 500) return 'error';
  if (status >= 400) return 'warn';
  return 'info';
}

const MSG_OK = 'mcp request ok';
const MSG_CLIENT_ERROR = 'mcp request client_error';
const MSG_SERVER_ERROR = 'mcp request server_error';

/**
 * Return the `msg` string attached to the canonical log line for a given
 * HTTP status. A tiny number of distinct values keeps Datadog facet
 * cardinality low while still letting engineers eyeball logs at a glance.
 */
export function messageFor(status: number): string {
  if (status >= 500) return MSG_SERVER_ERROR;
  if (status >= 400) return MSG_CLIENT_ERROR;
  return MSG_OK;
}

/**
 * Normalize and scrub the inbound `User-Agent` header before storing it in
 * the canonical log line.
 *
 * Steps:
 * 1. Reject non-string values (`req.headers['user-agent']` is typed as
 *    `string | string[] | undefined`; only scalars are accepted).
 * 2. Treat empty strings as "missing".
 * 3. Run the value through `scrubErrorMessage` so any 6+ digit ID or email
 *    that a custom client might have stuffed into its UA gets masked. This
 *    is defense-in-depth — real user-agents rarely contain such data.
 * 4. Truncate to `MAX_USER_AGENT_LENGTH` AFTER scrubbing.
 *
 * The scrub-then-truncate order is critical for correctness: scrub
 * replacements (`[REDACTED_ID]` 13 chars, `[REDACTED_EMAIL]` 16 chars) are
 * longer than the 6-char minimum they replace, so scrubbing CAN grow the
 * string. Truncating first would let a 256-char input with a 6-digit ID
 * expand to 263 chars after scrub, silently violating the documented cap.
 *
 * DoS note: running scrub on the raw (pre-truncation) value is safe because
 * (a) `scrubErrorMessage` uses two character-class regexes with no nested
 * quantifiers — both run in O(n) with a small constant — and (b) Node's
 * HTTP parser already bounds the total headers block to ~16KB by default
 * (`--max-http-header-size`), so a single header can never be pathologically
 * long in practice.
 */
export function normalizeUserAgent(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw.length === 0) return undefined;
  const scrubbed = scrubErrorMessage(raw);
  return scrubbed.length > MAX_USER_AGENT_LENGTH
    ? scrubbed.slice(0, MAX_USER_AGENT_LENGTH)
    : scrubbed;
}

/**
 * Express middleware responsible for per-request observability.
 *
 * For every non-health HTTP request this middleware:
 *
 * 1. Assigns a `request_id` (generating one if upstream didn't) and creates a
 *    `RequestRecorder` installed in AsyncLocalStorage. Downstream code can
 *    reach it via `getCurrentRecorder()`.
 *
 * 2. When OTel is enabled, opens a server span that is propagated through the
 *    same async context so that tool handlers / fetch calls become children
 *    of this span.
 *
 * 3. At request end (`res.on('finish')` or `res.on('close')`, whichever fires
 *    first), emits a single "canonical log line" — one pino `info` entry
 *    containing all metadata collected during the request (http status,
 *    duration, tool calls, api calls, errors) — and closes the OTel span.
 *
 * The canonical log is emitted regardless of OTel state; observability
 * remains functional even if OTel export is misconfigured.
 */
export function createTracingMiddleware(): (
  req: Request,
  res: Response,
  next: NextFunction,
) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip health checks entirely — no recorder, no span, no canonical log.
    if (req.path === '/health') {
      next();
      return;
    }

    // Assign a request_id at the earliest possible point. If another
    // middleware already set one we respect it.
    if (!req.requestId) {
      req.requestId = randomUUID();
    }

    const recorder = new RequestRecorder({
      request_id: req.requestId,
      source_ip: getClientIp(req),
      user_agent: normalizeUserAgent(req.headers['user-agent']),
      method: req.method,
      path: req.path,
    });

    const startTime = performance.now();
    let otelSpan: Span | undefined;

    if (isOtelEnabled()) {
      const tracer = trace.getTracer('freee-mcp');
      otelSpan = tracer.startSpan(`HTTP ${req.method} ${req.path}`, {
        kind: SpanKind.SERVER,
        attributes: {
          'http.request.method': req.method,
          'url.path': req.path,
        },
      });
    }

    const flush = (): void => {
      if (!recorder.flushOnce()) return;

      const durationMs = Math.round(performance.now() - startTime);
      const status = res.statusCode;

      const payload = recorder.buildPayload({ status, duration_ms: durationMs });
      const message = messageFor(status);
      // Explicit dispatch (rather than `getLogger()[level](...)`) keeps the
      // call sites consistent with the rest of the codebase and avoids
      // bracket-access against pino's `BaseLogger` interface, which has no
      // index signature.
      const logger = getLogger();
      switch (levelFor(status)) {
        case 'error':
          logger.error(payload, message);
          break;
        case 'warn':
          logger.warn(payload, message);
          break;
        default:
          logger.info(payload, message);
          break;
      }

      if (otelSpan) {
        const attrs = { method: req.method, path: req.path, status: String(status) };
        otelSpan.setAttribute('http.response.status_code', status);
        getHttpRequestDuration().record(durationMs / 1000, attrs);
        if (status >= 500) {
          otelSpan.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${status}` });
          getHttpRequestErrorCount().add(1, attrs);
        }
        otelSpan.end();
      }
    };

    // Attach flush to both events. flushOnce() inside ensures it runs at most
    // once regardless of which fires first (normal completion vs. client
    // disconnect during SSE streaming).
    res.on('finish', flush);
    res.on('close', flush);

    const runDownstream = (): void => {
      withRequestRecorder(recorder, () => {
        next();
      });
    };

    if (otelSpan) {
      // Propagate the active span through the same async context as the
      // recorder so pino's otelMixin picks up trace_id/span_id correctly.
      context.with(trace.setSpan(context.active(), otelSpan), runDownstream);
    } else {
      runDownstream();
    }
  };
}
