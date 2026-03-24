# freee-mcp

## 0.15.0

### Minor Changes

- [`6c128fb`](https://github.com/freee/freee-mcp/commit/6c128fb): リモート MCP サーバー機能を追加（実験的） ([#302](https://github.com/freee/freee-mcp/pull/302))

  - `freee-mcp --remote` で Express ベースの StreamableHTTP MCP サーバーを起動可能に
  - MCP OAuth 2.1 AS 統合: mcpAuthRouter による /.well-known/\*, /authorize, /token, /register, /revoke エンドポイント
  - JWT 署名・検証モジュール（jose + HS256）、requireBearerAuth による /mcp エンドポイント保護
  - Redis ベース OAuth 状態管理（セッション、認可コード、リフレッシュトークン）とマルチテナントトークン管理
  - クライアントストア（CIMD + DCR デュアルサポート）
  - freee OAuth コールバックハンドラー（/oauth/freee-callback）
  - プロダクション強化: Redis 接続復元力、セキュリティヘッダー (helmet)、CORS、レート制限、リクエストタイムアウト、構造化ログ (pino)
  - Dockerfile、compose.yaml 追加

  注意: この機能は実験的であり、今後のリリースで破壊的変更が入る可能性があります。

- [`e947547`](https://github.com/freee/freee-mcp/commit/e947547): stdio モードと HTTP リモートサーバーモードのバイナリを分離: `bin/cli.js` → `bin/freee-mcp.js` + `bin/freee-remote-mcp.js` ([#306](https://github.com/freee/freee-mcp/pull/306))

## 0.14.0

### Minor Changes

- [`89a26b5`](https://github.com/freee/freee-mcp/commit/89a26b5): freee_server_info ツールを追加。サーバーの情報（バージョンなど）を取得できるようになりました。リリース時にスキル ZIP に VERSION.md を同梱し、スキルとサーバーのバージョン比較が可能に。 ([#299](https://github.com/freee/freee-mcp/pull/299))

## 0.13.1

### Patch Changes

- [`0e194ff`](https://github.com/freee/freee-mcp/commit/0e194ff): package.json に prepare スクリプトを追加し、GitHub リポジトリから直接インストール時に自動ビルドが実行されるようにした ([#296](https://github.com/freee/freee-mcp/pull/296))
- [`a26ecfb`](https://github.com/freee/freee-mcp/commit/a26ecfb): `freee-mcp configure` 実行時のバナーにバージョン番号を表示するようにした ([#295](https://github.com/freee/freee-mcp/pull/295))

## 0.13.0

### Minor Changes

- [`c7d55a3`](https://github.com/freee/freee-mcp/commit/c7d55a3): `configure --force` オプションを追加。保存済みのログイン情報（トークン・設定ファイル）をリセットして再設定できるようにした。 ([#290](https://github.com/freee/freee-mcp/pull/290))
- [`37edff1`](https://github.com/freee/freee-mcp/commit/37edff1): 開発ツールチェーンを bun に移行: パッケージマネージャ (pnpm → bun)、バンドラ (esbuild → Bun.build)、スクリプト実行 (tsx → bun)。テストは vitest を維持。CI/CD を bun ベースに更新。 ([#283](https://github.com/freee/freee-mcp/pull/283))

### Patch Changes

- [`6ca07dc`](https://github.com/freee/freee-mcp/commit/6ca07dc): configure コマンドでポート番号に不正な値を入力した場合に、次回 configure が起動しなくなるバグを修正。入力時のバリデーション追加と、config.json の読み込み時に null 値を許容するよう修正。 ([#291](https://github.com/freee/freee-mcp/pull/291))
- [`5903d74`](https://github.com/freee/freee-mcp/commit/5903d74): TokenStore インターフェースを導入。将来のリモートデプロイ（Redis 等）に向けた内部構造の改善で、stdio モードの動作変更はありません。 ([#289](https://github.com/freee/freee-mcp/pull/289))

## 0.12.1

### Patch Changes

- [`f8873e4`](https://github.com/freee/freee-mcp/commit/f8873e4): エラーハンドリングの共通ヘルパー関数抽出とスキーマパス検証の regex キャッシュ化によるリファクタリング ([#281](https://github.com/freee/freee-mcp/pull/281))
- [`ff3e506`](https://github.com/freee/freee-mcp/commit/ff3e506): freee_api_delete が HTTP 204 No Content レスポンスで JSON パースエラーとなる問題を修正 ([#284](https://github.com/freee/freee-mcp/pull/284))
- [`83251cb`](https://github.com/freee/freee-mcp/commit/83251cb): freee-api-skill の description に具体的な操作キーワードを追加してトリガー率を改善 ([#280](https://github.com/freee/freee-mcp/pull/280))
- [`fb11574`](https://github.com/freee/freee-mcp/commit/fb11574): ESLint + Prettier を Biome に移行 ([#286](https://github.com/freee/freee-mcp/pull/286))

## 0.12.0

### Minor Changes

- [`441d1e4`](https://github.com/freee/freee-mcp/commit/441d1e4): --remote オプションを追加。リモート MCP サーバーとして動作させる際にファイルアップロード機能を無効化 ([#278](https://github.com/freee/freee-mcp/pull/278))
- [`564777b`](https://github.com/freee/freee-mcp/commit/564777b): configure コマンドで会計 API から事業所一覧を取得できない場合に、人事労務 API へフォールバックするように改善。人事労務のみ利用しているユーザーでも事業所を選択できるようになりました。 ([#277](https://github.com/freee/freee-mcp/pull/277))

### Patch Changes

- [`42255f2`](https://github.com/freee/freee-mcp/commit/42255f2): configure コマンドの事業所選択プロンプトに操作ヒント（↑↓ で選択、Enter で確定）を追加し、表現を「操作対象の事業所」に統一 ([#273](https://github.com/freee/freee-mcp/pull/273))

## 0.11.2

### Patch Changes

- [`bc135be`](https://github.com/freee/freee-mcp/commit/bc135be): API 要望の案内先を freee サポートページから freee Public API リクエストフォームに変更 ([#270](https://github.com/freee/freee-mcp/pull/270))

## 0.11.1

### Patch Changes

- [`8c964bf`](https://github.com/freee/freee-mcp/commit/8c964bf): API の機能制限に関する問い合わせを freee プロダクトのフィードバックに誘導するガイダンスを SKILL とトラブルシューティングに追加 ([#268](https://github.com/freee/freee-mcp/pull/268))

## 0.11.0

### Minor Changes

- [`32fab73`](https://github.com/freee/freee-mcp/commit/32fab73): 工数管理レシピの拡充: 全 PM エンドポイントのカバレッジ追加と、PM・HR 連携による安全な工数登録ワークフローレシピの新規追加 ([#262](https://github.com/freee/freee-mcp/pull/262))

### Patch Changes

- [`cc24426`](https://github.com/freee/freee-mcp/commit/cc24426): MCP サーバーに instructions を追加し、全ツールの description に freee-api-skill skill へのガイド参照を追加 ([#257](https://github.com/freee/freee-mcp/pull/257))
- [`ace37e0`](https://github.com/freee/freee-mcp/commit/ace37e0): PM/SM API 操作レシピを追加し company_id 指定方法を明記、取引 URL フォーマットを修正 ([#259](https://github.com/freee/freee-mcp/pull/259))
- [`cc24426`](https://github.com/freee/freee-mcp/commit/cc24426): publish workflow の skill zip ファイル名を freee-api-skill.zip に修正 ([#257](https://github.com/freee/freee-mcp/pull/257))
- [`cc24426`](https://github.com/freee/freee-mcp/commit/cc24426): サーバーバージョンをハードコードから package.json の値に同期するよう変更 ([#257](https://github.com/freee/freee-mcp/pull/257))

## 0.10.0

### Minor Changes

- [`d93e78b`](https://github.com/freee/freee-mcp/commit/d93e78b): ファイルボックスへのファイルアップロード用カスタムツール (freee_file_upload) を追加 ([#252](https://github.com/freee/freee-mcp/pull/252))

### Patch Changes

- [`78d94ed`](https://github.com/freee/freee-mcp/commit/78d94ed): Claude Desktop のスキルアップロード手順の UI パスを最新のものに更新 ([#253](https://github.com/freee/freee-mcp/pull/253))
- [`b94976d`](https://github.com/freee/freee-mcp/commit/b94976d): Fix `claude plugin add` to `claude plugin install` in README and publish workflow ([#254](https://github.com/freee/freee-mcp/pull/254))
- [`87abec4`](https://github.com/freee/freee-mcp/commit/87abec4): Windows Store (MSIX) 版 Claude Desktop の設定ファイルパスに対応。Store 版のパッケージディレクトリが存在する場合、自動的に正しいパスを使用します。 ([#247](https://github.com/freee/freee-mcp/pull/247))

## 0.9.1

### Patch Changes

- [`69622a3`](https://github.com/freee/freee-mcp/commit/69622a3): スキルドキュメントを整理し company_id の扱いを明確化 ([#242](https://github.com/freee/freee-mcp/pull/242))

## 0.9.0

### Minor Changes

- [`3fb6f22`](https://github.com/freee/freee-mcp/commit/3fb6f22): 人事労務(有給申請)・工数管理・販売 API のリファレンスドキュメントを追加し、リファレンス生成スクリプトを改善 ([#240](https://github.com/freee/freee-mcp/pull/240))

### Patch Changes

- [`dab48e3`](https://github.com/freee/freee-mcp/commit/dab48e3): ツールの説明文や使用例から invoice API の例示を deal 一覧取得の例に置き換え ([#239](https://github.com/freee/freee-mcp/pull/239))

## 0.8.1

### Patch Changes

- [`62e8483`](https://github.com/freee/freee-mcp/commit/62e8483): CSV レスポンスが JSON として処理される不整合を修正。isBinaryContentType に text/csv を追加し、CSV レスポンスが正しくファイルとして保存されるようにしました。 ([#229](https://github.com/freee/freee-mcp/pull/229))
- [`aa42fef`](https://github.com/freee/freee-mcp/commit/aa42fef): refresh_token が欠落している場合に空文字列を保存する代わりにエラーを返すようにし、再認証を促すメッセージを表示するようにした ([#230](https://github.com/freee/freee-mcp/pull/230))
- [`cb2e717`](https://github.com/freee/freee-mcp/commit/cb2e717): 環境変数の部分設定（FREEE_CLIENT_ID または FREEE_CLIENT_SECRET の片方のみ）でエラーを返すように修正 ([#231](https://github.com/freee/freee-mcp/pull/231))
- [`3a3346e`](https://github.com/freee/freee-mcp/commit/3a3346e): FREEE_CALLBACK_PORT の値検証を追加し、不正な値（NaN、範囲外）の場合はデフォルトポートにフォールバックするようにした

## 0.8.0

### Minor Changes

- [`806aa41`](https://github.com/freee/freee-mcp/commit/806aa41): 各サービスの API ベース URL を環境変数で切り替え可能にする機能を追加。FREEE*API_BASE_URL*{SERVICE}（ACCOUNTING, HR, INVOICE, PM, SM）環境変数でサービスごとの接続先を上書きできます。

### Patch Changes

- [`93222c3`](https://github.com/freee/freee-mcp/commit/93222c3): スキルの docs/ ディレクトリを recipes/ にリネーム（ユースケースサンプル集であることを明確化）
- [`d615b70`](https://github.com/freee/freee-mcp/commit/d615b70): README.md の skills インストーラー CLI の参照を `add-skill` から `skills` に更新

## 0.7.3

### Patch Changes

- [`7d84fd6`](https://github.com/freee/freee-mcp/commit/7d84fd6): 勤怠操作ガイド(hr-attendance-operations.md)を新設し、hr-operations.md を hr-employee-operations.md にリネーム・整理

## 0.7.2

### Patch Changes

- [`1ea4571`](https://github.com/freee/freee-mcp/commit/1ea4571): npm publish を Trusted Publishing (OIDC) に移行し、NPM_TOKEN シークレットを不要に

## 0.7.1

### Patch Changes

- [`3f3fe54`](https://github.com/freee/freee-mcp/commit/3f3fe54): npm パッケージ名を @him0/freee-mcp から freee-mcp に変更したことに伴い、全ファイルの参照を更新

## 0.7.0

### Minor Changes

- [`c47692c`](https://github.com/freee/freee-mcp/commit/c47692c): configure 完了後に Skill インストールの案内を表示するように改善。Claude Code には `npx add-skill` コマンド、Claude Desktop には Releases から freee-skill.zip をダウンロードする手順を案内。

### Patch Changes

- [`e91f75f`](https://github.com/freee/freee-mcp/commit/e91f75f): configure コマンドでコールバック URL を分かりやすく表示するように改善

## 0.6.7

### Patch Changes

- [`a3766e0`](https://github.com/freee/freee-mcp/commit/a3766e0): OpenAPI スキーマを最新版に更新: 会計 API に経費申請制限事項とテンプレート ID フィールド追加、人事労務 API に所定休日労働時間フィールド追加、販売 API に案件更新・受注更新エンドポイント追加

## 0.6.6

### Patch Changes

- [`d2147d3`](https://github.com/freee/freee-mcp/commit/d2147d3): freee API が name: null の事業所を返す場合に configure コマンドが失敗する問題を修正
- [`d055c47`](https://github.com/freee/freee-mcp/commit/d055c47): fix: トークン交換の失敗をブラウザに正しく表示

  トークン交換を待ってから結果に応じてブラウザに応答を返すように修正。エラー時は「認証エラー」（HTTP 500）を表示し、エラーがサイレントに無視されないようにした。

## 0.6.5

### Patch Changes

- [`988121f`](https://github.com/freee/freee-mcp/commit/988121f): Add User-Agent header to OAuth token refresh and token exchange requests

## 0.6.4

### Patch Changes

- [`74a2f5b`](https://github.com/freee/freee-mcp/commit/74a2f5b): fix: エラーメッセージ内の誤ったツール名を修正 (freee_set_company → freee_set_current_company, 旧ツール名 → freee_api_get)

## 0.6.3

### Patch Changes

- [`8b27a9f`](https://github.com/freee/freee-mcp/commit/8b27a9f): freee-agent パッケージを private に設定し、npm publish 対象から除外

## 0.6.2

### Patch Changes

- [`9ab8bc6`](https://github.com/freee/freee-mcp/commit/9ab8bc6): 0.6.2 リリース: 1/17 以降の変更を含む

  このリリースには以下の改善が含まれています（CHANGELOG 0.6.1 に既に記載済みの内容）:

  - 外部 API へのリクエストに User-Agent ヘッダーを追加
  - 外部 API レスポンスの Zod バリデーション追加
  - OAuth コールバックサーバーのエラーハンドリング改善
  - 403 エラーのハンドリング改善（レートリミット対応）
  - トークンエラーハンドリングの改善（Result 型パターン）
  - OAuth コールバックサーバーのオンデマンド起動
  - ポート使用中時のエラーメッセージ改善

## 0.6.1

### Patch Changes

- [`4b941b6`](https://github.com/freee/freee-mcp/commit/4b941b6): 外部 API へのリクエストに User-Agent ヘッダーを追加し、MCP サーバーからのリクエストであることを識別可能に
- [`a803a3e`](https://github.com/freee/freee-mcp/commit/a803a3e): Add Zod validation for external API responses to prevent silent failures from invalid response formats
- [`f79175d`](https://github.com/freee/freee-mcp/commit/f79175d): fix: improve error handling for OAuth callback server startup failures

  - Add explicit error messages when OAuth callback server fails to start
  - Log when server is already running instead of silently returning
  - Clean up server state properly on error

- [`a6b4a4c`](https://github.com/freee/freee-mcp/commit/a6b4a4c): fix: 403 エラーのハンドリングを改善し、レートリミットの可能性を示すメッセージを追加
- [`230cbf8`](https://github.com/freee/freee-mcp/commit/230cbf8): fix: improve token error handling with Result type pattern

  - Replace safeParseJson with parseJsonResponse that returns a Result type, preserving error context instead of silently returning empty object
  - Propagate token refresh errors in getValidAccessToken instead of returning null, allowing callers to understand failure reasons
  - Add comprehensive tests for parseJsonResponse and token refresh failure scenarios

- [`b2ac012`](https://github.com/freee/freee-mcp/commit/b2ac012): OAuth コールバックサーバーを MCP サーバー起動時ではなく、認証時にオンデマンドで起動するように変更
- [`d4f96c0`](https://github.com/freee/freee-mcp/commit/d4f96c0): ポートが使用中の場合にフォールバックせず、具体的な解決方法を含むエラーメッセージを表示するように変更
