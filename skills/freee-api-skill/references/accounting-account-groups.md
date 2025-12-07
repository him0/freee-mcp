# Account groups

## 概要

決算書表示名

## エンドポイント一覧

### POST /api/1/account_groups

**操作**: 決算書表示名の作成

**説明**: 概要 指定した事業所の決算書表示名を作成する

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1`
- **name** **(必須)**: string - 決算書表示名 (20文字以内) 例: `新しい決算書表示名`
- **account_category_id** **(必須)**: integer(int64) - 勘定科目カテゴリーID Selectablesフォーム用選択項目情報エンドポイント(account_groups.account_category_id)で取得可能です 例: `1`
- **index** (任意): integer(int64) - 表示順 例: `1`

### レスポンス (201)

- **account_group** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1`
  - **id** **(必須)**: integer(int64) - 決算書表示名(小カテゴリー)ID 例: `1`
  - **name** **(必須)**: string - 決算書表示名 例: `新しい決算書表示名`
  - **account_structure_id** **(必須)**: integer(int64) - 年度ID 例: `1`
  - **account_category_id** **(必須)**: integer(int64) - 勘定科目カテゴリID 例: `1`
  - **index** **(必須)**: integer(int64) - 表示順 例: `1`



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
