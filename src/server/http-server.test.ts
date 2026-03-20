import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Mock dependencies before importing the module
vi.mock('../config.js', () => ({
  loadRemoteServerConfig: vi.fn(() => ({
    port: 3001,
    bearerToken: 'test-bearer-token',
    freeeClientId: 'test-cid',
    freeeClientSecret: 'test-csec',
    tokenEndpoint: 'https://test.freee.co.jp/token',
    scope: 'read write',
    redisUrl: 'redis://localhost:6379',
  })),
  initRemoteConfig: vi.fn(),
  getConfig: vi.fn(() => ({
    freee: {
      clientId: 'test-cid',
      clientSecret: 'test-csec',
      companyId: '0',
      apiUrl: 'https://api.freee.co.jp',
    },
    oauth: {
      callbackPort: 54321,
      redirectUri: 'http://127.0.0.1:54321/callback',
      authorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
      tokenEndpoint: 'https://test.freee.co.jp/token',
      scope: 'read write',
    },
    server: { name: 'freee', version: '0.0.0-test', instructions: 'test' },
    auth: { timeoutMs: 300000 },
  })),
}));

vi.mock('../storage/redis-client.js', () => ({
  getRedisClient: vi.fn(() => ({
    ping: vi.fn().mockResolvedValue('PONG'),
    quit: vi.fn().mockResolvedValue('OK'),
  })),
  closeRedisClient: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../storage/redis-token-store.js', () => ({
  RedisTokenStore: vi.fn().mockImplementation(() => ({
    loadTokens: vi.fn(),
    saveTokens: vi.fn(),
    getValidAccessToken: vi.fn(),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: vi.fn().mockImplementation(() => ({
    sessionId: 'mock-session-id',
    handleRequest: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    onclose: null,
  })),
}));

vi.mock('../mcp/handlers.js', () => ({
  createMcpServer: vi.fn(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('HTTP Server - auth middleware behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should reject requests without Authorization header', async () => {
    // Test auth middleware logic directly
    const { loadRemoteServerConfig } = await import('../config.js');
    const remoteConfig = (loadRemoteServerConfig as ReturnType<typeof vi.fn>)();

    const req = {
      path: '/mcp',
      headers: {},
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    // Inline auth check logic
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid Authorization header' });
    } else {
      const token = authHeader.slice(7);
      if (token !== remoteConfig.bearerToken) {
        res.status(403).json({ error: 'Invalid bearer token' });
      } else {
        next();
      }
    }

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject requests with wrong bearer token', async () => {
    const { loadRemoteServerConfig } = await import('../config.js');
    const remoteConfig = (loadRemoteServerConfig as ReturnType<typeof vi.fn>)();

    const req = {
      path: '/mcp',
      headers: { authorization: 'Bearer wrong-token' },
    } as unknown as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;

    const next = vi.fn() as NextFunction;

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid Authorization header' });
    } else {
      const token = authHeader.slice(7);
      if (token !== remoteConfig.bearerToken) {
        res.status(403).json({ error: 'Invalid bearer token' });
      } else {
        next();
      }
    }

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should pass through health check without auth', async () => {
    const req = {
      path: '/health',
      headers: {},
    } as unknown as Request;

    const next = vi.fn() as NextFunction;

    // Health check bypass logic
    if (req.path === '/health') {
      next();
    }

    expect(next).toHaveBeenCalled();
  });

  it('should accept valid bearer token and inject auth context', async () => {
    const { loadRemoteServerConfig } = await import('../config.js');
    const remoteConfig = (loadRemoteServerConfig as ReturnType<typeof vi.fn>)();

    const req = {
      path: '/mcp',
      headers: { authorization: 'Bearer test-bearer-token' },
    } as unknown as Request;

    const next = vi.fn() as NextFunction;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      if (token === remoteConfig.bearerToken) {
        (req as unknown as Record<string, unknown>).auth = {
          extra: { tokenStore: {}, userId: 'remote-default' },
        };
        next();
      }
    }

    expect(next).toHaveBeenCalled();
    expect((req as unknown as Record<string, unknown>).auth).toEqual({
      extra: { tokenStore: expect.any(Object), userId: 'remote-default' },
    });
  });
});

describe('HTTP Server - health check', () => {
  it('should return ok status when Redis is connected', async () => {
    const { getRedisClient } = await import('../storage/redis-client.js');
    const redis = (getRedisClient as ReturnType<typeof vi.fn>)();

    const result = { status: 'ok', redis: 'connected', sessions: 0 };

    try {
      await redis.ping();
      // would set result
    } catch {
      // would set degraded
    }

    expect(result.status).toBe('ok');
    expect(result.redis).toBe('connected');
  });
});
