---
"freee-mcp": minor
---

Sign Remote MCP サーバーを追加

freee サイン用の Remote MCP サーバー（`freee-sign-remote-mcp`）を追加。freee 本体と同一構成で OAuth 2.1 Authorization Server + Streamable HTTP transport + Redis トークンストア + canonical log line + OTel tracing をサポート。

- 新規エントリポイント `bin/freee-sign-remote-mcp.js`（ポート 3002）
- ninja-sign.com との OAuth 2.0 code exchange + MCP クライアント向け OAuth 2.1 AS の二層認証
- Docker Compose に `freee-sign-mcp` サービス追加、`Dockerfile.sign` でビルド分離

## freee 本体との分離

共有インフラを Sign と freee 本体が使う構成のため、片方が他方に波及しないよう以下で分離:

- Redis の DB (freee 本体 DB 0 / Sign DB 1) とキー prefix (`freee-sign-mcp:*`) で名前空間分離
- rate-limit キーに `rl:sign:*` prefix を付与し freee 本体とカウンタ合算を防止
- Redis の `maxmemory-policy` を `noeviction` に変更し、全 DB 合算の LRU eviction で freee 本体の refresh token / DCR client が巻き添え削除される事態を防止
- OTel Collector に `memory_limiter` / `batch` processor を追加し、Sign のバーストで freee 本体 trace がサイレント drop する事態を防止

## セキュリティ

- `sign_api_*` ツールの path を `/v1/` 始まりに制限し、絶対 URL 経由で Bearer トークンが外部ホストへ流出する SSRF 経路を遮断
- Remote モードで認証コンテキストが取れない場合に local filesystem のトークンへ fallback する経路を禁止し、impersonation を防止
- ninja-sign.com との通信エラー本文を先頭 200 文字に truncate して PII 漏洩を防止
- `/v1/users/me` レスポンスを Zod schema で検証し、id の型不正による Redis キー衝突を防止
