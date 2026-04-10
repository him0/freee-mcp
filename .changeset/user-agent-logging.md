---
"freee-mcp": patch
---

Remote モードの canonical log line に inbound `user_agent` フィールドを追加、外部 freee API 向けの outbound User-Agent に transport mode (`stdio` / `remote`) を含めた

- Remote: MCP クライアントから届いた `User-Agent` ヘッダを 256 文字に切り詰め、`scrubErrorMessage` で数値 ID とメールをマスクした上で canonical log line に記録。Datadog で `@user_agent:ClaudeDesktop*` のように MCP クライアント別の分析が可能になる
- Outbound: freee API への fetch で送る User-Agent を `freee-mcp/<version> (MCP Server; stdio; +url)` / `freee-mcp/<version> (MCP Server; remote; +url)` の 2 形式に分離。freee 側ログでどの transport からの呼び出しかを区別できる
- 新モジュール `src/server/user-agent.ts` (`getUserAgent()` / `setUserAgentTransportMode()`) が `src/constants.ts` の旧 `USER_AGENT` 定数を置き換える。初期化はエントリポイント (`src/index.ts`, `src/sign/index.ts`, `src/server/http-server.ts`) で 1 度だけ実行
