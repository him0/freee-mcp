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
