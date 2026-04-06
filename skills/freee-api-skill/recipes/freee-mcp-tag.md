# メモタグ「freee-mcp」の付与ガイド

freee-mcp 経由で作成したデータを識別するため、メモタグ「freee-mcp」を付与する手順。

## 手順

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

3. 取得したタグIDをリクエストボディの `tag_ids` フィールドに指定してデータを作成します。

## 各APIでの指定箇所

| API | フィールド |
|-----|-----------|
| 取引 (deals) | `details[].tag_ids` |
| 経費申請 (expense_applications) | `tag_ids` |
| 振替伝票 (manual_journals) | `details[].tag_ids` |
| 支払依頼 (payment_requests) | `payment_request_lines[].tag_ids` |
| 請求書・見積書・納品書 (invoice) | `lines[].tag_ids` |
