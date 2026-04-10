import { getValidAccessToken } from '../auth/tokens.js';
import { getCurrentCompanyId } from '../config/companies.js';
import { getConfig } from '../config.js';
import { FETCH_TIMEOUT_API_MS } from '../constants.js';
import { serializeErrorChain } from '../server/error-serializer.js';
import { sanitizePath } from '../server/logger.js';
import { getCurrentRecorder } from '../server/request-context.js';
import { getUserAgent } from '../server/user-agent.js';
import { type TokenContext, resolveCompanyId } from '../storage/context.js';
import { formatApiErrorMessage, formatResponseErrorInfo } from '../utils/error.js';

/**
 * Response type for binary file downloads
 */
export interface BinaryFileResponse {
  type: 'binary';
  data: Buffer;
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
  const binaryTypes = ['application/pdf', 'application/octet-stream', 'image/', 'text/csv'];
  return binaryTypes.some((type) => contentType.includes(type));
}

export async function makeApiRequest(
  method: string,
  apiPath: string,
  params?: Record<string, unknown>,
  body?: Record<string, unknown>,
  baseUrl?: string,
  tokenContext?: TokenContext,
): Promise<unknown | BinaryFileResponse> {
  const recorder = getCurrentRecorder();
  const startTime = Date.now();
  const safePath = sanitizePath(apiPath);
  const userId = tokenContext?.userId ?? 'local';
  const apiUrl = baseUrl || getConfig().freee.apiUrl;
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

  // Properly join baseUrl and path, preserving baseUrl's path component
  const normalizedBase = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
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
        `freee_set_current_company で事業所を切り替えるか、リクエストの company_id を修正してください。`,
    );
  }

  // Validate company_id consistency if present in body
  const bodyCompanyId = body?.company_id;
  if (bodyCompanyId !== undefined && String(bodyCompanyId) !== String(companyId)) {
    throw new Error(
      `company_id の不整合: リクエストボディの company_id (${bodyCompanyId}) と現在の事業所 (${companyId}) が異なります。\n` +
        `freee_set_current_company で事業所を切り替えるか、リクエストの company_id を修正してください。`,
    );
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': getUserAgent(),
      },
      body: body ? JSON.stringify(typeof body === 'string' ? JSON.parse(body) : body) : undefined,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_API_MS),
    });
  } catch (fetchError) {
    const durationMs = Date.now() - startTime;
    const errorType: 'timeout' | 'network_error' =
      fetchError instanceof Error && fetchError.name === 'TimeoutError' ? 'timeout' : 'network_error';
    recorder?.recordApiCall({
      method,
      path_pattern: safePath,
      status_code: null,
      duration_ms: durationMs,
      company_id: String(companyId ?? ''),
      user_id: userId,
      error_type: errorType,
    });
    recorder?.recordError({
      source: 'api_client',
      error_type: errorType,
      chain: serializeErrorChain(fetchError),
    });
    throw fetchError;
  }

  if (response.status === 401) {
    const errorInfo = await formatResponseErrorInfo(response);
    const authError = new Error(
      `認証エラーが発生しました。freee_authenticate ツールを使用して再認証を行ってください。\n` +
        `現在の事業所ID: ${companyId}\n` +
        `エラー詳細: ${response.status} ${errorInfo}\n\n` +
        `確認事項:\n` +
        `1. freee側でアプリケーション設定が正しいか（リダイレクトURI等）\n` +
        `2. トークンの有効期限が切れていないか\n` +
        `3. 事業所IDが正しいか（freee_get_current_company で確認）`,
    );
    recorder?.recordApiCall({
      method,
      path_pattern: safePath,
      status_code: 401,
      duration_ms: Date.now() - startTime,
      company_id: String(companyId ?? ''),
      user_id: userId,
      error_type: 'auth_error',
    });
    recorder?.recordError({
      source: 'api_client',
      status_code: 401,
      error_type: 'auth_error',
      chain: serializeErrorChain(authError),
    });
    throw authError;
  }

  if (response.status === 403) {
    const errorInfo = await formatResponseErrorInfo(response);
    const forbiddenError = new Error(
      `アクセス拒否 (403): ${errorInfo}\n` +
        `事業所ID: ${companyId}\n\n` +
        `レートリミットの可能性があります。数分待ってから再試行してください。\n` +
        `それでも解決しない場合は、アプリの権限設定を確認するか、freee_authenticate で再認証してください。`,
    );
    recorder?.recordApiCall({
      method,
      path_pattern: safePath,
      status_code: 403,
      duration_ms: Date.now() - startTime,
      company_id: String(companyId ?? ''),
      user_id: userId,
      error_type: 'forbidden',
    });
    recorder?.recordError({
      source: 'api_client',
      status_code: 403,
      error_type: 'forbidden',
      chain: serializeErrorChain(forbiddenError),
    });
    throw forbiddenError;
  }

  if (!response.ok) {
    const errorMessage = await formatApiErrorMessage(response, response.status);
    const httpError = new Error(errorMessage);
    recorder?.recordApiCall({
      method,
      path_pattern: safePath,
      status_code: response.status,
      duration_ms: Date.now() - startTime,
      company_id: String(companyId ?? ''),
      user_id: userId,
      error_type: 'http_error',
    });
    recorder?.recordError({
      source: 'api_client',
      status_code: response.status,
      error_type: 'http_error',
      chain: serializeErrorChain(httpError),
    });
    throw httpError;
  }

  // Check Content-Type for binary response
  const contentType = response.headers.get('content-type') || '';

  // Shared metadata for all success-path recorder calls. One recorder entry
  // per fetch attempt — repeated across the four return paths below.
  const successApiCall = {
    method,
    path_pattern: safePath,
    status_code: response.status,
    company_id: String(companyId ?? ''),
    user_id: userId,
    error_type: null as null,
  };

  if (isBinaryContentType(contentType)) {
    const buffer = Buffer.from(await response.arrayBuffer());
    recorder?.recordApiCall({ ...successApiCall, duration_ms: Date.now() - startTime });
    return {
      type: 'binary',
      data: buffer,
      mimeType: contentType,
      size: buffer.byteLength,
    };
  }

  // Handle empty responses (e.g., 204 No Content from DELETE)
  if (response.status === 204) {
    recorder?.recordApiCall({ ...successApiCall, duration_ms: Date.now() - startTime });
    return null;
  }

  const text = await response.text();
  if (!text) {
    recorder?.recordApiCall({ ...successApiCall, duration_ms: Date.now() - startTime });
    return null;
  }

  try {
    const parsed = JSON.parse(text);
    recorder?.recordApiCall({ ...successApiCall, duration_ms: Date.now() - startTime });
    return parsed;
  } catch {
    const parseError = new Error(
      `Failed to parse API response as JSON. Status: ${response.status}, Content-Type: ${contentType}, Body preview: ${text.slice(0, 200)}`,
    );
    recorder?.recordApiCall({
      method,
      path_pattern: safePath,
      status_code: response.status,
      duration_ms: Date.now() - startTime,
      company_id: String(companyId ?? ''),
      user_id: userId,
      error_type: 'json_parse_error',
    });
    recorder?.recordError({
      source: 'api_client',
      status_code: response.status,
      error_type: 'json_parse_error',
      chain: serializeErrorChain(parseError),
    });
    throw parseError;
  }
}
