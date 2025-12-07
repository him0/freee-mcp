# 給与明細

## 概要

給与明細の操作

## エンドポイント一覧

### GET /api/v1/salaries/employee_payroll_statements

**操作**: 給与明細一覧の取得

**説明**: 概要 指定した事業所に所属する従業員の給与明細をリストで返します。 指定した年月に支払いのある給与明細が返されます。 注意点 複数時給を設定している場合はpaymentsに内訳が返されます。 管理者権限を持ったユーザーのみ実行可能です。 給与計算中の場合は、各パラメータはnullおよび空配列が返ります。

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
    - **id** (任意): integer(int32) - 給与明細ID
    - **company_id** (任意): integer(int32) - 事業所ID
    - **employee_id** (任意): integer(int32) - 従業員ID
    - **employee_name** (任意): string - 従業員の姓名
    - **employee_display_name** (任意): string - 従業員の表示名
    - **employee_num** (任意): string - 従業員番号
    - **pay_date** (任意): string(date) - 支払日
    - **start_date** (任意): string(date) - 給与計算開始日（固定給）
    - **closing_date** (任意): string(date) - 給与計算締日（固定給）
    - **variable_pay_start_date** (任意): string(date) - 給与計算開始日（変動給） 残業手当、遅刻早退・欠勤などの計算に使われる期間
    - **variable_pay_closing_date** (任意): string(date) - 給与計算締日（変動給）
    - **fixed** (任意): boolean - 給与明細が確定されているかどうか
    - **calc_status** (任意): string - 計算状況ステータス calculating: 計算中, calculated: 計算完了, overwritten: 直接編集, imported: インポート, error: エラー
    - **calculated_at** (任意): string(date-time) - 計算状況ステータスの更新日
    - **pay_calc_type** (任意): string - 給与形態 monthly: 月給, daily: 日給, hourly: 時給, (空文字列): 計算中 (選択肢: monthly, daily, hourly, ) 例: `monthly`
    - **board_member_remuneration_amount** (任意): string - 役員報酬
    - **basic_pay_amount** (任意): string - 基本給
    - **work_days** (任意): string - 労働日数
    - **normal_work_time** (任意): string - 労働時間のうち、所定労働時間に該当するもの
    - **normal_work_days** (任意): string - 所定労働出勤日数
    - **work_mins_by_paid_holiday** (任意): string - 有給休暇時間数
    - **num_paid_holidays** (任意): string - 有給日数
    - **is_board_member** (任意): boolean - 役員かどうか
    - **total_attendance_deduction_amount** (任意): string - 勤怠控除額合計
    - **total_allowance_amount** (任意): string - 支給手当額合計
    - **total_deduction_amount** (任意): string - 控除額合計
    - **total_deduction_employer_share** (任意): string - 法定福利費の会社負担分の合計（健康保険、厚生年金、雇用保険等）
    - **net_payment_amount** (任意): string - 差引支給額(手取り額)
    - **gross_payment_amount** (任意): string - 総支給額(額面)
    - **total_worked_days_count** (任意): string - 平日と休日の合計労働日数（日給用）
    - **total_taxable_payment_amount** (任意): string - 課税対象支給額
    - **total_expense_amount** (任意): string - 総経費精算額
    - **total_transfer_amount** (任意): string - 総振込額
    - **total_annual_payment_amount** (任意): string - 課税支給累計額
    - **payments** (任意): array[object] - 支給項目（基本給、残業代、通勤手当等）
    - **deductions** (任意): array[object] - 控除項目（健康保険、厚生年金、雇用保険等）
    - **deductions_employer_share** (任意): array[object] - 法定福利費の会社負担分（健康保険、厚生年金、雇用保険等）
    - **attendances** (任意): array[object] - 勤怠控除項目（遅刻早退控除、欠勤控除等）
    - **overtime_pays** (任意): array[object] - 時間外労働項目(法定内残業、時間外労働、法定休日労働、深夜労働等)
    - **remark** (任意): string - 備考
- **total_count** (任意): integer(int32) - 指定した年月に支払いのある給与明細の合計件数 例: `1` (最小: 0, 最大: 2147483647)

### GET /api/v1/salaries/employee_payroll_statements/{employee_id}

