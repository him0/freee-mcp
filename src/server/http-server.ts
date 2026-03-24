import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import { getConfig, initRemoteConfig, loadRemoteServerConfig } from '../config.js';
import { FREEE_CALLBACK_PATH } from '../constants.js';
import { createMcpServer } from '../mcp/handlers.js';
import type { Redis } from '../storage/redis-client.js';
import { closeRedisClient, getRedisClient } from '../storage/redis-client.js';
import { RedisTokenStore } from '../storage/redis-token-store.js';
import { RedisClientStore } from './client-store.js';
import { RedisUnavailableError } from './errors.js';
import { createFreeeCallbackHandler } from './freee-callback.js';
import { initLogger } from './logger.js';
import { FreeeOAuthProvider } from './oauth-provider.js';
import { OAuthStateStore } from './oauth-store.js';

const BODY_SIZE_LIMIT = 1_048_576; // 1 MB

// Extend Express Request with request ID
declare module 'express' {
  interface Request {
    requestId?: string;
  }
}

interface SessionEntry {
  transport: StreamableHTTPServerTransport;
  lastActivity: number;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const SHUTDOWN_TIMEOUT_MS = 30_000; // 30 seconds

export async function startHttpServer(): Promise<void> {
  const remoteConfig = loadRemoteServerConfig();
  initRemoteConfig(remoteConfig);

  const logger = initLogger(remoteConfig.logLevel);

  const redis = getRedisClient(remoteConfig.redisUrl);

  // Verify Redis connection before starting the server
  try {
    await redis.ping();
    logger.info('Redis connected');
  } catch (err) {
    logger.error(
      { err },
      'Failed to connect to Redis. Make sure Redis is running. For development: docker compose up -d',
    );
    process.exit(1);
  }

  const tokenStore = new RedisTokenStore(redis, {
    clientId: remoteConfig.freeeClientId,
    clientSecret: remoteConfig.freeeClientSecret,
    tokenEndpoint: remoteConfig.freeeTokenEndpoint,
    scope: remoteConfig.freeeScope,
  });

  // OAuth 2.1 AS dependencies
  const oauthStore = new OAuthStateStore(redis);
  const clientStore = new RedisClientStore({ redis });
  const provider = new FreeeOAuthProvider({
    clientStore,
    oauthStore,
    tokenStore,
    jwtSecret: remoteConfig.jwtSecret,
    issuerUrl: remoteConfig.issuerUrl,
    freeeClientId: remoteConfig.freeeClientId,
    freeeAuthorizationEndpoint: remoteConfig.freeeAuthorizationEndpoint,
    freeeScope: remoteConfig.freeeScope,
    callbackBaseUrl: remoteConfig.issuerUrl,
  });

  const freeeCallbackHandler = createFreeeCallbackHandler({
    oauthStore,
    tokenStore,
    clientStore,
    freeeClientId: remoteConfig.freeeClientId,
    freeeClientSecret: remoteConfig.freeeClientSecret,
    freeeTokenEndpoint: remoteConfig.freeeTokenEndpoint,
    freeeScope: remoteConfig.freeeScope,
    callbackBaseUrl: remoteConfig.issuerUrl,
  });

  const config = getConfig();

  const sessions = new Map<string, SessionEntry>();

  // Session cleanup interval
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of sessions) {
      if (now - entry.lastActivity > SESSION_TIMEOUT_MS) {
        logger.info({ sessionId: id }, 'Cleaning up inactive session');
        entry.transport.close().catch((err: unknown) => {
          logger.error({ sessionId: id, err }, 'Failed to close transport for session');
        });
        sessions.delete(id);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Dynamic import of express (only loaded in serve mode)
  const express = (await import('express')).default;
  const app = express();
  // Trust first proxy (required for express-rate-limit behind reverse proxy / tunnel)
  app.set('trust proxy', 1);
  // No global express.json() -- mcpAuthRouter installs per-route body parsers
  // (urlencoded for /token, /authorize, /revoke; json for /register),
  // and StreamableHTTPServerTransport reads the raw request stream directly.

  // --- Security middleware ---

  // Security headers (helmet)
  const helmet = (await import('helmet')).default;
  app.use(
    helmet({
      hsts: { maxAge: 31536000, preload: true },
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } },
      frameguard: { action: 'deny' },
    }),
  );

