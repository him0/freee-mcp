# Approval flow routes

## 概要

申請経路

## エンドポイント一覧

### GET /api/1/approval_flow_routes

**操作**: 申請経路一覧の取得

**説明**: 概要 指定した事業所の申請経路一覧を取得する 各種申請APIの使い方については、freee会計の各種申請APIの使い方をご参照ください 経費精算APIの使い方については、freee会計の経費精算APIの使い方をご参照ください 注意点 申請経路、承認者の指定として部門役職データ連携を活用し、以下のいずれかを利用している申請と申請経路はAPI経由で参照は可能ですが、作成と更新、承認ステータスの変更ができません。 役職指定（申請者の所属部門） 役職指定（申請時に部門指定） 部門および役職指定

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| included_user_id | query | いいえ | integer(int64) | 経路に含まれるユーザーのユーザーID |
| usage | query | いいえ | string | 申請種別（各申請種別が使用できる申請経路に絞り込めます。例えば、ApprovalRequest を指定すると、各種申請が使用できる申請経路に絞り込めます。）
* `TxnApproval` - 仕訳承認
* `ExpenseApplication` - 経費精算
* `PaymentRequest` - 支払依頼
* `ApprovalRequest` - 各種申請
* `DocApproval` - 請求書等 (見積書・納品書・請求書・発注書) (選択肢: TxnApproval, ExpenseApplication, PaymentRequest, ApprovalRequest, DocApproval) |
| request_form_id | query | いいえ | integer | 申請フォームID request_form_id指定時はusage条件をApprovalRequestに指定してください。指定しない場合無効になります。 |

### レスポンス (200)

- **approval_flow_routes** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - 申請経路ID 例: `1` (最小: 1)
    - **name** (任意): string - 申請経路名 例: `申請経路`
    - **description** (任意): string - 申請経路の説明 例: `申請経路の説明`
    - **user_id** (任意): integer(int64) - 更新したユーザーのユーザーID 例: `1` (最小: 1)
    - **definition_system** (任意): boolean - システム作成の申請経路かどうか 例: `true`
    - **first_step_id** (任意): integer(int64) - 最初の承認ステップのID 例: `1` (最小: 1)
    - **usages** (任意): array[string] - 申請種別（申請経路を使用できる申請種別を示します。例えば、ApprovalRequest の場合は、各種申請で使用できる申請経路です。）
* `TxnApproval` - 仕訳承認
* `ExpenseApplication` - 経費精算
* `PaymentRequest` - 支払依頼
* `ApprovalRequest` - 各種申請
* `DocApproval` - 請求書等 (見積書・納品書・請求書・発注書)
    - **request_form_ids** (任意): array[integer] - 申請経路で利用できる申請フォームID配列
    - **default_route** **(必須)**: boolean - 基本経路として設定されているかどうか<br><br>
リクエストパラメータusageに下記のいずれかが指定され、かつ、基本経路の場合はtrueになります。
* `TxnApproval` - 仕訳承認
* `ExpenseApplication` - 経費精算
* `PaymentRequest` - 支払依頼
* `ApprovalRequest`(リクエストパラメータrequest_form_idを同時に指定) - 各種申請
* `DocApproval` - 請求書等 (見積書・納品書・請求書・発注書)

<a href="https://support.freee.co.jp/hc/ja/articles/900000507963" target="_blank">申請フォームの基本経路設定</a>
 例: `true`

### GET /api/1/approval_flow_routes/{id}

**操作**: 申請経路の取得

**説明**: 概要 指定した事業所の申請経路を取得する 各種申請APIの使い方については、freee会計の各種申請APIの使い方をご参照ください 経費精算APIの使い方については、freee会計の経費精算APIの使い方をご参照ください 注意点 申請経路、承認者の指定として部門役職データ連携を活用し、以下のいずれかを利用している申請と申請経路はAPI経由で参照は可能ですが、作成と更新、承認ステータスの変更ができません。 役職指定（申請者の所属部門） 役職指定（申請時に部門指定） 部門および役職指定

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer | 経路申請ID |
| company_id | query | はい | integer | 事業所ID |

### レスポンス (200)

- **approval_flow_route** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 申請経路ID 例: `1` (最小: 1)
  - **name** (任意): string - 申請経路名 例: `申請経路`
  - **description** (任意): string - 申請経路の説明 例: `申請経路の説明`
  - **user_id** (任意): integer(int64) - 更新したユーザーのユーザーID 例: `1` (最小: 1)
  - **definition_system** (任意): boolean - システム作成の申請経路かどうか 例: `true`
  - **first_step_id** (任意): integer(int64) - 最初の承認ステップのID 例: `1` (最小: 1)
  - **usages** (任意): array[string] - 申請種別（申請経路を使用できる申請種別を示します。例えば、ApprovalRequest の場合は、各種申請で使用できる申請経路です。）
* `TxnApproval` - 仕訳承認
* `ExpenseApplication` - 経費精算
* `PaymentRequest` - 支払依頼
* `ApprovalRequest` - 各種申請
* `DocApproval` - 請求書等 (見積書・納品書・請求書・発注書)
  - **request_form_ids** **(必須)**: array[integer] - 申請経路で利用できる申請フォームID配列
  - **steps** (任意): array[object] - 承認ステップ（配列）



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
