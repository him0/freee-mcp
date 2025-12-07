# Segment tags

## 概要

セグメントタグ

## エンドポイント一覧

### GET /api/1/segments/{segment_id}/tags

**操作**: セグメントタグ一覧の取得

**説明**: 概要 指定した事業所のセグメントタグ一覧を取得する 注意点 事業所の設定でセグメントタグコードを使用する設定にしている場合、レスポンスでセグメントタグコード(code)を返します

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| segment_id | path | はい | integer(int64) | セグメントID（1,2,3のいずれか）
該当プラン以外で参照した場合にはエラーとなります。
 |
| offset | query | いいえ | integer(int64) | 取得レコードのオフセット (デフォルト: 0) |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 20, 最小: 1, 最大: 500)  |
| start_update_date | query | いいえ | string | 更新日で絞込：開始日(yyyy-mm-dd) |
| end_update_date | query | いいえ | string | 更新日で絞込：終了日(yyyy-mm-dd) |

### レスポンス (200)

- **segment_tags** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - セグメントタグID 例: `1` (最小: 1)
    - **name** **(必須)**: string - セグメントタグ名 例: `プロジェクトA`
    - **description** **(必須)**: string - 備考 例: `備考`
    - **shortcut1** **(必須)**: string - ショートカット１ (20文字以内) 例: `A`
    - **shortcut2** **(必須)**: string - ショートカット２ (20文字以内) 例: `123`
    - **code** (任意): string - セグメントタグコード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)
    - **update_date** (任意): string - 更新日(yyyy-mm-dd) 例: `2020-06-15`

### POST /api/1/segments/{segment_id}/tags

**操作**: セグメントタグの作成

**説明**: 概要 指定した事業所のセグメントタグを作成する 注意点 codeを利用するには、事業所の設定でセグメントタグコードを使用する設定にする必要があります。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| segment_id | path | はい | integer(int64) | セグメントID（1,2,3のいずれか）
該当プラン以外で参照した場合にはエラーとなります。
 |

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **name** **(必須)**: string - セグメントタグ名 (100文字以内) 例: `プロジェクトA`
- **description** (任意): string - 備考 (30文字以内) 例: `備考`
- **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `A`
- **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `123`
- **code** (任意): string - セグメントタグコード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)

### レスポンス (201)

- **segment_tag** **(必須)**: object
  - **id** **(必須)**: integer(int64) - セグメントタグID 例: `1` (最小: 1)
  - **name** **(必須)**: string - セグメントタグ名 例: `プロジェクトA`
  - **description** **(必須)**: string - 備考 例: `備考`
  - **shortcut1** **(必須)**: string - ショートカット１ (20文字以内) 例: `A`
  - **shortcut2** **(必須)**: string - ショートカット２ (20文字以内) 例: `123`
  - **code** (任意): string - セグメントタグコード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)
  - **update_date** (任意): string - 更新日(yyyy-mm-dd) 例: `2020-06-15`

### PUT /api/1/segments/{segment_id}/tags/{id}

**操作**: セグメントタグの更新

**説明**: 概要 指定した事業所のセグメントタグを更新する 注意点 codeを利用するには、事業所の設定でセグメントタグコードを使用する設定にする必要があります。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| segment_id | path | はい | integer(int64) | セグメントID（1,2,3のいずれか）
該当プラン以外で参照した場合にはエラーとなります。
 |
| id | path | はい | integer(int64) | セグメントタグID |

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **name** **(必須)**: string - セグメントタグ名 (100文字以内) 例: `プロジェクトA`
- **description** (任意): string - 備考 (30文字以内) 例: `備考`
- **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `A`
- **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `123`
- **code** (任意): string - セグメントタグコード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)

### レスポンス (200)

- **segment_tag** **(必須)**: object
  - **id** **(必須)**: integer(int64) - セグメントタグID 例: `1` (最小: 1)
  - **name** **(必須)**: string - セグメントタグ名 例: `プロジェクトA`
  - **description** **(必須)**: string - 備考 例: `備考`
  - **shortcut1** **(必須)**: string - ショートカット１ (20文字以内) 例: `A`
  - **shortcut2** **(必須)**: string - ショートカット２ (20文字以内) 例: `123`
  - **code** (任意): string - セグメントタグコード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)
  - **update_date** (任意): string - 更新日(yyyy-mm-dd) 例: `2020-06-15`

### DELETE /api/1/segments/{segment_id}/tags/{id}

**操作**: セグメントタグの削除

**説明**: 概要 指定した事業所のセグメントタグを削除する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| segment_id | path | はい | integer(int64) | セグメントID（1,2,3のいずれか）
該当プラン以外で参照した場合にはエラーとなります。
 |
| id | path | はい | integer(int64) | セグメントタグID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (204)

### PUT /api/1/segments/{segment_id}/tags/code/upsert

**操作**: セグメントタグの更新（作成）

**説明**: 概要 セグメントタグコードをキーに、指定したセグメントタグの情報を更新（存在しない場合は作成）する 注意点 codeを利用するには、事業所の設定でセグメントタグコードを使用する設定にする必要があります。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| segment_id | path | はい | integer(int64) | セグメントID（1,2,3のいずれか）
該当プラン以外で参照した場合にはエラーとなります。
 |

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **code** **(必須)**: string - セグメントタグコード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)
- **segment_tag** **(必須)**: object
  - **name** **(必須)**: string - セグメントタグ名 (100文字以内) 例: `プロジェクトA`
  - **description** (任意): string - 備考 (30文字以内) 例: `備考`
  - **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `A`
  - **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `123`

### レスポンス (200)

- **segment_tag** **(必須)**: object
  - **id** **(必須)**: integer(int64) - セグメントタグID 例: `1` (最小: 1)
  - **name** **(必須)**: string - セグメントタグ名 例: `プロジェクトA`
  - **description** **(必須)**: string - 備考 例: `備考`
  - **shortcut1** **(必須)**: string - ショートカット１ (20文字以内) 例: `A`
  - **shortcut2** **(必須)**: string - ショートカット２ (20文字以内) 例: `123`
  - **code** (任意): string - セグメントタグコード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)
  - **update_date** (任意): string - 更新日(yyyy-mm-dd) 例: `2020-06-15`



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
