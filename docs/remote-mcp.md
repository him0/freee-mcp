# HTTP Server Mode (--remote)

> この文書は開発者向けの内部ドキュメントです。リモートモードは開発中の機能であり、API や動作は今後変更される可能性があります。

`freee-mcp --remote` で Express ベースの StreamableHTTP MCP サーバーを起動する。
MCP OAuth 2.1 AS として動作し、freee OAuth を内部的にラップして AI クライアント（Claude.ai / ChatGPT）に対して標準的な MCP 認証フローを提供する。

## 環境変数

| 変数 | 必須 | デフォルト | 説明 |
|------|------|-----------|------|
| ISSUER_URL | Yes | - | パブリックURL（例: `https://mcp.example.com`） |
| JWT_SECRET | Yes | - | HMAC-SHA256 署名キー（32文字以上） |
| FREEE_CLIENT_ID | Yes | - | freee アプリ クライアントID |
| FREEE_CLIENT_SECRET | Yes | - | freee アプリ クライアントシークレット |
| REDIS_URL | No | redis://localhost:6379 | Redis 接続URL |
| PORT | No | 3000 | HTTPサーバーポート |
| FREEE_AUTHORIZATION_ENDPOINT | No | (freee default) | freee 認可エンドポイント |
| FREEE_TOKEN_ENDPOINT | No | (freee default) | freee トークンエンドポイント |
| FREEE_SCOPE | No | read write | freee OAuth スコープ |

## 開発環境セットアップ

```bash
# Redis 起動
docker compose up -d

# JWT シークレット生成
export JWT_SECRET=$(openssl rand -hex 32)

# サーバー起動
ISSUER_URL=http://localhost:3000 \
JWT_SECRET=$JWT_SECRET \
FREEE_CLIENT_ID=xxx \
FREEE_CLIENT_SECRET=xxx \
bun run src/index.ts --remote
```

## エンドポイント

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | /health | 不要 | ヘルスチェック（Redis接続状態含む） |
| GET | /.well-known/oauth-protected-resource | 不要 | OAuth Protected Resource メタデータ |
| GET | /.well-known/oauth-authorization-server | 不要 | OAuth AS メタデータ |
| GET | /authorize | 不要 | OAuth 認可（freee ログインへリダイレクト） |
| POST | /token | 不要 | OAuth トークン交換（JWT 発行） |
| POST | /register | 不要 | Dynamic Client Registration (DCR) |
| POST | /revoke | 不要 | トークン失効 |
| GET | /oauth/freee-callback | 不要 | freee OAuth コールバック |
| POST | /mcp | Bearer JWT | MCP リクエスト |
| GET | /mcp | Bearer JWT | SSE ストリーミング |
| DELETE | /mcp | Bearer JWT | セッション終了 |

## 動作確認

```bash
# ヘルスチェック
curl http://localhost:3000/health

# OAuth メタデータ確認
curl http://localhost:3000/.well-known/oauth-protected-resource
curl http://localhost:3000/.well-known/oauth-authorization-server

# 認証エラー確認
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/mcp  # 401
```

フル OAuth フローは AI クライアント（Claude.ai / ChatGPT）経由で実行する。
手動テストの場合は、/authorize から freee ログイン → コールバック → /token でJWT取得 → Bearer JWT で /mcp アクセス。

## アーキテクチャ

```
AI Client
  --> /.well-known/* (OAuth discovery)
  --> /authorize (MCP params を Redis 保存 → freee ログインへ 302)
  --> /oauth/freee-callback (freee code → token 交換 → userId 取得 → MCP auth code 発行)
  --> /token (auth code → JWT 発行)
  --> /mcp (Bearer JWT → requireBearerAuth → verifyAccessToken)
        --> StreamableHTTPServerTransport (session per initialize)
          --> McpServer (remote=true, ファイルアップロード無効)
            --> AuthInfo.extra { userId, tokenStore }
              --> RedisTokenStore (freee token/company per userId)
                --> Redis
```

セッション管理: 30分非アクティブタイムアウト、5分間隔クリーンアップ。
SIGTERM/SIGINT でグレースフルシャットダウン。

## 認証方式

MCP OAuth 2.1 AS として動作。freee OAuth をラップし、AI クライアントに対して標準 MCP 認証フローを提供する。

OAuth フロー:
1. AI クライアントが /authorize にアクセス
2. MCP パラメータ（code_challenge, redirect_uri, state）を Redis に保存
3. freee 用 PKCE を別途生成し、freee ログインページへリダイレクト
4. ユーザーが freee で認証後、/oauth/freee-callback にリダイレクト
5. freee コードをトークンに交換し、/api/1/users/me でユーザーID取得
6. freee トークンを Redis にユーザー別保存
7. MCP auth code を発行し、AI クライアントの redirect_uri にリダイレクト
8. AI クライアントが /token で auth code を JWT に交換
9. Bearer JWT で /mcp にアクセス（verifyAccessToken で検証）

各ユーザーのfreeeトークンは JWT の sub クレーム（freee ユーザーID）をキーとして Redis に保存。
マルチテナント対応により、複数ユーザーが同時利用可能。

## freee 開発者コンソール設定

| 項目 | 設定値 |
|------|--------|
| コールバックURL | `https://<your-server>/oauth/freee-callback` |
| アプリ種別 | ウェブアプリケーション |
| 権限 (scope) | read write |

## 制限事項

- Dockerfile 未作成（Phase 4 で対応予定）
- HTTPS はリバースプロキシで対応する前提
- freee_authenticate ツールはリモートモードでは「OAuth認証済み」メッセージを返す（MCP OAuth で認証済みのため）
- freee_file_upload はリモートモードで無効（ローカルファイルシステムにアクセス不可）

## クライアント互換性

| クライアント | client_id | DCR | redirect_uri |
|-------------|-----------|-----|-------------|
| Claude.ai | CIMD URL | 不要 | `https://claude.ai/api/mcp/auth_callback` |
| ChatGPT | DCR 登録値 | 必要 | `https://chatgpt.com/connector/oauth/{id}` |

CIMD (Client Information Metadata Document): Claude.ai は client_id として HTTPS URL を送信。
サーバーは URL からメタデータを取得してクライアント情報を構築する（SSRF 防止付き）。
