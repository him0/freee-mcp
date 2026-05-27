---
"freee-mcp": minor
---

vendor 経由のトラフィック (claude.ai 等) で OAuth/MCP エンドポイントの rate limit が誤って発火する問題を修正 (#439)。

- `/register`: クライアント metadata から fingerprint を計算し、同一 fingerprint の重複登録は既存の client_id を返す (RFC 7591 §3.2.1)。rate limit カウンタも消費しない
- `/authorize`: PKCE `state` ベースの制限と緩い IP ベースの安全網を併用し、同一 vendor IP から並行する異なるユーザーセッションを分離
- `/mcp`: 認証前は緩い IP ベースの安全網、認証後は検証済み user ID ベースの制限に分離し、署名検証前の JWT payload は rate limit key に使わない
- SDK 内蔵の `/register` rate limit (1h/20) を無効化し、freee-mcp 側の Redis ベースの limit に一本化
