---
"freee-mcp": patch
---

Remote モードで W3C `traceparent` を抽出して上流ゲートウェイの trace に server span を接続するようにし、SSE と JSON-RPC を区別できる観測ラベルを追加。

- middleware で `propagation.extract` を呼び、サーバー span を上流（Envoy/Istio）の child として紐付け
- span 名を `http.server.request` に変更（Datadog operation 命名に整合）
- `http.transport` (`sse` | `jsonrpc`)、`http.response.close_reason` (`completed` | `client_disconnect`) を span attribute と canonical log に追加
- 新ヒストグラム `mcp.sse.connection.duration` を追加 — SSE 接続寿命を専用バケットで観測
- propagator を `CompositePropagator([W3CTraceContext, W3CBaggage])` に拡張、resource に `deployment.environment` を付与
