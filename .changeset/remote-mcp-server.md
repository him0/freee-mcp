---
"freee-mcp": minor
---

リモート MCP サーバー機能を追加（実験的）

- `freee-mcp --remote` で Express ベースの StreamableHTTP MCP サーバーを起動可能に
- MCP OAuth 2.1 AS 統合: mcpAuthRouter による /.well-known/*, /authorize, /token, /register, /revoke エンドポイント
- JWT 署名・検証モジュール（jose + HS256）、requireBearerAuth による /mcp エンドポイント保護
- Redis ベース OAuth 状態管理（セッション、認可コード、リフレッシュトークン）とマルチテナントトークン管理
- クライアントストア（CIMD + DCR デュアルサポート）
- freee OAuth コールバックハンドラー（/oauth/freee-callback）
- プロダクション強化: Redis接続復元力、セキュリティヘッダー (helmet)、CORS、レート制限、リクエストタイムアウト、構造化ログ (pino)
- Dockerfile、compose.yaml 追加

注意: この機能は実験的であり、今後のリリースで破壊的変更が入る可能性があります。
