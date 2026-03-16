# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm build` - Build the project
- `pnpm typecheck` - TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm test:run` - Run tests
- `pnpm dev` - Start development server
- `pnpm inspector` - MCP inspector for debugging tools
- `pnpm changeset` - Create a new changeset for version bumps
- `pnpm version` - Apply changesets to update versions and CHANGELOG
- `pnpm release` - Build and publish to npm

## Architecture

MCP server that exposes freee API endpoints as MCP tools:

- Schema: Multiple OpenAPI schemas in `openapi/` directory
  - `accounting-api-schema.json` - 会計API (https://api.freee.co.jp)
  - `hr-api-schema.json` - 人事労務API (https://api.freee.co.jp/hr)
  - `invoice-api-schema.json` - 請求書API (https://api.freee.co.jp/iv)
  - `pm-api-schema.json` - 工数管理API (https://api.freee.co.jp/pm)
  - `sm-api-schema.json` - 販売API (https://api.freee.co.jp/sm)
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

Development mode: Use `"command": "pnpm", "args": ["tsx", "src/index.ts"]` with `"cwd": "/path/to/freee-mcp"`

### API Base URL の上書き（開発用）

環境変数 `FREEE_API_BASE_URL_{SERVICE}` でAPIの向き先を変更できる（`src/openapi/schema-loader.ts` の `resolveBaseUrl` で処理）。

- `FREEE_API_BASE_URL_ACCOUNTING` - 会計API
- `FREEE_API_BASE_URL_HR` - 人事労務API
- `FREEE_API_BASE_URL_INVOICE` - 請求書API
- `FREEE_API_BASE_URL_PM` - 工数管理API
- `FREEE_API_BASE_URL_SM` - 販売API

## PR Creation Pre-flight Checklist

Always run before creating a PR:

```bash
pnpm typecheck && pnpm lint && pnpm test:run && pnpm build
```

Changeset requirement:

- Run `pnpm changeset` to create a changeset file for any user-facing changes
- Select the appropriate bump type: `patch` (bug fixes), `minor` (new features), `major` (breaking changes)
- Write a concise description of what changed for the CHANGELOG

Contributor の追加:

- Issue を起票してくれた人を README.md の Contributors セクション（`<!-- CONTRIBUTORS-START -->` ～ `<!-- CONTRIBUTORS-END -->` の間）に追加する
- 既存のフォーマットに合わせて `<a href="https://github.com/{username}"><img src="https://github.com/{username}.png" width="40" height="40" alt="@{username}"></a>` を末尾に追記する

Common issues:

- Mock function return types (ensure `id` fields are strings)
- Missing return type annotations on exported functions
- Undefined environment variables in tests

## Writing Style

- Do not use markdown bold syntax (`**`)  in any files
