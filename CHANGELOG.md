# freee-mcp

## 0.11.0

### Minor Changes

- 32fab73: 工数管理レシピの拡充: 全PMエンドポイントのカバレッジ追加と、PM・HR連携による安全な工数登録ワークフローレシピの新規追加

### Patch Changes

- cc24426: MCPサーバーにinstructionsを追加し、全ツールのdescriptionにfreee-api-skill skillへのガイド参照を追加
- ace37e0: PM/SM API操作レシピを追加しcompany_id指定方法を明記、取引URLフォーマットを修正
- cc24426: publish workflowのskill zipファイル名をfreee-api-skill.zipに修正
- cc24426: サーバーバージョンをハードコードからpackage.jsonの値に同期するよう変更

## 0.10.0

### Minor Changes

- d93e78b: ファイルボックスへのファイルアップロード用カスタムツール (freee_file_upload) を追加

### Patch Changes

- 78d94ed: Claude Desktop のスキルアップロード手順の UI パスを最新のものに更新
- b94976d: Fix `claude plugin add` to `claude plugin install` in README and publish workflow
- 87abec4: Windows Store (MSIX) 版 Claude Desktop の設定ファイルパスに対応。Store 版のパッケージディレクトリが存在する場合、自動的に正しいパスを使用します。

## 0.9.1

### Patch Changes

- 69622a3: スキルドキュメントを整理し company_id の扱いを明確化

## 0.9.0

### Minor Changes

- 3fb6f22: 人事労務(有給申請)・工数管理・販売 API のリファレンスドキュメントを追加し、リファレンス生成スクリプトを改善

### Patch Changes

- dab48e3: ツールの説明文や使用例から invoice API の例示を deal 一覧取得の例に置き換え

## 0.8.1

### Patch Changes

- 62e8483: CSVレスポンスがJSONとして処理される不整合を修正。isBinaryContentType に text/csv を追加し、CSVレスポンスが正しくファイルとして保存されるようにしました。
- aa42fef: refresh_token が欠落している場合に空文字列を保存する代わりにエラーを返すようにし、再認証を促すメッセージを表示するようにした
- cb2e717: 環境変数の部分設定（FREEE_CLIENT_ID または FREEE_CLIENT_SECRET の片方のみ）でエラーを返すように修正
- 3a3346e: FREEE_CALLBACK_PORT の値検証を追加し、不正な値（NaN、範囲外）の場合はデフォルトポートにフォールバックするようにした

## 0.8.0

### Minor Changes

- 806aa41: 各サービスの API ベース URL を環境変数で切り替え可能にする機能を追加。FREEE*API_BASE_URL*{SERVICE}（ACCOUNTING, HR, INVOICE, PM, SM）環境変数でサービスごとの接続先を上書きできます。

### Patch Changes

- 93222c3: スキルの docs/ ディレクトリを recipes/ にリネーム（ユースケースサンプル集であることを明確化）
- d615b70: README.md の skills インストーラー CLI の参照を `add-skill` から `skills` に更新

## 0.7.3

### Patch Changes

- 7d84fd6: 勤怠操作ガイド(hr-attendance-operations.md)を新設し、hr-operations.mdをhr-employee-operations.mdにリネーム・整理

## 0.7.2

### Patch Changes

- 1ea4571: npm publish を Trusted Publishing (OIDC) に移行し、NPM_TOKEN シークレットを不要に

## 0.7.1

### Patch Changes

- 3f3fe54: npm パッケージ名を @him0/freee-mcp から freee-mcp に変更したことに伴い、全ファイルの参照を更新

## 0.7.0

### Minor Changes

- c47692c: configure 完了後に Skill インストールの案内を表示するように改善。Claude Code には `npx add-skill` コマンド、Claude Desktop には Releases から freee-skill.zip をダウンロードする手順を案内。

### Patch Changes

- e91f75f: configure コマンドでコールバックURLを分かりやすく表示するように改善

## 0.6.7

### Patch Changes

- a3766e0: OpenAPIスキーマを最新版に更新: 会計APIに経費申請制限事項とテンプレートIDフィールド追加、人事労務APIに所定休日労働時間フィールド追加、販売APIに案件更新・受注更新エンドポイント追加

## 0.6.6

### Patch Changes

- d2147d3: freee API が name: null の事業所を返す場合に configure コマンドが失敗する問題を修正
- d055c47: fix: トークン交換の失敗をブラウザに正しく表示

  トークン交換を待ってから結果に応じてブラウザに応答を返すように修正。エラー時は「認証エラー」（HTTP 500）を表示し、エラーがサイレントに無視されないようにした。

## 0.6.5

### Patch Changes

- 988121f: Add User-Agent header to OAuth token refresh and token exchange requests

## 0.6.4

### Patch Changes

- 74a2f5b: fix: エラーメッセージ内の誤ったツール名を修正 (freee_set_company → freee_set_current_company, 旧ツール名 → freee_api_get)

## 0.6.3

### Patch Changes

- 8b27a9f: freee-agent パッケージを private に設定し、npm publish 対象から除外

## 0.6.2

### Patch Changes

- 9ab8bc6: 0.6.2 リリース: 1/17以降の変更を含む

  このリリースには以下の改善が含まれています（CHANGELOG 0.6.1 に既に記載済みの内容）:
  - 外部APIへのリクエストにUser-Agentヘッダーを追加
  - 外部APIレスポンスのZodバリデーション追加
  - OAuthコールバックサーバーのエラーハンドリング改善
  - 403エラーのハンドリング改善（レートリミット対応）
  - トークンエラーハンドリングの改善（Result型パターン）
  - OAuthコールバックサーバーのオンデマンド起動
  - ポート使用中時のエラーメッセージ改善

## 0.6.1

### Patch Changes

- 4b941b6: 外部APIへのリクエストにUser-Agentヘッダーを追加し、MCPサーバーからのリクエストであることを識別可能に
- a803a3e: Add Zod validation for external API responses to prevent silent failures from invalid response formats
- f79175d: fix: improve error handling for OAuth callback server startup failures
  - Add explicit error messages when OAuth callback server fails to start
  - Log when server is already running instead of silently returning
  - Clean up server state properly on error

- a6b4a4c: fix: 403エラーのハンドリングを改善し、レートリミットの可能性を示すメッセージを追加
- 230cbf8: fix: improve token error handling with Result type pattern
  - Replace safeParseJson with parseJsonResponse that returns a Result type, preserving error context instead of silently returning empty object
  - Propagate token refresh errors in getValidAccessToken instead of returning null, allowing callers to understand failure reasons
  - Add comprehensive tests for parseJsonResponse and token refresh failure scenarios

- b2ac012: OAuthコールバックサーバーをMCPサーバー起動時ではなく、認証時にオンデマンドで起動するように変更
- d4f96c0: ポートが使用中の場合にフォールバックせず、具体的な解決方法を含むエラーメッセージを表示するように変更
