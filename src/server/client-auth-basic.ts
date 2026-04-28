import { timingSafeEqual } from 'node:crypto';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import express, { type RequestHandler } from 'express';
import { makeErrorChain } from './error-serializer.js';
import { getCurrentRecorder } from './request-context.js';

export interface DecodeBasicAuthOptions {
  clientStore: OAuthRegisteredClientsStore;
  realm: string;
}

interface CredentialsFromBody {
  client_id?: unknown;
  client_secret?: unknown;
}

function safeStringEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function buildWwwAuthenticate(realm: string, error: string, description: string): string {
  // RFC 7617 §2.1 charset, RFC 6749 §5.2 error / error_description.
  // description is callsite-controlled (no user-supplied content), so static-quoting is safe.
  return `Basic realm="${realm}", charset="UTF-8", error="${error}", error_description="${description}"`;
}

function reject401(
  res: express.Response,
  realm: string,
  description: string,
  errorTypeForLog: string,
  errorName: string,
): void {
  const wwwAuthenticate = buildWwwAuthenticate(realm, 'invalid_client', description);
  getCurrentRecorder()?.recordError({
    source: 'auth',
    status_code: 401,
    error_type: errorTypeForLog,
    chain: makeErrorChain(errorName, description),
  });
  res.setHeader('WWW-Authenticate', wwwAuthenticate);
  res.status(401).json({ error: 'invalid_client', error_description: description });
}

function reject400(
  res: express.Response,
  description: string,
  errorTypeForLog: string,
  errorName: string,
): void {
  getCurrentRecorder()?.recordError({
    source: 'auth',
    status_code: 400,
    error_type: errorTypeForLog,
    chain: makeErrorChain(errorName, description),
  });
  res.status(400).json({ error: 'invalid_request', error_description: description });
}

/**
 * Per RFC 6749 §2.3.1, client credentials in the Authorization header are
 * `application/x-www-form-urlencoded` encoded inside the base64 payload.
 * `decodeURIComponent` throws `URIError` on malformed `%` escapes; the caller
 * must treat that as a credential decoding failure (401), never let it surface
 * as a 500.
 */
function decodeFormUrlEncoded(input: string): string {
  return decodeURIComponent(input.replace(/\+/g, ' '));
}

function parseBasicHeader(
  header: string,
): { ok: true; clientId: string; clientSecret: string } | { ok: false; reason: string } {
  if (!/^Basic\s+/i.test(header)) return { ok: false, reason: 'Authorization scheme is not Basic' };
  const encoded = header.replace(/^Basic\s+/i, '').trim();
  if (encoded.length === 0) return { ok: false, reason: 'Empty Basic credentials' };

  // Buffer.from('...', 'base64') silently ignores invalid characters and
  // returns whatever bytes can be decoded. We rely on the downstream
  // colon-and-non-empty checks to catch garbage input — random base64-invalid
  // strings either decode to nothing or to bytes lacking a colon separator.
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');

  const colonIdx = decoded.indexOf(':');
  if (colonIdx === -1) {
    return { ok: false, reason: 'Basic credentials missing colon separator' };
  }
  const rawId = decoded.slice(0, colonIdx);
  const rawSecret = decoded.slice(colonIdx + 1);

  let clientId: string;
  let clientSecret: string;
  try {
    clientId = decodeFormUrlEncoded(rawId);
    clientSecret = decodeFormUrlEncoded(rawSecret);
  } catch {
    return { ok: false, reason: 'Malformed percent-encoding in Basic credentials' };
  }

  if (clientId.length === 0) {
    return { ok: false, reason: 'Empty client_id in Basic credentials' };
  }
  return { ok: true, clientId, clientSecret };
}

/**
 * Adapter middleware that brings the SDK's token / revocation endpoints up to
 * RFC 6749 §2.3.1 (HTTP Basic) compliance without forking the SDK router.
 *
 * Behavior:
 * - No Authorization header → pass through; SDK's body-based authenticateClient handles it.
 * - Non-POST (e.g., OPTIONS preflight) → pass through.
 * - Authorization: Basic with malformed payload → 401 + WWW-Authenticate, never reaches SDK.
 * - Authorization: Basic with valid payload but client validation fails → 401 + WWW-Authenticate.
 * - Authorization: Basic + body credentials present → 400 invalid_request (RFC §2.3 ambiguity).
 * - Public client attempting Basic → 401 (RFC §2.3.1 limits Basic to clients with passwords).
 * - Authorization: Basic with valid creds → merge into req.body so SDK's authenticateClient
 *   re-validates the same data and proceeds. timingSafeEqual is used for our pre-validation;
 *   the SDK's `!==` second check is unavoidable (its own concern, not addressed here).
 */
export function decodeBasicAuth(options: DecodeBasicAuthOptions): RequestHandler {
  const { clientStore, realm } = options;
  const bodyParser = express.urlencoded({ extended: false });

  const handler: RequestHandler = (req, res, next) => {
    if (req.method !== 'POST') return next();

    const authHeader = req.headers.authorization;
    if (!authHeader || !/^Basic\s+/i.test(authHeader)) {
      // Bearer or no header → SDK validates body, no change.
      return next();
    }

    // Body parser must run before we can detect collisions with body credentials.
    // Body-parser is a no-op when req._body is already true.
    bodyParser(req, res, (parseErr) => {
      if (parseErr) {
        reject400(res, 'Invalid request body', 'invalid_request', 'InvalidRequestError');
        return;
      }

      const body = (req.body ?? {}) as CredentialsFromBody;
      if (typeof body.client_id === 'string' || typeof body.client_secret === 'string') {
        reject400(
          res,
          'Client credentials must not be sent both via Authorization header and request body',
          'invalid_request',
          'InvalidRequestError',
        );
        return;
      }

      const parsed = parseBasicHeader(authHeader);
      if (!parsed.ok) {
        reject401(res, realm, parsed.reason, 'invalid_client', 'InvalidClientError');
        return;
      }

      void (async () => {
        try {
          const client = await clientStore.getClient(parsed.clientId);
          if (!client) {
            reject401(res, realm, 'Invalid client_id', 'invalid_client', 'InvalidClientError');
            return;
          }
          if (!client.client_secret) {
            // Public client: per RFC 6749 §2.3.1, Basic is only for clients with a password.
            reject401(
              res,
              realm,
              'Basic authentication is not permitted for public clients',
              'invalid_client',
              'InvalidClientError',
            );
            return;
          }
          if (!safeStringEquals(client.client_secret, parsed.clientSecret)) {
            reject401(res, realm, 'Invalid client_secret', 'invalid_client', 'InvalidClientError');
            return;
          }
          if (
            client.client_secret_expires_at &&
            client.client_secret_expires_at < Math.floor(Date.now() / 1000)
          ) {
            reject401(
              res,
              realm,
              'Client secret has expired',
              'invalid_client',
              'InvalidClientError',
            );
            return;
          }

          // Merge into body so the SDK's authenticateClient sees the same credentials
          // and produces the same `req.client` populated state downstream.
          (req.body as Record<string, unknown>).client_id = parsed.clientId;
          (req.body as Record<string, unknown>).client_secret = parsed.clientSecret;
          next();
        } catch (err) {
          reject401(
            res,
            realm,
            'Unable to validate Basic credentials',
            'invalid_client',
            err instanceof Error ? err.name : 'InvalidClientError',
          );
        }
      })();
    });
  };

  return handler;
}
