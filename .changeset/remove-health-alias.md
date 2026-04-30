---
"freee-mcp": minor
---

`/health` エンドポイント (transitional alias) を削除し、liveness は `/livez`、readiness は `/readyz` のみで提供。

- BREAKING (operator-facing): アップグレード前に liveness / readiness probe を `/livez` / `/readyz` へ移行してください。`/health` への probe は 404 を返します。
