---
"freee-mcp": patch
---

TokenContextにcompanyIdキャッシュを追加しRedis重複呼び出しを最適化

- resolveCompanyId() ヘルパーでcompanyIdをTokenContextにキャッシュ
- 同一リクエスト内での重複Redis GET呼び出しを排除
- アクセスログからcompany_id Redis参照を削除（ツールログで既に記録済み）
