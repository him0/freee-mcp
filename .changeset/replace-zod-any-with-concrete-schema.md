---
"@him0/freee-mcp": patch
---

z.any() を具体的なスキーマに置き換え

- `converter.ts` の body スキーマを `z.record(z.string(), z.unknown())` に変更
- `client-mode.ts` の body/query スキーマを `z.record(z.string(), z.unknown())` に変更
- 型安全性の向上とランタイムエラーリスクの低減
