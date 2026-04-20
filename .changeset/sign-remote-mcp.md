---
"freee-mcp": minor
---

Sign Remote MCP サーバーを追加

freee サイン用の Remote MCP サーバー（`freee-sign-remote-mcp`）を追加。freee 本体と同一構成で OAuth 2.1 Authorization Server + Streamable HTTP transport + Redis トークンストア + canonical log line + OTel tracing をサポート。

- 新規エントリポイント `bin/freee-sign-remote-mcp.js`（ポート 3002）
- ninja-sign.com との OAuth 2.0 code exchange + MCP クライアント向け OAuth 2.1 AS の二層認証
- Docker Compose に `freee-sign-mcp` サービス追加、`Dockerfile.sign` でビルド分離

## 共有 Valkey での分離

本番で Sign と freee 本体が共有する Valkey インスタンスの名前空間を以下で分離:

- Redis の DB (freee 本体 DB 0 / Sign DB 1) とキー prefix (`freee-sign-mcp:*`) で名前空間分離
- rate-limit キーに `rl:sign:*` prefix を付与し freee 本体とカウンタ合算を防止

本番 Valkey は parameter group で `maxmemory-policy` 未設定のため Valkey デフォルト (`noeviction`) で稼働しており、cross-DB eviction は発生しない想定。

## ローカル開発環境の調整

`compose.yaml` / `otel-collector-config.yaml` を本番挙動と整合させる:

- Redis の `maxmemory-policy` を `noeviction` に変更し、本番 Valkey と同じ挙動でローカル検証できるようにする
- OTel Collector に `memory_limiter` / `batch` processor を追加し、compose で Sign + freee が単一 collector を共有する開発環境の trace 欠落を防止（本番は Datadog Agent が Node 単位で OTLP を受ける構成のため該当しない）

## セキュリティ

- `sign_api_*` ツールの path を `/v1/` 始まりに制限し、絶対 URL 経由で Bearer トークンが外部ホストへ流出する SSRF 経路を遮断
- path traversal (`..` / `%2e%2e`) を Zod と URL 組み立て後の pathname 再検証で拒否し、ninja-sign.com 内の `/v1/` 外エンドポイントへの到達を防止
- Remote モードで認証コンテキストが取れない場合に local filesystem のトークンへ fallback する経路を禁止し、impersonation を防止
- ninja-sign.com との通信エラー本文を先頭 200 文字に truncate して PII 漏洩を防止
- `/v1/users/me` レスポンスを Zod schema で検証し、id の型不正による Redis キー衝突を防止
