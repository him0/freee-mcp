# quotations

## 概要

見積

## エンドポイント一覧

### GET /quotations

操作: 見積一覧

説明: 概要 見積の一覧を取得します。 登録されている見積情報を一覧形式で取得できます。 各種フィルタ条件を指定することで、特定の条件に合致する見積のみを取得することが可能です。

定義
start_registered_date : 見積登録日(絞り込み開始) end_registered_date : 見積登録日(絞り込み終了) start_last_updated_date : 見積更新日(絞り込み開始) end_last_updated_date : 見積更新日(絞り込み終了) start_quotation_date : 見積日(絞り込み開始) end_quotation_date : 見積日(絞り込み終了) charge_employee_ids : 社内担当者の従業員ID(複数指定可) customer_ids : 顧客の取引先ID(複数指定可) business_ids : 案件ID(複数指定可) quotation_status : 見積ステータス billing_status : 請求書送付ステータス canceled : 取消状態(デフォルト:false) `limit`と...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| start_registered_date | query | いいえ | string(date) | 見積登録日で絞込：開始日(yyyy-mm-dd) |
| end_registered_date | query | いいえ | string(date) | 見積登録日で絞込：終了日(yyyy-mm-dd) |
| start_last_updated_date | query | いいえ | string(date) | 見積更新日で絞込：開始日(yyyy-mm-dd) |
| end_last_updated_date | query | いいえ | string(date) | 見積更新日で絞込：終了日(yyyy-mm-dd) |
| start_quotation_date | query | いいえ | string(date) | 見積日で絞込：開始日(yyyy-mm-dd) |
| end_quotation_date | query | いいえ | string(date) | 見積日で絞込：終了日(yyyy-mm-dd) |
| charge_employee_ids[] | query | いいえ | array[integer] | 社内担当者の従業員ID |
| customer_ids[] | query | いいえ | array[integer] | 顧客の取引先ID |
| business_ids[] | query | いいえ | array[string] | 案件ID |
| quotation_status | query | いいえ | string | 見積ステータス (未受注: unanswered, 受注済: order_received, 失注: order_lost) (選択肢: unanswered, order_received, order_lost) |
| billing_status | query | いいえ | string | 請求書送付ステータス (未請求: not_billed, 一部請求済: partially_billed, 請求済: billed, なし: none) (選択肢: not_billed, partially_billed, billed, none) |
| canceled | query | いいえ | boolean | 取消状態 |
| limit | query | いいえ | integer(int32) | 取得レコードの件数（デフォルト：20, 最小：1, 最大：100） |
| offset | query | いいえ | integer(int32) | 取得レコードのオフセット（デフォルト：0） |

### レスポンス (200)

### POST /quotations

操作: 見積登録

説明: 概要 新しい見積を登録します。 顧客への見積情報を登録し、見積書の発行や受注への引き継ぎに利用できます。

定義
必須項目 quotation_date : 見積日 customer_id : 顧客の取引先ID lines : 明細リスト 任意項目 business_id : 案件ID internal_subject : 見積タイトル expires_on : 有効期限日 delivery_deadline : 納品期限日 delivery_location : 納品場所 quotation_template_id : 見積書テンプレートID ※指定しない場合はデフォルトのテンプレートが適用されます。 quotation_subject : 見積書件名 quotation_note : 見積書の備考欄に記載する内容 recipient_address : 宛先情報 ※Web画面とは異なり、顧客マスタからの自動補完は行われません。指定しない場合は全ての項目がnullとして登録されます。 charge_employee_id : 社内担当者の従業員ID reporting_section_...

### レスポンス (201)

### GET /quotations/{id}

操作: 見積詳細取得

説明: 概要 指定されたIDの見積の詳細情報を取得します。 見積の基本情報に加えて、明細情報や各種ステータスなどの詳細な情報も取得できます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| id | path | はい | string | 見積ID |

### レスポンス (200)

見積詳細取得のレスポンス


### PATCH /quotations/{id}

操作: 見積更新

説明: 概要 指定されたIDの見積を更新します。 見積の基本情報を部分的に更新できます。 送信したフィールドのみが更新され、送信しなかったフィールドは変更されません。

定義
更新可能項目 business_id : 案件ID internal_subject : 見積タイトル quotation_date : 見積日 customer_id : 顧客の取引先ID expires_on : 有効期限日 delivery_deadline : 納品期限日 delivery_location : 納品場所 quotation_template_id : 見積書テンプレートID quotation_subject : 見積書件名 quotation_note : 見積書の備考欄に記載する内容 recipient_address : 宛先情報（指定した場合、既存の宛先情報は全て削除され、新しい宛先情報に置き換えられます） charge_employee_id : 社内担当者の従業員ID reporting_section_id : 担当部門ID internal_memo : 社内メモ branch_n...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | 見積ID |

### レスポンス (200)

### PUT /quotations/{id}/quotation_status

操作: 見積ステータス変更

説明: 概要 指定されたIDの見積のステータスを変更します。 見積のステータス（未受注/失注）を更新できます。

定義
quotation_status : 見積ステータス (未受注: unanswered, 失注: order_lost) ※ステータス変更は取り消されていない見積に対してのみ可能です。 ※受注済（order_received）への変更は本APIでは行えません。受注登録APIで対象の見積を指定して受注登録することで、見積ステータスが自動的に受注済へ更新されます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | 見積ID |

### リクエストボディ

(必須)


### レスポンス (200)

見積ステータス変更のレスポンス

- id (必須): string - 見積ID 例: `01JPP4FD1CVQWCDSWA90VE1ZTM`
- registered_at (必須): string(date-time) - 登録日時 例: `2025-01-15T10:30:00+09:00`
- last_updated_at (必須): string(date-time) - 変更日時 例: `2025-01-16T14:45:00+09:00`

### POST /quotations/{id}/cancellation

操作: 見積取消

説明: 概要 指定されたIDの見積を取り消します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | 見積ID |

### レスポンス (200)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
