---
"freee-mcp": patch
---

`src/server/client-auth-basic.ts` の `reject401` / `reject400` ヘルパーシグネチャを整理 (PR #418 のフォローアップ整理、外部動作変更なし)

- `errorTypeForLog` 引数を削除: ヘルパー本体でハードコードする `error` フィールド (`invalid_client` / `invalid_request`) と常に同値だったため、構造的に重複していた
- `reject401` の `errorName` をデフォルト値 `'InvalidClientError'` に変更 (動的値が必要な catch ブロックのみ明示指定)
- `reject400` の `errorName` (`'InvalidRequestError'`) は固定でハードコード化
- `req.body` への重複キャストを named local `reqBody` に集約

レスポンスコード / `WWW-Authenticate` ヘッダー / JSON 本文 / canonical log の shape はすべて PR #418 マージ直後と同一。テストファイルの修正なし、669 件すべて green。
