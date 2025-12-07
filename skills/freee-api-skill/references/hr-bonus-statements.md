# 賞与明細

## 概要

賞与明細の操作

## エンドポイント一覧

### GET /api/v1/bonuses/employee_payroll_statements

**操作**: 賞与明細一覧の取得

**説明**: 概要 指定した事業所に所属する従業員の賞与明細をリストで返します。 指定した年月に支払いのある賞与明細が返されます。 注意点 管理者権限を持ったユーザーのみ実行可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| year | query | はい | integer | 従業員情報を取得したい年 |
| month | query | はい | integer | 従業員情報を取得したい月 |
| limit | query | いいえ | integer | 取得レコードの件数 (デフォルト: 50, 最小: 1, 最大: 100) |
| offset | query | いいえ | integer | 取得レコードのオフセット (デフォルト: 0) |

### レスポンス (200)

successful operation

- **employee_payroll_statements** (任意): array[object]
  配列の要素:
    - **id** (任意): integer(int32) - 賞与明細ID
    - **company_id** (任意): integer(int32) - 事業所ID
    - **employee_id** (任意): integer(int32) - 従業員ID
    - **employee_name** (任意): string - 従業員の姓名
    - **employee_display_name** (任意): string - 従業員の表示名
    - **employee_num** (任意): string - 従業員番号
    - **closing_date** (任意): string(date) - 確定日
    - **pay_date** (任意): string(date) - 支払日
    - **fixed** (任意): boolean - 賞与明細が確定されているかどうか
    - **calc_status** (任意): string - 計算状況ステータス calculating: 計算中, calculated: 計算完了, error: エラー
    - **calculated_at** (任意): string(date-time) - 計算状況ステータスの更新日
    - **bonus_amount** (任意): string - 賞与額
    - **total_allowance_amount** (任意): string - 手当額合計
    - **total_deduction_amount** (任意): string - 控除額合計
    - **net_payment_amount** (任意): string - 差引支給額(手取り額)
    - **gross_payment_amount** (任意): string - 総支給額(額面)
    - **total_taxable_payment_amount** (任意): string - 課税対象支給額
    - **allowances** (任意): array[object] - 手当
    - **deductions** (任意): array[object] - 控除項目（所得税、社会保険料等）
    - **remark** (任意): string - 備考
- **total_count** (任意): integer(int32) - 合計件数

### GET /api/v1/bonuses/employee_payroll_statements/{employee_id}

**操作**: 賞与明細の取得

**説明**: 概要 指定した従業員ID、年月の賞与明細を返します。 指定した年月に支払いのある賞与明細が返されます。 注意点 管理者権限を持ったユーザーのみ実行可能です。 examples { "employee_payroll_statement": { "id": 1, "company_id": 1, "employee_id": 1, "employee_name": "給与 太郎", "employee_display_name": "給与 太郎", "employee_num": "001", "closing_date": "2018-03-31", "pay_date": "2018-03-31", "fixed": true, "calc_status": "calculated", "calculated_at": "2018-09-27T05:06:45.315Z", "bonus_amount": "300000.0", "total_allowance_amount": "0.0", "total_deduction_amount": "23830.0", "net_pay...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| year | query | はい | integer | 従業員情報を取得したい年 |
| month | query | はい | integer | 従業員情報を取得したい月 |
| employee_id | path | はい | integer | 従業員ID |

### レスポンス (200)

successful operation

- **employee_payroll_statement** (任意): object
  - **id** (任意): integer(int32) - 賞与明細ID
  - **company_id** (任意): integer(int32) - 事業所ID
  - **employee_id** (任意): integer(int32) - 従業員ID
  - **employee_name** (任意): string - 従業員の姓名
  - **employee_display_name** (任意): string - 従業員の表示名
  - **employee_num** (任意): string - 従業員番号
  - **closing_date** (任意): string(date) - 確定日
  - **pay_date** (任意): string(date) - 支払日
  - **fixed** (任意): boolean - 賞与明細が確定されているかどうか
  - **calc_status** (任意): string - 計算状況ステータス calculating: 計算中, calculated: 計算完了, error: エラー
  - **calculated_at** (任意): string(date-time) - 計算状況ステータスの更新日
  - **bonus_amount** (任意): string - 賞与額
  - **total_allowance_amount** (任意): string - 手当額合計
  - **total_deduction_amount** (任意): string - 控除額合計
  - **net_payment_amount** (任意): string - 差引支給額(手取り額)
  - **gross_payment_amount** (任意): string - 総支給額(額面)
  - **total_taxable_payment_amount** (任意): string - 課税対象支給額
  - **allowances** (任意): array[object] - 手当
  - **deductions** (任意): array[object] - 控除項目（所得税、社会保険料等）
  - **remark** (任意): string - 備考



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
