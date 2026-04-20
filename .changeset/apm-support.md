---
"freee-mcp": patch
---

Microsoft の [Agent Package Manager (APM)](https://github.com/microsoft/apm) による配布に対応。`skills/freee-api-skill/` に `apm.yml` を追加し、`apm install freee/freee-mcp/skills/freee-api-skill` コマンドでスキルをインストール可能にした。APM は対象プロジェクトに存在する `.github/`、`.claude/`、`.cursor/`、`.opencode/`、`.codex/` の各ディレクトリへスキルを自動デプロイする。
