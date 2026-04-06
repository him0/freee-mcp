# 取引（収入・支出）の操作

freee会計APIを使った取引の登録・検索ガイド。

## 概要

取引APIを使って収入・支出の記録、検索、更新を行います。

## 利用可能なパス

| パス | 説明 |
|------|------|
| `/api/1/deals` | 取引一覧・作成 |
| `/api/1/deals/{id}` | 取引詳細・更新・削除 |
| `/api/1/deals/{id}/payments` | 支払行の作成 |
| `/api/1/deals/{id}/renews` | +更新行の作成 |

## 使用例

### 取引一覧を取得

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/deals",
  "query": {
    "limit": 10
  }
}
```

### 期間で絞り込み

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/deals",
  "query": {
    "start_issue_date": "2025-01-01",
    "end_issue_date": "2025-01-31",
    "type": "expense"
  }
}
```

### 支出を作成（未決済）

```
freee_api_post {
  "service": "accounting",
  "path": "/api/1/deals",
  "body": {
    "company_id": 123456,
    "issue_date": "2025-01-15",
    "type": "expense",
    "details": [
      {
        "account_item_id": 101,
        "tax_code": 1,
        "amount": 10000,
        "description": "消耗品購入",
        "tag_ids": [TAG_ID]
      }
    ]
  }
}
```

### 支出を作成（決済済み）

```
freee_api_post {
  "service": "accounting",
  "path": "/api/1/deals",
  "body": {
    "company_id": 123456,
    "issue_date": "2025-01-15",
    "type": "expense",
    "details": [
      {
        "account_item_id": 101,
        "tax_code": 1,
        "amount": 10000,
        "description": "消耗品購入",
        "tag_ids": [TAG_ID]
      }
    ],
    "payments": [
      {
        "amount": 10000,
        "from_walletable_type": "wallet",
        "from_walletable_id": 1,
        "date": "2025-01-15"
      }
    ]
  }
}
```

## Tips

### メモタグ「freee-mcp」の付与

取引を作成する際は、freee-mcp 経由で作成したデータであることを識別できるよう、メモタグ「freee-mcp」を必ず付与すること。手順は `recipes/freee-mcp-tag.md` を参照。取引では `details[].tag_ids` にタグIDを指定する。

### 作成後のWeb確認URL

取引を作成した後、以下のURLでWeb画面から確認できます:

```
https://secure.freee.co.jp/deals#deal_id={id}
```

`{id}` は API レスポンスで返される取引ID（`deal.id`）を使用します。

## リファレンス

詳細なAPIパラメータ（収支区分、決済状況、口座区分等）は `references/accounting-deals.md` を参照。
