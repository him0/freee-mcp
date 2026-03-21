import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken, joseErrors } from './jwt.js';

const TEST_SECRET = 'test-secret-key-that-is-long-enough-for-hmac-256';
const TEST_ISSUER = 'https://mcp.example.com';

describe('jwt', () => {
  describe('signAccessToken + verifyAccessToken round-trip', () => {
    it('signs and verifies a token successfully', async () => {
      const token = await signAccessToken(
        { sub: 'user-123', scope: 'mcp:read mcp:write', clientId: 'client-abc' },
        TEST_SECRET,
        TEST_ISSUER,
      );

      const payload = await verifyAccessToken(token, TEST_SECRET, TEST_ISSUER);

      expect(payload.sub).toBe('user-123');
      expect(payload.scope).toBe('mcp:read mcp:write');
      expect(payload.client_id).toBe('client-abc');
      expect(payload.iss).toBe(TEST_ISSUER);
      expect(payload.iat).toBeTypeOf('number');
      expect(payload.exp).toBeTypeOf('number');
      expect(payload.exp - payload.iat).toBe(3600);
    });
  });

  describe('verifyAccessToken rejection', () => {
    it('rejects a token signed with a different secret', async () => {
      const token = await signAccessToken(
        { sub: 'user-1', scope: 'mcp:read', clientId: 'c1' },
        TEST_SECRET,
        TEST_ISSUER,
      );

      await expect(
        verifyAccessToken(token, 'wrong-secret-key-that-is-also-long-enough', TEST_ISSUER),
      ).rejects.toThrow(joseErrors.JWSSignatureVerificationFailed);
    });

    it('rejects a token with wrong issuer', async () => {
      const token = await signAccessToken(
        { sub: 'user-1', scope: 'mcp:read', clientId: 'c1' },
        TEST_SECRET,
        TEST_ISSUER,
      );

      await expect(
        verifyAccessToken(token, TEST_SECRET, 'https://wrong.example.com'),
      ).rejects.toThrow(joseErrors.JWTClaimValidationFailed);
    });

    it('rejects an expired token', async () => {
      // Create a token that expired 1 hour ago by manually constructing it
      const { SignJWT } = await import('jose');
      const key = new TextEncoder().encode(TEST_SECRET);
      const pastTime = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago

      const token = await new SignJWT({ scope: 'mcp:read', client_id: 'c1' })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject('user-1')
        .setIssuer(TEST_ISSUER)
        .setIssuedAt(pastTime)
        .setExpirationTime(pastTime + 3600) // expired 1 hour ago
        .sign(key);

      await expect(verifyAccessToken(token, TEST_SECRET, TEST_ISSUER)).rejects.toThrow(
        joseErrors.JWTExpired,
      );
    });
  });

  describe('missing claims', () => {
    it('rejects a token without scope claim', async () => {
      const { SignJWT } = await import('jose');
      const key = new TextEncoder().encode(TEST_SECRET);

      const token = await new SignJWT({ client_id: 'c1' })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject('user-1')
        .setIssuer(TEST_ISSUER)
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(key);

      await expect(verifyAccessToken(token, TEST_SECRET, TEST_ISSUER)).rejects.toThrow(
        'JWT missing required claims',
      );
    });

    it('rejects a token without client_id claim', async () => {
      const { SignJWT } = await import('jose');
      const key = new TextEncoder().encode(TEST_SECRET);

      const token = await new SignJWT({ scope: 'mcp:read' })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject('user-1')
        .setIssuer(TEST_ISSUER)
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(key);

      await expect(verifyAccessToken(token, TEST_SECRET, TEST_ISSUER)).rejects.toThrow(
        'JWT missing required claims',
      );
    });
  });

  describe('secret validation', () => {
    it('rejects a secret shorter than 32 characters', async () => {
      await expect(
        signAccessToken({ sub: 'u1', scope: 'mcp:read', clientId: 'c1' }, 'short', TEST_ISSUER),
      ).rejects.toThrow('JWT secret must be at least 32 characters');
    });
  });
});
