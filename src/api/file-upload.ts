import fs from 'node:fs/promises';
import path from 'node:path';
import { getValidAccessToken } from '../auth/tokens.js';
import { getCurrentCompanyId } from '../config/companies.js';
import { getConfig } from '../config.js';
import { USER_AGENT } from '../constants.js';
import { serializeErrorChain } from '../server/error-serializer.js';
import type { ApiCallErrorType } from '../server/request-context.js';
import { getCurrentRecorder } from '../server/request-context.js';
import { type TokenContext, resolveCompanyId } from '../storage/context.js';
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
  const recorder = getCurrentRecorder();
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
        resolveCompanyId(tokenContext),
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

  const recordFailure = (
    statusCode: number | null,
    errorType: ApiCallErrorType,
    err: Error,
  ): never => {
    recorder?.recordApiCall({
      method: 'POST',
      path_pattern: safePath,
      status_code: statusCode,
      duration_ms: Date.now() - startTime,
      company_id: String(companyId ?? ''),
      user_id: userId,
      error_type: errorType,
      file_size_bytes: buffer.byteLength,
    });
    recorder?.recordError({
      source: 'file_upload',
      status_code: statusCode ?? undefined,
      error_type: errorType,
      chain: serializeErrorChain(err),
    });
    throw err;
  };

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
    const errorType: ApiCallErrorType =
      fetchError instanceof Error && fetchError.name === 'TimeoutError' ? 'timeout' : 'network_error';
    recorder?.recordApiCall({
      method: 'POST',
      path_pattern: safePath,
      status_code: null,
      duration_ms: Date.now() - startTime,
      company_id: String(companyId ?? ''),
      user_id: userId,
      error_type: errorType,
      file_size_bytes: buffer.byteLength,
    });
    recorder?.recordError({
      source: 'file_upload',
      error_type: errorType,
      chain: serializeErrorChain(fetchError),
    });
    throw fetchError;
  }

  if (response.status === 401) {
    const errorInfo = await formatResponseErrorInfo(response);
    recordFailure(
      401,
      'auth_error',
      new Error(
        `認証エラーが発生しました。freee_authenticate ツールを使用して再認証を行ってください。\n` +
          `現在の事業所ID: ${companyId}\n` +
          `エラー詳細: ${response.status} ${errorInfo}`,
      ),
    );
  }

  if (response.status === 403) {
    const errorInfo = await formatResponseErrorInfo(response);
    recordFailure(
      403,
      'forbidden',
      new Error(
        `アクセス拒否 (403): ${errorInfo}\n` +
          `事業所ID: ${companyId}\n\n` +
          `レートリミットの可能性があります。数分待ってから再試行してください。`,
      ),
    );
  }

  if (!response.ok) {
    const errorMessage = await formatApiErrorMessage(response, response.status);
    recordFailure(response.status, 'http_error', new Error(errorMessage));
  }

  // Success path: record the api call once with a null error_type.
  recorder?.recordApiCall({
    method: 'POST',
    path_pattern: safePath,
    status_code: response.status,
    duration_ms: Date.now() - startTime,
    company_id: String(companyId ?? ''),
    user_id: userId,
    error_type: null,
    file_size_bytes: buffer.byteLength,
  });

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    const parseError = new Error(
      `Failed to parse API response as JSON. Status: ${response.status}, Body preview: ${text.slice(0, 200)}`,
    );
    recorder?.recordError({
      source: 'file_upload',
      status_code: response.status,
      error_type: 'json_parse_error',
      chain: serializeErrorChain(parseError),
    });
    throw parseError;
  }
}
