import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type { OAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import { createOAuthMetadata } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { describe, expect, it, vi } from 'vitest';
import {
  buildOverriddenMetadata,
  createOverrideMetadataHandler,
} from './oauth-metadata-override.js';

function makeProvider(opts: {
  registerClient?: boolean;
  revokeToken?: boolean;
}): OAuthServerProvider {
  const clientsStore = {
    getClient: vi.fn(),
  } as unknown as OAuthRegisteredClientsStore;
  if (opts.registerClient) {
    (clientsStore as unknown as { registerClient: () => void }).registerClient = () => {};
  }
  const provider: Partial<OAuthServerProvider> = {
    clientsStore,
    authorize: vi.fn(),
    challengeForAuthorizationCode: vi.fn(),
    exchangeAuthorizationCode: vi.fn(),
    exchangeRefreshToken: vi.fn(),
    verifyAccessToken: vi.fn(),
  };
  if (opts.revokeToken) {
    provider.revokeToken = vi.fn();
  }
  return provider as OAuthServerProvider;
}

const issuerUrl = new URL('https://mcp.example.com/');

describe('buildOverriddenMetadata', () => {
  it('advertises client_secret_basic alongside client_secret_post and none', () => {
    const provider = makeProvider({ registerClient: true, revokeToken: true });
    const metadata = buildOverriddenMetadata({
      provider,
      issuerUrl,
      scopesSupported: ['mcp:read', 'mcp:write'],
    });

    expect(metadata.token_endpoint_auth_methods_supported).toEqual([
      'client_secret_basic',
      'client_secret_post',
      'none',
    ]);
  });

  it('advertises client_secret_basic on revocation endpoint when revoke is supported', () => {
    const provider = makeProvider({ registerClient: true, revokeToken: true });
    const metadata = buildOverriddenMetadata({ provider, issuerUrl });

    expect(metadata.revocation_endpoint).toBeDefined();
    expect(metadata.revocation_endpoint_auth_methods_supported).toEqual([
      'client_secret_basic',
      'client_secret_post',
    ]);
  });

  it('omits revocation_endpoint_auth_methods_supported when revoke not supported', () => {
    const provider = makeProvider({ registerClient: true, revokeToken: false });
    const metadata = buildOverriddenMetadata({ provider, issuerUrl });

    expect(metadata.revocation_endpoint).toBeUndefined();
    expect(metadata.revocation_endpoint_auth_methods_supported).toBeUndefined();
  });

  it('preserves other fields from the SDK baseline', () => {
    const provider = makeProvider({ registerClient: true, revokeToken: true });
    const baseline = createOAuthMetadata({
      provider,
      issuerUrl,
      scopesSupported: ['mcp:read'],
    });
    const overridden = buildOverriddenMetadata({
      provider,
      issuerUrl,
      scopesSupported: ['mcp:read'],
    });

    expect(overridden.issuer).toBe(baseline.issuer);
    expect(overridden.authorization_endpoint).toBe(baseline.authorization_endpoint);
    expect(overridden.token_endpoint).toBe(baseline.token_endpoint);
    expect(overridden.registration_endpoint).toBe(baseline.registration_endpoint);
    expect(overridden.code_challenge_methods_supported).toEqual(
      baseline.code_challenge_methods_supported,
    );
    expect(overridden.scopes_supported).toEqual(baseline.scopes_supported);
    expect(overridden.grant_types_supported).toEqual(baseline.grant_types_supported);
  });

  // SDK shape guard: this asserts that the SDK baseline still omits
  // client_secret_basic. When the SDK starts advertising it natively this
  // test will turn red, signaling that buildOverriddenMetadata is no longer
  // necessary and can be removed.
  it('SDK baseline does not yet advertise client_secret_basic (override still necessary)', () => {
    const provider = makeProvider({ registerClient: true, revokeToken: true });
    const baseline = createOAuthMetadata({ provider, issuerUrl });
    expect(baseline.token_endpoint_auth_methods_supported ?? []).not.toContain(
      'client_secret_basic',
    );
  });
});

describe('createOverrideMetadataHandler', () => {
  it('returns 200 with the overridden metadata and sets Cache-Control', () => {
    const provider = makeProvider({ registerClient: true, revokeToken: true });
    const handler = createOverrideMetadataHandler({ provider, issuerUrl });

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
    } as unknown as import('express').Response;

    handler({} as import('express').Request, res, vi.fn());

    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600');
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = (res.json as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as {
      token_endpoint_auth_methods_supported?: string[];
    };
    expect(payload.token_endpoint_auth_methods_supported).toContain('client_secret_basic');
  });
});
