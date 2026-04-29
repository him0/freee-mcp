---
"freee-mcp": patch
---

canonical log line に correlation ID (`cid`) を追加

- クライアントが `X-Correlation-ID` / `X-Request-ID` ヘッダーで指定した ID を log line に伝搬
- 未指定時は UUID を生成
- 既存の `request_id` (サーバー生成) と独立して追跡可能
