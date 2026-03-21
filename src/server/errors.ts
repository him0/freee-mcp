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
