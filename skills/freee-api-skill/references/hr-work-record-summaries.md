# 勤怠タグサマリ

## 概要

勤怠タグサマリの操作

## エンドポイント一覧

### GET /api/v1/employees/{employee_id}/attendance_tag_summaries/{year}/{month}

**操作**: 勤怠タグ月次サマリの取得

**説明**: 概要 指定した従業員・年月の勤怠タグサマリを更新します。 年月は給与支払い月を指定してください。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| employee_id | path | はい | integer | 従業員ID |
| year | path | はい | integer | 勤怠タグサマリを取得したい年 |
| month | path | はい | integer | 勤怠タグサマリを取得したい月 |

### レスポンス (200)

successful operation

- **employee_attendance_tag_summaries** (任意): array[object]
  配列の要素:
    - **attendance_tag** **(必須)**: object
    - **amount** **(必須)**: integer(int32) - 勤怠タグ回数 例: `1` (最小: 0, 最大: 99999)

### PUT /api/v1/employees/{employee_id}/attendance_tag_summaries/{year}/{month}

**操作**: 勤怠タグ月次サマリの更新

**説明**: 概要 指定した従業員・年月の勤怠タグサマリを更新します。 年月は給与支払い月を指定してください。 注意点 管理者権限を持ったユーザーのみ実行可能です。 指定した従業員・年月の勤怠タグサマリが存在する場合は、上書き更新されます。 指定がなかった勤怠タグは自動的に0が設定されます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| employee_id | path | はい | integer | 従業員ID |
| year | path | はい | integer | 勤怠タグサマリを更新したい年 |
| month | path | はい | integer | 勤怠タグサマリを更新したい月 |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 事業所ID 例: `1` (最小: 1, 最大: 2147483647)
- **employee_attendance_tag_summaries** **(必須)**: array[object] - 更新対象の勤怠タグサマリのリスト
  配列の要素:
    - **attendance_tag_id** **(必須)**: integer(int32) - 勤怠タグID 例: `1` (最小: 1, 最大: 2147483647)
    - **amount** **(必須)**: integer(int32) - 勤怠タグ回数 例: `1` (最小: 0, 最大: 99999)

### レスポンス (200)

successful operation

- **employee_attendance_tag_summaries** (任意): array[object]
  配列の要素:
    - **attendance_tag** **(必須)**: object
    - **amount** **(必須)**: integer(int32) - 勤怠タグ回数 例: `1` (最小: 0, 最大: 99999)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
