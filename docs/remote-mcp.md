# HTTP Server Mode (--remote)

> この文書は開発者向けの内部ドキュメントです。リモートモードは開発中の機能であり、API や動作は今後変更される可能性があります。

`freee-mcp --remote` で Express ベースの StreamableHTTP MCP サーバーを起動する。

## 環境変数

| 変数 | 必須 | デフォルト | 説明 |
|------|------|-----------|------|
| FREEE_CLIENT_ID | Yes | - | freee アプリ クライアントID |
| FREEE_CLIENT_SECRET | Yes | - | freee アプリ クライアントシークレット |
| API_BEARER_TOKEN | Yes | - | MCP エンドポイント認証トークン |
| REDIS_URL | No | redis://localhost:6379 | Redis 接続URL |
| PORT | No | 3000 | HTTPサーバーポート |


## 開発環境セットアップ

```bash
# Redis 起動
docker compose up -d

# サーバー起動（ホットリロード付き）
FREEE_CLIENT_ID=xxx FREEE_CLIENT_SECRET=xxx API_BEARER_TOKEN=test-token bun run dev:remote
# or: FREEE_CLIENT_ID=xxx FREEE_CLIENT_SECRET=xxx API_BEARER_TOKEN=test-token bun run src/index.ts --remote
```

## エンドポイント

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | /health | 不要 | ヘルスチェック（Redis接続状態含む） |
| POST | /mcp | Bearer | MCP リクエスト |
| GET | /mcp | Bearer | SSE ストリーミング |
| DELETE | /mcp | Bearer | セッション終了 |

## 動作確認

```bash
# ヘルスチェック
curl http://localhost:3000/health

# MCP initialize (Accept ヘッダ必須)
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}'

# 認証エラー確認
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/mcp  # 401
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/mcp -H "Authorization: Bearer wrong"  # 403
```

## アーキテクチャ

```
Client --Bearer token--> Express (authMiddleware)
  --> StreamableHTTPServerTransport (session per initialize)
    --> McpServer (remote=true, ファイルアップロード無効)
      --> RedisTokenStore (freee token/company per userId)
        --> Redis
```

セッション管理: 30分非アクティブタイムアウト、5分間隔クリーンアップ。
SIGTERM/SIGINT でグレースフルシャットダウン。

## 認証の変遷

現在（PR 2）: `API_BEARER_TOKEN` 環境変数による固定 Bearer トークン認証。
全クライアントが同一トークンを使用し、userId は `"remote-default"` 固定。開発/テスト用途の暫定実装。

PR 3 以降: MCP OAuth 2.1 AS に完全移行。
各ユーザーが OAuth フローで個別 JWT を取得 → Bearer JWT で /mcp にアクセス。
userId は JWT の sub クレーム（freee ユーザーID）から取得。`API_BEARER_TOKEN` は廃止。

## freee 開発者コンソール設定

PR 2 時点: 変更不要。既存の `freee-mcp configure` で使用している client_id/secret をそのまま環境変数に設定可能。

PR 3 で必要になる設定:

| 項目 | 設定値 |
|------|--------|
| コールバックURL | `https://<your-server>/oauth/freee-callback` |
| アプリ種別 | ウェブアプリケーション |
| 権限 (scope) | read write |

## 制限事項（PR 3 で対応予定）

- userId は固定値 "remote-default"（JWT sub クレームで置換予定）
- Redis にトークンがない状態では freee API 呼び出しは不可（MCP プロトコルレベルの確認のみ可能）
- freee_authenticate ツールはリモートモードでローカルコールバックを起動するため未対応
- HTTPS はリバースプロキシで対応する前提
