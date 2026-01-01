---
name: freee-api-skill
description: "freee 会計・人事労務 API を MCP 経由で操作するスキル。詳細なAPIリファレンスと使い方ガイドを提供。"
---

# freee API スキル

## 概要

[@him0/freee-mcp](https://www.npmjs.com/package/@him0/freee-mcp) (MCP サーバー) を通じて freee API と連携。

**このスキルの役割**:

- freee API の詳細リファレンスを提供
- freee-mcp 使用ガイドと API 呼び出し例を提供

**注意**: OAuth 認証はユーザー自身が自分の環境で実行する必要があります。

## セットアップ

### 1. OAuth 認証（あなたのターミナルで実行）

```bash
npx @him0/freee-mcp configure
```

ブラウザで freee にログインし、デフォルト事業所を選択します。設定は `~/.config/freee-mcp/config.json` に保存されます。

### 2. プラグインをインストール

- **Claude Code**: コマンドパレット → "Claude: Install Plugin" → このリポジトリのパス
- **Claude Desktop**: 設定 → Plugins → Add Plugin → このリポジトリのパス

### 3. 再起動して確認

Claude を再起動後、`freee_auth_status` ツールで認証状態を確認。

## 事業所（company_id）の扱い

### デフォルト事業所

`freee-mcp configure` で選択した事業所がデフォルトとして使用されます。

- 設定ファイル: `~/.config/freee-mcp/config.json`
- `defaultCompanyId` に保存される

### デフォルト事業所の変更

```
freee_set_default_company { "company_id": "987654" }
```

設定ファイルが更新され、以降のAPIリクエストで新しいデフォルト事業所が使用されます。

### 一時的に別の事業所を使用する場合

各 API ツールに `company_id` パラメータを指定することで、デフォルト以外の事業所を一時的に使用できます。

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/deals",
  "company_id": "987654"  // 一時的に別の事業所を使用
}
```

**利用可能な事業所の確認**:

```
freee_list_companies
```

## リファレンス

API リファレンスが `references/` に含まれます。各リファレンスにはパラメータ、リクエストボディ、レスポンスの詳細情報があります。

**検索方法**:

```
pattern: "経費"
path: "skills/freee-api-skill/references"
output_mode: "files_with_matches"
```

**主なリファレンス**:

- `accounting-deals.md` - 取引
- `accounting-expense-applications.md` - 経費申請
- `hr-employees.md` - 従業員情報
- `hr-attendances.md` - 勤怠

## 使い方

### MCP ツール

**認証管理**:

- `freee_authenticate` - OAuth 認証
- `freee_auth_status` - 認証状態確認
- `freee_clear_auth` - 認証情報クリア

**事業所確認**:

- `freee_list_companies` - 事業所一覧
- `freee_current_user` - 現在のユーザー情報

**API 呼び出し**:

- `freee_api_get` - GET リクエスト
- `freee_api_post` - POST リクエスト
- `freee_api_put` - PUT リクエスト
- `freee_api_delete` - DELETE リクエスト
- `freee_api_patch` - PATCH リクエスト

### API ツールのパラメータ

| パラメータ | 必須 | 説明 |
|-----------|------|------|
| `service` | ○ | 対象サービス（下記参照） |
| `path` | ○ | APIパス |
| `query` | - | クエリパラメータ |
| `body` | POST/PUT/PATCH | リクエストボディ |
| `company_id` | - | 事業所ID（省略時はデフォルト） |

**serviceパラメータ**:

| service | 説明 | パス例 |
|---------|------|--------|
| `accounting` | freee会計 (取引、勘定科目、取引先など) | `/api/1/deals` |
| `hr` | freee人事労務 (従業員、勤怠など) | `/api/1/employees` |
| `invoice` | freee請求書 (請求書、見積書、納品書) | `/invoices` |
| `pm` | freee工数管理 (プロジェクト、工数など) | `/api/1/projects` |

### 基本ワークフロー

1. **リファレンスを検索**: Grep で `skills/freee-api-skill/references` を検索
2. **仕様を確認**: 該当するリファレンスを読む
3. **API を呼び出す**: `freee_api_*` ツールを使用

### 使用例

**経費申請を作成**:

```
# 1. リファレンスを確認
Read: "skills/freee-api-skill/references/accounting-expense-applications.md"

# 2. APIを呼び出す（デフォルト事業所を使用）
freee_api_post {
  "service": "accounting",
  "path": "/api/1/expense_applications",
  "body": {
    "title": "交通費",
    "issue_date": "2025-01-15",
    "expense_application_lines": [{
      "transaction_date": "2025-01-15",
      "description": "新宿→渋谷",
      "amount": 400
    }]
  }
}
```

**取引を検索**:

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/deals",
  "query": {
    "limit": 10
  }
}
```

**別の事業所の従業員情報を取得**:

```
freee_api_get {
  "service": "hr",
  "path": "/api/1/employees",
  "query": {
    "year": 2025,
    "month": 1
  },
  "company_id": "987654"
}
```

**請求書一覧を取得**:

```
freee_api_get {
  "service": "invoice",
  "path": "/invoices"
}
```

## エラー対応

- **認証エラー**: `freee_auth_status` で確認 → `freee_clear_auth` → `freee_authenticate`
- **事業所エラー**: `freee_list_companies` で事業所IDを確認し、`company_id` パラメータで指定
- **詳細**: `docs/troubleshooting.md` 参照

## 対応 API

| service | ベースURL | パス形式 |
|---------|-----------|----------|
| `accounting` | `https://api.freee.co.jp` | `/api/1/...` |
| `hr` | `https://api.freee.co.jp/hr` | `/api/1/...` |
| `invoice` | `https://api.freee.co.jp/iv` | `/invoices`, `/quotations`, `/delivery_slips` |
| `pm` | `https://api.freee.co.jp/pm` | `/api/1/...` |

### 請求書 API について

請求書 API は `https://api.freee.co.jp/iv` をベースとした独立した API です。

**注意**: 会計 API の `/api/1/invoices` は過去の API であり、現在は請求書 API (`service: "invoice"`) を使用してください。

**利用可能なパス**:

- `/invoices` - 請求書
- `/invoices/{id}` - 請求書詳細
- `/quotations` - 見積書
- `/quotations/{id}` - 見積書詳細
- `/delivery_slips` - 納品書
- `/delivery_slips/{id}` - 納品書詳細

**使用例**:

```
freee_api_get {
  "service": "invoice",
  "path": "/invoices"
}
```

## 関連リンク

- [freee-mcp](https://www.npmjs.com/package/@him0/freee-mcp)
- [freee API ドキュメント](https://developer.freee.co.jp/docs)
