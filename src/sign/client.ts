// freee-mcp パッケージとして配布されるため、User-Agent は freee 本体と共通
import { FETCH_TIMEOUT_API_MS, USER_AGENT } from '../constants.js';
import { formatResponseErrorInfo } from '../utils/error.js';
import { SIGN_API_URL } from './config.js';
import { getValidSignAccessToken } from './tokens.js';

export async function makeSignApiRequest(
  method: string,
  apiPath: string,
  params?: Record<string, unknown>,
  body?: Record<string, unknown>,
): Promise<unknown> {
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

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_API_MS),
  });

  if (response.status === 401) {
    const errorInfo = await formatResponseErrorInfo(response);
    throw new Error(
      '認証エラーが発生しました。sign_authenticate ツールを使用して再認証を行ってください。\n' +
        `エラー詳細: ${response.status} ${errorInfo}`,
    );
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get('RateLimit-Reset') || response.headers.get('Retry-After');
    const retryMsg = retryAfter ? `${retryAfter}秒後に再試行してください。` : '数分待ってから再試行してください。';
    throw new Error(`レートリミットに達しました (429)。${retryMsg}`);
  }

  if (!response.ok) {
    const errorInfo = await formatResponseErrorInfo(response);
    throw new Error(`Sign API request failed: ${response.status} ${errorInfo}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Failed to parse Sign API response as JSON. Status: ${response.status}, Body preview: ${text.slice(0, 200)}`,
    );
  }
}
