# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm dev` - Start development server with watch mode
- `pnpm start` - Run the MCP server directly
- `pnpm inspector` - Run MCP inspector for debugging tools

### Build & Type Checking
- `pnpm build` - Full build (types + esbuild)
- `pnpm build:types` - Generate TypeScript declarations only
- `pnpm build:esbuild` - Bundle with esbuild only
- `pnpm type-check` - TypeScript type checking without emitting files

### Code Quality
- `pnpm lint` - Run ESLint on TypeScript files
- `pnpm lint:fix` - Auto-fix ESLint issues
- `pnpm format` - Format code with Prettier

## Architecture

This is a Model Context Protocol (MCP) server that exposes freee API endpoints as MCP tools. The core architecture:

1. **OpenAPI Schema Processing**: `src/data/freee-api-schema.json` contains the complete freee API definition
2. **Dynamic Tool Generation**: `generateToolsFromOpenApi()` in `src/index.ts:151` automatically converts OpenAPI paths to MCP tools
3. **Tool Naming Convention**: 
   - GET endpoints become `get_[resource_name]`
   - POST endpoints become `post_[resource_name]`
   - PUT endpoints become `put_[resource_name]_by_id`
   - DELETE endpoints become `delete_[resource_name]_by_id`
4. **Request Handling**: `makeApiRequest()` in `src/index.ts:65` handles all API calls with automatic authentication and company_id injection
5. **Parameter Validation**: Uses Zod schemas generated from OpenAPI parameter definitions

### Key Technical Details
- Uses `@modelcontextprotocol/sdk` for MCP server implementation
- Builds both ESM and CommonJS outputs via esbuild
- Automatically injects `company_id` from environment variables
- All tools accept parameters based on their OpenAPI parameter definitions
- Request bodies are currently simplified to `z.any()` due to MCP framework limitations with nested objects

### Environment Variables
- `FREEE_ACCESS_TOKEN` (required) - freee API access token
- `FREEE_COMPANY_ID` (required) - freee company ID
- `FREEE_API_URL` (optional) - API base URL, defaults to https://api.freee.co.jp