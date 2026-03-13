import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { addFileUploadTool } from './file-upload-tool.js';

vi.mock('../api/file-upload.js', () => ({
  uploadReceipt: vi.fn(),
}));

const { uploadReceipt } = await import('../api/file-upload.js');

describe('file-upload-tool', () => {
  let mockServer: McpServer;
  let mockTool: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockTool = vi.fn();
    mockServer = {
      tool: mockTool,
    } as unknown as McpServer;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addFileUploadTool', () => {
    it('should register freee_file_upload tool', () => {
      addFileUploadTool(mockServer);

      expect(mockTool).toHaveBeenCalledTimes(1);
      expect(mockTool).toHaveBeenCalledWith(
        'freee_file_upload',
        expect.any(String),
        expect.objectContaining({
          file_path: expect.anything(),
        }),
        expect.any(Function),
      );
    });

    it('should return upload result on success', async () => {
      const mockResult = { receipt: { id: '123', status: 'uploaded' } };
      vi.mocked(uploadReceipt).mockResolvedValue(mockResult);

      addFileUploadTool(mockServer);
      const handler = mockTool.mock.calls[0][3];

      const result = await handler({ file_path: '/path/to/test.pdf' });

      expect(uploadReceipt).toHaveBeenCalledWith('/path/to/test.pdf', {}, expect.objectContaining({ tokenStore: expect.any(Object), userId: 'local' }));
      expect(result.content[0].text).toContain('ファイルをアップロードしました');
      expect(result.content[0].text).toContain('ファイルボックスID: 123');
      expect(result.content[0].text).toContain('ステータス: uploaded');
    });

    it('should pass optional parameters to uploadReceipt', async () => {
      vi.mocked(uploadReceipt).mockResolvedValue({ receipt: { id: '1' } });

      addFileUploadTool(mockServer);
      const handler = mockTool.mock.calls[0][3];

      await handler({
        file_path: '/path/to/test.pdf',
        description: 'テスト',
        receipt_metadatum_partner_name: '取引先A',
        receipt_metadatum_issue_date: '2026-01-15',
        receipt_metadatum_amount: 5000,
        qualified_invoice: 'qualified',
        document_type: 'receipt',
      });

      expect(uploadReceipt).toHaveBeenCalledWith('/path/to/test.pdf', {
        description: 'テスト',
        receipt_metadatum_partner_name: '取引先A',
        receipt_metadatum_issue_date: '2026-01-15',
        receipt_metadatum_amount: 5000,
        qualified_invoice: 'qualified',
        document_type: 'receipt',
      }, expect.objectContaining({ tokenStore: expect.any(Object), userId: 'local' }));
    });

    it('should return error message on failure', async () => {
      vi.mocked(uploadReceipt).mockRejectedValue(new Error('ファイルが見つかりません: /missing.pdf'));

      addFileUploadTool(mockServer);
      const handler = mockTool.mock.calls[0][3];

      const result = await handler({ file_path: '/missing.pdf' });

      expect(result.content[0].text).toContain('ファイルアップロードに失敗');
      expect(result.content[0].text).toContain('ファイルが見つかりません');
    });
  });
});
