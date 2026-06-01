# deliveries

## 概要

納品

## エンドポイント一覧

### GET /deliveries

操作: 納品一覧

説明: 概要 納品の一覧を取得します。 登録されている納品情報を一覧形式で取得できます。 各種フィルタ条件を指定することで、特定の条件に合致する納品のみを取得することが可能です。

定義
start_registered_date : 登録日(絞り込み開始) end_registered_date : 登録日(絞り込み終了) start_delivery_date : 納品日(絞り込み開始) end_delivery_date : 納品日(絞り込み終了) start_acceptance_date : 検収日(絞り込み開始) end_acceptance_date : 検収日(絞り込み終了) charge_employee_ids : 社内担当者の従業員ID(複数指定可) customer_ids : 顧客の取引先ID(複数指定可) delivery_status : 納品ステータス canceled : 取消状態(デフォルト:false) `limit`と`offset`パラメータを使用してページネーションが可能です。 デフォルトでは20件ずつ取得され、最大100件まで一度に取得できます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| start_registered_date | query | いいえ | string(date) | 登録日で絞込：開始日(yyyy-mm-dd) |
| end_registered_date | query | いいえ | string(date) | 登録日で絞込：終了日(yyyy-mm-dd) |
| start_delivery_date | query | いいえ | string(date) | 納品日で絞込：開始日(yyyy-mm-dd) |
| end_delivery_date | query | いいえ | string(date) | 納品日で絞込：終了日(yyyy-mm-dd) |
| start_acceptance_date | query | いいえ | string(date) | 検収日で絞込：開始日(yyyy-mm-dd) |
| end_acceptance_date | query | いいえ | string(date) | 検収日で絞込：終了日(yyyy-mm-dd) |
| charge_employee_ids[] | query | いいえ | array[integer] | 社内担当者の従業員ID |
| customer_ids[] | query | いいえ | array[integer] | 顧客の取引先ID |
| delivery_status | query | いいえ | string | 納品ステータス (未納品: not_delivered, 納品済: delivered) (選択肢: not_delivered, delivered) |
| canceled | query | いいえ | boolean | 取消状態 |
| limit | query | いいえ | integer(int32) | 取得レコードの件数（デフォルト：20, 最小：1, 最大：100） |
| offset | query | いいえ | integer(int32) | 取得レコードのオフセット（デフォルト：0） |

### レスポンス (200)

### POST /deliveries

操作: 納品登録

説明: 概要 新しい納品を登録します。 受注に紐づく納品、または独立した納品を登録できます。

定義
必須項目 delivery_date : 納品日 customer_id : 顧客の取引先ID billing_partner_id : 請求先の取引先ID billing_creating_method_type : 請求作成方法 collecting_partner_id : 入金元の取引先ID collection_method_type : 入金方法 lines : 明細リスト 任意項目 sales_order_id : 受注ID（受注に紐づける場合） business_id : 案件ID internal_subject : 納品タイトル customer_order_no : 顧客注文No. acceptance_date : 検収日 delivery_note : 納品書の備考欄に記載する内容 delivery_template_id : 納品書テンプレートID ※指定しない場合はデフォルトのテンプレートが適用されます。 subject : 納品書件名 recipient_addr...

### レスポンス (201)

### GET /deliveries/{id}

操作: 納品詳細取得

説明: 概要 指定されたIDの納品の詳細情報を取得します。 納品の基本情報に加えて、売上・請求情報などの詳細な進捗情報も取得できます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| id | path | はい | string | 納品ID |

### レスポンス (200)

納品詳細取得のレスポンス


### PATCH /deliveries/{id}

操作: 納品更新

説明: 概要 指定されたIDの納品を更新します。 納品の基本情報、請求・入金情報などを部分的に更新できます。 送信したフィールドのみが更新され、送信しなかったフィールドは変更されません。

定義
更新可能項目 branch_no : 枝番 internal_subject : 納品タイトル delivery_date : 納品日 customer_order_no : 顧客注文No. acceptance_date : 検収日 customer_id : 顧客の取引先ID delivery_note : 納品書の備考欄に記載する内容 delivery_template_id : 納品書テンプレートID subject : 納品書件名 recipient_address : 宛先情報（指定した場合、既存の宛先情報は全て削除され、新しい宛先情報に置き換えられます） billing_creating_method_type : 請求作成方法 bills_on : 請求予定日 invoice_template_id : 請求書テンプレートID billing_partner_id : 請求先の取引先ID...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | 納品ID |

### レスポンス (200)

### POST /deliveries/{id}/cancellation

操作: 納品取消

説明: 概要 指定されたIDの納品を取消します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | 納品ID |

### レスポンス (200)

### PUT /deliveries/{id}/delivery_status

操作: 納品ステータス変更

説明: 概要 指定されたIDの納品の納品ステータスを変更します。

定義
status : 納品ステータス (未納品: not_delivered, 納品済: delivered)

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | 納品ID |

### リクエストボディ

(必須)


### レスポンス (200)

### PUT /deliveries/{id}/acceptance_status

操作: 検収ステータス変更

説明: 概要 指定されたIDの納品の検収ステータスを変更します。

定義
status : 検収ステータス (未検収: not_accepted, 検収済: accepted)

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | 納品ID |

### リクエストボディ

(必須)


### レスポンス (200)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
