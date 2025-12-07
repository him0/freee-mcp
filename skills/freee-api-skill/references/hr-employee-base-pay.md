# 従業員の基本給

## 概要

従業員の基本給の操作

## エンドポイント一覧

### GET /api/v1/employees/{employee_id}/basic_pay_rule

**操作**: 従業員の基本給の取得

**説明**: 概要 指定した従業員・日付の基本給情報を返します。 注意点 管理者権限を持ったユーザーのみ実行可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| year | query | はい | integer | 従業員情報を取得したい年 |
| month | query | はい | integer | 従業員情報を取得したい月<br>
締め日支払い日設定が翌月払いの従業員情報の場合は、 指定したmonth + 1の値が検索結果として返します。<br>
翌月払いの従業員の2022/01の従業員情報を取得する場合は、year=2021,month=12を指定してください。<br> |
| employee_id | path | はい | integer | 従業員ID |

### レスポンス (200)

successful operation

- **employee_basic_pay_rule** (任意): object
  - **id** (任意): integer(int32) - 従業員の基本給ID (最小: 1, 最大: 2147483647)
  - **company_id** (任意): integer(int32) - 事業所ID (最小: 1, 最大: 2147483647)
  - **employee_id** (任意): integer(int32) - 従業員ID (最小: 1, 最大: 2147483647)
  - **pay_calc_type** (任意): string - 給与方式 monthly: 月給, daily: 日給, hourly: 時給 (選択肢: monthly, daily, hourly)
  - **pay_amount** (任意): integer(int32) - 基本給 (最小: 0, 最大: 99999999)

### PUT /api/v1/employees/{employee_id}/basic_pay_rule

**操作**: 従業員の基本給の更新

**説明**: 概要 指定した従業員の基本給情報を更新します。 注意点 管理者権限を持ったユーザーのみ実行可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| employee_id | path | はい | integer | 従業員ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 更新対象事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **year** **(必須)**: integer(int32) - 更新対象年（必須） 例: `2021` (最小: 2000, 最大: 2100)
- **month** **(必須)**: integer(int32) - 更新対象月（必須）<br>
締め日支払い日設定が翌月払いの従業員情報の場合は、 指定したmonth + 1の値が更新されます<br>
翌月払いの従業員の2022/01の従業員情報を更新する場合は、year=2021,month=12を指定してください。<br> 例: `1` (最小: 1, 最大: 12)
- **employee_basic_pay_rule** **(必須)**: object
  - **pay_calc_type** **(必須)**: string - 給与方式 null不可 monthly: 月給, daily: 日給, hourly: 時給 (選択肢: monthly, daily, hourly) 例: `monthly`
  - **pay_amount** **(必須)**: integer(int32) - 基本給 null不可 例: `220000` (最小: 0, 最大: 99999999)

### レスポンス (200)

successful operation

- **employee_basic_pay_rule** (任意): object
  - **id** (任意): integer(int32) - 従業員の基本給ID (最小: 1, 最大: 2147483647)
  - **company_id** (任意): integer(int32) - 事業所ID (最小: 1, 最大: 2147483647)
  - **employee_id** (任意): integer(int32) - 従業員ID (最小: 1, 最大: 2147483647)
  - **pay_calc_type** (任意): string - 給与方式 monthly: 月給, daily: 日給, hourly: 時給 (選択肢: monthly, daily, hourly)
  - **pay_amount** (任意): integer(int32) - 基本給 (最小: 0, 最大: 99999999)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
