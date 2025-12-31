---
"@him0/freee-mcp": minor
---

バイナリレスポンスをローカルファイルに保存する機能を追加

- `makeApiRequest()`でContent-Typeヘッダーを確認し、バイナリレスポンス（PDF、画像など）を検出
- バイナリレスポンスをローカルファイルに保存し、ファイルパス情報を返却
- 設定ファイルで`downloadDir`を指定可能（デフォルトはシステムのtempディレクトリ）
- 仕訳帳ダウンロード(`/api/1/journals/reports/{id}/download`)やファイルボックスダウンロード(`/api/1/receipts/{id}/download`)などのバイナリエンドポイントが正常に動作

Fixes #19
