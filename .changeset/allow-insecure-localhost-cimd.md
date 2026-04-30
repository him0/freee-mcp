---
"freee-mcp": patch
---

ローカル開発用途で loopback の CIMD URL を受け入れるオプションを追加。

- dev/test 環境かつ Kubernetes Pod 外でのみ、`http://localhost` / `127.0.0.1` / `[::1]` の `client_id` を許可
- 同条件で loopback の `https://` self-signed cert も受け入れ（mkcert 等のローカル検証向け）
- それ以外（production / NODE_ENV 未設定 / Kubernetes Pod 内 / プライベート IP / 公開 HTTP）は引き続き拒否
- 運用注意: Kubernetes 以外で本番運用する場合は `NODE_ENV=production` を必ず明示すること
