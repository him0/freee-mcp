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
- **Tool Generation**: `generateToolsFromOpenApi()` in [src/index.ts:151](src/index.ts#L151) converts OpenAPI paths to MCP tools
- **Naming**: GET → `get_*`, POST → `post_*`, PUT → `put_*_by_id`, DELETE → `delete_*_by_id`
- **Requests**: `makeApiRequest()` in [src/index.ts:65](src/index.ts#L65) handles API calls with auto-auth and company_id injection

### Environment Variables

- `FREEE_CLIENT_ID` (required) - OAuth client ID
- `FREEE_CLIENT_SECRET` (required) - OAuth client secret
- `FREEE_DEFAULT_COMPANY_ID` (required) - Company ID
- `FREEE_CALLBACK_PORT` (optional) - OAuth callback port, defaults to 54321

### MCP Configuration

Add to Claude Code config:

```json
{
  "mcpServers": {
    "freee": {
      "command": "npx",
      "args": ["@him0/freee-mcp"],
      "env": {
        "FREEE_CLIENT_ID": "your_client_id",
        "FREEE_CLIENT_SECRET": "your_client_secret",
        "FREEE_DEFAULT_COMPANY_ID": "your_company_id",
        "FREEE_CALLBACK_PORT": "54321"
      }
    }
  }
}
```

Development mode: Use `"command": "pnpm", "args": ["tsx", "src/index.ts"]` with `"cwd": "/path/to/freee-mcp"`

## PR Creation Pre-flight Checklist

**Always run before creating a PR:**

```bash
pnpm type-check && pnpm lint && pnpm test:run && pnpm build
```

**Common issues:**
- Mock function return types (ensure `id` fields are strings)
- Missing return type annotations on exported functions
- Undefined environment variables in tests
