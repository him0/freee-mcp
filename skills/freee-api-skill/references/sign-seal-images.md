# マイ印鑑

## 概要



## エンドポイント一覧

### GET /v1/seal_images

操作: マイ印鑑一覧の取得

説明: マイ印鑑一覧を取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| page | query | いいえ | object |  |
| per_page | query | いいえ | object |  |
| name | query | いいえ | string | マイ印鑑名に一致する一覧を取得できる（部分一致も可） |

### レスポンス (200)

取得成功




## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [sign-api-schema.json](../../openapi/sign-api-schema.json)
