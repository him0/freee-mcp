---
"@him0/freee-mcp": patch
---

認証処理のグローバルステートを除去

- `AuthenticationManager` クラスを導入して認証状態をカプセル化
- `CallbackServer` クラスでOAuthコールバックサーバーを管理
- 依存性注入パターンを採用してテスタビリティを向上
