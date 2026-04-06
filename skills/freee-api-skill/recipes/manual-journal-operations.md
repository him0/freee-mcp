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

振替伝票作成時に「freee-mcp」メモタグを付けることで、freee-mcp 経由で作成したデータを識別できます。

1. メモタグ一覧から「freee-mcp」のIDを取得:

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/tags"
}
```

レスポンスの `tags` 配列から `name` が `freee-mcp` のものを探し、`id` を取得します。

2. 存在しない場合は作成:

```
freee_api_post {
  "service": "accounting",
  "path": "/api/1/tags",
  "body": {
    "company_id": 123456,
    "name": "freee-mcp"
  }
}
```

3. 取得したタグIDを `details[].tag_ids` に指定して振替伝票を作成します（上記の作成例を参照）。

### 貸借区分

| entry_side | 説明 |
|-----------|------|
| `debit` | 借方 |
| `credit` | 貸方 |

### 注意事項

- 貸借合わせて100行まで登録可能
- 貸方と借方の合計金額は一致する必要がある
- 決算整理仕訳の場合は `adjustment: true` を指定

## 関連API

振替伝票作成時に必要なマスタ情報:

- `/api/1/account_items` - 勘定科目一覧
- `/api/1/taxes` - 税区分一覧
- `/api/1/partners` - 取引先一覧
- `/api/1/tags` - メモタグ一覧

## リファレンス

詳細なAPIパラメータは `references/accounting-manual-journals.md` を参照。
