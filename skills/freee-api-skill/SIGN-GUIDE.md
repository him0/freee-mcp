# freee サイン（電子契約）ガイド

freee サインは freee 本体とは別の MCP サーバー（`freee-sign-mcp`）で提供されます。
認証基盤が異なるため、freee 本体の `company_id` や事業所管理は不要です。

## セットアップ

```bash
npx --package=freee-mcp -- freee-sign-mcp configure
```

ブラウザで freee サインにログインし、OAuth 認証を完了します。設定は `~/.config/freee-mcp/sign-config.json` に保存されます。

## MCP ツール

認証:

- `sign_authenticate` - freee サイン OAuth 認証
- `sign_auth_status` - 認証状態確認
- `sign_clear_auth` - 認証情報クリア

API 呼び出し:

- `sign_api_get` - GET リクエスト
- `sign_api_post` - POST リクエスト
- `sign_api_put` - PUT リクエスト
- `sign_api_patch` - PATCH リクエスト
- `sign_api_delete` - DELETE リクエスト

## 基本ワークフロー

1. 認証状態を確認: `sign_auth_status`（未認証なら `sign_authenticate` を実行）
2. リファレンスを検索: `sign-references/` 内の該当リファレンスを参照
3. API を呼び出す: `sign_api_*` ツールを使用

注意:
- freee 本体の `company_id` や `freee_get_current_company` はサインでは使用しません
- サインの API パスは `/v1/` から始まります（例: `/v1/documents`）

## リファレンス

API リファレンスが `sign-references/` に含まれます:

- `sign-documents.md` - 文書管理（作成・送信・検索・ダウンロード）
- `sign-folders.md` - フォルダ管理
- `sign-items.md` - 入力項目
- `sign-kintone.md` - kintone 連携
- `sign-seal-images.md` - マイ印鑑
- `sign-teams.md` - チーム管理
- `sign-templates.md` - テンプレート
- `sign-users.md` - ユーザー管理

## エラー対応

- 認証エラー: `sign_auth_status` で確認 → `sign_clear_auth` → `sign_authenticate`
- 設定エラー: `npx --package=freee-mcp -- freee-sign-mcp configure --force` で再設定
