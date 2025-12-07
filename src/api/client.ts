import { config } from '../config.js';
import { getValidAccessToken } from '../auth/tokens.js';
import { getCurrentCompanyId } from '../config/companies.js';

export async function makeApiRequest(
  method: string,
  path: string,
  params?: Record<string, unknown>,
  body?: Record<string, unknown>,
  baseUrl?: string,
): Promise<unknown> {
  const apiUrl = baseUrl || config.freee.apiUrl;
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
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(normalizedPath, normalizedBase);
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
    body: body ? JSON.stringify(typeof body === 'string' ? JSON.parse(body) : body) : undefined,
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
      `3. トークンの有効期限が切れていないか\n` +
      `4. 事業所IDが正しいか（freee_get_current_company で確認）`
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Extract detailed error messages from freee API response
    let errorMessage = `API request failed: ${response.status}`;
    
    if (errorData && errorData.errors && Array.isArray(errorData.errors)) {
      const allMessages: string[] = [];
      
      for (const error of errorData.errors) {
        if (error.messages && Array.isArray(error.messages)) {
          allMessages.push(...error.messages);
        }
      }
      
      if (allMessages.length > 0) {
        errorMessage += `\n\nエラー詳細:\n${allMessages.join('\n')}`;
        
        // Add helpful guidance for bad request errors
        if (response.status === 400) {
          errorMessage += `\n\n💡 ヒント: 不正なリクエストエラーが発生しました。`;
          errorMessage += `\n既存のデータを取得して正しい構造を確認することをお勧めします。`;
          errorMessage += `\n例: get_items, get_partners, get_account_items などで既存データの構造を確認してください。`;
        }
      }
    }
    
    // Fallback to raw error data if no structured errors found
    if (!errorData?.errors) {
      errorMessage += `\n\n詳細: ${JSON.stringify(errorData)}`;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}