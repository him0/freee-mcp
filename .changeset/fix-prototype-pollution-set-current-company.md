---
'freee-mcp': patch
---

freee_set_current_company の company_id にプロトタイプ汚染を引き起こす予約キーを渡せる脆弱性を修正

- `__proto__` / `constructor` / `prototype` を弾くガードを追加
- companies レコードのルックアップを `Object.hasOwn` ベースに変更
- MCP ツールの入力スキーマに数字のみを受け付ける regex 検証を追加
