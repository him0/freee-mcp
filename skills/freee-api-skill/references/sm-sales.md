# sales

## 概要

売上

## エンドポイント一覧

### GET /sales

操作: 売上一覧

説明: 概要 売上の一覧を取得します。 登録されている売上情報を一覧形式で取得できます。 各種フィルタ条件を指定することで、特定の条件に合致する売上のみを取得することが可能です。 定義 start_registered_date : 売上登録日(絞り込み開始) end_registered_date : 売上登録日(絞り込み終了) start_revenue_recognition_date : 売上日(絞り込み開始) end_revenue_recognition_date : 売上日(絞り込み終了) charge_employee_ids : 社内担当者の従業員ID(複数指定可) customer_ids : 顧客の取引先ID(複数指定可) billing_status : 請求書送付ステータス collection_status : 入金ステータス canceled : 取消状態(デフォルト:false) `limit`と`offset`パラメータを使用してページネーションが可能です。 デフォルトでは20件ずつ取得され、最大100件まで一度に取得できます。

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
|  |  | いいえ |  |  |
|  |  | いいえ |  |  |
|  |  | いいえ |  |  |
|  |  | いいえ |  |  |

### レスポンス (200)

### POST /sales

操作: 売上登録

説明: 概要 新しい売上を登録します。 受注や納品に紐づく売上、または独立した売上を登録できます。 定義 必須項目 revenue_recognition_date : 売上日 customer_id : 顧客の取引先ID billing_partner_id : 請求先の取引先ID collecting_partner_id : 入金元の取引先ID collection_method_type : 入金方法 billing_creating_method_type : 請求の管理 lines : 明細リスト 任意項目 sales_order_id : 受注ID（受注に紐づける場合） delivery_id : 納品ID（納品に紐づける場合） business_id : 案件ID subject : 売上タイトル customer_order_no : 顧客注文No. bills_on : 請求日 ※billing_creating_method_typeがautomaticallyの場合は必須 invoice_template_id : 請求書テンプレートID ※指定しない場合はデフォルトの...

### レスポンス (201)

### GET /sales/{id}

操作: 売上詳細取得

説明: 概要 指定されたIDの売上の詳細情報を取得します。 売上の基本情報に加えて、請求・入金情報などの詳細な進捗情報も取得できます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
|  |  | いいえ |  |  |
| id | path | はい | string | 売上ID |

### レスポンス (200)

売上詳細取得のレスポンス


### PATCH /sales/{id}

操作: 売上更新

説明: 概要 指定されたIDの売上を更新します。 売上の基本情報、請求・入金情報などを部分的に更新できます。 送信したフィールドのみが更新され、送信しなかったフィールドは変更されません。 定義 更新可能項目 subject : 売上タイトル revenue_recognition_date : 売上日 customer_order_no : 顧客注文No. customer_id : 顧客の取引先ID billing_partner_id : 請求先の取引先ID bills_on : 請求日 invoice_template_id : 請求書テンプレートID invoice_subject : 請求書件名 invoice_note : 請求書の備考欄に掲載する内容 collecting_partner_id : 入金元の取引先ID collection_method_type : 入金方法 collects_on : 入金期日 charge_employee_id : 社内担当者の従業員ID reporting_section_id : 担当部門ID internal_memo : 社内メモ ...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | 売上ID |

### レスポンス (200)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [sm-api-schema.json](../../openapi/sm-api-schema.json)
