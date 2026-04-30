import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type {
  AuthorizationParams,
  OAuthServerProvider,
} from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type {
  OAuthClientInformationFull,
  OAuthTokenRevocationRequest,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import express, { type Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { decodeBasicAuth } from './client-auth-basic.js';
import { createOverrideMetadataHandler } from './oauth-metadata-override.js';

// Integration test that wires the real SDK mcpAuthRouter together with our
// adapter middleware. The test exercises the public HTTP surface (metadata
// + /token + /revoke) the same way an MCP client would.

function basicHeader(id: string, secret: string): string {
  return `Basic ${Buffer.from(`${id}:${secret}`, 'utf8').toString('base64')}`;
}

function makeClientStore(
  clients: Record<string, OAuthClientInformationFull>,
): OAuthRegisteredClientsStore {
  return {
    getClient: async (id: string) => clients[id],
  };
}

function makeProvider(clientStore: OAuthRegisteredClientsStore): OAuthServerProvider {
  return {
    clientsStore: clientStore,
    async authorize(_client: OAuthClientInformationFull, _params: AuthorizationParams, res) {
      res.redirect(302, 'https://upstream.example/authorize');
    },
    async challengeForAuthorizationCode(_client, _code) {
      return 'unused-challenge';
    },
    async exchangeAuthorizationCode(_client, _code, _verifier, _redirect, _resource) {
      const tokens: OAuthTokens = {
        access_token: 'mock-access',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh',
        scope: 'mcp:read',
      };
      return tokens;
    },
    async exchangeRefreshToken(_client, refreshToken, _scopes, _resource) {
      if (refreshToken !== 'mock-refresh') {
        throw new Error('invalid refresh');
      }
      const tokens: OAuthTokens = {
        access_token: 'rotated-access',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'rotated-refresh',
        scope: 'mcp:read',
      };
      return tokens;
    },
    async verifyAccessToken(_token) {
      throw new Error('not used in this test');
    },
    async revokeToken(_client, _request: OAuthTokenRevocationRequest) {
      // no-op for the test
    },
    skipLocalPkceValidation: true,
  };
}

async function buildApp(clients: Record<string, OAuthClientInformationFull>): Promise<Express> {
  const app = express();
  app.set('trust proxy', 1);
  const clientStore = makeClientStore(clients);
  const provider = makeProvider(clientStore);
  const issuerUrl = new URL('https://mcp.example/');

  app.get(
    '/.well-known/oauth-authorization-server',
    createOverrideMetadataHandler({
      provider,
      issuerUrl,
      scopesSupported: ['mcp:read', 'mcp:write'],
    }),
  );
  app.use('/token', decodeBasicAuth({ clientStore, realm: 'freee MCP test' }));
  app.use('/revoke', decodeBasicAuth({ clientStore, realm: 'freee MCP test' }));

  const { mcpAuthRouter } = await import('@modelcontextprotocol/sdk/server/auth/router.js');
  app.use(
    mcpAuthRouter({
      provider,
      issuerUrl,
      resourceServerUrl: new URL('/mcp', issuerUrl),
      scopesSupported: ['mcp:read', 'mcp:write'],
      resourceName: 'freee MCP test',
    }),
  );
  return app;
}

const confidentialClient: OAuthClientInformationFull = {
  client_id: 'confid-1',
  client_secret: 'super-secret-1',
  redirect_uris: ['https://client.example/cb'],
  token_endpoint_auth_method: 'client_secret_basic',
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
};

const publicClient: OAuthClientInformationFull = {
  client_id: 'public-1',
  redirect_uris: ['https://client.example/cb'],
  token_endpoint_auth_method: 'none',
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
};

describe('OAuth AS — Basic auth integration', () => {
  it('advertises client_secret_basic in /.well-known/oauth-authorization-server', async () => {
    const app = await buildApp({});
    const res = await request(app).get('/.well-known/oauth-authorization-server');
    expect(res.status).toBe(200);
    expect(res.body.token_endpoint_auth_methods_supported).toContain('client_secret_basic');
    expect(res.body.token_endpoint_auth_methods_supported).toContain('client_secret_post');
    expect(res.body.token_endpoint_auth_methods_supported).toContain('none');
    expect(res.body.revocation_endpoint_auth_methods_supported).toContain('client_secret_basic');
  });

  it('accepts a token request with Authorization: Basic for a confidential client', async () => {
    const app = await buildApp({ [confidentialClient.client_id]: confidentialClient });
    const res = await request(app)
      .post('/token')
      .set('Authorization', basicHeader('confid-1', 'super-secret-1'))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('grant_type=refresh_token&refresh_token=mock-refresh');

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe('rotated-access');
  });

  it('still accepts client_secret_post token requests (no regression)', async () => {
    const app = await buildApp({ [confidentialClient.client_id]: confidentialClient });
    const res = await request(app)
      .post('/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(
        'grant_type=refresh_token&refresh_token=mock-refresh&client_id=confid-1&client_secret=super-secret-1',
      );

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe('rotated-access');
  });

  it('still accepts public clients via body without secret (none auth method)', async () => {
    const app = await buildApp({ [publicClient.client_id]: publicClient });
    const res = await request(app)
      .post('/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('grant_type=refresh_token&refresh_token=mock-refresh&client_id=public-1');

    expect(res.status).toBe(200);
  });

  it('rejects Basic with wrong secret with 401 + WWW-Authenticate', async () => {
    const app = await buildApp({ [confidentialClient.client_id]: confidentialClient });
    const res = await request(app)
      .post('/token')
      .set('Authorization', basicHeader('confid-1', 'wrong'))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('grant_type=refresh_token&refresh_token=mock-refresh');

    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toMatch(/^Basic realm=/);
    expect(res.body.error).toBe('invalid_client');
  });

  it('rejects Basic with malformed payload with 401', async () => {
    const app = await buildApp({});
    const res = await request(app)
      .post('/token')
      .set('Authorization', 'Basic !!!notbase64!!!')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('grant_type=refresh_token&refresh_token=mock-refresh');

    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toMatch(/^Basic realm=/);
  });

  it('rejects body+header credential collision with 400 invalid_request', async () => {
    const app = await buildApp({ [confidentialClient.client_id]: confidentialClient });
    const res = await request(app)
      .post('/token')
      .set('Authorization', basicHeader('confid-1', 'super-secret-1'))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(
        'grant_type=refresh_token&refresh_token=mock-refresh&client_id=confid-1&client_secret=super-secret-1',
      );

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  it('rejects public clients attempting Basic with 401', async () => {
    const app = await buildApp({ [publicClient.client_id]: publicClient });
    const res = await request(app)
      .post('/token')
      .set('Authorization', basicHeader('public-1', 'whatever'))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('grant_type=refresh_token&refresh_token=mock-refresh');

    expect(res.status).toBe(401);
    expect(res.body.error_description).toMatch(/public client/i);
  });

  it('accepts /revoke with Authorization: Basic', async () => {
    const app = await buildApp({ [confidentialClient.client_id]: confidentialClient });
    const res = await request(app)
      .post('/revoke')
      .set('Authorization', basicHeader('confid-1', 'super-secret-1'))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('token=any-token');

    expect(res.status).toBe(200);
  });
});
