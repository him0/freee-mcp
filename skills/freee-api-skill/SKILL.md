---
name: freee-api-skill
description: "freee API を MCP 経由で操作するスキル。会計・人事労務・請求書・工数管理・販売の詳細APIリファレンスと使い方ガイドを提供。経費申請・取引登録・勤怠打刻・給与明細・見積書・試算表・仕訳・従業員管理・工数登録・売上管理など、freee関連の操作やAPI仕様を調べたいときに使う。"
---

# freee API スキル

## 概要

[freee-mcp](https://www.npmjs.com/package/freee-mcp) (MCP サーバー) を通じて freee API と連携。

このスキルの役割:

- freee API の詳細リファレンスを提供
- freee-mcp 使用ガイドと API 呼び出し例を提供

接続方法は Remote MCP（推奨）とローカルの2つがあります。

## セットアップ

### 方法 1: Remote MCP で接続する（推奨）

freee が提供する Remote MCP サーバーに接続する方法です。ローカルでのセットアップが不要で、すぐに利用を開始できます。

Claude 及び Claude Desktop では「カスタマイズ」より「カスタムコネクタを追加」を開き、以下を設定してください。

- 名前: `freee`
- URL: `https://mcp.freee.co.jp/mcp`

初回接続時にブラウザで freee への認証が自動的に行われます。`npx freee-mcp configure` の実行は不要です。

その他の AI ツールでは、それぞれの案内に従って Remote MCP サーバーを追加してください。

### 方法 2: ローカルで MCP サーバーを起動する

freee アプリケーションを自分で登録し、ローカルで MCP サーバーを起動する方法です。

```bash
npx freee-mcp configure
```

ブラウザで freee にログインし、事業所を選択します。設定は `~/.config/freee-mcp/config.json` に保存されます。

Claude を再起動後、`freee_auth_status` ツールで認証状態を確認。

## リファレンス

API リファレンスが `references/` に含まれます。各リファレンスにはパラメータ、リクエストボディ、レスポンスの詳細情報があります。

目的のAPIを探すには、`references/` ディレクトリ内のファイルをキーワード検索してください。

主なリファレンス:

- `accounting-deals.md` - 取引
- `accounting-expense-applications.md` - 経費申請
- `hr-employees.md` - 従業員情報
- `hr-attendances.md` - 勤怠
- `invoice-invoices.md` - 請求書

## 使い方

### MCP ツール

認証・事業所管理:

- `freee_authenticate` - OAuth 認証（Remote MCP では認証は自動処理されるため通常は不要）
- `freee_auth_status` - 認証状態確認
- `freee_clear_auth` - 認証情報クリア（ローカルモード用）
- `freee_current_user` - ログインユーザー情報取得
- `freee_list_companies` - 事業所一覧
- `freee_set_current_company` - 事業所切り替え
- `freee_get_current_company` - 現在の事業所取得

サーバー情報:

- `freee_server_info` - サーバー情報取得（バージョンなど）

ファイル操作:

- `freee_file_upload` - ファイルボックスにファイルをアップロード (POST /api/1/receipts) ※ローカルモードのみ

API 呼び出し:

- `freee_api_get` - GET リクエスト
- `freee_api_post` - POST リクエスト
- `freee_api_put` - PUT リクエスト
- `freee_api_delete` - DELETE リクエスト
- `freee_api_patch` - PATCH リクエスト
- `freee_api_list_paths` - 利用可能なAPIパス一覧

serviceパラメータ (必須):

| service | 説明 | パス例 |
|---------|------|--------|
| `accounting` | freee会計 (取引、勘定科目、取引先など) | `/api/1/deals` |
| `hr` | freee人事労務 (従業員、勤怠など) | `/api/v1/employees` |
| `invoice` | freee請求書 (請求書、見積書、納品書) | `/invoices` |
| `pm` | freee工数管理 (プロジェクト、工数など) | `/projects` |
| `sm` | freee販売 (見積、受注、売上など) | `/businesses` |

### 基本ワークフロー

Remote MCP の場合、認証は自動処理されるため手順1から開始できます。ローカルモードで未認証の場合は先に `freee_authenticate` を実行してください。

1. 事業所を確認: `freee_get_current_company` で現在の事業所IDを取得する（初回は必須。セッション内で1回取得すれば以降は使い回せる）
2. レシピを確認: `recipes/` 内の該当レシピを読む
3. リファレンスを検索: 必要に応じて `references/` を参照
4. API を呼び出す: `freee_api_*` ツールを使用（company_id が必要なエンドポイントでは手順1で取得した値を使う）

注意:
- `company_id` は現在設定されている事業所と一致している必要がある。不一致の場合はエラーになる
- 事業所を変更する場合: 先に `freee_set_current_company` で切り替えてからリクエストを実行

### レシピ

よくある操作のユースケースサンプルとTipsは以下を参照:

- `recipes/expense-application-operations.md` - 経費申請
- `recipes/deal-operations.md` - 取引（収入・支出）
- `recipes/hr-employee-operations.md` - 人事労務（従業員・給与）
- `recipes/hr-attendance-operations.md` - 勤怠（出退勤・打刻・休憩の登録）
- `recipes/invoice-operations.md` - 請求書・見積書・納品書
- `recipes/receipt-operations.md` - ファイルボックス（証憑ファイルのアップロード・管理）
- `recipes/pm-operations.md` - 工数管理（プロジェクト・工数実績）
- `recipes/pm-workload-registration.md` - 工数の安全な登録（PM・HR連携ワークフロー）
- `recipes/sm-operations.md` - 販売管理（案件・受注）

## エラー対応

- バージョン確認: まず `VERSION.md` を読んでスキルのバージョンを確認し、`freee_server_info` でサーバーバージョンを確認してください。スキルのバージョンがサーバーより古い場合、スキルの情報が最新のサーバーに対応していない可能性があります。スキルを最新版に更新してから再度お試しください。
- 認証エラー（Remote MCP）: MCP クライアント（Claude Desktop 等）が自動的に再認証を促します。解決しない場合はカスタムコネクタを一度削除し、再度追加してください。
- 認証エラー（ローカル）: `freee_auth_status` で確認 → `freee_clear_auth` → `freee_authenticate`
- 事業所エラー: `freee_list_companies` → `freee_set_current_company`
- 詳細: `recipes/troubleshooting.md` 参照

## API の機能制限について

freee API 自体の機能制限に起因する問題は freee-mcp では解決できません。詳細は `recipes/troubleshooting.md` を参照してください。

## 関連リンク

- [freee-mcp](https://www.npmjs.com/package/freee-mcp)
- [freee API ドキュメント](https://developer.freee.co.jp/docs)
- Remote MCP サーバー: `https://mcp.freee.co.jp/mcp`
