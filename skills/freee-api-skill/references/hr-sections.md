# 部門

## 概要

部門の操作

## エンドポイント一覧

### GET /api/v1/groups

**操作**: 部門一覧の取得

**説明**: 概要 指定した事業所の指定日付時点における部門情報をリストで返します。 部門APIの使い方については、部門APIを利用した組織図の取得について をご参照ください。 注意点 管理者権限を持ったユーザーのみ実行可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |

### レスポンス (200)

successful operation

- **groups** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int32) - 部門ID 例: `3` (最小: 1, 最大: 2147483647)
    - **code** (任意): string - 部門コード 例: `group2`
    - **name** **(必須)**: string - 部門名称 例: `営業部門`
    - **level** **(必須)**: integer(int32) - 部門階層レベル（数字が大きいほど階層が深いです。） 例: `2` (最小: 1, 最大: 2147483647)
    - **parent_group_id** (任意): integer(int32) - 親部門ID 例: `2` (最小: 1, 最大: 2147483647)
    - **parent_group_code** (任意): string - 親部門コード 例: `group1`
    - **parent_group_name** (任意): string - 親部門名称 例: `営業統括`
- **total_count** **(必須)**: integer(int32) - 合計件数 例: `1` (最小: 0, 最大: 2147483647)

### POST /api/v1/groups

**操作**: 部門の作成

**説明**: 概要 指定した事業所の部門を新規作成します。 部門APIの使い方については、部門APIを利用した組織図の取得について をご参照ください。 注意点 管理者権限を持ったユーザーのみ実行可能です。

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 作成対象事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **group** **(必須)**: object
  - **code** (任意): string - 部門コード（入力しない場合、空文字が入力されます。） 例: `group2`
  - **name** **(必須)**: string - 部門名称（必須） 例: `営業部門`
  - **parent_group_id** (任意): integer(int32) - 親部門ID（部門階層レベルが10以内になるように親部門IDを指定してください。） 例: `2` (最小: 1, 最大: 2147483647)

### レスポンス (201)

successful operation

- **group** **(必須)**: object
  - **id** **(必須)**: integer(int32) - 部門ID 例: `3` (最小: 1, 最大: 2147483647)
  - **code** (任意): string - 部門コード 例: `group2`
  - **name** **(必須)**: string - 部門名称 例: `営業部門`
  - **level** **(必須)**: integer(int32) - 部門階層レベル（数字が大きいほど階層が深いです。） 例: `2` (最小: 1, 最大: 2147483647)
  - **parent_group_id** (任意): integer(int32) - 親部門ID 例: `2` (最小: 1, 最大: 2147483647)
  - **parent_group_code** (任意): string - 親部門コード 例: `group1`
  - **parent_group_name** (任意): string - 親部門名称 例: `営業統括`

### PUT /api/v1/groups/{id}

**操作**: 部門の更新

**説明**: 概要 指定した事業所の部門の情報を更新します。 部門APIの使い方については、部門APIを利用した組織図の取得について をご参照ください。 注意点 管理者権限を持ったユーザーのみ実行可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer | 部門ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 作成対象事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **group** **(必須)**: object
  - **code** (任意): string - 部門コード（入力しない場合、空文字が入力されます。） 例: `group2`
  - **name** **(必須)**: string - 部門名称 例: `営業部門`

### レスポンス (200)

successful operation

- **group** **(必須)**: object
  - **id** **(必須)**: integer(int32) - 部門ID 例: `3` (最小: 1, 最大: 2147483647)
  - **code** (任意): string - 部門コード 例: `group2`
  - **name** **(必須)**: string - 部門名称 例: `営業部門`
  - **level** **(必須)**: integer(int32) - 部門階層レベル（数字が大きいほど階層が深いです。） 例: `2` (最小: 1, 最大: 2147483647)
  - **parent_group_id** (任意): integer(int32) - 親部門ID 例: `2` (最小: 1, 最大: 2147483647)
  - **parent_group_code** (任意): string - 親部門コード 例: `group1`
  - **parent_group_name** (任意): string - 親部門名称 例: `営業統括`

### DELETE /api/v1/groups/{id}

**操作**: 部門の削除

**説明**: 概要 指定した事業所の部門の情報を削除します。 部門APIの使い方については、部門APIを利用した組織図の取得について をご参照ください。 注意点 管理者権限を持ったユーザーのみ実行可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer | 部門ID |
| company_id | query | はい | integer | 事業所ID |

### レスポンス (204)

successful operation



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
