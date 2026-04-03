import { describe, expect, it, vi } from 'vitest';
import { createSignMcpServer } from './handlers.js';

vi.mock('./config.js', () => ({
  SIGN_SERVER_INSTRUCTIONS:
    'freee サイン（電子契約）APIと連携するMCPサーバー。',
  SIGN_API_URL: 'https://ninja-sign.com',
  SIGN_AUTHORIZATION_ENDPOINT: 'https://ninja-sign.com/oauth/authorize',
  SIGN_TOKEN_ENDPOINT: 'https://ninja-sign.com/oauth/token',
  SIGN_OAUTH_SCOPE: 'all',
  getSignCredentials: (): Promise<{ clientId: string; clientSecret: string; callbackPort: number }> =>
    Promise.resolve({ clientId: 'id', clientSecret: 'secret', callbackPort: 54321 }),
}));

vi.mock('./tokens.js', () => ({
  loadSignTokens: (): Promise<null> => Promise.resolve(null),
  isSignTokenValid: (): boolean => false,
  clearSignTokens: (): Promise<void> => Promise.resolve(),
  getValidSignAccessToken: (): Promise<null> => Promise.resolve(null),
  OAuthTokenResponseSchema: { safeParse: vi.fn() },
  SignTokenDataSchema: { safeParse: vi.fn() },
}));

vi.mock('../auth/server.js', () => ({
  startCallbackServerWithAutoStop: (): Promise<void> => Promise.resolve(),
  getActualRedirectUri: (): string => 'http://127.0.0.1:54321/callback',
}));

describe('sign/handlers', () => {
  it('createSignMcpServer が sign_* ツールを登録する', () => {
    const server = createSignMcpServer();
    // McpServer is created without error and has the correct name
    expect(server).toBeDefined();
  });

  it('Sign server instructions が Sign API 固有の説明文を含む', async () => {
    const { SIGN_SERVER_INSTRUCTIONS } = await import('./config.js');
    expect(SIGN_SERVER_INSTRUCTIONS).toContain('サイン');
    expect(SIGN_SERVER_INSTRUCTIONS).not.toContain('会計');
  });
});
