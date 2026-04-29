import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import { getConfig, initRemoteConfig, loadRemoteServerConfig } from '../config.js';
import { FREEE_CALLBACK_PATH } from '../constants.js';
import { createMcpServer } from '../mcp/handlers.js';
import type { Redis } from '../storage/redis-client.js';
import { closeRedisClient, getRedisClient } from '../storage/redis-client.js';
import { RedisTokenStore } from '../storage/redis-token-store.js';
import { createTracingMiddleware } from '../telemetry/middleware.js';
import { RedisClientStore } from './client-store.js';
import { makeErrorChain, serializeErrorChain } from './error-serializer.js';
import { RedisUnavailableError } from './errors.js';
import { createFreeeCallbackHandler } from './freee-callback.js';
import { initLogger } from './logger.js';
import { FreeeOAuthProvider } from './oauth-provider.js';
import { OAuthStateStore } from './oauth-store.js';
import { getCurrentRecorder } from './request-context.js';
import { initUserAgentTransportMode } from './user-agent.js';

const BODY_SIZE_LIMIT = 1_048_576; // 1 MB

// Extend Express Request with request ID
declare module 'express' {
  interface Request {
    requestId?: string;
  }
}

const SHUTDOWN_TIMEOUT_MS = 30_000; // 30 seconds

