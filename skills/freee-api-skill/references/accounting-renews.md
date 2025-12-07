# Renews

## 概要

取引（収入・支出）の+更新

## エンドポイント一覧

### POST /api/1/deals/{id}/renews

**操作**: 取引（収入・支出）の+更新の作成

**説明**: 概要 指定した事業所の取引（収入・支出）の+更新を作成する 定義 issue_date : 発生日 due_date : 支払期日 amount : 金額 due_amount : 支払残額 type income : 収入 expense : 支出 details : 取引の明細行 accruals : 取引の債権債務行 renews : 取引の+更新行 payments : 取引の支払行 from_walletable_type bank_account : 銀行口座 credit_card : クレジットカード wallet : 現金 private_account_item : プライベート資金（法人の場合は役員借入金もしくは役員借入金、個人の場合は事業主貸もしくは事業主借） 注意点 本APIではdetails(取引の明細行)、accruals(債権債務行)、renewsのdetails(+更新の明細行)のみ操作可能です。 本APIで取引を更新すると、消費税の計算方法は必ず内税方式が選択されます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 取引ID |

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **update_date** **(必須)**: string - 更新日 (yyyy-mm-dd) 例: `2019-12-17`
- **renew_target_id** **(必須)**: integer(int64) - +更新対象行ID (details(取引の明細行), accruals(債権債務行), renewsのdetails(+更新の明細行)のIDを指定)  例: `1` (最小: 1)
- **details** **(必須)**: array[object] - +更新の明細行
  配列の要素:
    - **account_item_id** **(必須)**: integer(int64) - 勘定科目ID 例: `1` (最小: 1)
    - **tax_code** **(必須)**: integer(int64) - 税区分コード 例: `1` (最小: 0, 最大: 2147483647)
    - **amount** **(必須)**: integer(int64) - 取引金額（税込で指定してください）<br>
マイナスの値を指定した場合、控除・マイナス行として登録されます。<br>
上記以外の値を指定した場合、通常行として登録されます。
 例: `1080` (最小: -9223372036854776000, 最大: 9223372036854776000)
    - **vat** (任意): integer(int64) - 消費税額（指定しない場合は自動で計算されます） 例: `80` (最小: -9223372036854776000, 最大: 9223372036854776000)
    - **item_id** (任意): integer(int64) - 品目ID 例: `1` (最小: 1)
    - **section_id** (任意): integer(int64) - 部門ID 例: `1` (最小: 1)
    - **tag_ids** (任意): array[integer] - メモタグID 例: `[1,2,3]`
    - **segment_1_tag_id** (任意): integer(int64) - セグメント１タグID 例: `1` (最小: 1)
    - **segment_2_tag_id** (任意): integer(int64) - セグメント２タグID 例: `1` (最小: 1)
    - **segment_3_tag_id** (任意): integer(int64) - セグメント３タグID 例: `1` (最小: 1)
    - **description** (任意): string - 備考 例: `備考`

### レスポンス (201)

- **deal** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 取引ID 例: `101` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **issue_date** **(必須)**: string - 発生日 (yyyy-mm-dd) 例: `2019-12-17`
  - **due_date** (任意): string - 支払期日 (yyyy-mm-dd) 例: `2019-12-17`
  - **amount** **(必須)**: integer(int64) - 金額 例: `5250` (最小: -9223372036854776000, 最大: 9223372036854776000)
  - **due_amount** (任意): integer(int64) - 支払残額 例: `0`
  - **type** (任意): string - 収支区分 (収入: income, 支出: expense) (選択肢: income, expense) 例: `expense`
  - **partner_id** **(必須)**: integer(int64) - 取引先ID 例: `201`
  - **partner_code** (任意): string - 取引先コード 例: `code001`
  - **ref_number** (任意): string - 管理番号 例: `123-456`
  - **status** **(必須)**: string - 決済状況 (未決済: unsettled, 完了: settled) (選択肢: unsettled, settled) 例: `settled`
  - **deal_origin_name** (任意): string - 取引の登録元 例: `手動`
  - **details** (任意): array[object] - 取引の明細行
  - **renews** (任意): array[object] - 取引の+更新行
  - **payments** (任意): array[object] - 取引の支払行
  - **receipts** (任意): array[object] - ファイルボックス（証憑ファイル）

### PUT /api/1/deals/{id}/renews/{renew_id}

**操作**: 取引（収入・支出）の+更新の更新

**説明**: 概要 指定した事業所の取引（収入・支出）の+更新を更新する 定義 issue_date : 発生日 due_date : 支払期日 amount : 金額 due_amount : 支払残額 type income : 収入 expense : 支出 details : 取引の明細行 accruals : 取引の債権債務行 renews : 取引の+更新行 payments : 取引の支払行 from_walletable_type bank_account : 銀行口座 credit_card : クレジットカード wallet : 現金 private_account_item : プライベート資金（法人の場合は役員借入金もしくは役員借入金、個人の場合は事業主貸もしくは事業主借） 注意点 本APIでは+更新の更新のみ可能です。取引や支払行に対する更新はできません。 renew_idにはrenewsのid(+更新ID)を指定してください。renewsのdetailsのid(+更新の明細行ID)を指定できません。 月締めされている仕訳に紐づく＋更新行の編集・削除はできません。 承認済み...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 取引ID |
| renew_id | path | はい | integer(int64) | +更新ID |

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **update_date** **(必須)**: string - 更新日 (yyyy-mm-dd) 例: `2019-12-17`
- **details** **(必須)**: array[object] - +更新の明細行
  配列の要素:
    - **account_item_id** **(必須)**: integer(int64) - 勘定科目ID 例: `1` (最小: 1)
    - **tax_code** **(必須)**: integer(int64) - 税区分コード 例: `1` (最小: 0, 最大: 2147483647)
    - **amount** **(必須)**: integer(int64) - 取引金額（税込で指定してください）<br>
