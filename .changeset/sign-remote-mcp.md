---
"freee-mcp": minor
---

Sign Remote MCP サーバーを追加

freee サイン用の Remote MCP サーバー（`freee-sign-remote-mcp`）を追加。freee 本体と同一構成で OAuth 2.1 Authorization Server + Streamable HTTP transport + Redis トークンストア + canonical log line + OTel tracing をサポート。

- 新規エントリポイント `bin/freee-sign-remote-mcp.js`（ポート 3002）
- ninja-sign.com との OAuth 2.0 code exchange + MCP クライアント向け OAuth 2.1 AS の二層認証
- Redis 分離: freee 本体は DB 0 / Sign は DB 1、キー prefix `freee-sign-mcp:*` で名前空間分離
- rate-limit キーも `rl:sign:*` prefix で freee 本体のカウンタと衝突しないよう分離
- トークン交換失敗時のエラー本文は先頭 200 文字に truncate して PII 漏洩を防止
- Docker Compose に `freee-sign-mcp` サービス追加、`Dockerfile.sign` でビルド分離
