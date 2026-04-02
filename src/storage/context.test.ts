import { afterEach, describe, expect, it, vi } from 'vitest';
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
