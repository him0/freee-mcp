import { randomUUID } from 'node:crypto';
import { SpanKind, SpanStatusCode, context, trace, type Span } from '@opentelemetry/api';
import type { NextFunction, Request, Response } from 'express';
import { getClientIp } from '../server/http-utils.js';
import { getLogger } from '../server/logger.js';
import { RequestRecorder, withRequestRecorder } from '../server/request-context.js';
import { isOtelEnabled } from './init.js';
import { getHttpRequestDuration, getHttpRequestErrorCount } from './metrics.js';

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
      getLogger().info(payload, 'mcp request completed');

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
