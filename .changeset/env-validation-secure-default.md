---
"freee-mcp": minor
---

serve モードの環境変数バリデーションを zod ベースで強化し、`RATE_LIMIT_ENABLED` をデフォルト `true`（secure-by-default）に変更

- BREAKING: 明示的に `RATE_LIMIT_ENABLED=false` / `SIGN_RATE_LIMIT_ENABLED=false` を設定しない限り rate limit が有効化される
- 必須環境変数 (ISSUER_URL / JWT_SECRET / FREEE_CLIENT_ID / FREEE_CLIENT_SECRET 等) が未設定・URL 形式不正・LOG_LEVEL 不正値の場合に起動時失敗
- 起動時に解決済み設定をログ出力（jwtSecret / clientSecret はマスク）
