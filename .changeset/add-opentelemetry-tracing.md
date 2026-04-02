---
"freee-mcp": minor
---

OpenTelemetry分散トレーシングサポートを追加

- OTEL_ENABLED=true で有効化、globalThis.fetch パッチで自動計測
- Express リクエスト/Redis 操作の span を生成
- W3C traceparent ヘッダー伝搬
- ParentBasedSampler によるサンプリングレート制御
- Jaeger を docker compose で利用可能
