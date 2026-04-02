---
"freee-mcp": minor
---

ロガーの強化: pino-pretty対応、APIリクエスト・MCPツール実行の構造化ログを追加

- ローカル開発環境ではpino-prettyで人間が読みやすい出力、本番環境ではJSON出力に自動切替
- APIリクエスト成功時にmethod/path/status/duration_ms/user_id/company_idをログ出力
- MCPツール呼び出し時にtool名/service/path/duration_ms/user_idをログ出力
- エラー時のHTTPステータスコードとエラー種別(error_type)を構造化ログに追加
- sanitizePath()によりクエリパラメータ値・ユーザー入力データはログに記録しない
