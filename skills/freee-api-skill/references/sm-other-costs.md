# other_costs

## 概要

その他原価

## エンドポイント一覧

### GET /other_costs

操作: その他原価一覧

説明: 概要 その他原価の一覧を取得します。 登録されているその他原価情報を一覧形式で取得できます。 各種フィルタ条件を指定することで、特定の条件に合致するその他原価のみを取得することが可能です。

定義
start_amount_excluding_tax : 金額(税抜)の絞り込み下限 end_amount_excluding_tax : 金額(税抜)の絞り込み上限 business_ids : 案件ID(複数指定可) start_incurred_date : 発生日の絞り込み開始日 end_incurred_date : 発生日の絞り込み終了日 canceled : 取消状態(デフォルト:false) `limit`と`offset`パラメータを使用してページネーションが可能です。 デフォルトでは20件ずつ取得され、最大100件まで一度に取得できます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| start_amount_excluding_tax | query | いいえ | integer(int64) | 金額(税抜)で絞込：下限 |
| end_amount_excluding_tax | query | いいえ | integer(int64) | 金額(税抜)で絞込：上限 |
| business_ids[] | query | いいえ | array[string] | 案件ID |
| canceled | query | いいえ | boolean | 取消状態 |
| start_incurred_date | query | いいえ | string(date) | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_incurred_date | query | いいえ | string(date) | 発生日で絞込：終了日(yyyy-mm-dd) |
| limit | query | いいえ | integer(int32) | 取得レコードの件数（デフォルト：20, 最小：1, 最大：100） |
| offset | query | いいえ | integer(int32) | 取得レコードのオフセット（デフォルト：0） |

### レスポンス (200)

### POST /other_costs

操作: その他原価登録

説明: 概要 新しいその他原価を登録します。 案件に紐づくその他原価、または案件に紐づかないその他原価を登録できます。

定義
必須項目 company_id : 事業所ID amount_excluding_tax : 金額(税抜) incurred_date : 発生日 任意項目 business_id : 案件ID memo : メモ

### レスポンス (201)

### PATCH /other_costs/{id}

操作: その他原価更新

説明: 概要 指定されたIDのその他原価を更新します。 送信したフィールドのみが更新され、送信しなかったフィールドは変更されません。

定義
更新可能項目 business_id : 案件ID amount_excluding_tax : 金額(税抜) incurred_date : 発生日 memo : メモ ※全ての項目は任意です。更新したい項目のみを送信してください。

注意点
freee会計の取引明細インポートから登録されたその他原価は本APIでは更新できません。該当データを更新しようとした場合はエラーになります。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | その他原価ID |

### レスポンス (200)

### GET /other_costs/{id}

操作: その他原価詳細取得

説明: 概要 指定されたIDのその他原価の詳細情報を取得します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| id | path | はい | string | その他原価ID |

### レスポンス (200)

その他原価詳細取得のレスポンス

- id (必須): string - その他原価ID 例: `01JPP4FD1CVQWCDSWA90VE1ZTM`
- other_cost_no (必須): string - その他原価番号 例: `OC-00001`
- amount_excluding_tax (必須): integer(int64) - 金額(税抜) 例: `10000` (最大: 9223372036854776000)
- incurred_date (必須): string(date) - 発生日 例: `2025-04-01`
- memo (必須): string - メモ 例: `その他原価メモ`
- canceled (必須): boolean - 取消状態 例: `false`
- registered_at (必須): string(date-time) - 登録日時 例: `2025-01-15T10:30:00+09:00`
- last_updated_at (必須): string(date-time) - 変更日時 例: `2025-01-16T14:45:00+09:00`
- registered_by (必須): object - 社内担当者
  - id (必須): integer(int64) - 従業員ID 例: `101` (最大: 9223372036854776000)
  - display_name (必須): string - 従業員名 例: `田中太郎`
- last_updated_by (必須): object - 社内担当者
  - id (必須): integer(int64) - 従業員ID 例: `101` (最大: 9223372036854776000)
  - display_name (必須): string - 従業員名 例: `田中太郎`
- business (必須): object - 案件
  - id (必須): string - 案件ID 例: `01JPP4FD1CVQWCDSWA90VE1ZTM`
  - code (必須): string - 案件コード 例: `B-001`
  - name (必須): string - 案件名 例: `サンプル案件`
  - closed (必須): boolean - ロック状態 例: `false`
- deal_line (必須): object - 会計連携情報
  - deal_id (必須): integer(int64) - 会計取引ID 例: `1001` (最大: 9223372036854776000)
  - deal_line_id (必須): integer(int64) - 会計取引明細ID 例: `2001` (最大: 9223372036854776000)

### POST /other_costs/{id}/restoration

操作: その他原価復元

説明: 概要 指定されたIDの取消済みその他原価を復元します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | その他原価ID |

### レスポンス (200)

### POST /other_costs/{id}/cancellation

操作: その他原価取消

説明: 概要 指定されたIDのその他原価を取り消します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | string | その他原価ID |

### レスポンス (200)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
