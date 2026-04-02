import fs from 'node:fs/promises';
import path from 'node:path';
import { getValidAccessToken } from '../auth/tokens.js';
import { getCurrentCompanyId } from '../config/companies.js';
import { getConfig } from '../config.js';
import { USER_AGENT } from '../constants.js';
import { getLogger } from '../server/logger.js';
import type { TokenContext } from '../storage/context.js';
import { formatApiErrorMessage, formatResponseErrorInfo } from '../utils/error.js';

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
  const log = getLogger().child({ component: 'api-client' });
  const startTime = Date.now();
  const safePath = '/api/:id/receipts';
  const userId = tokenContext?.userId ?? 'local';
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
    : await Promise.all([getCurrentCompanyId(), getValidAccessToken()]);

  if (!accessToken) {
    throw new Error(
      `認証が必要です。freee_authenticate ツールを使用して認証を行ってください。\n` +
        `現在の事業所ID: ${companyId}`,
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

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': USER_AGENT,
      },
      body: formData,
    });
  } catch (fetchError) {
    const errorType =
      fetchError instanceof Error && fetchError.name === 'TimeoutError' ? 'timeout' : 'network_error';
    log.error(
      { method: 'POST', path: safePath, duration_ms: Date.now() - startTime, user_id: userId, company_id: companyId, file_size: buffer.byteLength, error_type: errorType, err: fetchError },
      'File upload network error',
    );
    throw fetchError;
  }

  if (response.status === 401) {
    log.warn(
      { method: 'POST', path: safePath, status: 401, duration_ms: Date.now() - startTime, user_id: userId, company_id: companyId, error_type: 'auth_error' },
      'File upload failed',
    );
    const errorInfo = await formatResponseErrorInfo(response);
    throw new Error(
      `認証エラーが発生しました。freee_authenticate ツールを使用して再認証を行ってください。\n` +
        `現在の事業所ID: ${companyId}\n` +
        `エラー詳細: ${response.status} ${errorInfo}`,
    );
  }

  if (response.status === 403) {
    log.warn(
      { method: 'POST', path: safePath, status: 403, duration_ms: Date.now() - startTime, user_id: userId, company_id: companyId, error_type: 'forbidden' },
      'File upload failed',
    );
    const errorInfo = await formatResponseErrorInfo(response);
    throw new Error(
      `アクセス拒否 (403): ${errorInfo}\n` +
        `事業所ID: ${companyId}\n\n` +
        `レートリミットの可能性があります。数分待ってから再試行してください。`,
    );
  }

  if (!response.ok) {
    const logLevel = response.status >= 500 ? 'error' : 'warn';
    log[logLevel](
      { method: 'POST', path: safePath, status: response.status, duration_ms: Date.now() - startTime, user_id: userId, company_id: companyId, error_type: 'http_error' },
      'File upload failed',
    );
    const errorMessage = await formatApiErrorMessage(response, response.status);
    throw new Error(errorMessage);
  }

  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    log.info(
      { method: 'POST', path: safePath, status: response.status, duration_ms: Date.now() - startTime, user_id: userId, company_id: companyId, file_size: buffer.byteLength },
      'File upload completed',
    );
    return parsed;
  } catch {
    log.error(
      { method: 'POST', path: safePath, status: response.status, error_type: 'json_parse_error' },
      'Failed to parse upload response',
    );
    throw new Error(
      `Failed to parse API response as JSON. Status: ${response.status}, Body preview: ${text.slice(0, 200)}`,
    );
  }
}
