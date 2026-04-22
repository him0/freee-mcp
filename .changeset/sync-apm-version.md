---
"freee-mcp": patch
---

リリース時に `skills/freee-api-skill/apm.yml` の `version` フィールドを `package.json` に自動追従させるよう publish ワークフローを拡張。既存の `.claude-plugin/plugin.json` / `marketplace.json` の同期ステップと同じコミットでまとめて push される。
