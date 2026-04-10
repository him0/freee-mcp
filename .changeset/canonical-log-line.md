---
"freee-mcp": minor
---

Remote モードのロギングを canonical log line パターンに再構成

1 HTTP リクエスト = 1 ログ行 = 1 trace の形式で、リクエスト単位のメタデータ
(method, status, duration, tool_calls, api_calls, errors) を 1 本の JSON ログに集約して出力します。
既存の個別イベントログ (API request completed, Tool call completed 等) は削除。

- 新規ログフィールド: request_id, source_ip, user_id, session_id, http.*, mcp.tool_calls[], api_calls[], errors[]
- エラー発生時は `Error.cause` チェーンと stack trace を `errors[].chain` に含める (serialize-error 経由)
- プライバシー保護: query 値や request body などユーザー入力はログに一切含まれない (型システムで強制)
- 400/500 エラーも canonical log で自動捕捉 (従来ログに残らなかった 400 系をカバー)
- pino.redact による defense-in-depth で stray log 経路からの漏洩も防止
