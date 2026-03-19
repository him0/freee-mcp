import { describe, it, expect, vi, afterEach } from 'vitest';
import { extractTokenContext } from './context.js';
import { FileTokenStore } from './file-token-store.js';

vi.mock('../auth/tokens.js', () => ({
  loadTokens: vi.fn(),
  saveTokens: vi.fn(),
  clearTokens: vi.fn(),
  getValidAccessToken: vi.fn(),
}));

vi.mock('../config/companies.js', () => ({
  getCurrentCompanyId: vi.fn(),
  setCurrentCompany: vi.fn(),
  getCompanyInfo: vi.fn(),
}));

describe('extractTokenContext', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns FileTokenStore with userId="local" when extra is undefined', () => {
    const ctx = extractTokenContext(undefined);

    expect(ctx.tokenStore).toBeInstanceOf(FileTokenStore);
    expect(ctx.userId).toBe('local');
  });

  it('returns FileTokenStore when extra has no authInfo', () => {
    const ctx = extractTokenContext({});

    expect(ctx.tokenStore).toBeInstanceOf(FileTokenStore);
    expect(ctx.userId).toBe('local');
  });

  it('returns FileTokenStore when authInfo.extra is missing', () => {
    const ctx = extractTokenContext({ authInfo: {} });

    expect(ctx.tokenStore).toBeInstanceOf(FileTokenStore);
    expect(ctx.userId).toBe('local');
  });

  it('returns FileTokenStore when authInfo.extra has no tokenStore', () => {
    const ctx = extractTokenContext({ authInfo: { extra: { userId: 'user1' } } });

    expect(ctx.tokenStore).toBeInstanceOf(FileTokenStore);
    expect(ctx.userId).toBe('local');
  });

  it('returns custom tokenStore and userId from authInfo.extra', () => {
    const mockStore = {
      loadTokens: vi.fn(),
      saveTokens: vi.fn(),
      clearTokens: vi.fn(),
      getValidAccessToken: vi.fn(),
      getCurrentCompanyId: vi.fn(),
      setCurrentCompany: vi.fn(),
      getCompanyInfo: vi.fn(),
    };

    const ctx = extractTokenContext({
      authInfo: {
        extra: { tokenStore: mockStore, userId: 'remote-user-42' },
      },
    });

    expect(ctx.tokenStore).toBe(mockStore);
    expect(ctx.userId).toBe('remote-user-42');
  });

  it('returns the same singleton FileTokenStore across calls', () => {
    const ctx1 = extractTokenContext(undefined);
    const ctx2 = extractTokenContext(undefined);

    expect(ctx1.tokenStore).toBe(ctx2.tokenStore);
  });
});
