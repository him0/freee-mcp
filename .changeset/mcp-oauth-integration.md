---
"freee-mcp": minor
---

MCP OAuth 2.1 AS 統合: 基盤クラスを HTTP サーバーに接続し、OAuth プロトコルで認証

- API_BEARER_TOKEN による静的認証を MCP OAuth 2.1 プロトコルに置換
- mcpAuthRouter による /.well-known/*, /authorize, /token, /register, /revoke エンドポイント追加
- requireBearerAuth によるJWT検証で /mcp エンドポイントを保護
- freee OAuth コールバック（/oauth/freee-callback）を統合
- RemoteServerConfig: bearerToken 削除、issuerUrl / jwtSecret 追加
