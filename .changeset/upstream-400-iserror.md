---
'freee-mcp': patch
---

freee API が 400 を返したときの MCP ツール応答に `isError: true` を立てるようにしました。

- MCP 仕様 (Tools - Error Handling) ではツール実行に伴う失敗は `CallToolResult.isError` で報告することが推奨されています
- これまでは 400 もテキスト応答のみで返していたため、LLM やクライアントが成功応答と区別できませんでした
- canonical log の `api_calls[].status_code` / `errors[]` 側は変更ありません
