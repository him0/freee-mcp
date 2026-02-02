# @him0/freee-mcp

## 0.6.1

### Patch Changes

- 4b941b6: 外部APIへのリクエストにUser-Agentヘッダーを追加し、MCPサーバーからのリクエストであることを識別可能に
- a803a3e: Add Zod validation for external API responses to prevent silent failures from invalid response formats
- f79175d: fix: improve error handling for OAuth callback server startup failures
  - Add explicit error messages when OAuth callback server fails to start
  - Log when server is already running instead of silently returning
  - Clean up server state properly on error

- a6b4a4c: fix: 403エラーのハンドリングを改善し、レートリミットの可能性を示すメッセージを追加
- 230cbf8: fix: improve token error handling with Result type pattern
  - Replace safeParseJson with parseJsonResponse that returns a Result type, preserving error context instead of silently returning empty object
  - Propagate token refresh errors in getValidAccessToken instead of returning null, allowing callers to understand failure reasons
  - Add comprehensive tests for parseJsonResponse and token refresh failure scenarios

- b2ac012: OAuthコールバックサーバーをMCPサーバー起動時ではなく、認証時にオンデマンドで起動するように変更
- d4f96c0: ポートが使用中の場合にフォールバックせず、具体的な解決方法を含むエラーメッセージを表示するように変更
