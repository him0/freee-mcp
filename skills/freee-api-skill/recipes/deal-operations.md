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

## 取引作成の前準備

取引を作成するには、事業所固有のマスタID（勘定科目ID、税区分コード、口座ID等）が必要になる。これらのIDは事業所ごとに異なるため、推測やハードコードせず、必ず事前にAPIで取得すること。

### 1. 勘定科目IDを取得

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/account_items"
}
```

レスポンスの `account_items` から目的の勘定科目（例: 「消耗品費」「旅費交通費」）の `id` を使用する。

### 2. 税区分コードを取得

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/taxes"
}
```

### 3. 口座IDを取得（決済済み取引の場合）

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/walletables",
  "query": { "type": "wallet" }
}
```

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

account_item_id、tax_code は上記の前準備で取得した実際の値を使用すること。

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
        "account_item_id": <取得した勘定科目ID>,
        "tax_code": <取得した税区分コード>,
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
        "account_item_id": <取得した勘定科目ID>,
        "tax_code": <取得した税区分コード>,
        "amount": 10000,
        "description": "消耗品購入",
        "tag_ids": [TAG_ID]
      }
    ],
    "payments": [
      {
        "amount": 10000,
        "from_walletable_type": "wallet",
        "from_walletable_id": <取得した口座ID>,
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
