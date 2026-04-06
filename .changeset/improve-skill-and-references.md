---
"freee-mcp": minor
---

freee-api-skill の改善と reference 自動生成の修正

- SKILL.md にワークフローの WHY 補足と概要の価値提案追加、description の undertrigger 防止
- レシピにメモタグ「freee-mcp」の付与ガイドを追加（freee-mcp-tag.md を新規作成）
- 取引・経費申請・請求書などの作成例に tag_ids を追加
- レシピの重複内容を削減し reference への参照に置き換え
- レシピのマスタIDハードコードを事前取得の指示に置き換え
- reference 自動生成の改善（空の概要フォールバック、壊れたリンク除去、description の改行改善）
