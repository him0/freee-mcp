---
"freee-mcp": patch
---

serve モードの HTTP server タイムアウトを明示設定。long-lived な MCP Streamable-HTTP / SSE 接続に合わせて Node.js の `requestTimeout` / `headersTimeout` / `keepAliveTimeout` をデフォルト 10m / 65s / 60s に固定し、それぞれ `HTTP_REQUEST_TIMEOUT_MS` / `HTTP_HEADERS_TIMEOUT_MS` / `HTTP_KEEP_ALIVE_TIMEOUT_MS` 環境変数で上書き可能にした。Node デフォルト (5m / 60s / 5s) では中間プロキシのストリームアイドルタイムアウトと衝突して MCP セッション中の長時間接続が切れるケースがあったため。
