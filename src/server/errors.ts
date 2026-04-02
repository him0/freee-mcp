import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';

/**
 * Thrown when a Redis operation fails at runtime (e.g., connection lost, timeout).
 * Caught by Express error handler to return 503 Service Unavailable.
 */
export class RedisUnavailableError extends Error {
  constructor(operation: string, cause?: Error) {
    super(`Redis unavailable during ${operation}`);
    this.name = 'RedisUnavailableError';
    this.cause = cause;
  }
}

/**
 * Execute a Redis operation, wrapping any thrown error as RedisUnavailableError.
 * Eliminates repetitive try/catch boilerplate in Redis-backed stores.
 * When OTel is enabled, creates a client span for the operation.
 */
export async function withRedis<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const tracer = trace.getTracer('freee-mcp');
  return tracer.startActiveSpan(
    `redis ${operation}`,
    {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.system': 'redis',
        'db.operation.name': operation,
      },
    },
    async (span) => {
      try {
        const result = await fn();
        span.end();
        return result;
      } catch (err) {
        span.recordException(err as Error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
        span.end();
        if (err instanceof RedisUnavailableError) throw err;
        throw new RedisUnavailableError(operation, err as Error);
      }
    },
  );
}
