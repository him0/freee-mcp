# @him0/freee-mcp

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
