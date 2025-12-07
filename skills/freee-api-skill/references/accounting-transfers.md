# Transfers

## 概要

取引（振替）

## エンドポイント一覧

### GET /api/1/transfers

**操作**: 取引（振替）一覧の取得

**説明**: 概要 指定した事業所の取引（振替）一覧を取得する 定義 amount : 振替金額 from_walletable_type, to_walletable_type bank_account : 銀行口座 credit_card : クレジットカード wallet : その他の決済口座

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| start_date | query | いいえ | string | 振替日で絞込：開始日 (yyyy-mm-dd) |
| end_date | query | いいえ | string | 振替日で絞込：終了日 (yyyy-mm-dd) |
| offset | query | いいえ | integer(int64) | 取得レコードのオフセット (デフォルト: 0) |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 20, 最小: 1, 最大: 100)  |

### レスポンス (200)

- **transfers** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - 取引(振替)ID 例: `1` (最小: 1)
    - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
    - **amount** **(必須)**: integer(int64) - 金額 例: `5000` (最小: -9223372036854776000, 最大: 9223372036854776000)
    - **date** **(必須)**: string - 振替日 (yyyy-mm-dd) 例: `2019-12-17`
    - **from_walletable_type** **(必須)**: string - 振替元口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, wallet, credit_card) 例: `credit_card`
    - **from_walletable_id** **(必須)**: integer(int64) - 振替元口座ID 例: `101` (最小: 1)
    - **to_walletable_type** **(必須)**: string - 振替先口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, wallet, credit_card) 例: `bank_account`
    - **to_walletable_id** **(必須)**: integer(int64) - 振替先口座ID 例: `201` (最小: 1)
    - **description** **(必須)**: string - 備考 例: `備考`

### POST /api/1/transfers

**操作**: 取引（振替）の作成

**説明**: 概要 指定した事業所の取引（振替）を作成する 定義 amount : 振替金額 from_walletable_type, to_walletable_type bank_account : 銀行口座 credit_card : クレジットカード wallet : その他の決済口座

### リクエストボディ

- **to_walletable_id** **(必須)**: integer(int64) - 振替先口座ID 例: `1` (最小: 1)
- **to_walletable_type** **(必須)**: string - 振替先口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, credit_card, wallet) 例: `bank_account`
- **from_walletable_id** **(必須)**: integer(int64) - 振替元口座ID 例: `1` (最小: 1)
- **from_walletable_type** **(必須)**: string - 振替元口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, credit_card, wallet) 例: `credit_card`
- **amount** **(必須)**: integer(int64) - 金額 例: `5000` (最小: -9223372036854776000, 最大: 9223372036854776000)
- **date** **(必須)**: string - 振替日 (yyyy-mm-dd) 例: `2019-12-17`
- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **description** (任意): string - 備考 例: `備考`

### レスポンス (201)

- **transfer** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 取引(振替)ID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **amount** **(必須)**: integer(int64) - 金額 例: `5000` (最小: -9223372036854776000, 最大: 9223372036854776000)
  - **date** **(必須)**: string - 振替日 (yyyy-mm-dd) 例: `2019-12-17`
  - **from_walletable_type** **(必須)**: string - 振替元口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, wallet, credit_card) 例: `credit_card`
  - **from_walletable_id** **(必須)**: integer(int64) - 振替元口座ID 例: `101` (最小: 1)
  - **to_walletable_type** **(必須)**: string - 振替先口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, wallet, credit_card) 例: `bank_account`
  - **to_walletable_id** **(必須)**: integer(int64) - 振替先口座ID 例: `201` (最小: 1)
  - **description** **(必須)**: string - 備考 例: `備考`

### GET /api/1/transfers/{id}

**操作**: 取引（振替）の取得

**説明**: 概要 指定した事業所の取引（振替）を取得する 定義 amount : 振替金額 from_walletable_type, to_walletable_type bank_account : 銀行口座 credit_card : クレジットカード wallet : その他の決済口座

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 取引(振替)ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (200)

- **transfer** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 取引(振替)ID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **amount** **(必須)**: integer(int64) - 金額 例: `5000` (最小: -9223372036854776000, 最大: 9223372036854776000)
  - **date** **(必須)**: string - 振替日 (yyyy-mm-dd) 例: `2019-12-17`
  - **from_walletable_type** **(必須)**: string - 振替元口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, wallet, credit_card) 例: `credit_card`
  - **from_walletable_id** **(必須)**: integer(int64) - 振替元口座ID 例: `101` (最小: 1)
  - **to_walletable_type** **(必須)**: string - 振替先口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, wallet, credit_card) 例: `bank_account`
  - **to_walletable_id** **(必須)**: integer(int64) - 振替先口座ID 例: `201` (最小: 1)
  - **description** **(必須)**: string - 備考 例: `備考`

### PUT /api/1/transfers/{id}

**操作**: 取引（振替）の更新

**説明**: 概要 指定した事業所の取引（振替）を更新する 定義 amount : 振替金額 from_walletable_type, to_walletable_type bank_account : 銀行口座 credit_card : クレジットカード wallet : その他の決済口座

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 取引(振替)ID |

### リクエストボディ

**(必須)**

- **to_walletable_id** **(必須)**: integer(int64) - 振替先口座ID 例: `1` (最小: 1)
- **to_walletable_type** **(必須)**: string - 振替先口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, credit_card, wallet) 例: `bank_account`
- **from_walletable_id** **(必須)**: integer(int64) - 振替元口座ID 例: `1` (最小: 1)
- **from_walletable_type** **(必須)**: string - 振替元口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, credit_card, wallet) 例: `credit_card`
- **amount** **(必須)**: integer(int64) - 金額 例: `5000` (最小: -9223372036854776000, 最大: 9223372036854776000)
- **date** **(必須)**: string - 振替日 (yyyy-mm-dd) 例: `2019-12-17`
- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **description** (任意): string - 備考 例: `備考`

### レスポンス (200)

- **transfer** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 取引(振替)ID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **amount** **(必須)**: integer(int64) - 金額 例: `5000` (最小: -9223372036854776000, 最大: 9223372036854776000)
  - **date** **(必須)**: string - 振替日 (yyyy-mm-dd) 例: `2019-12-17`
  - **from_walletable_type** **(必須)**: string - 振替元口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, wallet, credit_card) 例: `credit_card`
  - **from_walletable_id** **(必須)**: integer(int64) - 振替元口座ID 例: `101` (最小: 1)
  - **to_walletable_type** **(必須)**: string - 振替先口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, wallet, credit_card) 例: `bank_account`
  - **to_walletable_id** **(必須)**: integer(int64) - 振替先口座ID 例: `201` (最小: 1)
  - **description** **(必須)**: string - 備考 例: `備考`

### DELETE /api/1/transfers/{id}

**操作**: 取引（振替）の削除

**説明**: 概要 指定した事業所の取引（振替）を削除する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 取引(振替)ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (204)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
