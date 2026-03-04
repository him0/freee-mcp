# sales_orders

## 概要

受注

## エンドポイント一覧

### GET /sales_orders

操作: 受注一覧

説明: 概要 受注の一覧を取得します。 登録されている受注情報を一覧形式で取得できます。 各種フィルタ条件を指定することで、特定の条件に合致する受注のみを取得することが可能です。 定義 start_sales_order_date : 受注日(絞り込み開始) end_sales_order_date : 受注日(絞り込み終了) charge_employee_ids : 社内担当者の従業員ID(複数指定可) customer_ids : 顧客の取引先ID(複数指定可) canceled : 取消状態(デフォルト:false) `limit`と`offset`パラメータを使用してページネーションが可能です。 デフォルトでは20件ずつ取得され、最大100件まで一度に取得できます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
|  |  | いいえ |  |  |
|  |  | いいえ |  |  |
|  |  | いいえ |  |  |
|  |  | いいえ |  |  |
|  |  | いいえ |  |  |
|  |  | いいえ |  |  |
|  |  | いいえ |  |  |
|  |  | いいえ |  |  |

### レスポンス (200)

### POST /sales_orders

操作: 受注登録

説明: 概要 新しい受注を登録します。 顧客からの注文情報を登録し、納品・請求・入金の予定情報を管理できます。 定義 必須項目 sales_order_date : 受注日 customer_id : 顧客の取引先ID billing_partner_id : 請求先の取引先ID collecting_partner_id : 入金元の取引先ID lines : 明細リスト 任意項目 sales_order_subject : 受注タイトル customer_order_no : 顧客注文No. deliveries_on : 納品予定日 accepts_on : 検収予定日 bills_on : 請求予定日 collects_on : 入金予定日 business_id : 案件ID delivery_template_id : 納品書テンプレートID ※指定しない場合はデフォルトのテンプレートが適用されます。 invoice_template_id : 請求書テンプレートID ※指定しない場合はデフォルトのテンプレートが適用されます。

### レスポンス (201)

### GET /sales_orders/{id}

操作: 受注詳細取得

説明: 概要 指定されたIDの受注の詳細情報を取得します。 受注の基本情報に加えて、納品・請求・入金情報などの詳細な進捗情報も取得できます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
|  |  | いいえ |  |  |
| id | path | はい | string | 受注ID |

### レスポンス (200)

受注詳細取得のレスポンス


### PATCH /sales_orders/{id}

操作: 受注更新

説明: 概要 指定されたIDの受注を更新します。 受注の基本情報、納品・請求・入金情報などを部分的に更新できます。 送信したフィールドのみが更新され、送信しなかったフィールドは変更されません。 定義 更新可能項目 sales_order_subject : 受注タイトル sales_order_date : 受注日 customer_order_no : 顧客注文No. customer_id : 顧客の取引先ID sales_on : 売上予定日 deliveries_on : 納品予定日 accepts_on : 検収予定日 delivery_template_id : 納品書テンプレートID delivery_subject : 納品書件名 delivery_note : 納品書の備考欄に掲載する内容 billing_creating_method_type : 請求の管理 bills_on : 請求予定日 billing_partner_id : 請求先の取引先ID invoice_template_id : 請求書テンプレートID invoice_subject : 請求書件名 in...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | 受注ID |

### レスポンス (200)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [sm-api-schema.json](../../openapi/sm-api-schema.json)
