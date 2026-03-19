---
"freee-mcp": patch
---

configure コマンドでポート番号に不正な値を入力した場合に、次回 configure が起動しなくなるバグを修正。入力時のバリデーション追加と、config.json の読み込み時に null 値を許容するよう修正。
