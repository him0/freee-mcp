---
"freee-mcp": patch
---

Remote モードで期限切れアクセストークンが 500 ではなく 401 を返すように修正

- jose のトークン検証例外を `InvalidTokenError` に変換し、`WWW-Authenticate: Bearer error="invalid_token"` 付き HTTP 401 を返す
- これにより RFC 6750 準拠クライアント（Anthropic Managed Agents Vault など）の `refresh_token` 自動再発行が動作するようになる

Fixes #394
