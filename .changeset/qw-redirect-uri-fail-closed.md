---
"freee-mcp": patch
---

OAuth callback の redirect_uri 検証を fail-closed に変更 (深層防御)

- clientStore.getClient 等の例外発生時に 400 を返すよう変更
- これまでは catch 節で warn ログのみで処理継続 (fail-open) だった
