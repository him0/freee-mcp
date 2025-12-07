# Banks

## 概要

連携サービス

## エンドポイント一覧

### GET /api/1/banks

**操作**: 連携サービス一覧の取得

**説明**: 概要 連携しているサービス一覧を取得する 定義 type bank_account : 銀行口座 credit_card : クレジットカード wallet : その他の決済口座

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| offset | query | いいえ | integer(int64) | 取得レコードのオフセット (デフォルト: 0) |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 20, 最小: 1, 最大: 500) |
| type | query | いいえ | string | サービス種別 (選択肢: bank_account, credit_card, wallet) |

### レスポンス (200)

- **banks** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - 連携サービスID 例: `1` (最小: 1)
    - **name** (任意): string - 連携サービス名 例: `フリー銀行`
    - **type** (任意): string - 連携サービス種別: (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, credit_card, wallet) 例: `bank_account`
    - **name_kana** (任意): string - 連携サービス名(カナ) 例: `フリーギンコウ`

### GET /api/1/banks/{id}

**操作**: 連携サービスの取得

**説明**: 概要 連携しているサービスを取得する 定義 type bank_account : 銀行口座 credit_card : クレジットカード wallet : その他の決済口座

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 連携サービスID |

### レスポンス (200)

- **bank** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 連携サービスID 例: `1` (最小: 1)
  - **name** (任意): string - 連携サービス名 例: `フリー銀行`
  - **type** (任意): string - 連携サービス種別: (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, credit_card, wallet) 例: `bank_account`
  - **name_kana** (任意): string - 連携サービス名(カナ) 例: `フリーギンコウ`



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
