# 勤怠情報サマリ

## 概要

勤怠情報の月次サマリの操作

## エンドポイント一覧

### GET /api/v1/employees/{employee_id}/work_record_summaries/{year}/{month}

**操作**: 勤怠情報月次サマリの取得

**説明**: 概要 指定した従業員、月の勤怠情報のサマリを返します。 注意点 work_recordsオプションにtrueを指定することで、明細となる日次の勤怠情報もあわせて返却します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| work_records | query | いいえ | boolean | サマリ情報に日次の勤怠情報を含める(true/false)(デフォルト: false) |
| employee_id | path | はい | integer | 従業員ID |
| year | path | はい | integer | 従業員情報を取得したい年 |
| month | path | はい | integer | 従業員情報を取得したい月 |

### レスポンス (200)

successful operation

- **year** (任意): integer(int32) - 給与支払い年
- **month** (任意): integer(int32) - 給与支払い月 (最小: 1, 最大: 12)
- **start_date** (任意): string(date) - 集計開始日
- **end_date** (任意): string(date) - 集計終了日
- **work_days** (任意): number(float) - 労働日数
- **total_work_mins** (任意): integer(int32) - 総勤務時間（分）
- **total_normal_work_mins** (任意): integer(int32) - 所定内労働時間（分）
- **total_excess_statutory_work_mins** (任意): integer(int32) - 給与計算に用いられる法定内残業時間（分）
- **total_overtime_except_normal_work_mins** (任意): integer(int32) - 所定外法定外労働時間
- **total_overtime_within_normal_work_mins** (任意): integer(int32) - 所定内法定外労働時間（裁量労働制の場合はみなしベース）
- **total_holiday_work_mins** (任意): integer(int32) - 法定休日労働時間（分）
- **total_latenight_work_mins** (任意): integer(int32) - 深夜労働allow(company)時間（分）
- **num_absences** (任意): number(float) - 欠勤日数
- **num_paid_holidays** (任意): number(float) - 有給取得日数
- **num_paid_holidays_and_hours** (任意): object
  - **days** (任意): number(float) - 日数 0.5は半休を表す
  - **hours** (任意): integer(int32) - 時間数
- **num_paid_holidays_left** (任意): number(float) - 有給残日数
- **num_paid_holidays_and_hours_left** (任意): object
  - **days** (任意): number(float) - 日数 0.5は半休を表す
  - **hours** (任意): integer(int32) - 時間数
- **num_substitute_holidays_used** (任意): number(float) - 振替休日の使用日数
- **num_compensatory_holidays_used** (任意): number(float) - 代休の使用日数
- **num_special_holidays_used** (任意): number(float) - 特別休暇の使用日数
- **num_special_holidays_and_hours_used** (任意): object
  - **days** (任意): number(float) - 日数 0.5は半休を表す
  - **hours** (任意): integer(int32) - 時間数
- **total_lateness_and_early_leaving_mins** (任意): integer(int32) - 遅刻早退時間（分）
- **multi_hourly_wages** (任意): array[object] - 複数時給の労働時間の内訳（複数時給を設定している従業員のみ）
  配列の要素:
    - **name** (任意): string - 時給名
    - **total_normal_time_mins** (任意): integer(int32) - 所定内労働時間（分）
- **work_records** (任意): array[object] - 日々の勤怠情報
- **total_shortage_work_mins** (任意): integer(int32) - 不足時間（分）
- **total_deemed_paid_excess_statutory_work_mins** (任意): integer(int32) - みなし外の法定内残業時間（分）
- **total_deemed_paid_overtime_except_normal_work_mins** (任意): integer(int32) - みなし外の時間外労働時間（分）

### PUT /api/v1/employees/{employee_id}/work_record_summaries/{year}/{month}

**操作**: 勤怠情報月次サマリの更新

**説明**: 概要 指定した従業員、月の勤怠情報のサマリを更新します。 注意点 管理者権限を持ったユーザーのみ実行可能です。 日毎の勤怠の更新はこのAPIではできません。日毎の勤怠の操作には勤怠APIを使用して下さい。 勤怠データが存在しない場合は新規作成、既に存在する場合は上書き更新されます。 値が設定された項目のみ更新されます。値が設定されなかった場合は自動的に0が設定されます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| employee_id | path | はい | integer | 従業員ID |
| year | path | はい | integer | 更新対象年 |
| month | path | はい | integer | 更新対象月 |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **work_days** (任意): number(float) - 総勤務日数 (最小: 0, 最大: 31)
- **work_days_on_weekdays** (任意): number(float) - 所定労働日の勤務日数 (最小: 0, 最大: 31)
- **work_days_on_prescribed_holidays** (任意): number(float) - 所定休日の勤務日数 (最小: 0, 最大: 31)
- **work_days_on_legal_holidays** (任意): number(float) - 法定休日の勤務日数 (最小: 0, 最大: 31)
- **total_work_mins** (任意): integer - 労働時間（分） (最小: 0, 最大: 2147483647)
- **total_normal_work_mins** (任意): integer - 所定労働時間（分） (最小: 0, 最大: 2147483647)
- **total_excess_statutory_work_mins** (任意): integer - 給与計算に用いられる法定内残業時間（分） (最小: 0, 最大: 2147483647)
- **total_holiday_work_mins** (任意): integer - 法定休日労働時間（分） (最小: 0, 最大: 2147483647)
- **total_latenight_work_mins** (任意): integer - 深夜労働時間（分） (最小: 0, 最大: 2147483647)
- **total_actual_excess_statutory_work_mins** (任意): integer - 実労働時間ベースの法定内残業時間（分） (最小: 0, 最大: 2147483647)
- **total_overtime_work_mins** (任意): integer - 時間外労働時間（分） (最小: 0, 最大: 2147483647)
- **num_absences** (任意): number(float) - 欠勤日数 (最小: 0, 最大: 31)
- **num_absences_for_deduction** (任意): number(float) - 控除対象の欠勤日数

