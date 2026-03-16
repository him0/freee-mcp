import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { uploadReceipt } from '../api/file-upload.js';
import { createTextResponse, formatErrorMessage } from '../utils/error.js';
import { extractTokenContext } from '../storage/context.js';
import type { AuthExtra } from '../storage/context.js';

export function addFileUploadTool(server: McpServer): void {
  server.tool(
    'freee_file_upload',
    'ファイルボックスにファイルをアップロード (POST /api/1/receipts、詳細ガイドはfreee-api-skill skillを参照)',
    {
      file_path: z.string().describe('アップロードするファイルのローカルパス'),
      description: z.string().max(255).optional().describe('メモ (最大255文字)'),
      receipt_metadatum_partner_name: z.string().max(255).optional().describe('取引先名 (最大255文字)'),
      receipt_metadatum_issue_date: z.string().optional().describe('発行日 (yyyy-mm-dd)'),
      receipt_metadatum_amount: z.number().optional().describe('金額'),
      qualified_invoice: z.enum(['qualified', 'not_qualified', 'unselected']).optional().describe('適格請求書等の区分'),
      document_type: z.enum(['receipt', 'invoice', 'other']).optional().describe('書類の種類'),
    },
    async (args: {
      file_path: string;
      description?: string;
      receipt_metadatum_partner_name?: string;
      receipt_metadatum_issue_date?: string;
      receipt_metadatum_amount?: number;
      qualified_invoice?: 'qualified' | 'not_qualified' | 'unselected';
      document_type?: 'receipt' | 'invoice' | 'other';
    }, extra?: AuthExtra) => {
      try {
        const { file_path, ...options } = args;
        const { tokenStore, userId } = extractTokenContext(extra);
        const result = await uploadReceipt(file_path, options, { tokenStore, userId });

        const receipt = result as Record<string, unknown>;
        const receiptData = (receipt.receipt || receipt) as Record<string, unknown>;

        const lines = ['ファイルをアップロードしました'];
        if (receiptData.id) {
          lines.push(`ファイルボックスID: ${receiptData.id}`);
        }
        if (receiptData.status) {
          lines.push(`ステータス: ${receiptData.status}`);
        }
        lines.push('', JSON.stringify(result, null, 2));

        return createTextResponse(lines.join('\n'));
      } catch (error) {
        return createTextResponse(`ファイルアップロードに失敗: ${formatErrorMessage(error)}`);
      }
    }
  );
}
