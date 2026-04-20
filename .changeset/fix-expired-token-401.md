---
"freee-mcp": patch
---

Remote モードで期限切れアクセストークンが 500 ではなく 401 を返すように修正

Remote モード (`freee-remote-mcp`) の OAuth プロバイダーが jose 由来の `JWTExpired` などのトークン検証例外を `InvalidTokenError` に変換せずそのまま伝播していたため、MCP SDK の `bearerAuth` ミドルウェアが既定フォールバックに落ちて HTTP 500 (`server_error`) を返していた。これにより Anthropic Managed Agents の Vault など RFC 6750 準拠のクライアントが 401 を契機に `refresh_token` を使って自動再発行する流れが発火せず、1 時間ごとにユーザー側の再認証が必要になっていた。

- `src/server/oauth-provider.ts` の `verifyAccessToken` で `JWTExpired` / `JWSSignatureVerificationFailed` / `JWTInvalid` / `JWSInvalid` / `JWTClaimValidationFailed` を `InvalidTokenError` に変換して re-throw する。結果として `WWW-Authenticate: Bearer error="invalid_token"` ヘッダ付きの HTTP 401 が返るようになる
- 変換時に canonical log へ `errors[{ source: "auth", status_code: 401, error_type: "invalid_token", chain: [...] }]` を明示的に記録し、PR #392 で導入された `UnrecordedError` safety net に真因 (`JWTExpired` 等) が埋もれないようにする
- `src/server/oauth-provider.test.ts` に期限切れ / 署名不正 / 形式不正 / issuer 不正の 4 ケースと、期限切れ時に `RequestRecorder` へ記録されることを検証するテストを追加

Fixes #394
