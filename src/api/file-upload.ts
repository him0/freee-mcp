import fs from 'fs/promises';
import path from 'path';
import { getConfig } from '../config.js';
import { getValidAccessToken } from '../auth/tokens.js';
import { getCurrentCompanyId } from '../config/companies.js';
import { parseJsonResponse } from '../utils/error.js';
import { USER_AGENT } from '../constants.js';
import type { TokenContext } from '../storage/context.js';

const MAX_FILE_SIZE_BYTES = 64 * 1024 * 1024; // 64MB

export interface UploadReceiptOptions {
  description?: string;
  receipt_metadatum_partner_name?: string;
  receipt_metadatum_issue_date?: string;
  receipt_metadatum_amount?: number;
  qualified_invoice?: 'qualified' | 'not_qualified' | 'unselected';
  document_type?: 'receipt' | 'invoice' | 'other';
}

const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.csv': 'text/csv',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export async function uploadReceipt(
  filePath: string,
  options?: UploadReceiptOptions,
  tokenContext?: TokenContext,
): Promise<unknown> {
  const resolvedPath = path.resolve(filePath);

  // Read file
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(resolvedPath);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      throw new Error(`ファイルが見つかりません: ${resolvedPath}`);
    }
    if (nodeError.code === 'EACCES') {
      throw new Error(`ファイルの読み取り権限がありません: ${resolvedPath}`);
    }
    throw error;
  }

  // Check file size
  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (buffer.byteLength / (1024 * 1024)).toFixed(1);
    throw new Error(`ファイルサイズが上限(64MB)を超えています: ${sizeMB}MB`);
  }

  const [companyId, accessToken] = tokenContext
    ? await Promise.all([
        tokenContext.tokenStore.getCurrentCompanyId(tokenContext.userId),
        tokenContext.tokenStore.getValidAccessToken(tokenContext.userId),
      ])
    : await Promise.all([
        getCurrentCompanyId(),
        getValidAccessToken(),
      ]);

  if (!accessToken) {
    throw new Error(
      `認証が必要です。freee_authenticate ツールを使用して認証を行ってください。\n` +
      `現在の事業所ID: ${companyId}`
    );
  }

  // Build FormData
  const mimeType = getMimeType(resolvedPath);
  const fileName = path.basename(resolvedPath);
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });

  const formData = new FormData();
  formData.append('receipt', blob, fileName);
  formData.append('company_id', String(companyId));

  if (options?.description !== undefined) {
    formData.append('description', options.description);
  }
  if (options?.receipt_metadatum_partner_name !== undefined) {
    formData.append('receipt_metadatum_partner_name', options.receipt_metadatum_partner_name);
  }
  if (options?.receipt_metadatum_issue_date !== undefined) {
    formData.append('receipt_metadatum_issue_date', options.receipt_metadatum_issue_date);
  }
  if (options?.receipt_metadatum_amount !== undefined) {
    formData.append('receipt_metadatum_amount', String(options.receipt_metadatum_amount));
  }
  if (options?.qualified_invoice !== undefined) {
    formData.append('qualified_invoice', options.qualified_invoice);
  }
  if (options?.document_type !== undefined) {
    formData.append('document_type', options.document_type);
  }

  const apiUrl = getConfig().freee.apiUrl;
  const url = `${apiUrl}/api/1/receipts`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': USER_AGENT,
    },
    body: formData,
  });

  if (response.status === 401) {
    const result = await parseJsonResponse(response);
    const errorInfo = result.success
      ? JSON.stringify(result.data)
      : `(JSON parse failed: ${result.error})`;
    throw new Error(
      `認証エラーが発生しました。freee_authenticate ツールを使用して再認証を行ってください。\n` +
      `現在の事業所ID: ${companyId}\n` +
      `エラー詳細: ${response.status} ${errorInfo}`
    );
  }

  if (response.status === 403) {
    const result = await parseJsonResponse(response);
    const errorInfo = result.success
      ? JSON.stringify(result.data)
      : `(JSON parse failed: ${result.error})`;
    throw new Error(
      `アクセス拒否 (403): ${errorInfo}\n` +
      `事業所ID: ${companyId}\n\n` +
      `レートリミットの可能性があります。数分待ってから再試行してください。`
    );
  }

  if (!response.ok) {
    const result = await parseJsonResponse(response);
    let errorMessage = `API request failed: ${response.status}`;

    if (result.success) {
      const errorData = result.data;
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        const allMessages: string[] = [];
        for (const error of errorData.errors) {
          if (
            error &&
            typeof error === 'object' &&
            'messages' in error &&
            Array.isArray((error as { messages: string[] }).messages)
          ) {
            allMessages.push(...(error as { messages: string[] }).messages);
          }
        }
        if (allMessages.length > 0) {
          errorMessage += `\n\nエラー詳細:\n${allMessages.join('\n')}`;
        }
      }
      if (!errorData?.errors) {
        errorMessage += `\n\n詳細: ${JSON.stringify(errorData)}`;
      }
    } else {
      errorMessage += `\n\n詳細: (JSON parse failed: ${result.error})`;
    }

    throw new Error(errorMessage);
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Failed to parse API response as JSON. Status: ${response.status}, Body preview: ${text.slice(0, 200)}`
    );
  }
}
