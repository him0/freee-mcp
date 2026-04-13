// freee-mcp パッケージとして配布されるため、User-Agent は freee 本体と共通
import { FETCH_TIMEOUT_API_MS } from '../constants.js';
import { serializeErrorChain } from '../server/error-serializer.js';
import { sanitizePath } from '../server/logger.js';
import type { ApiCallErrorType } from '../server/request-context.js';
import { getCurrentRecorder } from '../server/request-context.js';
import { getUserAgent } from '../server/user-agent.js';
import { formatResponseErrorInfo } from '../utils/error.js';
import { SIGN_API_URL } from './config.js';
import { getValidSignAccessToken } from './tokens.js';

export async function makeSignApiRequest(
  method: string,
  apiPath: string,
  params?: Record<string, unknown>,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const recorder = getCurrentRecorder();
  const startTime = Date.now();
  const safePath = sanitizePath(apiPath);
  // PRIVACY: key names only, never values. Names are stable per endpoint
  // (`limit`, `type`, etc.), so they are safe to facet on in Datadog.
  // Skip the allocation entirely when no recorder is installed (CLI mode),
  // and treat an empty params object as "no keys" so Datadog doesn't index
  // an empty-array facet.
  let queryKeys: string[] | undefined;
  if (recorder && params) {
    const keys = Object.keys(params);
    if (keys.length > 0) queryKeys = keys;
  }

  const accessToken = await getValidSignAccessToken();

  if (!accessToken) {
    throw new Error(
      '認証が必要です。sign_authenticate ツールを使用して認証を行ってください。',
    );
  }

  const normalizedBase = SIGN_API_URL.endsWith('/') ? SIGN_API_URL : `${SIGN_API_URL}/`;
  const normalizedPath = apiPath.startsWith('/') ? apiPath.slice(1) : apiPath;
  const url = new URL(normalizedPath, normalizedBase);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    }
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
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_API_MS),
    });
  } catch (fetchError) {
    const errorType: ApiCallErrorType =
      fetchError instanceof Error && fetchError.name === 'TimeoutError' ? 'timeout' : 'network_error';
    recorder?.recordApiCall({
      method,
      path_pattern: safePath,
      status_code: null,
      duration_ms: Date.now() - startTime,
      error_type: errorType,
      query_keys: queryKeys,
    });
    recorder?.recordError({
      source: 'sign_client',
      error_type: errorType,
      chain: serializeErrorChain(fetchError),
    });
    throw fetchError;
  }

  const recordFailure = (statusCode: number, errorType: ApiCallErrorType, err: Error): never => {
    recorder?.recordApiCall({
      method,
      path_pattern: safePath,
      status_code: statusCode,
      duration_ms: Date.now() - startTime,
      error_type: errorType,
      query_keys: queryKeys,
    });
    recorder?.recordError({
      source: 'sign_client',
      status_code: statusCode,
      error_type: errorType,
      chain: serializeErrorChain(err),
    });
    throw err;
  };

  if (response.status === 401) {
    const errorInfo = await formatResponseErrorInfo(response);
    recordFailure(
      401,
      'auth_error',
      new Error(
        '認証エラーが発生しました。sign_authenticate ツールを使用して再認証を行ってください。\n' +
          `エラー詳細: ${response.status} ${errorInfo}`,
      ),
    );
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get('RateLimit-Reset') || response.headers.get('Retry-After');
    const retryMsg = retryAfter ? `${retryAfter}秒後に再試行してください。` : '数分待ってから再試行してください。';
    recordFailure(429, 'http_error', new Error(`レートリミットに達しました (429)。${retryMsg}`));
  }

  if (!response.ok) {
    const errorInfo = await formatResponseErrorInfo(response);
    recordFailure(
      response.status,
      'http_error',
      new Error(`Sign API request failed: ${response.status} ${errorInfo}`),
    );
  }

  if (response.status === 204) {
    recorder?.recordApiCall({
      method,
      path_pattern: safePath,
      status_code: response.status,
      duration_ms: Date.now() - startTime,
      error_type: null,
      query_keys: queryKeys,
    });
    return null;
  }

  const text = await response.text();
  if (!text) {
    recorder?.recordApiCall({
      method,
      path_pattern: safePath,
      status_code: response.status,
      duration_ms: Date.now() - startTime,
      error_type: null,
      query_keys: queryKeys,
    });
    return null;
  }

  try {
    const parsed = JSON.parse(text);
    // Record success only after JSON.parse succeeds to avoid a misleading
    // "successful" api_call entry alongside a json_parse_error in the log.
    recorder?.recordApiCall({
      method,
      path_pattern: safePath,
      status_code: response.status,
      duration_ms: Date.now() - startTime,
      error_type: null,
      query_keys: queryKeys,
    });
    return parsed;
  } catch {
    const parseError = new Error(
      `Failed to parse Sign API response as JSON. Status: ${response.status}, Body preview: ${text.slice(0, 200)}`,
    );
    recorder?.recordApiCall({
      method,
      path_pattern: safePath,
      status_code: response.status,
      duration_ms: Date.now() - startTime,
      error_type: 'json_parse_error',
      query_keys: queryKeys,
    });
    recorder?.recordError({
      source: 'sign_client',
      status_code: response.status,
      error_type: 'json_parse_error',
      chain: serializeErrorChain(parseError),
    });
    throw parseError;
  }
}
