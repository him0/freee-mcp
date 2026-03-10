# ファイルボックス（証憑ファイル）の操作

freee会計APIとカスタムツールを使ったファイルボックスの操作ガイド。

## 概要

ファイルボックスAPIを使って証憑ファイル（レシート・請求書等）のアップロード・検索・更新を行います。

## 利用可能なパス

| パス | 説明 |
|------|------|
| `/api/1/receipts` | 証憑ファイル一覧・アップロード |
| `/api/1/receipts/{id}` | 証憑ファイル詳細・更新・削除 |
| `/api/1/receipts/{id}/download` | 証憑ファイルのダウンロード |

## ファイルアップロード

### カスタムツール freee_file_upload を使う（推奨）

ローカルファイルをファイルボックスにアップロードするには、カスタムツール `freee_file_upload` を使います。
APIの `POST /api/1/receipts` は multipart/form-data が必要なため、通常の `freee_api_post` では利用できません。

```
freee_file_upload {
  "file_path": "/path/to/receipt.jpg",
  "document_type": "receipt",
  "description": "ファミリーマート レシート",
  "receipt_metadatum_amount": 460,
  "receipt_metadatum_issue_date": "2024-09-29",
  "receipt_metadatum_partner_name": "ファミリーマート"
}
```

パラメータ:

| 名前 | 必須 | 説明 |
|------|------|------|
| file_path | はい | アップロードするファイルのローカルパス |
| document_type | いいえ | 書類の種類: receipt(領収書), invoice(請求書), other(その他) |
| description | いいえ | メモ（最大255文字） |
| receipt_metadatum_amount | いいえ | 金額 |
| receipt_metadatum_issue_date | いいえ | 発行日 (yyyy-mm-dd) |
| receipt_metadatum_partner_name | いいえ | 取引先名（最大255文字） |
| qualified_invoice | いいえ | 適格請求書等: qualified, not_qualified, unselected |

## 使用例

### 証憑ファイル一覧を取得

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/receipts",
  "query": {
    "start_date": "2025-01-01",
    "end_date": "2025-01-31"
  }
}
```

### 特定の証憑ファイルを取得

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/receipts/432228305"
}
```

### 証憑ファイルのメタ情報を更新

```
freee_api_put {
  "service": "accounting",
  "path": "/api/1/receipts/432228305",
  "body": {
    "description": "ファミリーマート 一の橋店 レシート",
    "receipt_metadatum": {
      "partner_name": "ファミリーマート",
      "issue_date": "2024-09-29",
      "amount": 460
    },
    "document_type": "receipt"
  }
}
```

### 証憑ファイルを削除

```
freee_api_delete {
  "service": "accounting",
  "path": "/api/1/receipts/432228305"
}
```

## Tips

### アップロード後のWeb確認URL

ファイルをアップロードした後、以下のURLでWeb画面から確認できます:

```
https://secure.freee.co.jp/receipts/{id}
```

`{id}` は API レスポンスで返されるファイルボックスID（`receipt.id`）を使用します。

### アップロード制限

- ファイルサイズ: 64MBまで
- 月間アップロード容量: 合計10GBまで
- 1分間あたりのアップロード数: 300ファイルまで
- プランによる月間アップロード数制限あり

### 書類の種類（document_type）

| 値 | 説明 |
|----|------|
| `receipt` | 領収書 |
| `invoice` | 請求書 |
| `other` | その他 |

### ステータス

| 値 | 説明 |
|----|------|
| `confirmed` | 確認済み |
| `deleted` | 削除済み |
| `ignored` | 無視 |

### カテゴリ（一覧取得時のフィルタ）

| 値 | 説明 |
|----|------|
| `all` | すべて |
| `without_deal` | 未登録 |
| `with_expense_application_line` | 経費申請中 |
| `with_deal` | 登録済み |
| `ignored` | 無視 |

## リファレンス

詳細なAPIパラメータは `references/accounting-receipts.md` を参照。
