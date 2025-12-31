---
"@him0/freee-mcp": patch
---

Fix: npm パッケージに minimal スキーマファイルが含まれない問題を修正

npx で実行時に `ENOENT: no such file or directory, open '.../node_modules/@him0/openapi/minimal/accounting.json'` エラーが発生する問題を解決しました。

- ビルド時に `openapi/minimal/*.json` を `dist/openapi/minimal/` にコピーするように修正
- ランタイムでのパス解決を動的に行い、開発・テスト・本番環境すべてで動作するように改善
