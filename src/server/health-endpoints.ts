import type { Request, Response } from 'express';

/**
 * Minimal Redis surface required by the readiness probe. Kept narrow so
 * tests can supply a stub without pulling in the real ioredis client.
 */
export interface RedisLike {
  ping: () => Promise<unknown>;
}

// Default maximum time to wait for a Redis ping. Guards against half-open
// TCP sockets that accept the connection but never reply.
const READINESS_PING_TIMEOUT_MS = 3_000;

/**
 * Liveness probe handler.
 *
 * Returns 200 OK as long as the process is up. MUST NOT touch any external
 * dependency (Redis, freee API, etc.) — a transient blip in those
 * dependencies must not cause the orchestrator to restart this Pod.
 */
export function createLivenessHandler(): (req: Request, res: Response) => void {
  return (_req: Request, res: Response): void => {
    res.json({ status: 'ok' });
  };
}

/**
 * Readiness probe handler.
 *
 * Returns 200 only when Redis is reachable and responds within the timeout;
 * otherwise 503 so the orchestrator stops sending traffic to this instance
 * until it recovers.
 *
 * @param pingTimeoutMs - Override the default 3 s timeout (for testing).
 */
export function createReadinessHandler(
  redis: RedisLike,
  { pingTimeoutMs = READINESS_PING_TIMEOUT_MS }: { pingTimeoutMs?: number } = {},
): (req: Request, res: Response) => Promise<void> {
  return async (_req: Request, res: Response): Promise<void> => {
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Redis ping timeout')), pingTimeoutMs),
      );
      await Promise.race([redis.ping(), timeout]);
      res.json({ status: 'ok', redis: 'connected' });
    } catch {
      res.status(503).json({ status: 'degraded', redis: 'disconnected' });
    }
  };
}
