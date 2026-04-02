---
"freee-mcp": patch
---

Ctrl+C終了時にioredisの"Connection is closed"エラーが出る問題を修正。

- シャットダウン関数に再入防止フラグを追加し、SIGINTが複数回発火しても二重実行を防止
- シャットダウン順序を変更：HTTPサーバーを先にクローズしてから Redis をクローズすることで、処理中リクエストが閉じた接続を参照しないよう対応
- `closeRedisClient` に quit 失敗時の disconnect フォールバックを追加
