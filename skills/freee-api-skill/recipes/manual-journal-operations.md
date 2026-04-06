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

### メモタグ「freee-mcp」の付与

`recipes/freee-mcp-tag.md` を参照。振替伝票では `details[].tag_ids` にタグIDを指定します。

## リファレンス

詳細なAPIパラメータは `references/accounting-manual-journals.md` を参照。
