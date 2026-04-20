import { createHash } from 'node:crypto';
import type { OAuthClientMetadata } from '@modelcontextprotocol/sdk/shared/auth.js';
import { OAuthClientMetadataSchema } from '@modelcontextprotocol/sdk/shared/auth.js';
import { getUserAgent } from './user-agent.js';

const CIMD_FETCH_TIMEOUT_MS = 5000;
const MAX_RESPONSE_BYTES = 1_048_576; // 1MB

export interface CIMDFetcher {
  fetch(url: string): Promise<OAuthClientMetadata>;
}

export interface HttpCIMDFetcherOptions {
  // When true, http:// URLs whose host is localhost / 127.0.0.1 / [::1] bypass
  // the HTTPS requirement and the SSRF hostname filter. Intended for local
  // development only; callers must gate this on a non-production environment.
  allowInsecureLocalhost?: boolean;
}

export function hashCimdUrl(url: string): string {
  return createHash('sha256').update(url).digest('hex');
}

// Exported so RedisClientStore can apply the same "localhost" definition when
// deciding whether an http:// client_id should be treated as CIMD.
export function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '[::1]'
    );
  } catch {
    return false;
  }
}

function isPrivateHostname(hostname: string): boolean {
  // Localhost variants
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local')
  ) {
    return true;
  }

  // Cloud metadata endpoints
  if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
    return true;
  }

  // Private IPv4 ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x
  const ipv4Parts = hostname.split('.');
  if (ipv4Parts.length === 4 && ipv4Parts.every((p) => /^\d+$/.test(p))) {
    const [a, b] = ipv4Parts.map(Number);
    if (a === 10) return true;
    if (a === 127) return true; // entire loopback range
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true; // link-local
    if (a === 0) return true;
  }

  // IPv6 private/link-local (bracketed format in URLs)
  if (hostname.startsWith('[')) {
    const bare = hostname.replace(/^\[|\]$/g, '');
    if (bare.startsWith('fe80:') || bare.startsWith('fc') || bare.startsWith('fd')) {
      return true;
    }
    // IPv4-mapped / IPv4-compatible IPv6 (e.g. ::ffff:127.0.0.1, ::ffff:a00:1)
    if (bare.startsWith('::ffff:') || bare === '::1' || bare === '::') {
      return true;
    }
  }

  return false;
}

function isSafeUrl(url: string, allowInsecureLocalhost: boolean): boolean {
  try {
    const parsed = new URL(url);
    // Dev-only escape hatch: accept http://localhost (and loopback variants)
    // without the production SSRF filter. The loopback host is only reachable
    // from the process itself, so widening here does not expose new targets.
    if (
      allowInsecureLocalhost &&
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      isLocalhostUrl(url)
    ) {
      return true;
    }
    if (parsed.protocol !== 'https:') return false;
    if (isPrivateHostname(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export class HttpCIMDFetcher implements CIMDFetcher {
  private readonly allowInsecureLocalhost: boolean;

  constructor(options: HttpCIMDFetcherOptions = {}) {
    this.allowInsecureLocalhost = options.allowInsecureLocalhost ?? false;
  }

  async fetch(url: string): Promise<OAuthClientMetadata> {
    if (!isSafeUrl(url, this.allowInsecureLocalhost)) {
      throw new Error(`Unsafe CIMD URL: ${url}`);
    }

    const response = await globalThis.fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': getUserAgent(),
      },
      redirect: 'error', // Do not follow redirects (prevents SSRF via redirect)
      signal: AbortSignal.timeout(CIMD_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`CIMD fetch failed: ${response.status} ${response.statusText}`);
    }

    // Read as text with size limit (Content-Length can be omitted with chunked encoding)
    const text = await response.text();
    if (text.length > MAX_RESPONSE_BYTES) {
      throw new Error('CIMD response too large (> 1MB)');
    }

    const json: unknown = JSON.parse(text);
    const result = OAuthClientMetadataSchema.safeParse(json);
    if (!result.success) {
      throw new Error(`Invalid CIMD metadata: ${result.error.message}`);
    }

    return result.data;
  }
}
