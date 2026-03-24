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
 */
export async function withRedis<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof RedisUnavailableError) throw err;
    throw new RedisUnavailableError(operation, err as Error);
  }
}
