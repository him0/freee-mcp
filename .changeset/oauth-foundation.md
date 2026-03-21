---
"freee-mcp": patch
---

MCP OAuth 2.1 AS 基盤クラスを追加（PR 3b での統合に向けた準備）

- JWT 署名・検証モジュール（jose + HS256）
- Redis ベース OAuth 状態管理（セッション、認可コード、リフレッシュトークン）
- クライアントストア（CIMD + DCR デュアルサポート）
- freee OAuth コールバックハンドラー
- OAuthServerProvider 実装（FreeeOAuthProvider）
