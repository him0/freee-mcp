# Walletables

## 概要

口座

## エンドポイント一覧

### GET /api/1/walletables

**操作**: 口座一覧の取得

**説明**: 概要 指定した事業所の口座一覧を取得する 定義 type bank_account : 銀行口座 credit_card : クレジットカード wallet : その他の決済口座 walletable_balance : 登録残高 last_balance : 同期残高 last_synced_at : 最終同期成功日時 sync_status : 同期ステータス

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| type | query | いいえ | string | 口座種別（bank_account : 銀行口座, credit_card : クレジットカード, wallet : その他の決済口座） (選択肢: bank_account, credit_card, wallet) |
| with_balance | query | いいえ | boolean | 残高情報を含める |
| with_last_synced_at | query | いいえ | boolean | 最終同期成功日時を含める |
| with_sync_status | query | いいえ | boolean | 同期ステータスを含める |
| start_update_date | query | いいえ | string | 更新日で絞込：開始日(yyyy-mm-dd) |
| end_update_date | query | いいえ | string | 更新日で絞込：終了日(yyyy-mm-dd) |

### レスポンス (200)

- **walletables** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - 口座ID 例: `1` (最小: 1)
    - **name** **(必須)**: string - 口座名 (255文字以内) 例: `freee銀行`
    - **bank_id** **(必須)**: integer(int64) - サービスID 例: `3` (最小: 1)
    - **type** **(必須)**: string - 口座区分 (銀行口座: bank_account, クレジットカード: credit_card, その他の決済口座: wallet) (選択肢: bank_account, credit_card, wallet) 例: `bank_account`
    - **last_synced_at** (任意): string - 最終同期成功日時（ISO8601形式） 例: `2019-01-01T00:00:00+09:00`
    - **sync_status** (任意): string - 口座の同期ステータス(success: 同期成功, disabled: 同期設定なし, syncing: 同期中, token_refresh_error: トークンリフレッシュエラー, unsupported: 同期非対応, other_error: その他のエラー、freee会計画面上でご確認ください) (選択肢: success, disabled, syncing, token_refresh_error, unsupported, other_error) 例: `success`
    - **last_balance** (任意): integer(int64) - 同期残高 例: `1565583`
    - **walletable_balance** (任意): integer(int64) - 登録残高 例: `1340261`
    - **update_date** (任意): string - 更新日(yyyy-mm-dd) 例: `2020-06-15`
- **meta** (任意): object
  - **up_to_date** (任意): boolean - 集計結果が最新かどうか 例: `true`

### POST /api/1/walletables

**操作**: 口座の作成

**説明**: 概要 指定した事業所の口座を作成する 注意点 同期に対応した口座はこのAPIでは作成できません 定義 type bank_account : 銀行口座 credit_card : クレジットカード wallet : その他の決済口座 name : 口座名 bank_id : 連携サービスID is_asset : type:wallet指定時に口座を資産口座とするか負債口座とするか（true: 資産口座 (デフォルト), false: 負債口座）

### リクエストボディ

- **name** **(必須)**: string - 口座名 (255文字以内) 例: `ＸＸ銀行`
- **type** **(必須)**: string - 口座種別（bank_account : 銀行口座, credit_card : クレジットカード, wallet : その他の決済口座） (選択肢: bank_account, credit_card, wallet) 例: `bank_account`
- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **bank_id** (任意): integer(int64) - 連携サービスID（typeにbank_account、credit_cardを指定する場合は必須） 例: `1` (最小: 1)
- **is_asset** (任意): boolean - 口座を資産口座とするか負債口座とするか（true: 資産口座 (デフォルト), false: 負債口座）<br>
bank_idを指定しない場合にのみ使われます。<br>
bank_idを指定する場合には資産口座か負債口座かはbank_idに指定したサービスに応じて決定され、is_assetに指定した値は無視されます。
 例: `true`

### レスポンス (201)

