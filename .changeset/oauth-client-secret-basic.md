---
"freee-mcp": patch
---

OAuth トークン/取消エンドポイントが HTTP Basic 認証を受理するよう修正 (RFC 6749 §2.3.1 準拠)

- `/.well-known/oauth-authorization-server` の `token_endpoint_auth_methods_supported` / `revocation_endpoint_auth_methods_supported` に `client_secret_basic` を追加
- `Authorization: Basic` ヘッダー付きトークン要求を受理。失敗時は 401 + `WWW-Authenticate: Basic ...`
- ヘッダーとリクエストボディの両方に資格情報がある場合は 400 invalid_request で拒否（RFC 6749 §2.3）
