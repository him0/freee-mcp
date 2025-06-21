import { config } from '../config.js';
import { getValidAccessToken } from '../auth/tokens.js';
import { getCurrentCompanyId } from '../config/companies.js';

export async function makeApiRequest(
  method: string,
  path: string,
  params?: Record<string, unknown>,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const baseUrl = config.freee.apiUrl;
  const companyId = await getCurrentCompanyId();

  const accessToken = await getValidAccessToken(companyId);

  if (!accessToken) {
    throw new Error(
      `認証が必要です。freee_authenticate ツールを使用して認証を行ってください。\n` +
      `現在の事業所ID: ${companyId}\n` +
      `または、FREEE_CLIENT_ID環境変数が正しく設定されているか確認してください。`
    );
  }

  const url = new URL(path, baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  url.searchParams.append('company_id', String(companyId));

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body.body) : undefined,
  });

  if (response.status === 401 || response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `認証エラーが発生しました。freee_authenticate ツールを使用して再認証を行ってください。\n` +
      `現在の事業所ID: ${companyId}\n` +
      `エラー詳細: ${response.status} ${JSON.stringify(errorData)}\n\n` +
      `確認事項:\n` +
      `1. FREEE_CLIENT_ID環境変数が正しく設定されているか\n` +
      `2. freee側でアプリケーション設定が正しいか（リダイレクトURI等）\n` +
      `3. 現在の事業所(${companyId})に対するトークンの有効期限が切れていないか\n` +
      `4. 事業所IDが正しいか（freee_get_current_company で確認）`
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API request failed: ${response.status} ${JSON.stringify(errorData)}`);
  }

  return response.json();
}