  // CORS
  const cors = (await import('cors')).default;
  const allowedOrigins = remoteConfig.corsAllowedOrigins
    ? remoteConfig.corsAllowedOrigins.split(',').map((s) => s.trim())
    : [remoteConfig.issuerUrl];
  app.use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Mcp-Session-Id', 'Accept'],
    }),
  );

  // Body size limit (Content-Length check, does not consume the stream)
  app.use((req: Request, res: Response, next: () => void) => {
    const contentLength = req.headers['content-length'];
    if (contentLength && Number.parseInt(contentLength, 10) > BODY_SIZE_LIMIT) {
      res.status(413).json({ error: 'Payload too large' });
      return;
    }
    next();
  });

  // Request ID + request logging middleware
  app.use((req: Request, _res: Response, next: () => void) => {
    req.requestId = randomUUID();
    logger.debug({ requestId: req.requestId, method: req.method, path: req.path }, 'request');
    next();
  });

  // --- Rate limiting (opt-in) ---
  if (remoteConfig.rateLimitEnabled) {
    await setupRateLimiting(app, redis, logger);
  }

  // Health check endpoint (no auth required)
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

  // freee OAuth callback (browser redirect, no MCP auth required)
  app.get(FREEE_CALLBACK_PATH, freeeCallbackHandler);

  // MCP Auth Router: /.well-known/*, /authorize, /token, /register, /revoke
  const { mcpAuthRouter } = await import('@modelcontextprotocol/sdk/server/auth/router.js');
  const issuerUrl = new URL(remoteConfig.issuerUrl);
  const mcpResourceUrl = new URL('/mcp', issuerUrl);
  app.use(
    mcpAuthRouter({
      provider,
      issuerUrl,
      resourceServerUrl: mcpResourceUrl,
      scopesSupported: ['mcp:read', 'mcp:write'],
      resourceName: 'freee MCP Server',
    }),
  );

  // MCP endpoints (Bearer JWT auth required)
  const { requireBearerAuth } = await import(
    '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js'
  );
  const { getOAuthProtectedResourceMetadataUrl } = await import(
    '@modelcontextprotocol/sdk/server/auth/router.js'
  );
  const bearerAuth = requireBearerAuth({
    verifier: provider,
    resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpResourceUrl),
  });

  // MCP endpoint handler
  async function handleMcpRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    const existingEntry = sessionId ? sessions.get(sessionId) : undefined;
    if (existingEntry) {
      existingEntry.lastActivity = Date.now();
      await existingEntry.transport.handleRequest(req, res);
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
      await transport.handleRequest(req, res);

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
      logger.error({ err, requestId: req.requestId }, 'MCP request error');
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  app.post('/mcp', bearerAuth, mcpHandler);
  app.get('/mcp', bearerAuth, mcpHandler);

  app.delete('/mcp', bearerAuth, async (req: Request, res: Response) => {
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
      logger.error({ sessionId, err }, 'Failed to close session');
      sessions.delete(sessionId);
      res.status(500).json({ error: 'Failed to terminate session' });
    }
  });

  // Express error handler (must be after all routes)
  app.use((err: unknown, req: Request, res: Response, next: (err?: unknown) => void) => {
    if (err instanceof RedisUnavailableError) {
      logger.error({ err, requestId: req.requestId }, 'Redis unavailable');
      if (!res.headersSent) {
        res.status(503).json({
          error: 'service_unavailable',
          message: 'Storage backend temporarily unavailable',
        });
      }
      return;
    }
    logger.error({ err, requestId: req.requestId }, 'Unhandled middleware error');
    if (res.headersSent) {
      next(err);
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  });

  const server = app.listen(remoteConfig.port, () => {
    logger.info({ port: remoteConfig.port }, 'freee MCP HTTP server listening');
  });

  // Graceful shutdown
  async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Shutting down gracefully...');

    // Force exit after timeout if graceful shutdown hangs
    const forceExitTimer = setTimeout(() => {
      logger.warn('Shutdown timeout, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    clearInterval(cleanupTimer);

    // Close all sessions
    const closePromises = Array.from(sessions.values()).map((entry) =>
      entry.transport.close().catch((err: unknown) => {
        logger.error({ err }, 'Failed to close transport during shutdown');
      }),
    );
    await Promise.all(closePromises);
    sessions.clear();

    // Close Redis
    await closeRedisClient();

    // Close HTTP server
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

async function setupRateLimiting(
  app: import('express').Express,
  redis: Redis,
  logger: ReturnType<typeof initLogger>,
): Promise<void> {
  const rateLimitModule = await import('express-rate-limit');
  const rateLimit = rateLimitModule.rateLimit ?? rateLimitModule.default;
  const redisStoreModule = await import('rate-limit-redis');
  const RedisStore = redisStoreModule.RedisStore ?? redisStoreModule.default;

  const createLimiter = (windowMs: number, max: number, prefix: string) =>
    rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
      store: new RedisStore({
        sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as never,
        prefix: `rl:${prefix}:`,
      }),
    });

  app.use('/authorize', createLimiter(5 * 60 * 1000, 10, 'authorize'));
  app.use('/token', createLimiter(60 * 1000, 10, 'token'));
  app.use('/register', createLimiter(60 * 60 * 1000, 3, 'register'));
  app.use(FREEE_CALLBACK_PATH, createLimiter(5 * 60 * 1000, 10, 'freee-cb'));
  app.use('/mcp', createLimiter(60 * 1000, 100, 'mcp'));

  logger.info('Rate limiting enabled');
}