**操作**: 給与明細の取得

**説明**: 概要 指定した従業員ID、年月の給与明細を返します。 指定した年月に支払いのある給与明細が返されます。 注意点 複数時給を設定している場合はpaymentsに内訳が返されます。 管理者権限を持ったユーザーのみ実行可能です。 給与計算中の場合は、各パラメータはnullおよび空配列が返ります。 examples { "employee_payroll_statement": { "id": 1, "company_id": 1, "employee_id": 1, "employee_name": "給与 太郎", "employee_display_name": "給与 太郎", "employee_num": "001", "pay_date": "2018-02-25", "start_date": "2018-02-01", "closing_date": "2018-02-28", "variable_pay_start_date": "2018-01-01", "variable_pay_closing_date": "2018-01-31", "fixed": true, "...

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
  - **id** (任意): integer(int32) - 給与明細ID
  - **company_id** (任意): integer(int32) - 事業所ID
  - **employee_id** (任意): integer(int32) - 従業員ID
  - **employee_name** (任意): string - 従業員の姓名
  - **employee_display_name** (任意): string - 従業員の表示名
  - **employee_num** (任意): string - 従業員番号
  - **pay_date** (任意): string(date) - 支払日
  - **start_date** (任意): string(date) - 給与計算開始日（固定給）
  - **closing_date** (任意): string(date) - 給与計算締日（固定給）
  - **variable_pay_start_date** (任意): string(date) - 給与計算開始日（変動給） 残業手当、遅刻早退・欠勤などの計算に使われる期間
  - **variable_pay_closing_date** (任意): string(date) - 給与計算締日（変動給）
  - **fixed** (任意): boolean - 給与明細が確定されているかどうか
  - **calc_status** (任意): string - 計算状況ステータス calculating: 計算中, calculated: 計算完了, overwritten: 直接編集, imported: インポート, error: エラー
  - **calculated_at** (任意): string(date-time) - 計算状況ステータスの更新日
  - **pay_calc_type** (任意): string - 給与形態 monthly: 月給, daily: 日給, hourly: 時給, (空文字列): 計算中 (選択肢: monthly, daily, hourly, ) 例: `monthly`
  - **board_member_remuneration_amount** (任意): string - 役員報酬
  - **basic_pay_amount** (任意): string - 基本給
  - **work_days** (任意): string - 労働日数
  - **normal_work_time** (任意): string - 労働時間のうち、所定労働時間に該当するもの
  - **normal_work_days** (任意): string - 所定労働出勤日数
  - **work_mins_by_paid_holiday** (任意): string - 有給休暇時間数
  - **num_paid_holidays** (任意): string - 有給日数
  - **is_board_member** (任意): boolean - 役員かどうか
  - **total_attendance_deduction_amount** (任意): string - 勤怠控除額合計
  - **total_allowance_amount** (任意): string - 支給手当額合計
  - **total_deduction_amount** (任意): string - 控除額合計
  - **total_deduction_employer_share** (任意): string - 法定福利費の会社負担分の合計（健康保険、厚生年金、雇用保険等）
  - **net_payment_amount** (任意): string - 差引支給額(手取り額)
  - **gross_payment_amount** (任意): string - 総支給額(額面)
  - **total_worked_days_count** (任意): string - 平日と休日の合計労働日数（日給用）
  - **total_taxable_payment_amount** (任意): string - 課税対象支給額
  - **total_expense_amount** (任意): string - 総経費精算額
  - **total_transfer_amount** (任意): string - 総振込額
  - **total_annual_payment_amount** (任意): string - 課税支給累計額
  - **payments** (任意): array[object] - 支給項目（基本給、残業代、通勤手当等）
  - **deductions** (任意): array[object] - 控除項目（健康保険、厚生年金、雇用保険等）
  - **deductions_employer_share** (任意): array[object] - 法定福利費の会社負担分（健康保険、厚生年金、雇用保険等）
  - **attendances** (任意): array[object] - 勤怠控除項目（遅刻早退控除、欠勤控除等）
  - **overtime_pays** (任意): array[object] - 時間外労働項目(法定内残業、時間外労働、法定休日労働、深夜労働等)
  - **remark** (任意): string - 備考



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
