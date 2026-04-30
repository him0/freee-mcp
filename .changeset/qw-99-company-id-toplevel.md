---
"freee-mcp": patch
---

canonical log line の top-level に `company_id` を追加。`tools/list` のように外向き API call を発火しないリクエストでも company コンテキストが残るようになり、Datadog の `@company_id:<id>` facet で 1 ログ行から検索可能になる。
