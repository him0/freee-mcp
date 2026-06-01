# businesses

## 概要

案件

## エンドポイント一覧

### GET /businesses

操作: 案件一覧

説明: 概要 案件の一覧を取得します。 登録されている案件情報を一覧形式で取得できます。 各種フィルタ条件を指定することで、特定の条件に合致する案件のみを取得することが可能です。

定義
start_business_date : 案件登録日(絞り込み開始) end_business_date : 案件登録日(絞り込み終了) sales_progression_ids : 受注確度ID(複数指定可) business_phase_ids : 案件フェーズID(複数指定可) charge_employee_ids : 社内担当者の従業員ID(複数指定可) customer_ids : 顧客の取引先ID(複数指定可) canceled : 取消状態(デフォルト:false) `limit`と`offset`パラメータを使用してページネーションが可能です。 デフォルトでは20件ずつ取得され、最大100件まで一度に取得できます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| start_business_date | query | いいえ | string(date) | 案件登録日で絞込：開始日(yyyy-mm-dd) |
| end_business_date | query | いいえ | string(date) | 案件登録日で絞込：終了日(yyyy-mm-dd) |
| sales_progression_ids[] | query | いいえ | array[string] | 受注確度ID |
| business_phase_ids[] | query | いいえ | array[string] | 案件フェーズID |
| charge_employee_ids[] | query | いいえ | array[integer] | 社内担当者の従業員ID |
| customer_ids[] | query | いいえ | array[integer] | 顧客の取引先ID |
| canceled | query | いいえ | boolean | 取消状態 |
| limit | query | いいえ | integer(int32) | 取得レコードの件数（デフォルト：20, 最小：1, 最大：100） |
| offset | query | いいえ | integer(int32) | 取得レコードのオフセット（デフォルト：0） |

### レスポンス (200)

### POST /businesses

操作: 案件登録

説明: 概要 新しい案件を登録します。 顧客との商談や受注案件を管理するための案件情報を登録できます。

定義
必須項目 name : 案件名称 company_id : 事業所ID 任意項目 code : 案件コード business_date : 案件登録日 charge_employee_id : 社内担当者の従業員ID customer_id : 顧客の取引先ID prospect_sales_order : 受注見込 sales_progression_id : 受注確度ID scheduled_completion_date : 完了予定日 completion_date : 完了日 business_phase_id : 案件フェーズID reporting_section_id : 担当部門ID internal_memo : 社内メモ

### レスポンス (201)

### GET /businesses/{id}

操作: 案件詳細取得

説明: 概要 指定されたIDの案件の詳細情報を取得します。 案件の基本情報に加えて、粗利や売上情報などの詳細な集計情報も取得できます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| id | path | はい | string | 案件ID |

### レスポンス (200)

### PATCH /businesses/{id}

操作: 案件更新

説明: 概要 指定されたIDの案件を更新します。 案件の基本情報、受注見込、完了予定日などを部分的に更新できます。 送信したフィールドのみが更新され、送信しなかったフィールドは変更されません。

定義
更新可能項目 name : 案件名称 code : 案件コード business_date : 案件登録日 charge_employee_id : 社内担当者の従業員ID customer_id : 顧客の取引先ID prospect_sales_order : 受注見込 sales_progression_id : 受注確度ID scheduled_completion_date : 完了予定日 completion_date : 完了日 business_phase_id : 案件フェーズID reporting_section_id : 担当部門ID internal_memo : 社内メモ custom_fields : カスタム項目(指定した場合、既存のカスタム項目は全て削除され、新しいカスタム項目に置き換えられます) ※全ての項目は任意です。更新したい項目のみを送信してください。 ※...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | 案件ID |

### レスポンス (200)

### POST /businesses/{id}/cancellation

操作: 案件取消

説明: 概要 指定されたIDの案件を取消します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | 案件ID |

### レスポンス (200)

### POST /businesses/{id}/close

操作: 案件ロック

説明: 概要 指定されたIDの案件をロックします。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | 案件ID |

### レスポンス (200)

### POST /businesses/{id}/reopen

操作: 案件ロック解除

説明: 概要 指定されたIDの案件ロックを解除します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | 案件ID |

### レスポンス (200)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
