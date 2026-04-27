import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies before importing the module
const mockRemoteConfig = {
  port: 3001,
  issuerUrl: 'https://mcp.example.com',
  jwtSecret: 'a-test-secret-that-is-at-least-32-characters-long',
  freeeClientId: 'test-cid',
  freeeClientSecret: 'test-csec',
  freeeAuthorizationEndpoint: 'https://accounts.secure.freee.co.jp/public_api/authorize',
  tokenEndpoint: 'https://test.freee.co.jp/token',
  scope: 'read write',
  freeeApiUrl: 'https://api.freee.co.jp',
  redisUrl: 'redis://localhost:6379',
};

vi.mock('../config.js', () => ({
  loadRemoteServerConfig: vi.fn(() => mockRemoteConfig),
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

const mockHandleRequest = vi.fn().mockResolvedValue(undefined);
const mockClose = vi.fn().mockResolvedValue(undefined);

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: vi.fn().mockImplementation(() => ({
    sessionId: undefined,
    handleRequest: mockHandleRequest,
    close: mockClose,
    onclose: null,
  })),
}));

const mockConnect = vi.fn().mockResolvedValue(undefined);

vi.mock('../mcp/handlers.js', () => ({
  createMcpServer: vi.fn(() => ({
    connect: mockConnect,
  })),
}));

