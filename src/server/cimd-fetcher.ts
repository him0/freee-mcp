import { createHash } from 'node:crypto';
import { OAuthClientMetadataSchema } from '@modelcontextprotocol/sdk/shared/auth.js';
import type { OAuthClientMetadata } from '@modelcontextprotocol/sdk/shared/auth.js';
import { USER_AGENT } from '../constants.js';

const CIMD_FETCH_TIMEOUT_MS = 5000;
const MAX_RESPONSE_BYTES = 1_048_576; // 1MB

export interface CIMDFetcher {
  fetch(url: string): Promise<OAuthClientMetadata>;
}

export function hashCimdUrl(url: string): string {
  return createHash('sha256').update(url).digest('hex');
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
  }

  return false;
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    if (isPrivateHostname(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export class HttpCIMDFetcher implements CIMDFetcher {
  async fetch(url: string): Promise<OAuthClientMetadata> {
    if (!isSafeUrl(url)) {
      throw new Error(`Unsafe CIMD URL: ${url}`);
    }

    const response = await globalThis.fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
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
