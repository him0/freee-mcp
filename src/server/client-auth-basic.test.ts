import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';
import express, { type Express } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { decodeBasicAuth } from './client-auth-basic.js';
import { RequestRecorder, withRequestRecorder } from './request-context.js';

function basicHeader(id: string, secret: string): string {
  return `Basic ${Buffer.from(`${id}:${secret}`, 'utf8').toString('base64')}`;
}

function makeClientStore(
  clients: Record<string, Partial<OAuthClientInformationFull>>,
): OAuthRegisteredClientsStore {
  return {
    getClient: vi.fn(async (id: string) => {
      const found = clients[id];
      return found ? (found as OAuthClientInformationFull) : undefined;
    }),
  };
}

function buildApp(
  clientStore: OAuthRegisteredClientsStore,
  recorderHolder: { recorder?: RequestRecorder } = {},
): Express {
  const app = express();
  app.use((req, _res, next) => {
    const recorder = new RequestRecorder({
      request_id: 'test-req',
      source_ip: '127.0.0.1',
      method: req.method,
      path: req.path,
    });
    recorderHolder.recorder = recorder;
    withRequestRecorder(recorder, () => next());
  });
  app.use('/token', decodeBasicAuth({ clientStore, realm: 'freee MCP test' }));
  app.post('/token', express.urlencoded({ extended: false }), (req, res) => {
    res.status(200).json({ ok: true, body: req.body });
  });
  app.options('/token', (_req, res) => res.status(204).send());
  return app;
}

async function postToken(
  app: Express,
  opts: { headers?: Record<string, string>; body?: string; method?: 'POST' | 'OPTIONS' } = {},
) {
  const agent = request(app);
  const builder = opts.method === 'OPTIONS' ? agent.options('/token') : agent.post('/token');
  const withType = builder.set('Content-Type', 'application/x-www-form-urlencoded');
  for (const [k, v] of Object.entries(opts.headers ?? {})) {
    withType.set(k, v);
  }
  return opts.body !== undefined ? withType.send(opts.body) : withType.send();
}