マイナスの値を指定した場合、控除・マイナス行として登録されます。<br>
上記以外の値を指定した場合、通常行として登録されます。
 例: `1080` (最小: -9223372036854776000, 最大: 9223372036854776000)
    - **vat** (任意): integer(int64) - 消費税額（指定しない場合は自動で計算されます） 例: `80` (最小: -9223372036854776000, 最大: 9223372036854776000)
    - **item_id** (任意): integer(int64) - 品目ID 例: `1` (最小: 1)
    - **section_id** (任意): integer(int64) - 部門ID 例: `1` (最小: 1)
    - **tag_ids** (任意): array[integer] - メモタグID 例: `[1,2,3]`
    - **segment_1_tag_id** (任意): integer(int64) - セグメント１タグID 例: `1` (最小: 1)
    - **segment_2_tag_id** (任意): integer(int64) - セグメント２タグID 例: `1` (最小: 1)
    - **segment_3_tag_id** (任意): integer(int64) - セグメント３タグID 例: `1` (最小: 1)
    - **description** (任意): string - 備考 例: `備考`

### レスポンス (200)

- **deal** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 取引ID 例: `101` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **issue_date** **(必須)**: string - 発生日 (yyyy-mm-dd) 例: `2019-12-17`
  - **due_date** (任意): string - 支払期日 (yyyy-mm-dd) 例: `2019-12-17`
  - **amount** **(必須)**: integer(int64) - 金額 例: `5250` (最小: -9223372036854776000, 最大: 9223372036854776000)
  - **due_amount** (任意): integer(int64) - 支払残額 例: `0`
  - **type** (任意): string - 収支区分 (収入: income, 支出: expense) (選択肢: income, expense) 例: `expense`
  - **partner_id** **(必須)**: integer(int64) - 取引先ID 例: `201`
  - **partner_code** (任意): string - 取引先コード 例: `code001`
  - **ref_number** (任意): string - 管理番号 例: `123-456`
  - **status** **(必須)**: string - 決済状況 (未決済: unsettled, 完了: settled) (選択肢: unsettled, settled) 例: `settled`
  - **deal_origin_name** (任意): string - 取引の登録元 例: `手動`
  - **details** (任意): array[object] - 取引の明細行
  - **renews** (任意): array[object] - 取引の+更新行
  - **payments** (任意): array[object] - 取引の支払行
  - **receipts** (任意): array[object] - ファイルボックス（証憑ファイル）

### DELETE /api/1/deals/{id}/renews/{renew_id}

**操作**: 取引（収入・支出）の+更新の削除

**説明**: 概要 指定した事業所の取引（収入・支出）の+更新を削除する 注意点 本APIでは+更新の削除のみ可能です。取引や支払行に対する削除はできません。 renew_idにはrenewsのid(+更新ID)を指定してください。renewsのdetailsのid(+更新の明細行ID)を指定できません。 月締めされている仕訳に紐づく＋更新行の編集・削除はできません。 承認済み仕訳に紐づく＋更新行の編集・削除は管理者権限のユーザーのみ可能です。 本APIで取引を更新すると、消費税の計算方法は必ず内税方式が選択されます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 取引ID |
| renew_id | path | はい | integer(int64) | +更新ID |
| company_id | query | はい | integer(int64s) | 事業所ID |

### レスポンス (200)

- **deal** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 取引ID 例: `101` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **issue_date** **(必須)**: string - 発生日 (yyyy-mm-dd) 例: `2019-12-17`
  - **due_date** (任意): string - 支払期日 (yyyy-mm-dd) 例: `2019-12-17`
  - **amount** **(必須)**: integer(int64) - 金額 例: `5250` (最小: -9223372036854776000, 最大: 9223372036854776000)
  - **due_amount** (任意): integer(int64) - 支払残額 例: `0`
  - **type** (任意): string - 収支区分 (収入: income, 支出: expense) (選択肢: income, expense) 例: `expense`
  - **partner_id** **(必須)**: integer(int64) - 取引先ID 例: `201`
  - **partner_code** (任意): string - 取引先コード 例: `code001`
  - **ref_number** (任意): string - 管理番号 例: `123-456`
  - **status** **(必須)**: string - 決済状況 (未決済: unsettled, 完了: settled) (選択肢: unsettled, settled) 例: `settled`
  - **deal_origin_name** (任意): string - 取引の登録元 例: `手動`
  - **details** (任意): array[object] - 取引の明細行
  - **renews** (任意): array[object] - 取引の+更新行
  - **payments** (任意): array[object] - 取引の支払行
  - **receipts** (任意): array[object] - ファイルボックス（証憑ファイル）



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
