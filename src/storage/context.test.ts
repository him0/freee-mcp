import { InvalidTokenError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initUserAgentTransportMode } from '../server/user-agent.js';
import { extractTokenContext, resolveCompanyId } from './context.js';
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
    // The user-agent module holds a single mutable transport mode global,
    // so reset it after each test to avoid leaking remote mode into later
    // cases that expect the stdio default.
    initUserAgentTransportMode('stdio');
  });

  describe('stdio mode (single-tenant local CLI)', () => {
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

    it('returns the same singleton FileTokenStore across calls', () => {
      const ctx1 = extractTokenContext(undefined);
      const ctx2 = extractTokenContext(undefined);

      expect(ctx1.tokenStore).toBe(ctx2.tokenStore);
    });
  });

  describe('remote mode (multi-tenant HTTP server)', () => {
    beforeEach(() => {
      initUserAgentTransportMode('remote');
    });

    it('throws InvalidTokenError when extra is undefined', () => {
      expect(() => extractTokenContext(undefined)).toThrow(InvalidTokenError);
    });

    it('throws InvalidTokenError when extra has no authInfo', () => {
      expect(() => extractTokenContext({})).toThrow(InvalidTokenError);
    });

    it('throws InvalidTokenError when authInfo.extra is missing', () => {
      expect(() => extractTokenContext({ authInfo: {} })).toThrow(InvalidTokenError);
    });

    it('throws InvalidTokenError when authInfo.extra has userId but no tokenStore', () => {
      expect(() =>
        extractTokenContext({ authInfo: { extra: { userId: 'user1' } } }),
      ).toThrow(InvalidTokenError);
    });

    it('throws InvalidTokenError even when authInfo.extra is a partial object (regression guard)', () => {
      // Partial AuthExtra (has `extra` key but no tokenStore/userId) must
      // never silently fall back to the single-tenant local file store.
      expect(() =>
        extractTokenContext({ authInfo: { extra: {} } }),
      ).toThrow(InvalidTokenError);
    });
  });

  it('returns custom tokenStore and userId from authInfo.extra (remote injection succeeds)', () => {
    initUserAgentTransportMode('remote');

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
});

describe('resolveCompanyId', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createMockStore() {
    return {
      loadTokens: vi.fn(),
      saveTokens: vi.fn(),
      clearTokens: vi.fn(),
      getValidAccessToken: vi.fn(),
      getCurrentCompanyId: vi.fn().mockResolvedValue('12345'),
      setCurrentCompany: vi.fn(),
      getCompanyInfo: vi.fn(),
    };
  }

  it('fetches companyId from store on first call and caches it', async () => {
    const mockStore = createMockStore();
    const ctx = { tokenStore: mockStore, userId: 'user-1' };

    const result = await resolveCompanyId(ctx);

    expect(result).toBe('12345');
    expect(mockStore.getCurrentCompanyId).toHaveBeenCalledOnce();
    expect(mockStore.getCurrentCompanyId).toHaveBeenCalledWith('user-1');
    expect(ctx.companyId).toBe('12345');
  });

  it('returns cached value on subsequent calls without hitting store', async () => {
    const mockStore = createMockStore();
    const ctx = { tokenStore: mockStore, userId: 'user-1' };

    const first = await resolveCompanyId(ctx);
    const second = await resolveCompanyId(ctx);
    const third = await resolveCompanyId(ctx);

    expect(first).toBe('12345');
    expect(second).toBe('12345');
    expect(third).toBe('12345');
    expect(mockStore.getCurrentCompanyId).toHaveBeenCalledOnce();
  });

  it('returns pre-set companyId without calling store', async () => {
    const mockStore = createMockStore();
    const ctx = { tokenStore: mockStore, userId: 'user-1', companyId: '99999' };

    const result = await resolveCompanyId(ctx);

    expect(result).toBe('99999');
    expect(mockStore.getCurrentCompanyId).not.toHaveBeenCalled();
  });

  it('caches falsy companyId values correctly', async () => {
    const mockStore = createMockStore();
    mockStore.getCurrentCompanyId.mockResolvedValue('0');
    const ctx = { tokenStore: mockStore, userId: 'user-1' };

    const first = await resolveCompanyId(ctx);
    const second = await resolveCompanyId(ctx);

    expect(first).toBe('0');
    expect(second).toBe('0');
    expect(mockStore.getCurrentCompanyId).toHaveBeenCalledOnce();
  });
});
