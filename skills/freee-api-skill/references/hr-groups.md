# 所属

## 概要

所属の操作

## エンドポイント一覧

### GET /api/v1/employee_group_memberships

操作: 所属一覧の取得

説明: 概要 指定した事業所の指定日付時点における所属情報をリストで返します。 注意点 管理者権限を持ったユーザーのみ実行可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| base_date | query | はい | string(date) | 指定日。指定日付時点における所属情報をリストで返します。(YYYY-MM-DD)(例:2018-07-31) |
| with_no_payroll_calculation | query | いいえ | boolean | trueを指定すると給与計算対象外の従業員情報をレスポンスに含めます。 |
| employee_ids | query | いいえ | string | 取得対象とする従業員IDを指定することができます。指定しない場合は全従業員が対象となります。
(例:1,2,3,4,5)
 |
| limit | query | いいえ | integer | 取得レコードの件数 (デフォルト: 50, 最小: 1, 最大: 100) |
| offset | query | いいえ | integer | 取得レコードのオフセット (デフォルト: 0) |

### レスポンス (200)

successful operation

- employee_group_memberships (任意): array[object]
  配列の要素:
    - id (任意): integer(int32) - 従業員ID 例: `1`
    - num (任意): string - 従業員番号 例: `A-001`
    - display_name (任意): string - 従業員名（表示名） 例: `山田 太郎`
    - entry_date (任意): string(date) - 入社日 例: `2021-04-01`
    - retire_date (任意): string(date) - 退職日 例: `2022-03-31`
    - user_id (任意): integer(int32) - ユーザーID(従業員詳細未設定の場合、nullになります。) 例: `1`
    - login_email (任意): string - ログイン用メールアドレス(従業員詳細未設定の場合、nullになります。) 例: `example@example.com`
    - birth_date (任意): string(date) - 生年月日 例: `2000-01-01`
    - gender (任意): string - 性別　unselected: 未選択, male: 男性, female: 女性 (選択肢: unselected, male, female) 例: `male`
    - payroll_calculation (任意): boolean - 給与計算対象従業員の場合trueを返します 例: `true`
    - group_memberships (任意): array[object]
- total_count (任意): integer(int32) - 合計件数 例: `1`

### GET /api/v1/employees/{employee_id}/group_memberships

操作: 従業員の所属取得

説明: 概要 指定した従業員の所属情報をリストで返します。 base_dateを指定した場合は指定日付時点の所属情報を、base_dateを省略した場合は全期間の所属履歴を返します。 注意点 管理者権限を持ったユーザーのみ実行可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| employee_id | path | はい | integer | 従業員ID |
| company_id | query | はい | integer | 事業所ID |
| base_date | query | いいえ | string(date) | 指定日。指定日付時点における所属情報を返します。(YYYY-MM-DD)(例:2018-07-31)
省略した場合は全期間の所属履歴を返します。
 |
| limit | query | いいえ | integer | 取得レコードの件数 (デフォルト: 50, 最小: 1, 最大: 100) |
| offset | query | いいえ | integer | 取得レコードのオフセット (デフォルト: 0) |

### レスポンス (200)

successful operation

- group_memberships (必須): array[object]
  配列の要素:
    - id (必須): integer(int64) - グループ所属ID 例: `1`
    - start_date (必須): string(date) - 開始日 例: `2000-01-01`
    - end_date (必須): string(date) - 終了日 例: `2020-01-01`
    - boss_id (任意): integer(int64) - 上司ID 例: `1`
    - main_duty (必須): string - 主務 (選択肢: unspecified, sub_duty, main_duty) 例: `main_duty`
    - group_id (必須): integer(int32) - 部門ID 例: `10`
    - group_code (必須): string - 部門コード 例: `group2`
    - group_name (必須): string - 部門名称 例: `営業部`
    - position_id (任意): integer(int32) - 役職ID 例: `1`
    - position_code (任意): string - 役職コード 例: `position1`
    - position_name (任意): string - 役職名称 例: `部長`
- total_count (必須): integer(int32) - 合計件数 例: `1`



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