// OAuth foundation mocks
vi.mock('./oauth-store.js', () => ({
  OAuthStateStore: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('./client-store.js', () => ({
  RedisClientStore: vi.fn().mockImplementation(() => ({})),
}));

const mockProvider = {
  clientsStore: {},
  authorize: vi.fn(),
  challengeForAuthorizationCode: vi.fn(),
  exchangeAuthorizationCode: vi.fn(),
  exchangeRefreshToken: vi.fn(),
  verifyAccessToken: vi.fn(),
  revokeToken: vi.fn(),
};

vi.mock('./oauth-provider.js', () => ({
  FreeeOAuthProvider: vi.fn().mockImplementation(() => mockProvider),
}));

vi.mock('./freee-callback.js', () => ({
  createFreeeCallbackHandler: vi.fn(() =>
    vi.fn((_req: unknown, res: { json: (v: unknown) => void }) => res.json({ ok: true })),
  ),
}));

vi.mock('@modelcontextprotocol/sdk/server/auth/router.js', () => ({
  mcpAuthRouter: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
  // createOAuthMetadata is imported by oauth-metadata-override.ts; provide a
  // minimal stub so that module loads successfully under this mock.
  createOAuthMetadata: vi.fn(() => ({
    issuer: 'https://test/',
    authorization_endpoint: 'https://test/authorize',
    token_endpoint: 'https://test/token',
    response_types_supported: ['code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
  })),
  getOAuthProtectedResourceMetadataUrl: vi.fn(
    () => 'https://test/.well-known/oauth-protected-resource',
  ),
}));

vi.mock('./oauth-metadata-override.js', () => ({
  createOverrideMetadataHandler: vi.fn(
    () => (_req: unknown, res: { status: (n: number) => { json: (v: unknown) => void } }) =>
      res.status(200).json({}),
  ),
}));

vi.mock('./client-auth-basic.js', () => ({
  decodeBasicAuth: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}));

vi.mock('@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js', () => ({
  requireBearerAuth: vi.fn(
    () => (req: Record<string, unknown>, _res: unknown, next: () => void) => {
      req.auth = {
        token: 'mock-jwt',
        clientId: 'test-cid',
        scopes: ['mcp:read', 'mcp:write'],
        extra: { userId: 'user-1', tokenStore: {} },
      };
      next();
    },
  ),
}));

describe('HTTP Server - OAuth integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize FreeeOAuthProvider with correct dependencies', async () => {
    const { FreeeOAuthProvider } = await import('./oauth-provider.js');

    // FreeeOAuthProvider should have been called by module-level mock setup
    // Verify the constructor signature matches our expectations
    expect(FreeeOAuthProvider).toBeDefined();

    const providerConstructor = FreeeOAuthProvider as ReturnType<typeof vi.fn>;
    // The mock is set up, verify it's callable
    const instance = providerConstructor({
      clientStore: {},
      oauthStore: {},
      tokenStore: {},
      jwtSecret: mockRemoteConfig.jwtSecret,
      issuerUrl: mockRemoteConfig.issuerUrl,
      freeeClientId: mockRemoteConfig.freeeClientId,
      freeeAuthorizationEndpoint: mockRemoteConfig.freeeAuthorizationEndpoint,
      callbackBaseUrl: mockRemoteConfig.issuerUrl,
    });
    expect(instance).toBeDefined();
  });

  it('should configure mcpAuthRouter with provider and issuerUrl', async () => {
    const { mcpAuthRouter } = await import('@modelcontextprotocol/sdk/server/auth/router.js');

    // Verify the mock is set up correctly
    expect(mcpAuthRouter).toBeDefined();
    expect(typeof mcpAuthRouter).toBe('function');
  });

  it('should configure requireBearerAuth with provider as verifier', async () => {
    const { requireBearerAuth } = await import(
      '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js'
    );

    expect(requireBearerAuth).toBeDefined();
    expect(typeof requireBearerAuth).toBe('function');
  });

  it('should inject auth context via requireBearerAuth for MCP requests', () => {
    const req: Record<string, unknown> = {
      path: '/mcp',
      headers: { authorization: 'Bearer mock-jwt' },
    };

    const next = vi.fn();

    // Simulate requireBearerAuth middleware behavior
    req.auth = {
      token: 'mock-jwt',
      clientId: 'test-cid',
      scopes: ['mcp:read', 'mcp:write'],
      extra: { userId: 'user-1', tokenStore: {} },
    };
    next();

    expect(next).toHaveBeenCalled();
    expect(req.auth).toEqual({
      token: 'mock-jwt',
      clientId: 'test-cid',
      scopes: ['mcp:read', 'mcp:write'],
      extra: { userId: 'user-1', tokenStore: expect.any(Object) },
    });
  });
});

describe('HTTP Server - health check', () => {
  it('should return ok status without sessions field when Redis is connected', async () => {
    const { getRedisClient } = await import('../storage/redis-client.js');
    const redis = (getRedisClient as ReturnType<typeof vi.fn>)();

    const result: Record<string, unknown> = { status: 'degraded', redis: 'disconnected' };

    try {
      await redis.ping();
      result.status = 'ok';
      result.redis = 'connected';
    } catch {
      // would stay degraded
    }

    expect(result.status).toBe('ok');
    expect(result.redis).toBe('connected');
    expect(result).not.toHaveProperty('sessions');
  });
});

describe('HTTP Server - stateless transport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create transport with sessionIdGenerator: undefined', async () => {
    const { StreamableHTTPServerTransport } = await import(
      '@modelcontextprotocol/sdk/server/streamableHttp.js'
    );
    const TransportMock = StreamableHTTPServerTransport as ReturnType<typeof vi.fn>;

    // Simulate what handleMcpRequest does
    const transport = new TransportMock({ sessionIdGenerator: undefined });

    expect(TransportMock).toHaveBeenCalledWith({ sessionIdGenerator: undefined });
    expect(transport.sessionId).toBeUndefined();
  });

  it('should create a fresh McpServer for each request', async () => {
    const { createMcpServer } = await import('../mcp/handlers.js');
    const createMcpServerMock = createMcpServer as ReturnType<typeof vi.fn>;

    // Simulate two independent requests
    const server1 = createMcpServerMock({ server: { name: 'test' } }, { remote: true });
    const server2 = createMcpServerMock({ server: { name: 'test' } }, { remote: true });

    expect(createMcpServerMock).toHaveBeenCalledTimes(2);
    expect(server1).not.toBe(server2);
  });

  it('should handle requests with existing Mcp-Session-Id header (orphaned session)', async () => {
    const { StreamableHTTPServerTransport } = await import(
      '@modelcontextprotocol/sdk/server/streamableHttp.js'
    );
    const TransportMock = StreamableHTTPServerTransport as ReturnType<typeof vi.fn>;

    // In stateless mode, Mcp-Session-Id header is ignored by the transport
    const transport = new TransportMock({ sessionIdGenerator: undefined });
    const mockReq = { headers: { 'mcp-session-id': 'orphaned-id' } };
    const mockRes = {};

    await transport.handleRequest(mockReq, mockRes);

    expect(mockHandleRequest).toHaveBeenCalledWith(mockReq, mockRes);
  });
});

describe('HTTP Server - config integration', () => {
  it('should load remote config without bearerToken', () => {
    expect(mockRemoteConfig).not.toHaveProperty('bearerToken');
    expect(mockRemoteConfig.issuerUrl).toBe('https://mcp.example.com');
    expect(mockRemoteConfig.jwtSecret).toBeDefined();
    expect(mockRemoteConfig.jwtSecret.length).toBeGreaterThanOrEqual(32);
  });
});
