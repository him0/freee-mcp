import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { isBinaryFileResponse, makeApiRequest } from '../api/client.js';
import { makeErrorChain, serializeErrorChain } from '../server/error-serializer.js';
import { sanitizePath } from '../server/logger.js';
import { getCurrentRecorder } from '../server/request-context.js';
import type { AuthExtra } from '../storage/context.js';
import { extractTokenContext } from '../storage/context.js';
import { registerTracedTool, setToolAttributes } from '../telemetry/tool-tracer.js';
import { createTextResponse, formatErrorMessage } from '../utils/error.js';
import { type ApiType, listAllAvailablePaths, validatePathForService } from './schema-loader.js';

const SUPPORTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const SERVICE_HINT = 'service: accounting/hr/invoice/pm/sm';
const SKILL_HINT = '詳細ガイドはfreee-api-skill skillを参照';

const serviceSchema = z
  .enum(['accounting', 'hr', 'invoice', 'pm', 'sm'])
  .describe('対象のfreeeサービス');

const UTF8_BOM = String.fromCharCode(0xfeff);

/**
 * Some MCP clients send object parameters as JSON strings. This wrapper
 * accepts both a plain object and a JSON string, coercing the latter.
 *
 * A leading UTF-8 BOM (U+FEFF) is rejected with a dedicated error rather than
 * silently stripped: silent normalization would make the same payload behave
 * differently across operating systems and hide upstream encoding bugs. The
 * generic parse-failure message intentionally carries only the string length —
 * never any portion of the raw string — so customer payload data cannot leak
 * into error responses or downstream logs.
 */
export function coercibleRecord(description: string) {
  return z.preprocess(
    (val, ctx) => {
      if (typeof val !== 'string') return val;
      if (val.startsWith(UTF8_BOM)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            `string starts with a UTF-8 BOM (U+FEFF), which is not valid JSON. ` +
            `The MCP client likely transcoded the payload through a transport ` +
            `that prepended a BOM (commonly seen on Windows). ` +
            `Send the JSON without a BOM.`,
        });
        return z.NEVER;
      }
      try {
        return JSON.parse(val);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            `expected object or JSON-encoded object string; received string ` +
            `of length ${val.length} that could not be parsed as JSON`,
        });
        return z.NEVER;
      }
    },
    z.record(z.string(), z.unknown()),
  ).describe(description);
}

/**
 * Creates a tool handler for a specific HTTP method
 */
function createMethodTool(method: string) {
  const toolName = `freee_api_${method.toLowerCase()}`;

  return async (
    args: {
      service: ApiType;
      path: string;
      query?: Record<string, unknown>;
      body?: Record<string, unknown>;
    },
    extra?: AuthExtra,
  ) => {
    const recorder = getCurrentRecorder();
    const startTime = Date.now();
    const safePath = sanitizePath(args.path);
    const tokenContext = extractTokenContext(extra);

    try {
      const { service, path, query, body } = args;
      setToolAttributes({ 'mcp.tool.service': service, 'mcp.tool.path': safePath, 'mcp.tool.method': method });

      const validation = validatePathForService(method, path, service);
      if (!validation.isValid) {
        recorder?.recordToolCall({
          tool: toolName,
          service,
          status: 'error',
          duration_ms: Date.now() - startTime,
        });
        recorder?.recordError({
          source: 'validation',
          error_type: 'path_validation_failed',
          chain: makeErrorChain('ValidationError', validation.message ?? 'unknown validation error'),
        });
        return createTextResponse(
          `パス検証エラー: ${validation.message}\n\n` +
            `利用可能なパスを確認するには freee_api_list_paths ツールを使用してください。`,
        );
      }

      const actualPath = validation.actualPath ?? path;
      const result = await makeApiRequest(method, actualPath, query, body, validation.baseUrl, tokenContext);

      recorder?.recordToolCall({
        tool: toolName,
        service,
        status: 'success',
        duration_ms: Date.now() - startTime,
      });

      if (isBinaryFileResponse(result)) {
        const baseMimeType = result.mimeType.split(';')[0].trim();

        if (SUPPORTED_IMAGE_MIME_TYPES.has(baseMimeType)) {
          return {
            content: [
              { type: 'image', data: result.data.toString('base64'), mimeType: baseMimeType },
            ],
          };
        }

        if (baseMimeType === 'application/pdf') {
          return {
            content: [
              {
                type: 'resource',
                resource: {
                  uri: `freee://api${actualPath}`,
                  mimeType: baseMimeType,
                  blob: result.data.toString('base64'),
                },
              },
            ],
          };
        }

        if (baseMimeType === 'text/csv') {
          return createTextResponse(result.data.toString('utf-8'));
        }

        return createTextResponse(
          `バイナリファイルを受信しました。このファイル形式（${baseMimeType}）は表示できません。\n\n` +
            `Content-Type: ${result.mimeType}\n` +
            `ファイルサイズ: ${result.size} bytes\n\n` +
            `このファイルを取得するには、freee Webアプリから直接ダウンロードしてください。`,
        );
      }

      if (result === null) {
        return createTextResponse('リクエストが正常に完了しました。');
      }

      return createTextResponse(JSON.stringify(result, null, 2));
    } catch (error) {
      recorder?.recordToolCall({
        tool: toolName,
        service: args.service,
        status: 'error',
        duration_ms: Date.now() - startTime,
      });
      recorder?.recordError({ source: 'tool_handler', chain: serializeErrorChain(error) });
      return createTextResponse(`APIリクエストエラー: ${formatErrorMessage(error)}`);
    }
  };
}

