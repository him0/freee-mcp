---
"freee-mcp": patch
---

ローカル開発用途の CIMD 受け入れオプションを追加。

環境変数 `FREEE_MCP_ALLOW_INSECURE_LOCALHOST_CIMD=true` を設定したときに限り、`http://localhost` / `http://127.0.0.1` / `http://[::1]` の `client_id`（CIMD URL）も受け入れる。既定値は無効。`NODE_ENV=production` 下では起動時にエラーとする。

プライベート IP 範囲（10.x / 172.16–31.x / 192.168.x / *.local など）や公開 HTTP ホストは引き続き SSRF 保護のため拒否する。
