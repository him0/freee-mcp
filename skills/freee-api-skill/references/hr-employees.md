# 従業員

## 概要

従業員の操作

## エンドポイント一覧

### GET /api/v1/companies/{company_id}/employees

**操作**: 全期間の従業員一覧の取得

**説明**: 概要 指定した事業所に所属する従業員をリストで返します。 注意点 管理者権限を持ったユーザーのみ実行可能です。 退職ユーザーも含めて取得可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| limit | query | いいえ | integer | 取得レコードの件数 (デフォルト: 50, 最小: 1, 最大: 100) |
| offset | query | いいえ | integer | 取得レコードのオフセット (デフォルト: 0) |
| company_id | path | はい | integer | 事業所ID |
| with_no_payroll_calculation | query | いいえ | boolean | trueを指定すると給与計算対象外の従業員情報をレスポンスに含めます。 |

### レスポンス (200)

successful operation


### GET /api/v1/employees

**操作**: 従業員一覧の取得

**説明**: 概要 指定した対象年月に事業所に所属する従業員をリストで返します。 注意点 管理者権限を持ったユーザーのみ実行可能です。 指定した年月に退職済みユーザーは取得できません。 保険料計算方法が自動計算の場合、対応する保険料の直接指定金額は無視されnullが返されます。(例: 給与計算時の健康保険料の計算方法が自動計算の場合、給与計算時の健康保険料の直接指定金額はnullが返されます) 事業所が定額制の健康保険組合に加入している場合、保険料の直接指定金額は無視されnullが返されます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| year | query | はい | integer | 従業員情報を取得したい年 |
| month | query | はい | integer | 従業員情報を取得したい月<br>
締め日支払い日設定が翌月払いの従業員情報の場合は、 指定したmonth + 1の値が検索結果として返します。<br>
翌月払いの従業員の2022/01の従業員情報を取得する場合は、year=2021,month=12を指定してください。<br> |
| limit | query | いいえ | integer | 取得レコードの件数 (デフォルト: 50, 最小: 1, 最大: 100) |
| offset | query | いいえ | integer | 取得レコードのオフセット (デフォルト: 0) |
| with_no_payroll_calculation | query | いいえ | boolean | trueを指定すると給与計算対象外の従業員情報をレスポンスに含めます。 |

### レスポンス (200)

successful operation

- **employees** (任意): array[object]
  配列の要素:
    - **id** (任意): integer(int32) - 従業員ID
    - **company_id** (任意): integer(int32) - 事業所ID
    - **num** (任意): string - 従業員番号
    - **display_name** (任意): string - 従業員名（表示名）
    - **base_pension_num** (任意): string - 基礎年金番号
    - **employment_insurance_reference_number** (任意): string - 被保険者番号（雇用保険）
    - **birth_date** (任意): string(date) - 生年月日
    - **entry_date** (任意): string(date) - 入社日
    - **retire_date** (任意): string(date) - 退職日
    - **user_id** (任意): integer(int32) - ユーザーID(従業員詳細未設定の場合、nullになります。)
    - **profile_rule** (任意): object
    - **health_insurance_rule** (任意): object
    - **welfare_pension_insurance_rule** (任意): object
    - **dependent_rules** (任意): array[object] - 家族情報
    - **bank_account_rule** (任意): object
    - **basic_pay_rule** (任意): object
    - **payroll_calculation** (任意): boolean - 給与計算対象従業員の場合trueを返します 例: `true`
    - **company_reference_date_rule_name** (任意): string - 締め日支払い日グループ名(給与計算対象外従業員の場合、nullを返します) 例: `当月締め翌月払い`
- **total_count** (任意): integer(int32) - 合計件数

### POST /api/v1/employees

**操作**: 従業員の作成

**説明**: 概要 従業員を新規作成します。 注意点 管理者権限を持ったユーザーのみ実行可能です。

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 作成対象事業所ID（必須） (最小: 1, 最大: 2147483647)
- **employee** **(必須)**: object
  - **num** (任意): string - 従業員番号<br>
従業員を判別しやすいよう管理することができます。（例: 1人目の正社員を A-001 と入力） 例: `A-001`
  - **working_hours_system_name** (任意): string - <a href="https://support.freee.co.jp/hc/ja/articles/360000562403-労働時間制度と勤務-賃金設定について" target="_blank">勤務・賃金設定名</a>
で設定した名称を指定してください。
- 未指定の際は、最初に登録したデータが利用されます。
- 入力パラメータのno_payroll_calculationがtrueの場合に指定するとエラーになります。 例: `固定`
  - **company_reference_date_rule_name** (任意): string - <a href="https://support.freee.co.jp/hc/ja/articles/360000666303-締め日支払い日を変更する方法は-" target="_blank">締め日支払い日グループ名</a>
で設定した締め日支払い日を指定してください。
- 未指定の際は、最初に登録したデータが利用されます。
- 入力パラメータのno_payroll_calculationがtrueの場合に指定するとエラーになります。 例: `15日締め（当月25日払い）`
  - **last_name** **(必須)**: string - 姓（必須）<br>
