# 所属

## 概要

所属の操作

## エンドポイント一覧

### GET /api/v1/employee_group_memberships

**操作**: 所属一覧の取得

**説明**: 概要 指定した事業所の指定日付時点における所属情報をリストで返します。 注意点 管理者権限を持ったユーザーのみ実行可能です。

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

- **employee_group_memberships** (任意): array[object]
  配列の要素:
    - **id** (任意): integer(int32) - 従業員ID 例: `1`
    - **num** (任意): string - 従業員番号 例: `A-001`
    - **display_name** (任意): string - 従業員名（表示名） 例: `山田 太郎`
    - **entry_date** (任意): string(date) - 入社日 例: `2021-04-01`
    - **retire_date** (任意): string(date) - 退職日 例: `2022-03-31`
    - **user_id** (任意): integer(int32) - ユーザーID(従業員詳細未設定の場合、nullになります。) 例: `1`
    - **login_email** (任意): string - ログイン用メールアドレス(従業員詳細未設定の場合、nullになります。) 例: `example@example.com`
    - **birth_date** (任意): string(date) - 生年月日 例: `2000-01-01`
    - **gender** (任意): string - 性別　unselected: 未選択, male: 男性, female: 女性 (選択肢: unselected, male, female) 例: `male`
    - **payroll_calculation** (任意): boolean - 給与計算対象従業員の場合trueを返します 例: `true`
    - **group_memberships** (任意): array[object]
- **total_count** (任意): integer(int32) - 合計件数 例: `1`



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
