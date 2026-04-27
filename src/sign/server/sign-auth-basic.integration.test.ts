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
import { decodeBasicAuth } from '../../server/client-auth-basic.js';
import { createOverrideMetadataHandler } from '../../server/oauth-metadata-override.js';

// Sign-side smoke test: confirms the same adapter middleware integrates with
// the SDK on the Sign HTTP server. Sign and accounting share the middleware
// modules; this proves wiring at the integration boundary.

function basicHeader(id: string, secret: string): string {
  return `Basic ${Buffer.from(`${id}:${secret}`, 'utf8').toString('base64')}`;
}

const signClient: OAuthClientInformationFull = {
  client_id: 'sign-client-1',
  client_secret: 'sign-secret-1',
  redirect_uris: ['https://client.example/cb'],
  token_endpoint_auth_method: 'client_secret_basic',
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
};

function makeClientStore(): OAuthRegisteredClientsStore {
  return {
    getClient: async (id: string) => (id === signClient.client_id ? signClient : undefined),
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
    async exchangeAuthorizationCode(_client, _code, _v, _r, _res) {
      const tokens: OAuthTokens = {
        access_token: 'sign-access',
        token_type: 'bearer',
        expires_in: 3600,
        scope: 'mcp:read',
      };
      return tokens;
    },
    async exchangeRefreshToken(_client, refresh, _scopes, _resource) {
      if (refresh !== 'sign-refresh') throw new Error('invalid');
      const tokens: OAuthTokens = {
        access_token: 'sign-rotated',
        token_type: 'bearer',
        expires_in: 3600,
        scope: 'mcp:read',
      };
      return tokens;
    },
    async verifyAccessToken(_token) {
      throw new Error('not used in this test');
    },
    async revokeToken(_client, _request: OAuthTokenRevocationRequest) {},
    skipLocalPkceValidation: true,
  };
}

async function buildSignApp(): Promise<Express> {
  const app = express();
  app.set('trust proxy', 1);
  const clientStore = makeClientStore();
  const provider = makeProvider(clientStore);
  const issuerUrl = new URL('https://sign.example/');

  app.get(
    '/.well-known/oauth-authorization-server',
    createOverrideMetadataHandler({
      provider,
      issuerUrl,
      scopesSupported: ['mcp:read', 'mcp:write'],
    }),
  );
  app.use('/token', decodeBasicAuth({ clientStore, realm: 'freee Sign MCP test' }));
  app.use('/revoke', decodeBasicAuth({ clientStore, realm: 'freee Sign MCP test' }));

  const { mcpAuthRouter } = await import('@modelcontextprotocol/sdk/server/auth/router.js');
  app.use(
    mcpAuthRouter({
      provider,
      issuerUrl,
      resourceServerUrl: new URL('/mcp', issuerUrl),
      scopesSupported: ['mcp:read', 'mcp:write'],
      resourceName: 'freee Sign MCP test',
    }),
  );
  return app;
}

describe('Sign OAuth AS — Basic auth smoke', () => {
  it('advertises client_secret_basic in metadata', async () => {
    const app = await buildSignApp();
    const res = await request(app).get('/.well-known/oauth-authorization-server');
    expect(res.status).toBe(200);
    expect(res.body.token_endpoint_auth_methods_supported).toContain('client_secret_basic');
  });

  it('accepts /token with Authorization: Basic for a confidential Sign client', async () => {
    const app = await buildSignApp();
    const res = await request(app)
      .post('/token')
      .set('Authorization', basicHeader('sign-client-1', 'sign-secret-1'))
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('grant_type=refresh_token&refresh_token=sign-refresh');

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe('sign-rotated');
  });
});
