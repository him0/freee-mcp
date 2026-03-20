import type { Request, Response, NextFunction } from 'express';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from '../mcp/handlers.js';
import { loadRemoteServerConfig, initRemoteConfig, getConfig } from '../config.js';
import { getRedisClient, closeRedisClient } from '../storage/redis-client.js';
import { RedisTokenStore } from '../storage/redis-token-store.js';
import type { TokenStore } from '../storage/token-store.js';

interface SessionEntry {
  transport: StreamableHTTPServerTransport;
  lastActivity: number;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export async function startHttpServer(): Promise<void> {
  const remoteConfig = loadRemoteServerConfig();
  initRemoteConfig(remoteConfig);

  const redis = getRedisClient(remoteConfig.redisUrl);

  // Verify Redis connection before starting the server
  try {
    await redis.ping();
    console.error('[info] Redis connected');
  } catch (err) {
    console.error('[error] Failed to connect to Redis:', (err as Error).message);
    console.error('[error] Make sure Redis is running. For development: docker compose up -d');
    process.exit(1);
  }

  const tokenStore: TokenStore = new RedisTokenStore(redis, {
    clientId: remoteConfig.freeeClientId,
    clientSecret: remoteConfig.freeeClientSecret,
    tokenEndpoint: remoteConfig.tokenEndpoint,
    scope: remoteConfig.scope,
  });

  const config = getConfig();

  const sessions = new Map<string, SessionEntry>();

  // Session cleanup interval
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of sessions) {
      if (now - entry.lastActivity > SESSION_TIMEOUT_MS) {
        console.error(`[info] Cleaning up inactive session: ${id}`);
        entry.transport.close().catch((err: unknown) => {
          console.error(`[error] Failed to close transport for session ${id}:`, err);
        });
        sessions.delete(id);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Bearer token authentication middleware
  function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Skip auth for health check
    if (req.path === '/health') {
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid Authorization header' });
      return;
    }

    const token = authHeader.slice(7);
    const expected = remoteConfig.bearerToken;
    const tokenBuf = Buffer.from(token);
    const expectedBuf = Buffer.from(expected);
    if (tokenBuf.length !== expectedBuf.length || !timingSafeEqual(tokenBuf, expectedBuf)) {
      res.status(403).json({ error: 'Invalid bearer token' });
      return;
    }

    // TODO(PR 3): Replace fixed userId with JWT sub claim
    const userId = 'remote-default';

    // Inject auth context for MCP transport
    // StreamableHTTPServerTransport reads req.auth and passes it as authInfo
    (req as unknown as Record<string, unknown>).auth = {
      extra: { tokenStore, userId },
    };

    next();
  }

  // Dynamic import of express (only loaded in serve mode)
  const express = (await import('express')).default;
  const app = express();

  app.use(express.json());
  app.use(authMiddleware);

  // Health check endpoint
  app.get('/health', async (_req: Request, res: Response) => {
    try {
      await redis.ping();
      res.json({
        status: 'ok',
        redis: 'connected',
        sessions: sessions.size,
      });
    } catch {
      res.status(503).json({
        status: 'degraded',
        redis: 'disconnected',
        sessions: sessions.size,
      });
    }
  });

  // MCP endpoint handler
  async function handleMcpRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    const existingEntry = sessionId ? sessions.get(sessionId) : undefined;
    if (existingEntry) {
      existingEntry.lastActivity = Date.now();
      await existingEntry.transport.handleRequest(req, res, req.body);
      return;
    }

    // Unknown session ID: return 404 per MCP spec
    if (sessionId) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Create new session for initialize requests
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    try {
      const server = createMcpServer(config, { remote: true });
      await server.connect(transport);

      // handleRequest first so that the transport gets its sessionId assigned
      await transport.handleRequest(req, res, req.body);

      const newSessionId = transport.sessionId;
      if (newSessionId) {
        sessions.set(newSessionId, {
          transport,
          lastActivity: Date.now(),
        });

        transport.onclose = () => {
          sessions.delete(newSessionId);
        };
      } else {
        // No session was created (e.g., non-initialize request) — clean up
        await transport.close().catch(() => {});
      }
    } catch (err) {
      await transport.close().catch(() => {});
      throw err;
    }
  }

  function mcpHandler(req: Request, res: Response): void {
    handleMcpRequest(req, res).catch((err: unknown) => {
      console.error('[error] MCP request error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  app.post('/mcp', mcpHandler);
  app.get('/mcp', mcpHandler);

  app.delete('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const entry = sessionId ? sessions.get(sessionId) : undefined;
    if (!sessionId || !entry) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    try {
      await entry.transport.close();
      sessions.delete(sessionId);
      res.status(200).json({ message: 'Session terminated' });
    } catch (err) {
      console.error(`[error] Failed to close session ${sessionId}:`, err);
      sessions.delete(sessionId);
      res.status(500).json({ error: 'Failed to terminate session' });
    }
  });

  const server = app.listen(remoteConfig.port, () => {
    console.error(`[info] freee MCP HTTP server listening on port ${remoteConfig.port}`);
  });

  // Graceful shutdown
  async function shutdown(signal: string): Promise<void> {
    console.error(`[info] Received ${signal}, shutting down gracefully...`);
    clearInterval(cleanupTimer);

    // Close all sessions
    const closePromises = Array.from(sessions.values()).map((entry) =>
      entry.transport.close().catch((err: unknown) => {
        console.error('[error] Failed to close transport during shutdown:', err);
      }),
    );
    await Promise.all(closePromises);
    sessions.clear();

    // Close Redis
    await closeRedisClient();

    // Close HTTP server
    server.close(() => {
      console.error('[info] HTTP server closed');
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