- **walletable** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 口座ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 口座名, 最大255文字 例: `〇〇銀行`
  - **bank_id** **(必須)**: integer(int64) - 連携サービスID（typeにbank_account、credit_cardを指定する場合は必須） 例: `1` (最小: 1)
  - **type** **(必須)**: string - 口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, credit_card, wallet) 例: `bank_account`

### GET /api/1/walletables/{type}/{id}

**操作**: 口座の取得

**説明**: 概要 指定した事業所の口座を取得する 定義 type bank_account : 銀行口座 credit_card : クレジットカード wallet : その他の決済口座 walletable_balance : 登録残高 last_balance : 同期残高 last_synced_at : 最終同期成功日時 sync_status : 同期ステータス

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 口座ID |
| type | path | はい | string | 口座種別（bank_account : 銀行口座, credit_card : クレジットカード, wallet : その他の決済口座） (選択肢: bank_account, credit_card, wallet) |
| company_id | query | はい | integer(int64) | 事業所ID |
| with_last_synced_at | query | いいえ | boolean | 最終同期成功日時を含める |
| with_sync_status | query | いいえ | boolean | 同期ステータスを含める |

### レスポンス (200)

- **walletable** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 口座ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 口座名 (255文字以内) 例: `freee銀行`
  - **bank_id** **(必須)**: integer(int64) - サービスID 例: `3` (最小: 1)
  - **type** **(必須)**: string - 口座区分 (銀行口座: bank_account, クレジットカード: credit_card, その他の決済口座: wallet) (選択肢: bank_account, credit_card, wallet) 例: `bank_account`
  - **last_synced_at** (任意): string - 最終同期成功日時（ISO8601形式） 例: `2019-01-01T00:00:00+09:00`
  - **sync_status** (任意): string - 口座の同期ステータス(success: 同期成功, disabled: 同期設定なし, syncing: 同期中, token_refresh_error: トークンリフレッシュエラー, unsupported: 同期非対応, other_error: その他のエラー、freee会計画面上でご確認ください) (選択肢: success, disabled, syncing, token_refresh_error, unsupported, other_error) 例: `success`
  - **last_balance** (任意): integer(int64) - 同期残高 例: `1565583`
  - **walletable_balance** (任意): integer(int64) - 登録残高 例: `1340261`
  - **update_date** (任意): string - 更新日(yyyy-mm-dd) 例: `2020-06-15`
- **meta** (任意): object
  - **up_to_date** (任意): boolean - 集計結果が最新かどうか 例: `true`

### PUT /api/1/walletables/{type}/{id}

**操作**: 口座の更新

**説明**: 概要 指定した事業所の口座を更新する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 口座ID |
| type | path | はい | string | 口座種別（bank_account : 銀行口座, credit_card : クレジットカード, wallet : その他の決済口座） (選択肢: bank_account, credit_card, wallet) |

### リクエストボディ

- **name** **(必須)**: string - 口座名 (255文字以内) 例: `ＸＸ銀行`
- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)

### レスポンス (200)

- **walletable** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 口座ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 口座名 (255文字以内) 例: `freee銀行`
  - **bank_id** **(必須)**: integer(int64) - サービスID 例: `3` (最小: 1)
  - **type** **(必須)**: string - 口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, credit_card, wallet) 例: `bank_account`
  - **last_balance** (任意): integer(int64) - 同期残高 例: `1565583`
  - **walletable_balance** (任意): integer(int64) - 登録残高 例: `1340261`
- **meta** (任意): object
  - **up_to_date** (任意): boolean - 集計結果が最新かどうか 例: `true`

### DELETE /api/1/walletables/{type}/{id}

**操作**: 口座の削除

**説明**: 概要 指定した事業所の口座を削除する 注意点 削除を実行するには、当該口座に関連する仕訳データを事前に削除する必要があります。 当該口座に仕訳が残っていないか確認するには、レポートの「仕訳帳」等を参照し、必要に応じて、「取引」や「口座振替」も削除します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 口座ID |
| type | path | はい | string | 口座種別（bank_account : 銀行口座, credit_card : クレジットカード, wallet : その他の決済口座） (選択肢: bank_account, credit_card, wallet) |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (204)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