export async function startHttpServer(options?: {
  otelShutdown?: () => Promise<void>;
}): Promise<void> {
  const remoteConfig = loadRemoteServerConfig();
  initRemoteConfig(remoteConfig);

  const logger = initLogger({ level: remoteConfig.logLevel, transportMode: 'remote' });
  initUserAgentTransportMode('remote');

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
    freeeApiUrl: remoteConfig.freeeApiUrl,
    callbackBaseUrl: remoteConfig.issuerUrl,
  });

  const config = getConfig();

  // Dynamic import of express (only loaded in serve mode)
  const express = (await import('express')).default;
  const app = express();
  // Trust first proxy (required for express-rate-limit behind reverse proxy / tunnel)
  app.set('trust proxy', 1);
  // No global express.json() -- mcpAuthRouter installs per-route body parsers
  // (urlencoded for /token, /authorize, /revoke; json for /register),
  // and StreamableHTTPServerTransport reads the raw request stream directly.

  // --- Tracing middleware (must be first to wrap entire request lifecycle) ---
  app.use(createTracingMiddleware());

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
      getCurrentRecorder()?.recordError({
        source: 'middleware',
        status_code: 413,
        error_type: 'payload_too_large',
        chain: makeErrorChain(
          'PayloadTooLargeError',
          'Content-Length exceeds configured body size limit',
        ),
      });
      res.status(413).json({ error: 'Payload too large' });
      return;
    }
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
      });
    } catch {
      res.status(503).json({
        status: 'degraded',
        redis: 'disconnected',
      });
    }
  });

  // freee OAuth callback (browser redirect, no MCP auth required)
  app.get(FREEE_CALLBACK_PATH, freeeCallbackHandler);

  // MCP Auth Router: /.well-known/*, /authorize, /token, /register, /revoke
  const { mcpAuthRouter } = await import('@modelcontextprotocol/sdk/server/auth/router.js');
  const issuerUrl = new URL(remoteConfig.issuerUrl);
  const mcpResourceUrl = new URL('/mcp', issuerUrl);
  // Override the SDK's authorization-server metadata to advertise
  // client_secret_basic (RFC 6749 §2.3.1). Mounted before mcpAuthRouter so
  // Express first-match-wins routes /.well-known here instead of into the SDK.
  const { createOverrideMetadataHandler } = await import('./oauth-metadata-override.js');
  app.get(
    '/.well-known/oauth-authorization-server',
    createOverrideMetadataHandler({
      provider,
      issuerUrl,
      scopesSupported: ['mcp:read', 'mcp:write'],
    }),
  );
  // Adapter middleware that extends the SDK's body-only client auth to also
  // accept Authorization: Basic. RFC 6749 §2.3.1 requires Basic to be
  // supported when client passwords are issued.
  const { decodeBasicAuth } = await import('./client-auth-basic.js');
  app.use('/token', decodeBasicAuth({ clientStore, realm: 'freee MCP' }));
  app.use('/revoke', decodeBasicAuth({ clientStore, realm: 'freee MCP' }));
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

  // MCP endpoint handler (stateless: each request creates a fresh transport)
  async function handleMcpRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    // Patch the request recorder with identity fields now that bearer auth
    // has run. company_id lookup is fail-soft: it is a diagnostic facet, not
    // load-bearing for the request, so a Redis hiccup must not break /mcp.
    const authExtra = (req as unknown as Record<string, unknown>).auth as
      | { extra?: Record<string, unknown> }
      | undefined;
    const userId =
      typeof authExtra?.extra?.userId === 'string' ? authExtra.extra.userId : undefined;
    const companyId = userId
      ? await tokenStore.getCurrentCompanyId(userId).catch(() => undefined)
      : undefined;
    getCurrentRecorder()?.updateContext({
      user_id: userId,
      company_id: companyId,
      session_id: sessionId,
    });

    // Unknown session ID: return 404 per MCP spec (stateless mode never issues session IDs)
    if (sessionId) {
      getCurrentRecorder()?.recordError({
        source: 'mcp_handler',
        status_code: 404,
        error_type: 'unknown_session',
        chain: makeErrorChain('SessionNotFound', 'Unknown session id supplied'),
      });
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Create a fresh transport for each request (stateless)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    const mcpServer = createMcpServer(config, { remote: true });
    await mcpServer.connect(transport);

    // Clean up transport when the HTTP response finishes (normal completion or client disconnect).
    // Cannot use a finally block here because handleRequest resolves before SSE streaming completes.
    res.on('close', () => {
      transport.close().catch(() => {});
    });

    await transport.handleRequest(req, res);
  }

  function mcpHandler(req: Request, res: Response): void {
    handleMcpRequest(req, res).catch((err: unknown) => {
      getCurrentRecorder()?.recordError({
        source: 'mcp_handler',
        status_code: 500,
        error_type: 'unhandled_exception',
        chain: serializeErrorChain(err),
      });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }

  app.post('/mcp', bearerAuth, mcpHandler);
  app.get('/mcp', bearerAuth, mcpHandler);

  app.delete('/mcp', bearerAuth, mcpHandler);

  // Express error handler (must be after all routes)
  app.use((err: unknown, _req: Request, res: Response, next: (err?: unknown) => void) => {
    if (err instanceof RedisUnavailableError) {
      if (!res.headersSent) {
        res.status(503).json({
          error: 'service_unavailable',
          message: 'Storage backend temporarily unavailable',
        });
      }
      getCurrentRecorder()?.recordError({
        source: 'redis_unavailable',
        status_code: 503,
        error_type: 'redis_unavailable',
        chain: serializeErrorChain(err),
      });
      return;
    }
    if (res.headersSent) {
      next(err);
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
    getCurrentRecorder()?.recordError({
      source: 'middleware',
      status_code: 500,
      error_type: 'unhandled_middleware_error',
      chain: serializeErrorChain(err),
    });
  });

  const server = app.listen(remoteConfig.port, () => {
    logger.info({ port: remoteConfig.port }, 'freee MCP HTTP server listening');
  });

  // Graceful shutdown
  let shuttingDown = false;
  async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info({ signal }, 'Shutting down gracefully...');

    // Force exit after timeout if graceful shutdown hangs
    const forceExitTimer = setTimeout(() => {
      logger.warn('Shutdown timeout, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    // Stop accepting new requests first
    await new Promise<void>((resolve) => {
      server.close(() => {
        logger.info('HTTP server closed');
        resolve();
      });
    });

    // Flush pending OTel spans before closing connections
    await options?.otelShutdown?.();

    // Close Redis after all in-flight requests have drained
    await closeRedisClient();

    process.exit(0);
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
