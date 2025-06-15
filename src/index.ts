import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import freeeApiSchema from './data/freee-api-schema.json';
import { getValidAccessToken, authenticateWithPKCE, clearTokens, loadTokens, generatePKCE, buildAuthUrl, startCallbackServer, stopCallbackServer } from './auth.js';
import crypto from 'crypto';

type OpenAPIRequestBodyContentSchema = {
  required?: string[];
  type: 'object';
  properties: {
    [key: string]: {
      type?: string;
      format?: string;
      description?: string;
      example?: string | number | boolean | (string | number | boolean)[];
      enum?: string[] | number[];
      minimum?: number | string;
      maximum?: number | string;
    };
  };
};

type OpenAPIRequestBody = {
  content: {
    'application/json'?: {
      schema: { $ref: string } | OpenAPIRequestBodyContentSchema;
    };
    'multipart/form-data'?: {
      schema: { $ref: string } | OpenAPIRequestBodyContentSchema;
    };
  };
};

type OpenAPIParameter = {
  name: string;
  in: string;
  schema?: {
    type: string;
    format?: string;
  };
  type?: string;
  format?: string;
  required?: boolean;
  description?: string;
};

type OpenAPIOperation = {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: Record<string, unknown>;
};

type OpenAPIPathItem = {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  patch?: OpenAPIOperation;
};

