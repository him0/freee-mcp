---
"freee-mcp": patch
---

freee API のベースURL（本番: `https://api.freee.co.jp`）を環境変数 `FREEE_API_BASE_URL` で上書きできるように対応。環境変数が未設定の場合は従来どおりハードコーディングされた値にフォールバックする。OAuth のコールバック内で利用される API URL もこの環境変数を参照するため、ローカル環境に向けて Remote MCP サーバーを立ち上げる際の動作確認が容易になる。
