# 経費申請の操作

freee会計APIを使った経費申請のガイド。

## 概要

経費精算APIを使って経費申請の作成・取得・承認操作を行います。

## 利用可能なパス

| パス | 説明 |
|------|------|
| `/api/1/expense_applications` | 経費申請一覧・作成 |
| `/api/1/expense_applications/{id}` | 経費申請詳細・更新・削除 |
| `/api/1/expense_application_line_templates` | 経費科目一覧 |

## 使用例

### 経費申請一覧を取得

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/expense_applications",
  "query": {
    "limit": 10
  }
}
```

### 経費申請を作成

```
freee_api_post {
  "service": "accounting",
  "path": "/api/1/expense_applications",
  "body": {
    "company_id": 123456,
    "title": "交通費",
    "issue_date": "2025-01-15",
    "expense_application_lines": [
      {
        "transaction_date": "2025-01-15",
        "description": "新宿→渋谷",
        "amount": 400
      }
    ]
  }
}
```

### 経費科目一覧を取得

経費申請作成時に使用する経費科目IDを確認:

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/expense_application_line_templates"
}
```

## Tips

### 作成後のWeb確認URL

経費申請を作成した後、以下のURLでWeb画面から確認できます:

```
https://secure.freee.co.jp/expense_applications/{id}
```

`{id}` は API レスポンスで返される経費申請ID（`expense_application.id`）を使用します。

### 申請ステータス

| status | 説明 |
|--------|------|
| `draft` | 下書き |
| `in_progress` | 申請中 |
| `approved` | 承認済 |
| `rejected` | 却下 |
| `feedback` | 差戻し |

### 取引ステータス（承認後）

| deal_status | 説明 |
|-------------|------|
| `unsettled` | 清算待ち |
| `settled` | 精算済み |

## 注意点

- 申請経路に部門役職データ連携を使用している経費申請はAPI経由で作成・更新できません
- 申請の削除は下書き・差戻し状態の場合のみ可能
- 領収書添付が必要な場合はファイルボックスAPIと連携

## リファレンス

詳細なAPIパラメータは `references/accounting-expense-applications.md` を参照。
