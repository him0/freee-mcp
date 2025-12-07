# 勤怠タグ

## 概要

勤怠タグの操作

## エンドポイント一覧

### GET /api/v1/employees/{employee_id}/attendance_tags

**操作**: 勤怠タグ一覧の取得

**説明**: 概要 指定した従業員の利用可能な勤怠タグの一覧を返します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| employee_id | path | はい | integer | 従業員ID |

### レスポンス (200)

successful operation

- **employee_attendance_tags** (任意): array[object]
  配列の要素:
    - **id** **(必須)**: integer(int32) - 勤怠タグID 例: `1` (最小: 1, 最大: 2147483647)
    - **company_id** **(必須)**: integer(int32) - 事業所ID 例: `1` (最小: 1, 最大: 2147483647)
    - **name** **(必須)**: string - 勤怠タグ名称 例: `勤怠タグの名称`
    - **description** **(必須)**: string - 勤怠タグ備考 例: `勤怠タグの備考`
    - **max_amount** **(必須)**: integer(int32) - 勤怠タグ回数上限 例: `1` (最小: 1, 最大: 999)
    - **published** **(必須)**: boolean - 勤怠タグ公開ステータス 例: `true`
    - **is_employee_usable** **(必須)**: boolean - 対象従業員が利用可能かどうか 例: `true`

### GET /api/v1/employees/{employee_id}/attendance_tags/{date}

**操作**: 勤怠タグと利用回数の取得

**説明**: 概要 指定した従業員・日付の勤怠タグと利用回数の一覧を返します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| employee_id | path | はい | integer | 従業員ID |
| date | path | はい | string(date) | 対象年月日(YYYY-MM-DD)(例:2018-08-01) |

### レスポンス (200)

successful operation

- **employee_attendance_tags** (任意): array[object]
  配列の要素:
    - **attendance_tag** **(必須)**: object
    - **amount** **(必須)**: integer(int32) - 勤怠タグ回数 例: `1` (最小: 0, 最大: 999)

### PUT /api/v1/employees/{employee_id}/attendance_tags/{date}

**操作**: 勤怠タグの更新

**説明**: 概要 指定した従業員・日付の勤怠タグを更新します。 注意点 指定した従業員・日付の勤怠タグが存在する場合は、上書き更新されます。 指定がなかった勤怠タグは削除されます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| employee_id | path | はい | integer | 従業員ID |
| date | path | はい | string(date) | 更新対象年月日(YYYY-MM-DD)(例:2018-08-01) |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 事業所ID 例: `1` (最小: 1, 最大: 2147483647)
- **employee_attendance_tags** **(必須)**: array[object] - 更新対象の勤怠タグのリスト
  配列の要素:
    - **attendance_tag_id** **(必須)**: integer(int32) - 勤怠タグID 例: `1` (最小: 1, 最大: 2147483647)
    - **amount** **(必須)**: integer(int32) - 勤怠タグ回数 例: `1` (最小: 0, 最大: 999)

### レスポンス (200)

successful operation

- **employee_attendance_tags** (任意): array[object]
  配列の要素:
    - **attendance_tag** **(必須)**: object
    - **amount** **(必須)**: integer(int32) - 勤怠タグ回数 例: `1` (最小: 0, 最大: 999)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
