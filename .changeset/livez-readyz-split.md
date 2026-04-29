---
"freee-mcp": minor
---

ヘルスチェックエンドポイントを `/livez` (liveness) と `/readyz` (readiness) に分離

- `/livez`: プロセス生存のみを確認。外部依存 (Redis 等) をチェックしないため、Redis の一時的な不調で Pod が再起動されない
- `/readyz`: Redis 到達性を確認し、未到達時は 503 を返してトラフィックを切り離す
- `/health`: 後方互換のため残し、`/readyz` と同じ挙動
