# 支払依頼の操作

freee会計APIを使った支払依頼の登録・検索ガイド。

## 概要

支払依頼APIを使って支払依頼の作成・取得・承認操作を行います。

## 利用可能なパス

| パス | 説明 |
|------|------|
| `/api/1/payment_requests` | 支払依頼一覧・作成 |
| `/api/1/payment_requests/{id}` | 支払依頼詳細・更新・削除 |

## 使用例

### 支払依頼一覧を取得

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/payment_requests",
  "query": {
    "limit": 10
  }
}
```

### ステータスで絞り込み

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/payment_requests",
  "query": {
    "status": "in_progress"
  }
}
```

### 支払依頼を作成（下書き）

```
freee_api_post {
  "service": "accounting",
  "path": "/api/1/payment_requests",
  "body": {
    "company_id": 123456,
    "title": "仕入代金支払い",
    "issue_date": "2025-01-15",
    "draft": true,
    "approval_flow_route_id": 1,
    "partner_id": 201,
    "payment_date": "2025-01-31",
    "payment_method": "domestic_bank_transfer",
    "payment_request_lines": [
      {
        "line_type": "deal_line",
        "description": "商品仕入",
        "amount": 50000,
        "account_item_id": 101,
        "tax_code": 1,
        "tag_ids": [TAG_ID]
      }
    ]
  }
}
```

### 支払依頼を作成（申請）

```
freee_api_post {
  "service": "accounting",
  "path": "/api/1/payment_requests",
  "body": {
    "company_id": 123456,
    "title": "外注費支払い",
    "issue_date": "2025-01-15",
    "draft": false,
    "approval_flow_route_id": 1,
    "partner_id": 201,
    "payment_date": "2025-01-31",
    "payment_request_lines": [
      {
        "line_type": "deal_line",
        "description": "1月分外注費",
        "amount": 100000,
        "account_item_id": 101,
        "tax_code": 1,
        "tag_ids": [TAG_ID]
      }
    ]
  }
}
```

## Tips

### メモタグ「freee-mcp」の付与

支払依頼作成時に「freee-mcp」メモタグを付けることで、freee-mcp 経由で作成したデータを識別できます。

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

3. 取得したタグIDを `payment_request_lines[].tag_ids` に指定して支払依頼を作成します（上記の作成例を参照）。

## リファレンス

詳細なAPIパラメータは `references/accounting-payment-requests.md` を参照。
