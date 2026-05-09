---
'freee-mcp': patch
---

freee と freee サインの MCP ツール周りのリファクタ。

- HTTP メソッド→`ToolAnnotations` のマッピングを共通ユーティリティに抽出し、freee／サイン両方のツール登録で共有
- `CliAuthHandler` インターフェースから未使用の `codeVerifier` フィールドを除去（コールバックハンドラ内で参照されておらず Sign は PKCE 非対応）
- `sign_api_delete` で body を許可している理由のコメントを補足
