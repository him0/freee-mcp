# 振替伝票の操作

freee会計APIを使った振替伝票の登録・検索ガイド。

## 概要

振替伝票APIを使って仕訳の登録、検索、更新、削除を行います。
振替伝票は売掛・買掛レポートには反映されません。債権・債務データの登録は取引(Deals)を使用してください。

## 利用可能なパス

| パス | 説明 |
|------|------|
| `/api/1/manual_journals` | 振替伝票一覧・作成 |
| `/api/1/manual_journals/{id}` | 振替伝票詳細・更新・削除 |

## 使用例

### 振替伝票一覧を取得

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/manual_journals",
  "query": {
    "limit": 10
  }
}
```

### 期間で絞り込み

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/manual_journals",
  "query": {
    "start_issue_date": "2025-01-01",
    "end_issue_date": "2025-01-31"
  }
}
```

### 振替伝票を作成

貸借の合計金額が一致する必要があります。

```
freee_api_post {
  "service": "accounting",
  "path": "/api/1/manual_journals",
  "body": {
    "company_id": 123456,
    "issue_date": "2025-01-15",
    "details": [
      {
        "entry_side": "debit",
        "account_item_id": 101,
        "tax_code": 1,
        "amount": 10000,
        "description": "前払費用の振替",
        "tag_ids": [TAG_ID]
      },
      {
        "entry_side": "credit",
        "account_item_id": 202,
        "tax_code": 1,
        "amount": 10000,
        "description": "前払費用の振替",
        "tag_ids": [TAG_ID]
      }
    ]
  }
}
```

### 振替伝票を更新

detailsに含まれない既存の貸借行は削除されます。更新後も残したい行は、貸借行IDを指定してdetailsに含めてください。

```
freee_api_put {
  "service": "accounting",
  "path": "/api/1/manual_journals/1",
  "body": {
    "company_id": 123456,
    "issue_date": "2025-01-15",
    "details": [
      {
        "id": 1,
        "entry_side": "debit",
        "account_item_id": 101,
        "tax_code": 1,
        "amount": 15000,
        "tag_ids": [TAG_ID]
      },
      {
        "id": 2,
        "entry_side": "credit",
        "account_item_id": 202,
        "tax_code": 1,
        "amount": 15000,
        "tag_ids": [TAG_ID]
      }
    ]
  }
}
```

### 振替伝票を削除

```
freee_api_delete {
  "service": "accounting",
  "path": "/api/1/manual_journals/1"
}
```

## Tips

### 作成後のWeb確認URL

振替伝票を作成した後、以下のURLでWeb画面から確認できます:

```
https://secure.freee.co.jp/manual_journals#?deal_id={id}
```

`{id}` は API レスポンスで返される振替伝票ID（`manual_journal.id`）を使用します。

### メモタグ「freee-mcp」の付与

振替伝票作成時に「freee-mcp」メモタグを付けることで、freee-mcp 経由で作成したデータを識別できます。

メモタグの取得・作成手順は `recipes/memo-tag-operations.md` を参照してください。取得したタグIDを `details[].tag_ids` に指定して振替伝票を作成します（上記の作成例を参照）。

## リファレンス

詳細なAPIパラメータは `references/accounting-manual-journals.md` を参照。
