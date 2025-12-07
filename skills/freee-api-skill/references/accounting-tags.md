# Tags

## 概要

メモタグ

## エンドポイント一覧

### GET /api/1/tags

**操作**: メモタグ一覧の取得

**説明**: 概要 指定した事業所のメモタグ一覧を取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| start_update_date | query | いいえ | string | 更新日で絞り込み：開始日(yyyy-mm-dd) |
| end_update_date | query | いいえ | string | 更新日で絞り込み：終了日(yyyy-mm-dd) |
| offset | query | いいえ | integer(int64) | 取得レコードのオフセット (デフォルト: 0) |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 50, 最小: 1, 最大: 3000) |

### レスポンス (200)

- **tags** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - タグID 例: `1` (最小: 1)
    - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
    - **name** **(必須)**: string - 名前(30文字以内) 例: `メモタグ`
    - **update_date** **(必須)**: string - 更新日(yyyy-mm-dd) 例: `2019-12-17`
    - **shortcut1** (任意): string - ショートカット1 (255文字以内) 例: `MEMOTAG`
    - **shortcut2** (任意): string - ショートカット2 (255文字以内) 例: `123`

### POST /api/1/tags

**操作**: メモタグの作成

**説明**: 概要 指定した事業所のメモタグを作成する

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **name** **(必須)**: string - メモタグ名 (30文字以内) 例: `メモタグ1`
- **shortcut1** (任意): string - ショートカット1 (20文字以内) 例: `tag1`
- **shortcut2** (任意): string - ショートカット2 (20文字以内) 例: `t1`

### レスポンス (201)

- **tag** **(必須)**: object
  - **id** **(必須)**: integer(int64) - タグID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 名前(30文字以内) 例: `メモタグ`
  - **update_date** **(必須)**: string - 更新日(yyyy-mm-dd) 例: `2019-12-17`
  - **shortcut1** (任意): string - ショートカット1 (255文字以内) 例: `MEMOTAG`
  - **shortcut2** (任意): string - ショートカット2 (255文字以内) 例: `123`

### GET /api/1/tags/{id}

**操作**: メモタグの取得

**説明**: 概要 指定した事業所のメモタグを取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | タグID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (200)

- **tag** **(必須)**: object
  - **id** **(必須)**: integer(int64) - タグID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 名前(30文字以内) 例: `メモタグ`
  - **update_date** **(必須)**: string - 更新日(yyyy-mm-dd) 例: `2019-12-17`
  - **shortcut1** (任意): string - ショートカット1 (255文字以内) 例: `MEMOTAG`
  - **shortcut2** (任意): string - ショートカット2 (255文字以内) 例: `123`

### PUT /api/1/tags/{id}

**操作**: メモタグの更新

**説明**: 概要 指定した事業所のメモタグを更新する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | メモタグID |

### リクエストボディ

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **name** **(必須)**: string - メモタグ名 (30文字以内) 例: `メモタグ1`
- **shortcut1** (任意): string - ショートカット1 (20文字以内) 例: `tag1`
- **shortcut2** (任意): string - ショートカット2 (20文字以内) 例: `t1`

### レスポンス (200)

- **tag** **(必須)**: object
  - **id** **(必須)**: integer(int64) - タグID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 名前(30文字以内) 例: `メモタグ`
  - **update_date** **(必須)**: string - 更新日(yyyy-mm-dd) 例: `2019-12-17`
  - **shortcut1** (任意): string - ショートカット1 (255文字以内) 例: `MEMOTAG`
  - **shortcut2** (任意): string - ショートカット2 (255文字以内) 例: `123`

### DELETE /api/1/tags/{id}

**操作**: メモタグの削除

**説明**: 概要 指定した事業所のメモタグを削除する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | タグID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (204)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
