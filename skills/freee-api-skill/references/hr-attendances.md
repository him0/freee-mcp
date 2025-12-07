# 勤怠

## 概要

勤怠の操作

## エンドポイント一覧

### GET /api/v1/employees/{employee_id}/work_records/{date}

**操作**: 勤怠の取得

**説明**: 概要 指定した従業員・日付の勤怠情報を返します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| employee_id | path | はい | integer | 従業員ID |
| date | path | はい | string(date) | 従業員情報を取得したい年月日(YYYY-MM-DD)(例:2018-08-01) |

### レスポンス (200)

successful operation


### PUT /api/v1/employees/{employee_id}/work_records/{date}

**操作**: 勤怠の更新

**説明**: 概要 指定した従業員の勤怠情報を更新します。 注意点 振替出勤・振替休日・代休出勤・代休の登録はAPIでは行うことができません。 examples 出勤日について出退勤時刻および休憩時間を更新する場合は以下のようなパラメータをリクエストします。 { "company_id": 1, "break_records": [ { "clock_in_at": "2017-05-25 12:00:00", "clock_out_at": "2017-05-25 13:00:00" } ], "work_record_segments": [ { "clock_in_at": "2017-05-25 09:10:00", "clock_out_at": "2017-05-25 18:20:00" } ] } 勤務パターンや既定の所定労働時間を変更する場合は use_default_work_pattern に false を指定するとともに、各設定を上書きするパラメータをリクエストします。 { "company_id": 1, "break_records": [ { "clock_in_at"...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| employee_id | path | はい | integer | 従業員ID |
| date | path | はい | string(date) | 更新対象年月日(YYYY-MM-DD)(例:2018-08-01) |

### リクエストボディ


### レスポンス (200)

successful operation

- **break_records** (任意): array[object] - 休憩時間のリスト
  配列の要素:
    - **clock_in_at** (任意): string(date-time) - 開始時刻
    - **clock_out_at** (任意): string(date-time) - 終了時刻
- **work_record_segments** (任意): array[object] - 出退勤のリスト
  - 登録されている全ての出退勤時間のリストを返します。
  配列の要素:
    - **clock_in_at** (任意): string(date-time) - 開始時刻
    - **clock_out_at** (任意): string(date-time) - 終了時刻
- **clock_in_at** (任意): string(date-time) - 出勤時刻
  - 出勤時刻を返します。出退勤が複数登録されている場合は、最初の出退勤の出勤時間を返します。
- **clock_out_at** (任意): string(date-time) - 退勤時刻
  - 退勤時刻を返します。出退勤が複数登録されている場合は、最後の出退勤の退勤時間を返します。
- **date** (任意): string(date-time) - 対象日付
- **day_pattern** (任意): string - 勤務パターン
- normal_day: 所定労働日
- prescribed_holiday: 所定休日
- legal_holiday: 法定休日 (選択肢: normal_day, prescribed_holiday, legal_holiday)
- **schedule_pattern** (任意): string - スケジュールパターン
- substitute_holiday_work: 振替出勤
- substitute_holiday: 振替休日
- compensatory_holiday_work: 代休出勤
- compensatory_holiday: 代休
- special_holiday: 特別休暇 (選択肢: , substitute_holiday_work, substitute_holiday, compensatory_holiday_work, compensatory_holiday, special_holiday)
- **early_leaving_mins** (任意): integer(int32) - 早退分の時間（分単位）
- **half_special_holiday_mins** (任意): integer(int32) - 特別休暇の半休を利用した時間（分単位）
- **hourly_special_holiday_mins** (任意): integer(int32) - 特別休暇の時間休を利用した時間（分単位）
- **is_absence** (任意): boolean - 欠勤かどうか 例: `false`
- **is_editable** (任意): boolean - 勤怠データが編集可能かどうか
- **lateness_mins** (任意): integer(int32) - 遅刻分の時間（分単位）
- **normal_work_clock_in_at** (任意): string(date-time) - 所定労働開始時刻
- **normal_work_clock_out_at** (任意): string(date-time) - 所定労働終了時刻
- **normal_work_mins** (任意): integer(int32) - 所定労働時間
- **note** (任意): string - 勤怠メモ
- **paid_holidays** (任意): array[object] - 年次有給休暇の実績
  配列の要素:
    - **type** **(必須)**: string - 有給休暇の種別取得単位（full:全休、half:半休、morning_off:午前休、 afternoon_off:午後休、hourly:時間休） (選択肢: full, half, morning_off, afternoon_off, hourly) 例: `half`
    - **mins** **(必須)**: integer(int32) - 年次有給休暇の休暇時間（分単位） 例: `240`
    - **days** **(必須)**: number(float) - 年次有給休暇の消化日数（全休：1, 半日単位：0.5, 時間休：0） 例: `0.5`
- **special_holiday** (任意): number(float) - この日に対する特別休暇取得日数。半休の場合は0.5が入ります。時間休の場合はhourly_special_holiday_minsを所定労働時間で割った値が入るため、実際の時間を確認するにはhourly_special_holiday_minsを参照してください。
- **special_holiday_setting_id** (任意): integer(int32) - 特別休暇設定ID
- **use_attendance_deduction** (任意): boolean - 欠勤・遅刻・早退を控除対象時間に算入するかどうか
- **use_default_work_pattern** (任意): boolean - デフォルトの勤務時間設定を使っているかどうか
- **use_half_compensatory_holiday** (任意): boolean - 代休の半休を利用したかどうか 例: `false`
- **total_overtime_work_mins** (任意): integer(int32) - 時間外労働時間（分）（Webの勤怠登録画面にて詳細項目の「勤務時間の長さを自動で計算しない」にチェックを入れた場合0が返却されます。時間外労働時間はtotal_overtime_except_normal_work_minsを参照してください。）
- **total_holiday_work_mins** (任意): integer(int32) - 法定休日労働時間（分）
- **total_latenight_work_mins** (任意): integer(int32) - 深夜労働時間（分）
- **not_auto_calc_work_time** (任意): boolean - 勤怠登録時に勤務時間の長さを自動で計算しないかどうか 例: `false`
- **total_excess_statutory_work_mins** (任意): integer(int32) - 法定内残業時間（分）
- **total_latenight_excess_statutory_work_mins** (任意): integer(int32) - 深夜の法定内残業時間（分）
- **total_overtime_except_normal_work_mins** (任意): integer(int32) - 所定外法定外労働時間（分）
- **total_latenight_overtime_except_normal_work_min** (任意): integer(int32) - 深夜の所定外法定外労働時間（分）

### DELETE /api/v1/employees/{employee_id}/work_records/{date}

**操作**: 勤怠の削除

**説明**: 概要 指定した従業員の勤怠情報を削除します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| employee_id | path | はい | integer | 従業員ID |
| date | path | はい | string(date) | 削除対象年月日(YYYY-MM-DD)(例:2018-08-01) |
| company_id | query | はい | integer(int32) | 事業所ID |

### レスポンス (204)

successful operation



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
