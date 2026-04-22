---
"freee-mcp": minor
---

`freee_file_upload` ツールに `company_id` 必須引数を追加

通常の `freee_api_*` ツール (`src/api/client.ts` の `makeApiRequest`) と同様に、呼び出し側が渡した `company_id` とコンテキストで解決された事業所 ID を文字列比較で検証し、不一致時はエラーを返すようにした。誤った事業所へのファイルアップロードを防ぐガードレール。

- MCP ツール `freee_file_upload` の inputSchema に `company_id` を必須で追加 (`string | number`)
- `uploadReceipt()` の 2 番目の引数として `requestedCompanyId` を追加
- 認証チェック直後にバリデーションを実施し、通常ツールと同一の文言でエラーを throw
