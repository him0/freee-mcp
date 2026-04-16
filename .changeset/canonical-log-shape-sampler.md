---
"freee-mcp": minor
---

Remote モードの canonical log payload を整理し、tool/method 別の OTel sampler を導入。

- `CanonicalLogPayload` を `http` / `mcp` / `api` の 3 セクション構成に整理。`api_calls` / `api_call_count` を `api.calls` / `api.call_count` に移動し、tool 層と api 層で重複していた `api_method` / `api_path_pattern` / `query_keys` を `api.calls[]` 側に集約。
- `query_keys` (privacy: 値ではなくキー名のみ) を `makeApiRequest` / `makeSignApiRequest` 内部で `params` から導出し、5xx / 4xx / json_parse_error / 成功すべてのパスに付与。tool 層からは消えたので、ToolCallInfo は意図として「どの MCP ツールが呼ばれたか」だけを保持する純粋メタデータとなる。
- 新しい head-based custom sampler `RuleBasedSampler` を追加。環境変数 `OTEL_TRACES_SAMPLER_RULES` で `tool=freee_api_get:0.1,method=POST:1.0,http=GET /mcp:0.2,default=0.5` のような DSL を定義し、tool / HTTP method / inbound HTTP route 別に異なる ratio をかけられる。`OTEL_TRACES_SAMPLER_RULES` 未設定時は従来通り `OTEL_TRACES_SAMPLER_ARG` (単一 ratio) にフォールバック。DSL の構文エラーは throw せず warn ログ + skip で degrade するため、起動失敗の懸念なし。

BREAKING (Datadog ログ検索のみ): `@api_calls.*` / `@api_call_count` / `@mcp.tool_calls.api_method` / `@mcp.tool_calls.api_path_pattern` / `@mcp.tool_calls.query_keys` を facet している既存ダッシュボードは移行が必要。新しいパスは `@api.calls.*` / `@api.call_count` / `@api.calls.method` / `@api.calls.path_pattern` / `@api.calls.query_keys`。
