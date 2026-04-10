# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `bun run build` - Build the project (uses Bun.build)
- `bun run typecheck` - TypeScript type checking
- `bun run lint` - Run Biome linter
- `bun run format` - Run Biome formatter
- `bun run check` - Run Biome lint + format (recommended before PR)
- `bun run test:run` - Run tests (vitest)
- `bun run dev` - Start development server
- `bun run inspector` - MCP inspector for debugging tools
- `bun run changeset` - Create a new changeset for version bumps
- `bun run version` - Apply changesets to update versions and CHANGELOG
- `bun run release` - Build and publish to npm

## Architecture

MCP server that exposes freee API endpoints as MCP tools:

- Schema: Multiple OpenAPI schemas in `openapi/` directory
  - `accounting-api-schema.json` - 会計API (https://api.freee.co.jp)
  - `hr-api-schema.json` - 人事労務API (https://api.freee.co.jp/hr)
  - `invoice-api-schema.json` - 請求書API (https://api.freee.co.jp/iv)
  - `pm-api-schema.json` - 工数管理API (https://api.freee.co.jp/pm)
  - `sm-api-schema.json` - 販売API (https://api.freee.co.jp/sm)
  - `sign-api-schema.json` - サイン（電子契約）API (https://ninja-sign.com)
- Schema Loader: `src/openapi/schema-loader.ts` loads and manages all API schemas
- Tool Generation: `generateClientModeTool()` in `src/openapi/client-mode.ts` creates method-specific tools
  - Tools: `freee_api_get`, `freee_api_post`, `freee_api_put`, `freee_api_delete`, `freee_api_patch`, `freee_api_list_paths`
  - Automatically detects API type from path and uses correct base URL
  - Validates paths against all OpenAPI schemas before execution
  - Supports all 5 freee APIs seamlessly
- Requests: `makeApiRequest()` in `src/api/client.ts` handles API calls with auto-auth and company_id injection

### Configuration

Run `freee-mcp configure` to set up configuration interactively:

- Creates `~/.config/freee-mcp/config.json` with OAuth credentials and company settings
- More secure (file permissions 0600)

### CLI Subcommands

- `freee-mcp` - Start MCP server
- `freee-mcp configure` - Interactive configuration setup
- `freee-sign-mcp` - Start Sign MCP server
- `freee-sign-mcp configure` - Sign interactive configuration setup

### MCP Configuration

After running `freee-mcp configure`:

```json
{
  "mcpServers": {
    "freee": {
      "command": "npx",
      "args": ["freee-mcp"]
    }
  }
}
```

Configuration is automatically loaded from `~/.config/freee-mcp/config.json`.

Development mode: Use `"command": "bun", "args": ["run", "src/index.ts"]` with `"cwd": "/path/to/freee-mcp"`

Sign development mode: Use `"command": "bun", "args": ["run", "src/sign/index.ts"]` with `"cwd": "/path/to/freee-mcp"`

### API Base URL の上書き（開発用）

環境変数 `FREEE_API_BASE_URL_{SERVICE}` でAPIの向き先を変更できる（`src/openapi/schema-loader.ts` の `resolveBaseUrl` で処理）。

- `FREEE_API_BASE_URL_ACCOUNTING` - 会計API
- `FREEE_API_BASE_URL_HR` - 人事労務API
- `FREEE_API_BASE_URL_INVOICE` - 請求書API
- `FREEE_API_BASE_URL_PM` - 工数管理API
- `FREEE_API_BASE_URL_SM` - 販売API
- `FREEE_SIGN_API_URL` - サインAPI（`src/sign/config.ts` で処理）

### Remote モードのロギング (canonical log line)

Remote (`mcp.freee.co.jp`) モードでは 1 HTTP リクエスト = 1 ログ行 = 1 trace のパターンで JSON 構造化ログを出力する。個別イベントログ (`API request completed` 等) は存在せず、`src/telemetry/middleware.ts` の `res.on('finish')` で 1 本にまとめて emit される。

ログ行の構造:

```json
{
  "msg": "mcp request completed",
  "request_id": "...",
  "trace_id": "...",
  "source_ip": "...",
  "user_agent": "ClaudeDesktop/1.2.3 (macOS 15.1)",
  "user_id": "...",
  "http": { "method": "POST", "path": "/mcp", "status": 200, "duration_ms": 842 },
  "mcp": { "tool_calls": [...], "tool_call_count": 1 },
  "api_calls": [...],
  "api_call_count": 1,
  "errors": []
}
```

実装の要点:

- `src/server/request-context.ts` の `RequestRecorder` が AsyncLocalStorage 経由でリクエスト単位の状態を保持する。tool handler・API client・エラーハンドラは `getCurrentRecorder()?.recordToolCall(...)` / `recordApiCall(...)` / `recordError(...)` で情報を追記する
- エラー発生時は `serializeErrorChain()` (`src/server/error-serializer.ts`) で `Error.cause` チェーンを展開し、`errors[].chain[]` に stack trace 付きで格納される
- プライバシー: `ToolCallInfo` の型が query 値や body を表現できないよう設計されており、型システムで漏洩を防止する。pino.redact と `scrubErrorMessage()` (6 桁以上の数値 ID とメールアドレスをマスク) が二重の防御層として働く
- `http.status` はクライアントへの最終応答コード、`api_calls[].status_code` は内部 freee API の応答コードで意味が異なる。freee API が 500 でも MCP 応答は 200 で包む場合があるため両方を参照する
- Inbound `User-Agent` ヘッダは `src/telemetry/middleware.ts` の `normalizeUserAgent()` で scrub → 256 文字切り詰めを行った上で `user_agent` フィールドに記録される。どの MCP クライアント (Claude Desktop / Cursor / 自作スクリプトなど) が呼び出したかを Datadog で分析可能。UA に 6 桁以上の連続数字が含まれる場合は `[REDACTED_ID]` に置換される点に注意 (例: `Chrome/120.0.987654.1` → `Chrome/120.0.[REDACTED_ID].1`)。4 桁以下のビルド番号 (実際の Chrome, Safari など) は素通し
- Outbound の User-Agent (freee API 向け) は `src/server/user-agent.ts` の `getUserAgent()` が transport mode を含む文字列を返す: `freee-mcp/<version> (MCP Server; stdio|remote; +url)`。エントリポイントで `initUserAgentTransportMode('remote' | 'stdio')` を起動時 1 回だけ呼ぶ
- 詳細な個別イベントを見たい場合は環境変数 `LOG_LEVEL=debug` で再起動する (ただし現在 debug ログは運用では用意していない)

Datadog 検索例:

- `@http.status:500` — MCP サーバー自体の 5xx
- `@api_calls.error_type:timeout` — 外部 API タイムアウトの集計 (envoy アラームとの相関分析用)
- `@http.status:200 @errors:*` — 見かけ上は成功だが内部的に失敗した (MCP 応答に error content を wrap したもの)
- `@request_id:<uuid>` — 特定リクエストのすべての情報 (1 行にまとまっている)
- `@user_agent:ClaudeDesktop*` — 特定の MCP クライアント種別だけを抽出 (クライアント別のタイムアウト / エラー分布分析)

## PR Creation Pre-flight Checklist

Always run before creating a PR:

```bash
bun run typecheck && bun run lint && bun run test:run && bun run build
```

Changeset requirement (必須):

- コミット時に changeset ファイルを必ず作成すること（忘れやすいので注意）
- `bun run changeset` が対話モードで使えない場合は `.changeset/<短い説明>.md` を直接作成する
- フォーマット: frontmatter に `"freee-mcp": patch|minor|major`、本文に変更内容の説明（日本語）
- bump type: `patch`（バグ修正）、`minor`（新機能）、`major`（破壊的変更）

Contributor の追加:

- Issue を起票してくれた人を README.md の Contributors セクション（`<!-- CONTRIBUTORS-START -->` ～ `<!-- CONTRIBUTORS-END -->` の間）に追加する
- 既存のフォーマットに合わせて `<a href="https://github.com/{username}"><img src="https://github.com/{username}.png" width="40" height="40" alt="@{username}"></a>` を末尾に追記する

Common issues:

- Mock function return types (ensure `id` fields are strings)
- Missing return type annotations on exported functions
- Undefined environment variables in tests

## Skill について

- `skills/freee-api-skill/` 内の `VERSION.md` は npm publish 時に自動生成されるため、開発環境（ローカル）には存在しない
- 開発環境では `freee_server_info` のバージョンが `dev` と返る（正常動作）。実際のバージョンは `package.json` の `version` を参照する

## Writing Style

- Do not use markdown bold syntax (`**`)  in any files
