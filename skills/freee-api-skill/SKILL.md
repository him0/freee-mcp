---
name: freee-api-skill
description: "freee 会計・人事労務 API を MCP 経由で操作するスキル。詳細なAPIリファレンスと使い方ガイドを提供。"
---

# freee API スキル

## 概要

[@him0/freee-mcp](https://www.npmjs.com/package/@him0/freee-mcp) (MCP サーバー) を通じて freee API と連携。

このスキルの役割:

- freee API の詳細リファレンスを提供
- freee-mcp 使用ガイドと API 呼び出し例を提供

注意: OAuth 認証はユーザー自身が自分の環境で実行する必要があります。

## セットアップ

### 1. OAuth 認証（あなたのターミナルで実行）

```bash
npx @him0/freee-mcp configure
```

ブラウザで freee にログインし、事業所を選択します。設定は `~/.config/freee-mcp/config.json` に保存されます。

### 2. プラグインをインストール

- Claude Code: コマンドパレット → "Claude: Install Plugin" → このリポジトリのパス
- Claude Desktop: 設定 → Plugins → Add Plugin → このリポジトリのパス

### 3. 再起動して確認

Claude を再起動後、`freee_auth_status` ツールで認証状態を確認。

## リファレンス

API リファレンスが `references/` に含まれます。各リファレンスにはパラメータ、リクエストボディ、レスポンスの詳細情報があります。

検索方法:

```
pattern: "経費"
path: "skills/freee-api-skill/references"
output_mode: "files_with_matches"
```

主なリファレンス:

- `accounting-deals.md` - 取引
- `accounting-expense-applications.md` - 経費申請
- `hr-employees.md` - 従業員情報
- `hr-attendances.md` - 勤怠

## 使い方

### MCP ツール

認証・事業所管理:

- `freee_authenticate` - OAuth 認証
- `freee_auth_status` - 認証状態確認
- `freee_list_companies` - 事業所一覧
- `freee_set_current_company` - 事業所切り替え

API 呼び出し:

- `freee_api_get` - GET リクエスト
- `freee_api_post` - POST リクエスト
- `freee_api_put` - PUT リクエスト
- `freee_api_delete` - DELETE リクエスト
- `freee_api_patch` - PATCH リクエスト

serviceパラメータ (必須):

| service | 説明 | パス例 |
|---------|------|--------|
| `accounting` | freee会計 (取引、勘定科目、取引先など) | `/api/1/deals` |
| `hr` | freee人事労務 (従業員、勤怠など) | `/api/1/employees` |
| `invoice` | freee請求書 (請求書、見積書、納品書) | `/invoices` |
| `pm` | freee工数管理 (プロジェクト、工数など) | `/api/1/projects` |

### company_id について

リクエストに `company_id` を含める場合、現在設定されている事業所（`freee_get_current_company` で確認可能）と一致している必要があります。不一致の場合はエラーになります。

- 事業所を変更する場合: 先に `freee_set_company` で切り替えてからリクエストを実行
- company_id を含まない API（例: `/api/1/companies`）: そのまま実行可能

### 基本ワークフロー

1. 操作ガイドを確認: `docs/` 内の該当ガイドを読む
2. リファレンスを検索: 必要に応じて `references/` を参照
3. API を呼び出す: `freee_api_*` ツールを使用

### 操作ガイド

よくある操作の使用例とTipsは以下を参照:

- `docs/expense-application-operations.md` - 経費申請
- `docs/deal-operations.md` - 取引（収入・支出）
- `docs/hr-operations.md` - 人事労務（従業員・勤怠）
- `docs/invoice-operations.md` - 請求書・見積書・納品書

## エラー対応

- 認証エラー: `freee_auth_status` で確認 → `freee_clear_auth` → `freee_authenticate`
- 事業所エラー: `freee_list_companies` → `freee_set_current_company`
- 詳細: `docs/troubleshooting.md` 参照

## 対応 API

| service | ベースURL | パス形式 |
|---------|-----------|----------|
| `accounting` | `https://api.freee.co.jp` | `/api/1/...` |
| `hr` | `https://api.freee.co.jp/hr` | `/api/1/...` |
| `invoice` | `https://api.freee.co.jp/iv` | `/invoices`, `/quotations`, `/delivery_slips` |
| `pm` | `https://api.freee.co.jp/pm` | `/api/1/...` |

### 請求書 API について

請求書・見積書・納品書の操作については `docs/invoice-operations.md` を参照してください。

注意: 会計 API の `/api/1/invoices` は過去の API であり、現在は請求書 API (`service: "invoice"`) を使用してください。

## 関連リンク

- [freee-mcp](https://www.npmjs.com/package/@him0/freee-mcp)
- [freee API ドキュメント](https://developer.freee.co.jp/docs)
