import express, { type Express } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import {
  createLivenessHandler,
  createReadinessHandler,
  type RedisLike,
} from './health-endpoints.js';

function buildApp(redis: RedisLike, pingTimeoutMs?: number): Express {
  const app = express();
  app.get('/livez', createLivenessHandler());
  app.get('/readyz', createReadinessHandler(redis, pingTimeoutMs ? { pingTimeoutMs } : undefined));
  return app;
}

describe('createLivenessHandler', () => {
  it('returns 200 with status:ok regardless of dependency state', async () => {
    // Use a Redis stub that always rejects to prove /livez does not depend on it.
    const redis: RedisLike = {
      ping: vi.fn().mockRejectedValue(new Error('Redis is down')),
    };
    const app = buildApp(redis);

    const res = await request(app).get('/livez');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
    // The liveness handler MUST NOT touch Redis.
    expect(redis.ping).not.toHaveBeenCalled();
  });

  it('returns 200 even if Redis ping would hang indefinitely', async () => {
    // A handler that touches Redis would never settle here. /livez must
    // bypass the dependency entirely and respond synchronously.
    const redis: RedisLike = {
      ping: vi.fn(() => new Promise(() => {})),
    };
    const app = buildApp(redis);

    const res = await request(app).get('/livez');

    expect(res.status).toBe(200);
    expect(redis.ping).not.toHaveBeenCalled();
  });
});

describe('createReadinessHandler', () => {
  it('returns 200 with redis:connected when Redis ping succeeds', async () => {
    const redis: RedisLike = {
      ping: vi.fn().mockResolvedValue('PONG'),
    };
    const app = buildApp(redis);

    const res = await request(app).get('/readyz');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', redis: 'connected' });
    expect(redis.ping).toHaveBeenCalledTimes(1);
  });

  it('returns 503 with redis:disconnected when Redis ping rejects', async () => {
    const redis: RedisLike = {
      ping: vi.fn().mockRejectedValue(new Error('connection refused')),
    };
    const app = buildApp(redis);

    const res = await request(app).get('/readyz');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'degraded', redis: 'disconnected' });
  });

  it('returns 503 when Redis ping hangs beyond the timeout window', async () => {
    // Simulate a half-open TCP socket by never resolving. Pass a 50 ms
    // timeout so the test completes quickly without fake timers.
    const redis: RedisLike = {
      ping: vi.fn(() => new Promise(() => {})),
    };
    const app = buildApp(redis, 50);

    const res = await request(app).get('/readyz');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'degraded', redis: 'disconnected' });
  });
});
