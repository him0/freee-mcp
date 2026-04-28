import type { OAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import { createOAuthMetadata } from '@modelcontextprotocol/sdk/server/auth/router.js';
import type { OAuthMetadata } from '@modelcontextprotocol/sdk/shared/auth.js';
import type { RequestHandler } from 'express';

export interface OverrideMetadataOptions {
  provider: OAuthServerProvider;
  issuerUrl: URL;
  baseUrl?: URL;
  scopesSupported?: string[];
  serviceDocumentationUrl?: URL;
}

// SDK @modelcontextprotocol/sdk@1.28.0 hardcodes ['client_secret_post', 'none']
// in createOAuthMetadata, omitting client_secret_basic. RFC 6749 §2.3.1 requires
// HTTP Basic to be supported, so we re-advertise it here. Drop this module when
// the SDK starts advertising client_secret_basic natively (the unit test on
// SDK_BASELINE_AUTH_METHODS will fail loudly when that happens).
const TOKEN_AUTH_METHODS_WITH_BASIC = [
  'client_secret_basic',
  'client_secret_post',
  'none',
] as const;

const REVOCATION_AUTH_METHODS_WITH_BASIC = ['client_secret_basic', 'client_secret_post'] as const;

export function buildOverriddenMetadata(options: OverrideMetadataOptions): OAuthMetadata {
  const baseline = createOAuthMetadata(options);
  const overridden: OAuthMetadata = {
    ...baseline,
    token_endpoint_auth_methods_supported: [...TOKEN_AUTH_METHODS_WITH_BASIC],
  };
  if (baseline.revocation_endpoint) {
    overridden.revocation_endpoint_auth_methods_supported = [...REVOCATION_AUTH_METHODS_WITH_BASIC];
  }
  return overridden;
}

export function createOverrideMetadataHandler(options: OverrideMetadataOptions): RequestHandler {
  const metadata = buildOverriddenMetadata(options);
  return (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).json(metadata);
  };
}
