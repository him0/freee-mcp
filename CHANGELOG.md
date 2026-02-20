# @him0/freee-mcp

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
