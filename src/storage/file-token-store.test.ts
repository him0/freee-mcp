import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

const {
  loadTokens,
  saveTokens,
  clearTokens,
  getValidAccessToken,
} = await import('../auth/tokens.js');

const {
  getCurrentCompanyId,
  setCurrentCompany,
  getCompanyInfo,
} = await import('../config/companies.js');

describe('FileTokenStore', () => {
  let store: FileTokenStore;

  beforeEach(() => {
    store = new FileTokenStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loadTokens delegates to file-based loadTokens, ignoring userId', async () => {
    const mockTokens = {
      access_token: 'at',
      refresh_token: 'rt',
      expires_at: 9999999999999,
      token_type: 'Bearer',
      scope: 'read write',
    };
    vi.mocked(loadTokens).mockResolvedValue(mockTokens);

    const result = await store.loadTokens('any-user');

    expect(loadTokens).toHaveBeenCalledOnce();
    expect(result).toBe(mockTokens);
  });

  it('saveTokens delegates to file-based saveTokens, ignoring userId', async () => {
    const tokens = {
      access_token: 'at',
      refresh_token: 'rt',
      expires_at: 9999999999999,
      token_type: 'Bearer',
      scope: 'read write',
    };
    vi.mocked(saveTokens).mockResolvedValue(undefined);

    await store.saveTokens('ignored', tokens);

    expect(saveTokens).toHaveBeenCalledWith(tokens);
  });

  it('clearTokens delegates to file-based clearTokens', async () => {
    vi.mocked(clearTokens).mockResolvedValue(undefined);

    await store.clearTokens('ignored');

    expect(clearTokens).toHaveBeenCalledOnce();
  });

  it('getValidAccessToken delegates to file-based getValidAccessToken', async () => {
    vi.mocked(getValidAccessToken).mockResolvedValue('valid-token');

    const result = await store.getValidAccessToken('ignored');

    expect(getValidAccessToken).toHaveBeenCalledOnce();
    expect(result).toBe('valid-token');
  });

  it('getCurrentCompanyId delegates to file-based getCurrentCompanyId', async () => {
    vi.mocked(getCurrentCompanyId).mockResolvedValue('12345');

    const result = await store.getCurrentCompanyId('ignored');

    expect(getCurrentCompanyId).toHaveBeenCalledOnce();
    expect(result).toBe('12345');
  });

  it('setCurrentCompany delegates with all args except userId', async () => {
    vi.mocked(setCurrentCompany).mockResolvedValue(undefined);

    await store.setCurrentCompany('ignored', '999', 'My Co', 'desc');

    expect(setCurrentCompany).toHaveBeenCalledWith('999', 'My Co', 'desc');
  });

  it('getCompanyInfo delegates to file-based getCompanyInfo', async () => {
    const info = { id: '12345', name: 'Demo', addedAt: Date.now() };
    vi.mocked(getCompanyInfo).mockResolvedValue(info);

    const result = await store.getCompanyInfo('ignored', '12345');

    expect(getCompanyInfo).toHaveBeenCalledWith('12345');
    expect(result).toBe(info);
  });
});
