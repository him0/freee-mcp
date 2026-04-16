---
"freee-mcp": patch
---

Canonical log の `errors[]` が 4xx/5xx 応答で常に空になる hole を修正。
`res.status().json()` で応答を直接送出して Express エラーハンドラを bypass
する third-party middleware のケースで `errors[]` が空のまま emit されて
いた問題を、`flush()` の universal fallback で補完。`source: "response"`,
`error_type: "unrecorded"` の placeholder ErrorInfo を合成し、Datadog
operator が `status:error` で filter した後でも最低限のドリルダウン情報を
得られるようにした。

明示的な `recordError` が呼ばれているケースでは fallback は no-op となる
ため、既存の挙動には影響しない。
