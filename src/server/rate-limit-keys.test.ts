import type { Request } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';
import { describe, expect, it } from 'vitest';
import { rateLimitIpKey, verifiedMcpRateLimitKey } from './http-server.js';

function requestWith(fields: Partial<Request> & { auth?: unknown }): Request {
  return fields as Request;
}

describe('rate limit key helpers', () => {
  it('normalizes IP fallback keys with express-rate-limit ipKeyGenerator', () => {
    const req = requestWith({ ip: '2001:db8:abcd:1234::1' });

    expect(rateLimitIpKey(req)).toBe(`ip:${ipKeyGenerator('2001:db8:abcd:1234::1')}`);
  });

  it('uses verified MCP user ID when bearer auth has populated auth context', () => {
    const req = requestWith({
      ip: '203.0.113.10',
      auth: {
        clientId: 'client-1',
        extra: { userId: 'user-1' },
      },
    });

    expect(verifiedMcpRateLimitKey(req)).toBe('user:user-1');
  });

  it('does not use an unverified bearer token payload as the MCP key', () => {
    const fakeToken =
      `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.` +
      `${Buffer.from(JSON.stringify({ sub: 'attacker-controlled-sub' })).toString('base64url')}.` +
      'invalid-signature';
    const req = requestWith({
      ip: '203.0.113.10',
      headers: { authorization: `Bearer ${fakeToken}` },
    });

    expect(verifiedMcpRateLimitKey(req)).toBe(`ip:${ipKeyGenerator('203.0.113.10')}`);
  });

  it('falls back to verified client ID when user ID is absent', () => {
    const req = requestWith({
      ip: '203.0.113.10',
      auth: {
        clientId: 'client-1',
        extra: {},
      },
    });

    expect(verifiedMcpRateLimitKey(req)).toBe('client:client-1');
  });
});
