import { getConfig } from '../config.js';
import { getValidAccessToken } from '../auth/tokens.js';
import { getCurrentCompanyId, getDownloadDir } from '../config/companies.js';
import { parseJsonResponse } from '../utils/error.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Response type for binary file downloads
 */
export interface BinaryFileResponse {
  type: 'binary';
  filePath: string;
  mimeType: string;
  size: number;
}

/**
 * Type guard for BinaryFileResponse
 */
export function isBinaryFileResponse(result: unknown): result is BinaryFileResponse {
  return (
    typeof result === 'object' &&
    result !== null &&
    'type' in result &&
    (result as BinaryFileResponse).type === 'binary'
  );
}

/**
 * Check if Content-Type indicates binary response
 */
function isBinaryContentType(contentType: string): boolean {
  const binaryTypes = [
    'application/pdf',
    'application/octet-stream',
    'image/',
  ];
  return binaryTypes.some(type => contentType.includes(type));
}

/**
 * Get file extension from Content-Type
 */
function getExtensionFromContentType(contentType: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': '.pdf',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'text/csv': '.csv',
  };

  for (const [type, ext] of Object.entries(typeMap)) {
    if (contentType.includes(type)) {
      return ext;
    }
  }

  if (contentType.includes('image/')) {
    return '.bin';
  }

  return '.bin';
}

export async function makeApiRequest(
  method: string,
  apiPath: string,
  params?: Record<string, unknown>,
  body?: Record<string, unknown>,
  baseUrl?: string,
): Promise<unknown | BinaryFileResponse> {
  const apiUrl = baseUrl || getConfig().freee.apiUrl;
  const companyId = await getCurrentCompanyId();

  const accessToken = await getValidAccessToken();

  if (!accessToken) {
    throw new Error(
      `認証が必要です。freee_authenticate ツールを使用して認証を行ってください。\n` +
      `現在の事業所ID: ${companyId}\n` +
      `または、FREEE_CLIENT_ID環境変数が正しく設定されているか確認してください。`
    );
  }

  // Properly join baseUrl and path, preserving baseUrl's path component
  const normalizedBase = apiUrl.endsWith('/') ? apiUrl : apiUrl + '/';
  const normalizedPath = apiPath.startsWith('/') ? apiPath.slice(1) : apiPath;
  const url = new URL(normalizedPath, normalizedBase);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // Validate company_id consistency if present in params
  const paramsCompanyId = params?.company_id;
  if (paramsCompanyId !== undefined && String(paramsCompanyId) !== String(companyId)) {
    throw new Error(
      `company_id の不整合: リクエストの company_id (${paramsCompanyId}) と現在の事業所 (${companyId}) が異なります。\n` +
      `freee_set_company で事業所を切り替えるか、リクエストの company_id を修正してください。`
    );
  }

  // Validate company_id consistency if present in body
  const bodyCompanyId = body?.company_id;
  if (bodyCompanyId !== undefined && String(bodyCompanyId) !== String(companyId)) {
    throw new Error(
      `company_id の不整合: リクエストボディの company_id (${bodyCompanyId}) と現在の事業所 (${companyId}) が異なります。\n` +
      `freee_set_company で事業所を切り替えるか、リクエストの company_id を修正してください。`
    );
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(typeof body === 'string' ? JSON.parse(body) : body) : undefined,
  });

  if (response.status === 401 || response.status === 403) {
    const result = await parseJsonResponse(response);
    const errorInfo = result.success
      ? JSON.stringify(result.data)
      : `(JSON parse failed: ${result.error})`;
    throw new Error(
      `認証エラーが発生しました。freee_authenticate ツールを使用して再認証を行ってください。\n` +
      `現在の事業所ID: ${companyId}\n` +
      `エラー詳細: ${response.status} ${errorInfo}\n\n` +
      `確認事項:\n` +
      `1. FREEE_CLIENT_ID環境変数が正しく設定されているか\n` +
      `2. freee側でアプリケーション設定が正しいか（リダイレクトURI等）\n` +
      `3. トークンの有効期限が切れていないか\n` +
      `4. 事業所IDが正しいか（freee_get_current_company で確認）`
    );
  }

  if (!response.ok) {
    const result = await parseJsonResponse(response);

    // Extract detailed error messages from freee API response
    let errorMessage = `API request failed: ${response.status}`;

    if (result.success) {
      const errorData = result.data;
      if (errorData && errorData.errors && Array.isArray(errorData.errors)) {
        const allMessages: string[] = [];

        for (const error of errorData.errors) {
          if (
            error &&
            typeof error === 'object' &&
            'messages' in error &&
            Array.isArray(error.messages)
          ) {
            allMessages.push(...error.messages);
          }
        }

        if (allMessages.length > 0) {
          errorMessage += `\n\nエラー詳細:\n${allMessages.join('\n')}`;

          // Add helpful guidance for bad request errors
          if (response.status === 400) {
            errorMessage += `\n\nヒント: 不正なリクエストエラーが発生しました。`;
            errorMessage += `\n既存のデータを取得して正しい構造を確認することをお勧めします。`;
            errorMessage += `\n例: get_items, get_partners, get_account_items などで既存データの構造を確認してください。`;
          }
        }
      }

      // Fallback to raw error data if no structured errors found
      if (!errorData?.errors) {
        errorMessage += `\n\n詳細: ${JSON.stringify(errorData)}`;
      }
    } else {
      errorMessage += `\n\n詳細: (JSON parse failed: ${result.error})`;
    }

    throw new Error(errorMessage);
  }

  // Check Content-Type for binary response
  const contentType = response.headers.get('content-type') || '';

  if (isBinaryContentType(contentType)) {
    // Handle binary response: save to file and return path
    const downloadDir = await getDownloadDir();
    const extension = getExtensionFromContentType(contentType);
    const timestamp = Date.now();
    const fileName = `freee_download_${timestamp}${extension}`;
    const filePath = path.join(downloadDir, fileName);

    const buffer = await response.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(buffer));

    return {
      type: 'binary',
      filePath,
      mimeType: contentType,
      size: buffer.byteLength,
    } as BinaryFileResponse;
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Failed to parse API response as JSON. Status: ${response.status}, Content-Type: ${contentType}, Body preview: ${text.slice(0, 200)}`
    );
  }
}
