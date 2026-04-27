---
"freee-mcp": patch
---

ローカル開発用途の CIMD 受け入れオプションを追加。

`NODE_ENV=development` または `NODE_ENV=test` のとき、かつ Kubernetes Pod 内で動作していない場合に限り、`http://localhost` / `http://127.0.0.1` / `http://[::1]` の `client_id`（CIMD URL）を受け入れる。判定は環境から自動的に行うため、運用者が管理する環境変数は存在せず、設定誤りによる本番環境での誤有効化が原理的に発生しない。

それ以外の環境（`NODE_ENV` 未設定 / `production` / 任意の値 / Kubernetes Pod 内）は自動的に拒否される。`KUBERNETES_SERVICE_HOST` は kubelet が全てのコンテナに自動注入するため、運用者の設定漏れに依存しない信頼できる本番識別シグナルとして利用している。

プライベート IP 範囲（10.x / 172.16–31.x / 192.168.x / *.local など）や公開 HTTP ホストは引き続き SSRF 保護のため拒否する。
