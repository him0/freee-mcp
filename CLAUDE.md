# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` - Start development server with watch mode
- `pnpm build` - Full build (types + esbuild)
- `pnpm type-check` - TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm inspector` - MCP inspector for debugging tools
- `node scripts/test-tools.js` - Quick tool verification
- `node scripts/test-mcp.js` - Full MCP protocol testing

## Architecture

MCP server that exposes freee API endpoints as MCP tools:

- **Schema**: `src/data/freee-api-schema.json` contains OpenAPI definition
- **Tool Generation**: Two modes available (selected via CLI subcommand):
  - **Client Mode** (`freee-mcp client`): Sub-command tools per HTTP method
    - `generateClientModeTool()` in `src/openapi/client-mode.ts` creates method-specific tools
    - Tools: `freee_api_get`, `freee_api_post`, `freee_api_put`, `freee_api_delete`, `freee_api_patch`, `freee_api_list_paths`
    - Validates paths against OpenAPI schema before execution
    - Reduces context window usage significantly (6 tools vs hundreds)
  - **Individual Mode** (`freee-mcp api` or default): One tool per endpoint
    - `generateToolsFromOpenApi()` in `src/openapi/converter.ts` converts OpenAPI paths to MCP tools
    - Naming: GET → `get_*`, POST → `post_*`, PUT → `put_*_by_id`, DELETE → `delete_*_by_id`
- **Requests**: `makeApiRequest()` in `src/api/client.ts` handles API calls with auto-auth and company_id injection

### Configuration

#### Recommended Setup (Config File)

Run `freee-mcp configure` to set up configuration interactively:
- Creates `~/.config/freee-mcp/config.json` with OAuth credentials and company settings
- No environment variables needed
- More secure (file permissions 0600)

#### Environment Variables (Deprecated)

⚠️ **Environment variables are deprecated and will be removed in a future version.**

- `FREEE_CLIENT_ID` - OAuth client ID (deprecated, use config file)
- `FREEE_CLIENT_SECRET` - OAuth client secret (deprecated, use config file)
- `FREEE_DEFAULT_COMPANY_ID` - Company ID (deprecated, use `freee_set_company` tool)
- `FREEE_CALLBACK_PORT` - OAuth callback port (deprecated, set in config file)

### CLI Subcommands

- `freee-mcp client` - Start in client mode (HTTP method sub-commands)
- `freee-mcp api` - Start in API mode (individual tools per endpoint) [default]

### MCP Configuration

#### Using Config File (Recommended)

After running `freee-mcp configure`:

```json
{
  "mcpServers": {
    "freee": {
      "command": "npx",
      "args": ["@him0/freee-mcp"]
    }
  }
}
```

Configuration is automatically loaded from `~/.config/freee-mcp/config.json`.

#### Using Environment Variables (Deprecated)

⚠️ **Deprecated: Will be removed in future versions**

**Client Mode (recommended):**
```json
{
  "mcpServers": {
    "freee": {
      "command": "npx",
      "args": ["@him0/freee-mcp", "client"],
      "env": {
        "FREEE_CLIENT_ID": "your_client_id",
        "FREEE_CLIENT_SECRET": "your_client_secret",
        "FREEE_CALLBACK_PORT": "54321"
      }
    }
  }
}
```

**API Mode (individual tools):**
```json
{
  "mcpServers": {
    "freee": {
      "command": "npx",
      "args": ["@him0/freee-mcp", "api"],
      "env": {
        "FREEE_CLIENT_ID": "your_client_id",
        "FREEE_CLIENT_SECRET": "your_client_secret",
        "FREEE_COMPANY_ID": "your_company_id",
        "FREEE_CALLBACK_PORT": "54321"
      }
    }
  }
}
```

**Client Mode vs Individual Mode**:
- Use `freee-mcp client` for HTTP method sub-command tools (recommended for large APIs)
  - 6 tools total: freee_api_{get,post,put,delete,patch} + freee_api_list_paths
  - Significantly reduces context window usage
- Use `freee-mcp api` for individual tools per endpoint (more granular but uses more context)
  - Hundreds of tools (one per API endpoint)

Development mode: Use `"command": "pnpm", "args": ["tsx", "src/index.ts", "client"]` with `"cwd": "/path/to/freee-mcp"`

## PR Creation Pre-flight Checklist

**Always run before creating a PR:**

```bash
pnpm type-check && pnpm lint && pnpm test:run && pnpm build
```

**Common issues:**
- Mock function return types (ensure `id` fields are strings)
- Missing return type annotations on exported functions
- Undefined environment variables in tests
