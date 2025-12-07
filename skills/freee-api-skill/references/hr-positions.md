# 役職

## 概要

役職の操作

## エンドポイント一覧

### GET /api/v1/positions

**操作**: 役職一覧の取得

**説明**: 概要 指定した事業所の指定日付時点における役職情報をリストで返します。 注意点 管理者権限を持ったユーザーのみ実行可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |

### レスポンス (200)

successful operation

- **positions** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int32) - 役職ID 例: `1` (最小: 1, 最大: 2147483647)
    - **code** (任意): string - 役職コード 例: `position1`
    - **name** **(必須)**: string - 役職名称 例: `部長`
- **total_count** **(必須)**: integer(int32) - 合計件数 例: `1` (最小: 0, 最大: 2147483647)

### POST /api/v1/positions

**操作**: 役職の作成

**説明**: 概要 指定した事業所の役職を新規作成します。 注意点 管理者権限を持ったユーザーのみ実行可能です。

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 作成対象事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **position** **(必須)**: object
  - **code** (任意): string - 役職コード（入力しない場合、空文字が入力されます。） 例: `position1`
  - **name** **(必須)**: string - 役職名称（必須） 例: `部長`

### レスポンス (201)

successful operation

- **position** **(必須)**: object
  - **id** **(必須)**: integer(int32) - 役職ID 例: `1` (最小: 1, 最大: 2147483647)
  - **code** (任意): string - 役職コード 例: `position1`
  - **name** **(必須)**: string - 役職名称 例: `部長`

### PUT /api/v1/positions/{id}

**操作**: 役職の更新

**説明**: 概要 指定した事業所の役職の情報を更新します。 注意点 管理者権限を持ったユーザーのみ実行可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer | 役職ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 作成対象事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **position** **(必須)**: object
  - **code** (任意): string - 役職コード（入力しない場合、空文字が入力されます。） 例: `position1`
  - **name** **(必須)**: string - 役職名称（必須） 例: `部長`

### レスポンス (200)

successful operation

- **position** **(必須)**: object
  - **id** **(必須)**: integer(int32) - 役職ID 例: `1` (最小: 1, 最大: 2147483647)
  - **code** (任意): string - 役職コード 例: `position1`
  - **name** **(必須)**: string - 役職名称 例: `部長`

### DELETE /api/v1/positions/{id}

**操作**: 役職の削除

**説明**: 概要 指定した事業所の役職の情報を削除します。 注意点 管理者権限を持ったユーザーのみ実行可能です。 従業員に役職が適用されている場合、従業員の役職情報も削除されます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer | 役職ID |
| company_id | query | はい | integer | 事業所ID |

### レスポンス (204)

successful operation



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
