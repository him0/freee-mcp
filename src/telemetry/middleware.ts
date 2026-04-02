import type { NextFunction, Request, Response } from 'express';
import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { isOtelEnabled } from './init.js';

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
        res.on('finish', () => {
          span.setAttribute('http.response.status_code', res.statusCode);
          if (res.statusCode >= 500) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${res.statusCode}` });
          }
          span.end();
        });
        next();
      },
    );
  };
}