フレックスタイム制の場合は、指定した値が反映されず無視されます。 (最小: 0, 最大: 9999.999)
- **total_lateness_mins** (任意): integer - 遅刻時間（分） (最小: 0, 最大: 2147483647)
- **total_lateness_mins_for_deduction** (任意): integer - 控除対象の遅刻時間（分）

フレックスタイム制と裁量労働制の場合は、指定した値が反映されず無視されます。 (最小: 0, 最大: 2147483647)
- **total_early_leaving_mins** (任意): integer - 早退時間（分） (最小: 0, 最大: 2147483647)
- **total_early_leaving_mins_for_deduction** (任意): integer - 控除対象の早退時間（分）

フレックスタイム制と裁量労働制の場合は、指定した値が反映されず無視されます。 (最小: 0, 最大: 2147483647)
- **num_paid_holidays** (任意): number(float) - 有給取得日数 (最小: 0, 最大: 31)
- **total_shortage_work_mins** (任意): integer - 不足時間（分）（フレックスタイム制でのみ使用） (最小: 0, 最大: 2147483647)
- **total_deemed_paid_excess_statutory_work_mins** (任意): integer - みなし外の法定内残業時間（分）（裁量労働制でのみ使用） (最小: 0, 最大: 2147483647)
- **total_deemed_paid_overtime_except_normal_work_mins** (任意): integer - みなし外の時間外労働時間（分）（裁量労働制でのみ使用） (最小: 0, 最大: 2147483647)

### レスポンス (200)

successful operation

- **year** (任意): integer(int32) - 給与支払い年
- **month** (任意): integer(int32) - 給与支払い月 (最小: 1, 最大: 12)
- **start_date** (任意): string(date) - 集計開始日
- **end_date** (任意): string(date) - 集計終了日
- **work_days** (任意): number(float) - 労働日数
- **total_work_mins** (任意): integer(int32) - 総勤務時間（分）
- **total_normal_work_mins** (任意): integer(int32) - 所定内労働時間（分）
- **total_excess_statutory_work_mins** (任意): integer(int32) - 給与計算に用いられる法定内残業時間（分）
- **total_overtime_except_normal_work_mins** (任意): integer(int32) - 所定外法定外労働時間
- **total_overtime_within_normal_work_mins** (任意): integer(int32) - 所定内法定外労働時間（裁量労働制の場合はみなしベース）
- **total_holiday_work_mins** (任意): integer(int32) - 法定休日労働時間（分）
- **total_latenight_work_mins** (任意): integer(int32) - 深夜労働allow(company)時間（分）
- **num_absences** (任意): number(float) - 欠勤日数
- **num_paid_holidays** (任意): number(float) - 有給取得日数
- **num_paid_holidays_and_hours** (任意): object
  - **days** (任意): number(float) - 日数 0.5は半休を表す
  - **hours** (任意): integer(int32) - 時間数
- **num_paid_holidays_left** (任意): number(float) - 有給残日数
- **num_paid_holidays_and_hours_left** (任意): object
  - **days** (任意): number(float) - 日数 0.5は半休を表す
  - **hours** (任意): integer(int32) - 時間数
- **num_substitute_holidays_used** (任意): number(float) - 振替休日の使用日数
- **num_compensatory_holidays_used** (任意): number(float) - 代休の使用日数
- **num_special_holidays_used** (任意): number(float) - 特別休暇の使用日数
- **num_special_holidays_and_hours_used** (任意): object
  - **days** (任意): number(float) - 日数 0.5は半休を表す
  - **hours** (任意): integer(int32) - 時間数
- **total_lateness_and_early_leaving_mins** (任意): integer(int32) - 遅刻早退時間（分）
- **multi_hourly_wages** (任意): array[object] - 複数時給の労働時間の内訳（複数時給を設定している従業員のみ）
  配列の要素:
    - **name** (任意): string - 時給名
    - **total_normal_time_mins** (任意): integer(int32) - 所定内労働時間（分）
- **work_records** (任意): array[object] - 日々の勤怠情報
- **total_shortage_work_mins** (任意): integer(int32) - 不足時間（分）
- **total_deemed_paid_excess_statutory_work_mins** (任意): integer(int32) - みなし外の法定内残業時間（分）
- **total_deemed_paid_overtime_except_normal_work_mins** (任意): integer(int32) - みなし外の時間外労働時間（分）



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