/**
 * Generates API client tools as sub-commands per HTTP method
 */
export function generateClientModeTool(server: McpServer): void {
  // GET tool
  registerTracedTool(server,
    'freee_api_get',
    {
      title: 'freee API GET リクエスト',
      description: `freee API GET - ${SERVICE_HINT} (${SKILL_HINT})`,
      inputSchema: {
        service: serviceSchema,
        path: z.string().describe('APIパス (例: /api/1/deals)'),
        query: coercibleRecord('クエリパラメータ (オプション)').optional(),
      },
      annotations: { readOnlyHint: true },
    },
    createMethodTool('GET'),
  );

  // POST tool
  registerTracedTool(server,
    'freee_api_post',
    {
      title: 'freee API POST リクエスト',
      description: `freee API POST - ${SERVICE_HINT} (${SKILL_HINT})`,
      inputSchema: {
        service: serviceSchema,
        path: z.string().describe('APIパス (例: /api/1/deals)'),
        body: coercibleRecord('リクエストボディ'),
        query: coercibleRecord('クエリパラメータ (オプション)').optional(),
      },
      annotations: { destructiveHint: false },
    },
    createMethodTool('POST'),
  );

  // PUT tool
  registerTracedTool(server,
    'freee_api_put',
    {
      title: 'freee API PUT リクエスト',
      description: `freee API PUT - ${SERVICE_HINT} (${SKILL_HINT})`,
      inputSchema: {
        service: serviceSchema,
        path: z.string().describe('APIパス (例: /api/1/deals/123)'),
        body: coercibleRecord('リクエストボディ'),
        query: coercibleRecord('クエリパラメータ (オプション)').optional(),
      },
      annotations: { destructiveHint: false, idempotentHint: true },
    },
    createMethodTool('PUT'),
  );

  // DELETE tool
  registerTracedTool(server,
    'freee_api_delete',
    {
      title: 'freee API DELETE リクエスト',
      description: `freee API DELETE - ${SERVICE_HINT} (${SKILL_HINT})`,
      inputSchema: {
        service: serviceSchema,
        path: z.string().describe('APIパス (例: /api/1/deals/123)'),
        query: coercibleRecord('クエリパラメータ (オプション)').optional(),
      },
      annotations: { idempotentHint: true },
    },
    createMethodTool('DELETE'),
  );

  // PATCH tool
  registerTracedTool(server,
    'freee_api_patch',
    {
      title: 'freee API PATCH リクエスト',
      description: `freee API PATCH - ${SERVICE_HINT} (${SKILL_HINT})`,
      inputSchema: {
        service: serviceSchema,
        path: z.string().describe('APIパス (例: /api/1/deals/123)'),
        body: coercibleRecord('リクエストボディ'),
        query: coercibleRecord('クエリパラメータ (オプション)').optional(),
      },
      annotations: { destructiveHint: false },
    },
    createMethodTool('PATCH'),
  );

  // Add helper tool to list available paths
  registerTracedTool(server,
    'freee_api_list_paths',
    {
      title: 'API エンドポイント一覧',
      description: 'freee API エンドポイント一覧 (詳細ガイドはfreee-api-skill skillを参照)',
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const recorder = getCurrentRecorder();
      const toolStart = Date.now();
      const pathsList = listAllAvailablePaths();
      recorder?.recordToolCall({
        tool: 'freee_api_list_paths',
        status: 'success',
        duration_ms: Date.now() - toolStart,
      });
      return createTextResponse(
        `# freee API 利用可能なエンドポイント一覧${pathsList}\n\n` +
          `使用例:\n` +
          `freee_api_get { "service": "accounting", "path": "/api/1/deals", "query": { "limit": 10 } }\n` +
          `freee_api_get { "service": "accounting", "path": "/api/1/deals", "query": { "type": "income", "limit": 5 } }\n` +
          `freee_api_post { "service": "accounting", "path": "/api/1/deals", "body": { "issue_date": "2024-01-01", ... } }`,
      );
    },
  );
}
