---
"@him0/freee-mcp": patch
---

Non-null assertion を安全なパターンに置き換え

- `src/cli.ts`の`selectCompany`関数で使用されていた非安全な`!`演算子を削除
- `find()`の結果がundefinedの場合に適切なエラーメッセージを表示するよう修正
