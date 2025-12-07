# 従業員の特別休暇

## 概要

従業員の特別休暇の操作

## エンドポイント一覧

### GET /api/v1/employees/{employee_id}/special_holidays

**操作**: 従業員の特別休暇一覧の取得

**説明**: 概要 指定した従業員に付与された特別休暇情報をリストで返します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| employee_id | path | はい | integer | 従業員ID |
| date | query | いいえ | string(date) | 対象日 |
| start_date | query | いいえ | string(date) | 対象開始日 |
| end_date | query | いいえ | string(date) | 対象終了日 |

### レスポンス (200)

successful operation

- **employee_special_holidays** (任意): array[object]
  配列の要素:
    - **id** (任意): integer(int32) - 特別休暇付与ID 例: `1` (最小: 1, 最大: 2147483647)
    - **company_id** (任意): integer(int32) - 事業所ID 例: `1` (最小: 1, 最大: 2147483647)
    - **employee_id** (任意): integer(int32) - 従業員ID 例: `1` (最小: 1, 最大: 2147483647)
    - **special_holiday_setting_id** (任意): integer(int32) - 特別休暇設定ID 例: `1` (最小: 1, 最大: 2147483647)
    - **name** (任意): string - 特別休暇名称 例: `育休`
    - **type_name** (任意): string - 特別休暇・休業休職種別名 例: `育児休業日`
    - **paid_type** (任意): string - 有給・無給区分（paid: 有給、unpaid: 無休） (選択肢: paid, unpaid) 例: `paid`
    - **attendance_rate_calc_type** (任意): string - 出勤率計算方法（in_workdays: 出勤日数に含める、not_in_workdays: 出勤日数に含めない、not_in_total_workdays: 全労働日に含めない） (選択肢: in_workdays, not_in_workdays, not_in_total_workdays) 例: `in_workdays`
    - **usage_day** (任意): string - 最小消化単位（full: 全休、half: 半休、hour: 時間休） (選択肢: full, half, hour) 例: `half`
    - **valid_date_from** (任意): string(date) - 有効期間開始日(YYYY-MM-DD)(例:2023-01-01)
    - **valid_date_to** (任意): string(date) - 有効期間終了日(YYYY-MM-DD)(例:2023-01-31)
    - **days** (任意): integer(int32) - 付与日数 例: `2` (最小: 0, 最大: 2147483647)
    - **used** (任意): number(float) - 使用数 例: `0.5` (最小: 0, 最大: 999999999.9999)
    - **num_days_and_hours_used** (任意): object - 使用日数・時間数
    - **left** (任意): number(float) - 残数 例: `1.5` (最小: 0, 最大: 999999999.9999)
    - **num_days_and_hours_left** (任意): object - 残日数・時間数



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