last_nameとfirst_nameを空白文字で結合した文字列がdisplay_nameとして登録されます。
- 例）last_name=田中、first_name＝太郎の場合、display_name＝田中 太郎
- display_nameはput apiで更新可能です。 例: `山田`
  - **first_name** **(必須)**: string - 名（必須）<br>
last_nameとfirst_nameを空白文字で結合した文字列がdisplay_nameとして登録されます。
- 例）last_name=田中、first_name＝太郎の場合、display_name＝田中 太郎
- display_nameはput apiで更新可能です。 例: `太郎`
  - **last_name_kana** **(必須)**: string - 姓カナ（必須） 例: `ヤマダ`
  - **first_name_kana** **(必須)**: string - 名カナ（必須） 例: `タロウ`
  - **birth_date** **(必須)**: string(date) - 生年月日（必須） 例: `2000-01-01` (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
  - **entry_date** **(必須)**: string(date) - 入社日（必須） 例: `2021-04-01` (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
  - **pay_calc_type** (任意): string - 給与方式 monthly: 月給, daily: 日給, hourly: 時給
- フレックスタイム制を使用している場合はmonthly以外指定できません。
- 入力パラメータのno_payroll_calculationがfalseの場合は必須になります。
- 入力パラメータのno_payroll_calculationがtrueの場合に指定するとエラーになります。 (選択肢: monthly, daily, hourly) 例: `monthly`
  - **pay_amount** (任意): integer(int32) - 基本給
- 入力パラメータのno_payroll_calculationがfalseの場合は必須になります。
- 入力パラメータのno_payroll_calculationがtrueの場合に指定するとエラーになります。 例: `220000` (最小: 0, 最大: 99999999)
  - **gender** (任意): string - 性別　unselected: 未選択, male: 男性, female: 女性（デフォルト: unselected: 未選択） (選択肢: unselected, male, female) 例: `male`
  - **married** (任意): boolean - 配偶者の有無（デフォルト: false）
  - **no_payroll_calculation** (任意): boolean - 給与計算対象外の従業員情報を作成する場合はtrueを指定します 例: `true`

### レスポンス (201)

successful operation

- **employee** (任意): object
  - **id** (任意): integer(int32) - 従業員ID
  - **company_id** (任意): integer(int32) - 事業所ID
  - **num** (任意): string - 従業員番号
  - **display_name** (任意): string - 従業員名（表示名）
  - **base_pension_num** (任意): string - 基礎年金番号
  - **employment_insurance_reference_number** (任意): string - 被保険者番号（雇用保険）
  - **birth_date** (任意): string(date) - 生年月日
  - **entry_date** (任意): string(date) - 入社日
  - **retire_date** (任意): string(date) - 退職日
  - **user_id** (任意): integer(int32) - ユーザーID(従業員詳細未設定の場合、nullになります。)
  - **profile_rule** (任意): object
  - **health_insurance_rule** (任意): object
  - **welfare_pension_insurance_rule** (任意): object
  - **dependent_rules** (任意): array[object] - 家族情報
  - **bank_account_rule** (任意): object
  - **basic_pay_rule** (任意): object
  - **payroll_calculation** (任意): boolean - 給与計算対象従業員の場合trueを返します 例: `true`
  - **company_reference_date_rule_name** (任意): string - 締め日支払い日グループ名(給与計算対象外従業員の場合、nullを返します) 例: `当月締め翌月払い`

### GET /api/v1/employees/{id}

**操作**: 従業員の取得

**説明**: 概要 指定したIDの従業員を返します。 注意点 管理者権限を持ったユーザーのみ実行可能です。 指定した年月に退職済みユーザーは取得できません。 保険料計算方法が自動計算の場合、対応する保険料の直接指定金額は無視されnullが返されます。(例: 給与計算時の健康保険料の計算方法が自動計算の場合、給与計算時の健康保険料の直接指定金額はnullが返されます) 事業所が定額制の健康保険組合に加入している場合、保険料の直接指定金額は無視されnullが返されます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| year | query | はい | integer | 従業員情報を取得したい年 |
| month | query | はい | integer | 従業員情報を取得したい月<br>
締め日支払い日設定が翌月払いの従業員情報の場合は、 指定したmonth + 1の値が検索結果として返します。<br>
翌月払いの従業員の2022/01の従業員情報を取得する場合は、year=2021,month=12を指定してください。<br> |
| id | path | はい | integer | 従業員ID |

### レスポンス (200)

successful operation

- **employee** (任意): object
  - **id** (任意): integer(int32) - 従業員ID
  - **company_id** (任意): integer(int32) - 事業所ID
  - **num** (任意): string - 従業員番号
  - **display_name** (任意): string - 従業員名（表示名）
  - **base_pension_num** (任意): string - 基礎年金番号
  - **employment_insurance_reference_number** (任意): string - 被保険者番号（雇用保険）
  - **birth_date** (任意): string(date) - 生年月日
  - **entry_date** (任意): string(date) - 入社日
  - **retire_date** (任意): string(date) - 退職日
  - **user_id** (任意): integer(int32) - ユーザーID(従業員詳細未設定の場合、nullになります。)
  - **profile_rule** (任意): object
  - **health_insurance_rule** (任意): object
  - **welfare_pension_insurance_rule** (任意): object
  - **dependent_rules** (任意): array[object] - 家族情報
  - **bank_account_rule** (任意): object
  - **basic_pay_rule** (任意): object
  - **payroll_calculation** (任意): boolean - 給与計算対象従業員の場合trueを返します 例: `true`
  - **company_reference_date_rule_name** (任意): string - 締め日支払い日グループ名(給与計算対象外従業員の場合、nullを返します) 例: `当月締め翌月払い`

### PUT /api/v1/employees/{id}

**操作**: 従業員の更新

**説明**: 概要 指定した従業員の情報を更新します。 注意点 管理者権限を持ったユーザーのみ実行可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer | 従業員ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 更新対象事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **year** (任意): integer(int32) - 更新対象年
- 給与計算対象の従業員情報の場合は必須になります。 例: `2021` (最小: 2000, 最大: 2100)
- **month** (任意): integer(int32) - 更新対象月
- 給与計算対象の従業員情報の場合は必須になります。
- 締め日支払い日設定が翌月払いの従業員情報の場合は、 指定したmonth + 1の値が更新されます。
- 翌月払いの従業員の2022/01の従業員情報を更新する場合は、year=2021,month=12を指定してください。 例: `1` (最小: 1, 最大: 12)
- **employee** **(必須)**: object
  - **num** (任意): string - 従業員番号<br>
従業員を判別しやすいよう管理することができます。（例: 1人目の正社員を A-001 と入力） 例: `A-001`
  - **display_name** (任意): string - 従業員名（freee人事労務上での表示にのみ使用される名前です。出力書類には姓名が使用されます。）
- 給与計算対象外の従業員情報の場合は必須になります。 例: `山田 太郎`
  - **base_pension_num** (任意): string - 基礎年金番号 数値文字列10桁固定長 例: 1111111111 例: `1111111111`
  - **employment_insurance_reference_number** (任意): string - 被保険者番号（雇用保険） 数値文字列11桁固定長 例: 11111111111
- 給与計算対象外の従業員情報の場合に指定するとエラーになります。 例: `11111111111`
  - **birth_date** **(必須)**: string(date) - 生年月日 null不可 例: `2000-01-01` (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
  - **entry_date** **(必須)**: string(date) - 入社日 null不可 例: `2021-04-01` (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
  - **retire_date** (任意): string(date) - 退職日
- 退職していない場合は指定不要です。
- 指定する場合はentry_date以降の日付を指定してください。
- retire_dateをクリアする場合、nullを指定してください。 例: `2022-03-31` (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
  - **company_reference_date_rule_name** (任意): string - <a href="https://support.freee.co.jp/hc/ja/articles/360000666303-締め日支払い日を変更する方法は-" target="_blank">締め日支払い日グループ名</a>
で設定した締め日支払い日を指定してください。
- 未指定の際は、締め日支払い日は変わりません。
- 指定した従業員が給与計算対象外の場合、指定するとエラーになります。 例: `当月締め翌月払い`

### レスポンス (200)

successful operation

- **employee** (任意): object
  - **id** (任意): integer(int32) - 従業員ID
  - **company_id** (任意): integer(int32) - 事業所ID
  - **num** (任意): string - 従業員番号
  - **display_name** (任意): string - 従業員名（表示名）
  - **base_pension_num** (任意): string - 基礎年金番号
  - **employment_insurance_reference_number** (任意): string - 被保険者番号（雇用保険）
  - **birth_date** (任意): string(date) - 生年月日
  - **entry_date** (任意): string(date) - 入社日
  - **retire_date** (任意): string(date) - 退職日
  - **user_id** (任意): integer(int32) - ユーザーID(従業員詳細未設定の場合、nullになります。)
  - **profile_rule** (任意): object
  - **health_insurance_rule** (任意): object
  - **welfare_pension_insurance_rule** (任意): object
  - **dependent_rules** (任意): array[object] - 家族情報
  - **bank_account_rule** (任意): object
  - **basic_pay_rule** (任意): object
  - **payroll_calculation** (任意): boolean - 給与計算対象従業員の場合trueを返します 例: `true`
  - **company_reference_date_rule_name** (任意): string - 締め日支払い日グループ名(給与計算対象外従業員の場合、nullを返します) 例: `当月締め翌月払い`

### DELETE /api/v1/employees/{id}

**操作**: 従業員の削除

**説明**: 概要 指定したIDの従業員を削除します。 注意点 管理者権限を持ったユーザーのみ実行可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer | 従業員ID |
| company_id | query | はい | integer | 事業所ID |

### レスポンス (204)

successful operation



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
