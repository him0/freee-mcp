---
"freee-mcp": patch
---

CLI 認証コールバックページの reflected XSS を修正

- `error_description` 等の OAuth エラーパラメータを HTML エスケープしてから埋め込むように変更
- 127.0.0.1 上で返す HTML レスポンスに CSP / `X-Content-Type-Options` / `Referrer-Policy` を付与
