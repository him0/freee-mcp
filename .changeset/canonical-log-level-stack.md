---
"freee-mcp": minor
---

Remote モードの canonical log line を Datadog の status マッピングと整合するよう改善。

- HTTP status に応じて pino の log level を `info` / `warn` / `error` に分岐 (5xx → error, 4xx → warn, それ以外 → info)。401/403/404/422 もすべて warn に集約。
- `formatters.level` で level を文字列ラベル (`"info"` / `"warn"` / `"error"`) として出力するよう変更。Datadog の Status Remapper が追加 pipeline 設定なしで `service:freee-mcp* status:error` クエリを解釈できるようになる。
- canonical log の `msg` フィールドを HTTP status に応じた動的文字列 (`mcp request ok` / `mcp request client_error` / `mcp request server_error`) に変更。Datadog UI 上での目視判別が容易になる。
- `makeErrorChain` を `new Error` + `Error.captureStackTrace` ベースに再実装。validation / routing 由来の synthetic error にも stack trace が付与され、Datadog から呼び出し位置を直接追跡可能。プライバシー scrub は従来通り適用。
- pino otelMixin に `trace_sampled` フィールドを追加。アクティブな span がない場合も `trace_sampled: false` として明示的に出力するため、Datadog 上で「sampler が sampled と判定したログのみ」を facet で抽出できる(エクスポーター段階の drop は含まない)。
