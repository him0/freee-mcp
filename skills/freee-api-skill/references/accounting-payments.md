# Payments

## 概要

取引（収入・支出）の支払行

## エンドポイント一覧

### POST /api/1/deals/{id}/payments

**操作**: 取引（収入・支出）の支払行の作成

**説明**: 概要 指定した事業所の取引（収入・支出）の支払行を作成する 定義 issue_date : 発生日 due_date : 支払期日 amount : 金額 due_amount : 支払残額 type income : 収入 expense : 支出 details : 取引の明細行 renews : 取引の+更新行 payments : 取引の支払行 from_walletable_type bank_account : 銀行口座 credit_card : クレジットカード wallet : 現金 private_account_item : プライベート資金（法人の場合は役員借入金もしくは役員借入金、個人の場合は事業主貸もしくは事業主借）

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 取引ID |

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **date** **(必須)**: string - 支払日 例: `2019-12-17`
- **from_walletable_type** **(必須)**: string - 口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet, プライベート資金: private_account_item)：payments指定時は必須 (選択肢: bank_account, credit_card, wallet, private_account_item) 例: `bank_account`
- **from_walletable_id** **(必須)**: integer(int64) - 口座ID（from_walletable_typeがprivate_account_itemの場合は勘定科目ID）：payments指定時は必須 例: `1` (最小: 1)
- **amount** **(必須)**: integer(int64) - 金額 例: `10000` (最小: 1, 最大: 9223372036854776000)

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

### PUT /api/1/deals/{id}/payments/{payment_id}

**操作**: 取引（収入・支出）の支払行の更新

**説明**: 概要 指定した事業所の取引（収入・支出）の支払行を更新する 定義 issue_date : 発生日 due_date : 支払期日 amount : 金額 due_amount : 支払残額 type income : 収入 expense : 支出 details : 取引の明細行 renews : 取引の+更新行 payments : 取引の支払行 from_walletable_type bank_account : 銀行口座 credit_card : クレジットカード wallet : 現金 private_account_item : プライベート資金（法人の場合は役員借入金もしくは役員借入金、個人の場合は事業主貸もしくは事業主借）

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 取引ID |
| payment_id | path | はい | integer(int64) | 決済ID |

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **date** **(必須)**: string - 支払日 例: `2019-12-17`
- **from_walletable_type** **(必須)**: string - 口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet, プライベート資金: private_account_item)：payments指定時は必須 (選択肢: bank_account, credit_card, wallet, private_account_item) 例: `bank_account`
- **from_walletable_id** **(必須)**: integer(int64) - 口座ID（from_walletable_typeがprivate_account_itemの場合は勘定科目ID）：payments指定時は必須 例: `1` (最小: 1)
- **amount** **(必須)**: integer(int64) - 金額 例: `10000` (最小: 1, 最大: 9223372036854776000)

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

### DELETE /api/1/deals/{id}/payments/{payment_id}

**操作**: 取引（収入・支出）の支払行の削除

**説明**: 概要 指定した事業所の取引（収入・支出）の支払行を削除する 定義 issue_date : 発生日 due_date : 支払期日 amount : 金額 due_amount : 支払残額 type income : 収入 expense : 支出 details : 取引の明細行

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 取引ID |
| payment_id | path | はい | integer(int64) | 決済ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (204)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