// APIリクエストを実行する関数
async function makeApiRequest(
  method: string,
  path: string,
  params?: Record<string, unknown>,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const baseUrl = process.env.FREEE_API_URL || 'https://api.freee.co.jp';
  const companyId = process.env.FREEE_COMPANY_ID || 0;

  // OAuthトークンを取得、なければ自動認証フローを開始
  let accessToken = await getValidAccessToken();

  if (!accessToken) {
    // MCPツール経由での自動認証は困難なため、適切なメッセージを返す
    throw new Error(
      `認証が必要です。freee_authenticate ツールを使用して認証を行ってください。\n` +
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

  // 認証エラーの場合
  if (response.status === 401 || response.status === 403) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `認証エラーが発生しました。freee_authenticate ツールを使用して再認証を行ってください。\n` +
      `エラー詳細: ${response.status} ${JSON.stringify(errorData)}\n\n` +
      `確認事項:\n` +
      `1. FREEE_CLIENT_ID環境変数が正しく設定されているか\n` +
      `2. freee側でアプリケーション設定が正しいか（リダイレクトURI等）\n` +
      `3. トークンの有効期限が切れていないか`
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API request failed: ${response.status} ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

// OpenAPIのパラメータをZodスキーマに変換する関数
function convertParameterToZodSchema(parameter: OpenAPIParameter): z.ZodType {
  const { type } = parameter.schema || parameter;
  const { description, required } = parameter;

  let schema;

  switch (type) {
    case 'string':
      schema = z.string();
      break;
    case 'integer':
      schema = z.number().int();
      break;
    case 'number':
      schema = z.number();
      break;
    case 'boolean':
      schema = z.boolean();
      break;
    default:
      schema = z.any();
  }

  if (description) {
    schema = schema.describe(description);
  }

  if (!required) {
    schema = schema.optional();
  }

  return schema;
}

// OpenAPIのパスをMCPツール名に変換する関数
function convertPathToToolName(path: string): string {
  let toolName = path
    .replace(/^\/api\/\d+\//, '')
    .replace(/\/{[^}]+}/g, '_by_id')
    .replace(/\//g, '_');

  // 64文字制限を適用
  if (toolName.length > 50) { // methodプレフィックス分を考慮
    toolName = toolName.substring(0, 50);
  }

  return toolName;
}

// OpenAPIの定義からMCPツールを生成する関数
function generateToolsFromOpenApi(server: McpServer): void {
  const paths = freeeApiSchema.paths;
  const components = freeeApiSchema.components;
  const componentsSchemas = components.schemas as Record<string, OpenAPIRequestBodyContentSchema>;

  // パスの key のアルファベット順でソート
  const orderedPathKeys = Object.keys(paths).sort() as (keyof typeof paths)[];

  orderedPathKeys.forEach((pathKey) => {
    const pathItem: OpenAPIPathItem = paths[pathKey];
    Object.entries(pathItem).forEach(([method, operation]: [string, OpenAPIOperation]) => {
      const toolName = `${method}_${convertPathToToolName(pathKey)}`;
      const description = operation.summary || operation.description || '';

      // パラメータスキーマの構築
      const parameterSchema: Record<string, z.ZodType> = {};

      // パスパラメータの処理
      const pathParams = operation.parameters?.filter((p) => p.in === 'path') || [];
      pathParams.forEach((param) => {
        parameterSchema[param.name] = convertParameterToZodSchema(param);
      });

      // クエリパラメータの処理
      const queryParams = operation.parameters?.filter((p) => p.in === 'query') || [];
      queryParams.forEach((param) => {
        let schema = convertParameterToZodSchema(param);
        if (param.name === 'company_id') {
          schema = schema.optional(); // company_id は任意にしてリクエスト時に補完
        }
        parameterSchema[param.name] = schema;
      });

      // Bodyパラメータの処理
      // let bodySchema = z.object({});
      let bodySchema = z.any();
      if (method === 'post' || method === 'put') {
        const requestBody = operation.requestBody?.content?.['application/json']?.schema;
        if (requestBody) {
          // TODO: The framework does not support nested objects as parameters, so this is temporarily commented out

          // let requestBodyContentSchema;
          // if ('$ref' in requestBody) {
          //   const ref = requestBody['$ref'];
          //   const componentName = ref.replace('#/components/schemas/', '');
          //   const component = componentsSchemas[componentName];
          //   requestBodyContentSchema = component;
          // } else {
          //   requestBodyContentSchema = requestBody;
          // }

          // const required = requestBodyContentSchema.required || [];
          // const properties = requestBodyContentSchema.properties || {};
          // Object.entries(properties).forEach(([name, property]) => {
          //   const schema = convertParameterToZodSchema(property as OpenAPIParameter);
          //   if (!required.includes(name)) {
          //     schema.optional();
          //   }
          //   bodySchema = bodySchema.extend({ [name]: schema });
          // });

          // bodySchema を parameterSchema に追加
          parameterSchema['body'] = bodySchema.describe('Request body');
        }
      }

      server.tool(toolName, description, parameterSchema, async (params) => {
        try {
          // パスパラメータの置換
          let actualPath = pathKey as string;
          pathParams.forEach((param: OpenAPIParameter) => {
            actualPath = actualPath.replace(`{${param.name}}`, String(params[param.name]));
          });

          // クエリパラメータの抽出
          const queryParameters: Record<string, unknown> = {};
          queryParams.forEach((param: OpenAPIParameter) => {
            if (params[param.name] !== undefined) {
              queryParameters[param.name] = params[param.name];
            }
          });

          const bodyParameters =
            method === 'post' || method === 'put' ? bodySchema.parse(params) : undefined;
          const result = await makeApiRequest(
            method.toUpperCase(),
            actualPath,
            queryParameters,
            bodyParameters,
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      });
    });
  });
}

// 認証関連のMCPツールを追加する関数
function addAuthenticationTools(server: McpServer): void {
  // 現在のユーザー情報取得ツール
  server.tool(
    'freee_current_user',
    'freee APIの現在のユーザー情報を取得します。認証状態、会社ID、ユーザー詳細が含まれます。',
    {},
    async () => {
      try {
        const companyId = process.env.FREEE_COMPANY_ID;
        if (!companyId) {
          return {
            content: [
              {
                type: 'text',
                text: 'FREEE_COMPANY_ID環境変数が設定されていません。',
              },
            ],
          };
        }

        // get_users_me APIを実行
        const userInfo = await makeApiRequest('GET', '/api/1/users/me');

        return {
          content: [
            {
              type: 'text',
              text: `現在のユーザー情報:\n` +
                    `設定されている会社ID: ${companyId}\n` +
                    `ユーザー詳細:\n${JSON.stringify(userInfo, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `ユーザー情報の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}\n\n` +
                    `以下を確認してください:\n` +
                    `1. 認証が完了しているか（freee_authenticate ツールを使用）\n` +
                    `2. FREEE_COMPANY_ID環境変数が正しく設定されているか\n` +
                    `3. ネットワーク接続が正常か`,
            },
          ],
        };
      }
    }
  );

  // OAuth認証ツール
  server.tool(
    'freee_authenticate',
    'freee APIのOAuth認証を開始します。永続的なコールバックサーバーを利用して認証を行います。',
    {},
    async () => {
      try {
        if (!process.env.FREEE_CLIENT_ID) {
          return {
            content: [
              {
                type: 'text',
                text: 'FREEE_CLIENT_ID環境変数が設定されていません。\n' +
                      'OAuth認証を行うには、freee developersでアプリケーションを作成し、\n' +
                      'クライアントIDを環境変数に設定してください。',
              },
            ],
          };
        }

        if (!process.env.FREEE_CLIENT_SECRET) {
          return {
            content: [
              {
                type: 'text',
                text: 'FREEE_CLIENT_SECRET環境変数が設定されていません。\n' +
                      'OAuth認証を行うには、freee developersでアプリケーションを作成し、\n' +
                      'クライアントシークレットを環境変数に設定してください。',
              },
            ],
          };
        }

        // PKCEパラメータを生成
        const { codeVerifier, codeChallenge } = generatePKCE();
        const state = crypto.randomBytes(16).toString('hex');
        const authUrl = buildAuthUrl(codeChallenge, state, 'http://127.0.0.1:8080/callback');

        // 永続サーバーに認証リクエストを登録
        const { registerAuthenticationRequest } = await import('./auth.js');
        registerAuthenticationRequest(state, codeVerifier);

        // 即座にレスポンスを返す（ユーザーに認証URLを提供）
        return {
          content: [
            {
              type: 'text',
              text: `🚀 OAuth認証を開始しました！\n\n` +
                    `📱 以下のURLをブラウザで開いて認証を完了してください:\n` +
                    `${authUrl}\n\n` +
                    `🔄 認証手順:\n` +
                    `1. 上記URLをクリックまたはコピーしてブラウザで開く\n` +
                    `2. freeeにログインして会社を選択\n` +
                    `3. アプリケーションへのアクセスを許可\n` +
                    `4. 認証完了後、freee_auth_status で状態を確認\n` +
                    `⏰ この認証リクエストは5分後にタイムアウトします`
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `認証開始に失敗しました: ${error instanceof Error ? error.message : String(error)}\n\n` +
                    `以下を確認してください:\n` +
                    `1. FREEE_CLIENT_ID環境変数が設定されているか\n` +
                    `2. freee側でアプリケーション設定が正しいか\n` +
                    `3. コールバックサーバー（8080ポート）が起動しているか`,
            },
          ],
        };
      }
    }
  );

  // 認証状態確認ツール
  server.tool(
    'freee_auth_status',
    'freee APIの認証状態を確認します。保存されているトークンの情報を表示します。',
    {},
    async () => {
      try {
        const tokens = await loadTokens();
        if (!tokens) {
          return {
            content: [
              {
                type: 'text',
                text: '認証されていません。freee_authenticate ツールを使用して認証を行ってください。',
              },
            ],
          };
        }

        const isValid = Date.now() < tokens.expires_at;
        const expiryDate = new Date(tokens.expires_at).toLocaleString();

        return {
          content: [
            {
              type: 'text',
              text: `認証状態: ${isValid ? '有効' : '期限切れ'}\n` +
                    `アクセストークン: ${tokens.access_token.substring(0, 20)}...\n` +
                    `有効期限: ${expiryDate}\n` +
                    `スコープ: ${tokens.scope}\n` +
                    `トークンタイプ: ${tokens.token_type}` +
                    (isValid ? '' : '\n\n次回API使用時に自動更新されます。'),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `認証状態の確認に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  // 認証リセットツール
  server.tool(
    'freee_clear_auth',
    'freee APIの認証情報をクリアします。保存されているトークンファイルを削除し、次回API使用時に再認証が必要になります。',
    {},
    async () => {
      try {
        await clearTokens();
        return {
          content: [
            {
              type: 'text',
              text: '認証情報がクリアされました。\n' +
                    '次回freee API使用時に再認証が必要です。\n' +
                    '再認証するには freee_authenticate ツールを使用してください。',
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `認証情報のクリアに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}

// Create an MCP server
const server = new McpServer({
  name: 'freee',
  version: '1.0.0',
});

// 認証関連のMCPツールを追加（freee始まりのツールを最初に）
addAuthenticationTools(server);

// OpenAPI定義からツールを生成
generateToolsFromOpenApi(server);

const main = async (): Promise<void> => {
  // コールバック受付サーバーを起動
  try {
    await startCallbackServer();
    console.error('✅ OAuth callback server started on http://127.0.0.1:8080');
  } catch (error) {
    console.error('⚠️ Failed to start callback server:', error);
    console.error('OAuth authentication will fall back to manual mode');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Freee MCP Server running on stdio');

  // プロセス終了時にサーバーを停止
  process.on('SIGINT', () => {
    stopCallbackServer();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    stopCallbackServer();
    process.exit(0);
  });
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
