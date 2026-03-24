import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadReceipt } from './file-upload.js';

vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
  },
}));

vi.mock('../config.js', () => ({
  getConfig: (): { freee: { apiUrl: string } } => ({
    freee: {
      apiUrl: 'https://api.freee.co.jp',
    },
  }),
}));

vi.mock('../auth/tokens.js', () => ({
  getValidAccessToken: vi.fn(),
}));

vi.mock('../config/companies.js', () => ({
  getCurrentCompanyId: vi.fn().mockResolvedValue('12345'),
}));

const mockFs = await import('node:fs/promises');
const { getValidAccessToken } = await import('../auth/tokens.js');

describe('uploadReceipt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getValidAccessToken).mockResolvedValue('test-access-token');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should upload file with required fields only', async () => {
    const fileBuffer = Buffer.from('test file content');
    vi.mocked(mockFs.default.readFile).mockResolvedValue(fileBuffer);

    const mockResponse = {
      ok: true,
      status: 201,
      text: vi.fn().mockResolvedValue(JSON.stringify({ receipt: { id: '1', status: 'uploaded' } })),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const result = await uploadReceipt('/path/to/test.pdf');

    expect(result).toEqual({ receipt: { id: '1', status: 'uploaded' } });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.freee.co.jp/api/1/receipts',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-access-token',
        }),
      }),
    );

    const callArgs = vi.mocked(fetch).mock.calls[0];
    const formData = callArgs[1]?.body as FormData;
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get('company_id')).toBe('12345');
    expect(formData.get('receipt')).toBeInstanceOf(Blob);
  });

  it('should upload file with all optional fields', async () => {
    const fileBuffer = Buffer.from('test file content');
    vi.mocked(mockFs.default.readFile).mockResolvedValue(fileBuffer);

    const mockResponse = {
      ok: true,
      status: 201,
      text: vi.fn().mockResolvedValue(JSON.stringify({ receipt: { id: '2', status: 'uploaded' } })),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await uploadReceipt('/path/to/invoice.pdf', {
      description: 'テスト領収書',
      receipt_metadatum_partner_name: 'テスト取引先',
      receipt_metadatum_issue_date: '2026-01-15',
      receipt_metadatum_amount: 10000,
      qualified_invoice: 'qualified',
      document_type: 'receipt',
    });

    const callArgs = vi.mocked(fetch).mock.calls[0];
    const formData = callArgs[1]?.body as FormData;
    expect(formData.get('description')).toBe('テスト領収書');
    expect(formData.get('receipt_metadatum_partner_name')).toBe('テスト取引先');
    expect(formData.get('receipt_metadatum_issue_date')).toBe('2026-01-15');
    expect(formData.get('receipt_metadatum_amount')).toBe('10000');
    expect(formData.get('qualified_invoice')).toBe('qualified');
    expect(formData.get('document_type')).toBe('receipt');
  });

  it('should throw error when file is not found', async () => {
    const error = new Error('ENOENT') as NodeJS.ErrnoException;
    error.code = 'ENOENT';
    vi.mocked(mockFs.default.readFile).mockRejectedValue(error);

    await expect(uploadReceipt('/nonexistent/file.pdf')).rejects.toThrow(
      'ファイルが見つかりません',
    );
  });

  it('should throw error when file permission is denied', async () => {
    const error = new Error('EACCES') as NodeJS.ErrnoException;
    error.code = 'EACCES';
    vi.mocked(mockFs.default.readFile).mockRejectedValue(error);

    await expect(uploadReceipt('/protected/file.pdf')).rejects.toThrow(
      'ファイルの読み取り権限がありません',
    );
  });

  it('should throw error when file exceeds 64MB', async () => {
    const largeBuffer = Buffer.alloc(65 * 1024 * 1024); // 65MB
    vi.mocked(mockFs.default.readFile).mockResolvedValue(largeBuffer);

    await expect(uploadReceipt('/path/to/large.pdf')).rejects.toThrow(
      'ファイルサイズが上限(64MB)を超えています',
    );
  });

  it('should throw error when not authenticated', async () => {
    const fileBuffer = Buffer.from('test');
    vi.mocked(mockFs.default.readFile).mockResolvedValue(fileBuffer);
    vi.mocked(getValidAccessToken).mockResolvedValue(null as unknown as string);

    await expect(uploadReceipt('/path/to/test.pdf')).rejects.toThrow('認証が必要です');
  });

  it('should throw error on 401 response', async () => {
    const fileBuffer = Buffer.from('test');
    vi.mocked(mockFs.default.readFile).mockResolvedValue(fileBuffer);

    const mockResponse = {
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({ message: 'Unauthorized' }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(uploadReceipt('/path/to/test.pdf')).rejects.toThrow('認証エラーが発生しました');
  });

  it('should throw error on 403 response', async () => {
    const fileBuffer = Buffer.from('test');
    vi.mocked(mockFs.default.readFile).mockResolvedValue(fileBuffer);

    const mockResponse = {
      ok: false,
      status: 403,
      json: vi.fn().mockResolvedValue({ message: 'Forbidden' }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(uploadReceipt('/path/to/test.pdf')).rejects.toThrow('アクセス拒否');
  });

  it('should throw error on other API errors', async () => {
    const fileBuffer = Buffer.from('test');
    vi.mocked(mockFs.default.readFile).mockResolvedValue(fileBuffer);

    const mockResponse = {
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({
        errors: [{ messages: ['不正なリクエストです'] }],
      }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await expect(uploadReceipt('/path/to/test.pdf')).rejects.toThrow('API request failed: 400');
  });

  it('should detect MIME type from file extension', async () => {
    const fileBuffer = Buffer.from('test');
    vi.mocked(mockFs.default.readFile).mockResolvedValue(fileBuffer);

    const mockResponse = {
      ok: true,
      status: 201,
      text: vi.fn().mockResolvedValue(JSON.stringify({ receipt: { id: '1' } })),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    await uploadReceipt('/path/to/photo.png');

    const callArgs = vi.mocked(fetch).mock.calls[0];
    const formData = callArgs[1]?.body as FormData;
    const receipt = formData.get('receipt') as Blob;
    expect(receipt.type).toBe('image/png');
  });
});
