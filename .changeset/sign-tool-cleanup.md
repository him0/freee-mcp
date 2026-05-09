---
'freee-mcp': patch
---

サイン MCP のコード品質改善。

- `getSignApiToolAnnotations` を else-if 連結に整理し、PATCH/POST が destructive かつ非冪等である前提を明示
- `CliAuthHandler` インターフェースから未使用の `codeVerifier` フィールドを除去（コールバックハンドラ内で参照されておらず Sign は PKCE 非対応）
- `sign_api_delete` 用ツールに body を許可している理由のコメントを補足
