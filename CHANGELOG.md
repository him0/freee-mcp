# @him0/freee-mcp

## 0.6.1

### Patch Changes

- a845326: Add operation guides for common API use cases
  - docs/invoice-operations.md: 請求書・見積書・納品書の操作ガイドとWeb確認URLのtips
  - docs/expense-application-operations.md: 経費申請の操作ガイド
  - docs/deal-operations.md: 取引（収入・支出）の操作ガイド
  - docs/hr-operations.md: 人事労務（従業員・勤怠）の操作ガイド
  - SKILL.md: 使用例を操作ガイドへの参照に置き換えてスリム化

- 0570cb6: fix: add Zod schema validation after JSON.parse to prevent runtime errors from invalid JSON data
- 3b07493: refactor: migrate deprecated config export to getConfig() function
- e0ecc8c: refactor: extract duplicate patterns into utility functions
  - Add createTextResponse() for MCP text response wrapper pattern
  - Add formatErrorMessage() for error message formatting
  - Refactor tools.ts and client-mode.ts to use new utilities

- 48c1582: Remove unused @types/crypto-js from devDependencies to reduce package size

## 0.6.0

### Minor Changes

- a51a21a: Add interactive MCP configuration toggle for Claude Code and Claude Desktop

  The `freee-mcp configure` command now allows you to add or remove freee-mcp from Claude Code (~/.claude.json) and Claude Desktop config files interactively.

- 1f0b6c2: refactor: rename freee_set_company to freee_set_current_company
  - Rename freee_set_company tool to freee_set_current_company for consistency with freee_get_current_company
  - Remove FREEE_DEFAULT_COMPANY_ID environment variable (use freee_set_current_company tool instead)

### Patch Changes

- 66f88df: cli.tsでdeprecatedなconfig importを削除し、FREEE_API_URL定数を使用するように修正
- ec49296: perf: per-API lazy loading for OpenAPI schemas
  - Load individual API schemas on demand instead of loading all 5 at once
  - Remove unused getAllSchemas() function
  - Memory usage reduced when using only 1-2 APIs (e.g., accounting only: 311KB instead of 482KB)

## 0.5.2

### Patch Changes

- 28a4f85: Fix bin/cli.js path resolution for minimal schemas when running via npx

## 0.5.1

### Patch Changes

- 5f1cc98: Fix: npm パッケージに minimal スキーマファイルが含まれない問題を修正

  npx で実行時に `ENOENT: no such file or directory, open '.../node_modules/@him0/openapi/minimal/accounting.json'` エラーが発生する問題を解決しました。
  - ビルド時に `openapi/minimal/*.json` を `dist/openapi/minimal/` にコピーするように修正
  - ランタイムでのパス解決を動的に行い、開発・テスト・本番環境すべてで動作するように改善

## 0.5.0

### Minor Changes

- a3368ae: Remove API mode, keep client mode only

  BREAKING CHANGE: `freee-mcp api` subcommand has been removed. The server now only operates in client mode (HTTP method sub-commands). Use `freee-mcp` or `freee-mcp client` to start the server.

## 0.4.0

### Minor Changes

- f51b81d: freee販売API（sm）のサポートを追加
  - 販売API（案件、受注）のエンドポイントが利用可能に
  - クライアントモードで `service: "sm"` を指定して利用可能
  - APIモードで `sm_get_businesses` などのツールが利用可能

- 0db3760: バイナリレスポンスをローカルファイルに保存する機能を追加
  - `makeApiRequest()`でContent-Typeヘッダーを確認し、バイナリレスポンス（PDF、画像など）を検出
  - バイナリレスポンスをローカルファイルに保存し、ファイルパス情報を返却
  - 設定ファイルで`downloadDir`を指定可能（デフォルトはシステムのtempディレクトリ）
  - 仕訳帳ダウンロード(`/api/1/journals/reports/{id}/download`)やファイルボックスダウンロード(`/api/1/receipts/{id}/download`)などのバイナリエンドポイントが正常に動作

  Fixes #19

- 945585b: MCPツールコンテキストを約4,500文字削減
  - `freee_help`, `freee_getting_started`, `freee_status` ツールを削除
  - ツール説明を簡略化してコンテキストウィンドウ使用量を削減
  - 認証関連ツールの説明を短縮

### Patch Changes

- f34a3a1: refactor: 設定ディレクトリパスを共通化し XDG Base Directory 対応を追加
- cc14e67: Consolidate duplicate error handling patterns into a shared safeParseJson utility function
- 945585b: ログ出力フォーマットを改善
  - 絵文字プレフィックスを `[info]`, `[warn]`, `[error]` 形式に変更
  - サイレントエラーサプレッション箇所にログを追加してデバッグを容易に

- 945585b: 認証処理のグローバルステートを除去
  - `AuthenticationManager` クラスを導入して認証状態をカプセル化
  - `CallbackServer` クラスでOAuthコールバックサーバーを管理
  - 依存性注入パターンを採用してテスタビリティを向上

- d308517: Centralize configuration directory path with XDG Base Directory support
  - Add `getConfigDir()` utility function to `src/constants.ts`
  - Support `XDG_CONFIG_HOME` environment variable
  - Remove duplicated path construction from `src/auth/tokens.ts` and `src/config/companies.ts`

- 85caf64: Non-null assertion を安全なパターンに置き換え
  - `src/cli.ts`の`selectCompany`関数で使用されていた非安全な`!`演算子を削除
  - `find()`の結果がundefinedの場合に適切なエラーメッセージを表示するよう修正

- 9c32e76: z.any() を具体的なスキーマに置き換え
  - `converter.ts` の body スキーマを `z.record(z.string(), z.unknown())` に変更
  - `client-mode.ts` の body/query スキーマを `z.record(z.string(), z.unknown())` に変更
  - 型安全性の向上とランタイムエラーリスクの低減
