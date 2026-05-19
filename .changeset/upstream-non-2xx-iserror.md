---
'freee-mcp': patch
---

上流 freee API への呼び出しが 2xx 以外で返ってきたとき、MCP ツール応答に `isError: true` を立てるようにしました。

- MCP 仕様 (Tools - Error Handling) ではツール実行に伴う失敗は `CallToolResult.isError` で報告することが推奨されています
- これまでは 4xx/5xx もテキスト応答のみで返していたため、LLM やクライアントが成功応答と区別できませんでした
- 対象: 4xx/5xx 応答に加え、ネットワークエラー・タイムアウト等 `makeApiRequest` から例外が投げられる全ケース
- canonical log の `api_calls[].status_code` / `errors[]` 側は変更ありません
