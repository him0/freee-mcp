---
"freee-mcp": patch
---

Sign Remote MCP の Redis 既定 DB 番号指定を撤廃

セキュリティ相談会 (2026-04-20) / Slack スレッドでの SRE 合意に基づき、freee-mcp 本体と Sign Remote MCP で共有する Valkey (ElastiCache) の分離方式を「DB 番号による論理分離」から「`freee-sign-mcp:*` prefix + Valkey RBAC (IAM Role ACL)」に変更する方針と決定した。DB 分離は将来の cluster mode 移行を阻害するため採用しない。

本 PR は当該方針に合わせて、アプリ側のデフォルト値から DB 番号を外す対応:

- `compose.yaml`: `SIGN_REDIS_URL: redis://redis:6379/1` → `redis://redis:6379`
- `src/sign/config.ts`: `SIGN_REDIS_URL` 未設定時の既定値を `redis://localhost:6379/1` → `redis://localhost:6379`
- `src/sign/config.test.ts`: 既定値 assertion を追従
