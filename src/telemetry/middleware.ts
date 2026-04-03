import type { NextFunction, Request, Response } from 'express';
import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { isOtelEnabled } from './init.js';
import { getHttpRequestDuration, getHttpRequestErrorCount } from './metrics.js';

/**
 * Express middleware that creates a server span for each incoming request.
 * Returns a no-op pass-through when OTel is disabled.
 */
export function createTracingMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!isOtelEnabled()) {
      next();
      return;
    }

    // Skip health check endpoint to avoid noisy traces
    if (req.path === '/health') {
      next();
      return;
    }

    const tracer = trace.getTracer('freee-mcp');
    tracer.startActiveSpan(
      `HTTP ${req.method} ${req.path}`,
      {
        kind: SpanKind.SERVER,
        attributes: {
          'http.request.method': req.method,
          'url.path': req.path,
        },
      },
      (span) => {
        const startTime = performance.now();
        res.on('finish', () => {
          const durationS = (performance.now() - startTime) / 1000;
          const attrs = { method: req.method, path: req.path, status: String(res.statusCode) };

          span.setAttribute('http.response.status_code', res.statusCode);
          getHttpRequestDuration().record(durationS, attrs);
          if (res.statusCode >= 500) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${res.statusCode}` });
            getHttpRequestErrorCount().add(1, attrs);
          }
          span.end();
        });
        next();
      },
    );
  };
}
