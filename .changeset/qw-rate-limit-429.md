---
"freee-mcp": patch
---

freee API の 429 (rate limit) レスポンスを明示ハンドリング

- makeApiRequest に 429 専用分岐を追加し canonical log line に `error_type: 'rate_limit'` を記録
- Retry-After をエラーメッセージに含める
- 自動 retry/backoff は別 PR で検討