describe('decodeBasicAuth', () => {
  it('passes through when no Authorization header is present', async () => {
    const clientStore = makeClientStore({});
    const app = buildApp(clientStore);
    const res = await postToken(app, { body: 'grant_type=client_credentials' });
    expect(res.status).toBe(200);
    expect(clientStore.getClient).not.toHaveBeenCalled();
  });

  it('passes through Bearer scheme without modification', async () => {
    const clientStore = makeClientStore({});
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      headers: { Authorization: 'Bearer abc' },
      body: 'grant_type=refresh_token',
    });
    expect(res.status).toBe(200);
    expect(clientStore.getClient).not.toHaveBeenCalled();
  });

  it('passes through OPTIONS preflight without invoking the validator', async () => {
    const clientStore = makeClientStore({});
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      method: 'OPTIONS',
      headers: { Authorization: basicHeader('id', 'secret') },
    });
    expect(res.status).not.toBe(401);
    expect(clientStore.getClient).not.toHaveBeenCalled();
  });

  it('decodes a valid Basic header and merges into req.body', async () => {
    const clientStore = makeClientStore({
      'client-a': { client_id: 'client-a', client_secret: 'secret-x' },
    });
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      headers: { Authorization: basicHeader('client-a', 'secret-x') },
      body: 'grant_type=client_credentials',
    });
    expect(res.status).toBe(200);
    expect((res.body as { body: Record<string, string> }).body).toMatchObject({
      grant_type: 'client_credentials',
      client_id: 'client-a',
      client_secret: 'secret-x',
    });
  });

  it('accepts colon characters inside client_secret', async () => {
    const clientStore = makeClientStore({
      'client-a': { client_id: 'client-a', client_secret: 'sec:ret:withcolons' },
    });
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      headers: { Authorization: basicHeader('client-a', 'sec:ret:withcolons') },
      body: 'grant_type=client_credentials',
    });
    expect(res.status).toBe(200);
    expect((res.body as { body: Record<string, string> }).body.client_secret).toBe(
      'sec:ret:withcolons',
    );
  });

  it('URL-decodes credentials per application/x-www-form-urlencoded', async () => {
    const id = 'a b';
    const secret = 's@c+t';
    const encoded = `${encodeURIComponent(id).replace(/%20/g, '+')}:${encodeURIComponent(secret)}`;
    const header = `Basic ${Buffer.from(encoded, 'utf8').toString('base64')}`;
    const clientStore = makeClientStore({ [id]: { client_id: id, client_secret: secret } });
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      headers: { Authorization: header },
      body: 'grant_type=client_credentials',
    });
    expect(res.status).toBe(200);
    expect((res.body as { body: Record<string, string> }).body.client_id).toBe(id);
    expect((res.body as { body: Record<string, string> }).body.client_secret).toBe(secret);
  });

  it('rejects malformed base64 with 401 + WWW-Authenticate', async () => {
    const clientStore = makeClientStore({});
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      headers: { Authorization: 'Basic !!!notbase64!!!' },
      body: 'grant_type=client_credentials',
    });
    expect(res.status).toBe(401);
    expect((res.headers['www-authenticate'] ?? '').toString()).toMatch(/^Basic realm=/);
    expect((res.body as { error: string }).error).toBe('invalid_client');
  });

  it('includes charset="UTF-8" in WWW-Authenticate per RFC 7617 §2.1', async () => {
    const clientStore = makeClientStore({});
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      headers: { Authorization: basicHeader('missing', 'secret') },
      body: 'grant_type=client_credentials',
    });
    expect((res.headers['www-authenticate'] ?? '').toString()).toMatch(/charset="UTF-8"/);
  });

  it('rejects missing colon with 401', async () => {
    const encoded = Buffer.from('noColonHere', 'utf8').toString('base64');
    const clientStore = makeClientStore({});
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      headers: { Authorization: `Basic ${encoded}` },
      body: 'grant_type=client_credentials',
    });
    expect(res.status).toBe(401);
    expect((res.body as { error: string }).error).toBe('invalid_client');
  });

  it('rejects malformed percent-encoding with 401', async () => {
    const encoded = Buffer.from('client%ZZ:secret', 'utf8').toString('base64');
    const clientStore = makeClientStore({});
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      headers: { Authorization: `Basic ${encoded}` },
      body: 'grant_type=client_credentials',
    });
    expect(res.status).toBe(401);
    expect((res.body as { error: string }).error).toBe('invalid_client');
  });

  it('rejects empty client_id (e.g. ":secret") with 401', async () => {
    const encoded = Buffer.from(':secret', 'utf8').toString('base64');
    const clientStore = makeClientStore({});
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      headers: { Authorization: `Basic ${encoded}` },
      body: 'grant_type=client_credentials',
    });
    expect(res.status).toBe(401);
  });

  it('rejects unknown client_id with 401 + WWW-Authenticate', async () => {
    const clientStore = makeClientStore({});
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      headers: { Authorization: basicHeader('missing', 'secret') },
      body: 'grant_type=client_credentials',
    });
    expect(res.status).toBe(401);
    expect((res.body as { error: string }).error).toBe('invalid_client');
  });

  it('rejects wrong client_secret with 401 (timing-safe compare)', async () => {
    const clientStore = makeClientStore({
      'client-a': { client_id: 'client-a', client_secret: 'right' },
    });
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      headers: { Authorization: basicHeader('client-a', 'wrong') },
      body: 'grant_type=client_credentials',
    });
    expect(res.status).toBe(401);
  });

  it('rejects public clients (no client_secret) attempting Basic with 401', async () => {
    const clientStore = makeClientStore({
      'public-a': { client_id: 'public-a' },
    });
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      headers: { Authorization: basicHeader('public-a', 'whatever') },
      body: 'grant_type=client_credentials',
    });
    expect(res.status).toBe(401);
    expect((res.body as { error_description: string }).error_description).toMatch(/public client/i);
  });

  it('rejects expired client_secret with 401', async () => {
    const clientStore = makeClientStore({
      'client-a': {
        client_id: 'client-a',
        client_secret: 'sec',
        client_secret_expires_at: 1,
      },
    });
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      headers: { Authorization: basicHeader('client-a', 'sec') },
      body: 'grant_type=client_credentials',
    });
    expect(res.status).toBe(401);
    expect((res.body as { error_description: string }).error_description).toMatch(/expire/i);
  });

  it('rejects body+header credential collision with 400 invalid_request', async () => {
    const clientStore = makeClientStore({
      'client-a': { client_id: 'client-a', client_secret: 'sec' },
    });
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      headers: { Authorization: basicHeader('client-a', 'sec') },
      body: 'grant_type=client_credentials&client_id=client-a&client_secret=sec',
    });
    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toBe('invalid_request');
  });

  it('does not leak client_secret into the response body or headers', async () => {
    const clientStore = makeClientStore({
      'client-a': { client_id: 'client-a', client_secret: 'super-secret' },
    });
    const app = buildApp(clientStore);
    const res = await postToken(app, {
      headers: { Authorization: basicHeader('client-a', 'wrong-guess') },
      body: 'grant_type=client_credentials',
    });
    expect(res.status).toBe(401);
    const serialized = JSON.stringify({ body: res.body, headers: res.headers });
    expect(serialized).not.toContain('super-secret');
    expect(serialized).not.toContain('wrong-guess');
  });

  it('records canonical log error with source=auth on rejection', async () => {
    const clientStore = makeClientStore({});
    const recorderHolder: { recorder?: RequestRecorder } = {};
    const app = buildApp(clientStore, recorderHolder);
    await postToken(app, {
      headers: { Authorization: basicHeader('missing', 'secret') },
      body: 'grant_type=client_credentials',
    });
    const payload = recorderHolder.recorder?.buildPayload({ status: 401, duration_ms: 0 });
    expect(payload?.errors.length ?? 0).toBeGreaterThan(0);
    const err = payload?.errors[0];
    expect(err?.source).toBe('auth');
    expect(err?.status_code).toBe(401);
    expect(err?.error_type).toBe('invalid_client');
  });
});
