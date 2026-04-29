---
"freee-mcp": patch
---

JWT access token に `aud` claim を追加 (RFC 8707 Resource Indicators 準拠)

- `signAccessToken` / `verifyAccessToken` に audience 引数を追加
- `MCP_JWT_AUDIENCE` / `MCP_JWT_AUDIENCE_ENFORCE` env で grace period 制御 (default は enforce=false)
