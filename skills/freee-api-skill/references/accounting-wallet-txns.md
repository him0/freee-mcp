# Wallet txns

## 概要

口座明細

## エンドポイント一覧

### GET /api/1/wallet_txns

**操作**: 口座明細一覧の取得

**説明**: 概要 指定した事業所の口座明細一覧を取得する 定義 amount : 明細金額 due_amount : 取引登録待ち金額 balance : 残高 entry_side income : 入金 expense : 出金 walletable_type bank_account : 銀行口座 credit_card : クレジットカード wallet : その他の決済口座

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| walletable_type | query | いいえ | string | 口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) walletable_type、walletable_idは同時に指定が必要です。 (選択肢: bank_account, credit_card, wallet) |
| walletable_id | query | いいえ | integer(int64) | 口座ID walletable_type、walletable_idは同時に指定が必要です。 |
| start_date | query | いいえ | string | 取引日で絞込：開始日 (yyyy-mm-dd) |
| end_date | query | いいえ | string | 取引日で絞込：終了日 (yyyy-mm-dd) |
| entry_side | query | いいえ | string | 入金／出金 (入金: income, 出金: expense) (選択肢: income, expense) |
| offset | query | いいえ | integer(int64) | 取得レコードのオフセット (デフォルト: 0) |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 20, 最小: 1, 最大: 100)  |

### レスポンス (200)

- **wallet_txns** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - 明細ID 例: `1` (最小: 1)
    - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
    - **date** **(必須)**: string - 取引日(yyyy-mm-dd) 例: `2019-12-17`
    - **amount** **(必須)**: integer(int64) - 取引金額 例: `5000` (最小: -9223372036854776000, 最大: 9223372036854776000)
    - **due_amount** **(必須)**: integer(int64) - 未決済金額 例: `0`
    - **balance** **(必須)**: integer(int64) - 残高(銀行口座等)(Webで残高未設定で登録した場合や口座明細の作成APIでキーを指定しないで登録した場合などはnullとなります) 例: `10000`
    - **entry_side** **(必須)**: string - 入金／出金 (入金: income, 出金: expense) (選択肢: income, expense) 例: `income`
    - **walletable_type** **(必須)**: string - 口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, credit_card, wallet) 例: `bank_account`
    - **walletable_id** **(必須)**: integer(int64) - 口座ID 例: `1` (最小: 1)
    - **description** **(必須)**: string - 取引内容 例: `振込 カ）ABC`
    - **status** **(必須)**: integer(int64) - 明細のステータス（消込待ち: 1, 消込済み: 2, 無視: 3, 消込中: 4, 対象外: 6） (最小: 1, 最大: 6)
    - **rule_matched** **(必須)**: boolean - 登録時に<a href="https://support.freee.co.jp/hc/ja/articles/202848350-明細の自動登録ルールを設定する" target="_blank">自動登録ルールの設定</a>が適用され、登録処理が実行された場合、
trueになります。〜を推測する、〜の消込をするの条件の場合は一致してもfalseになります。
 例: `true`

### POST /api/1/wallet_txns

**操作**: 口座明細の作成

**説明**: 概要 指定した事業所の口座明細を作成する 定義 amount : 明細金額 due_amount : 取引登録待ち金額 balance : 残高 entry_side income : 入金 expense : 出金 walletable_type bank_account : 銀行口座 credit_card : クレジットカード wallet : その他の決済口座

### リクエストボディ

- **entry_side** **(必須)**: string - 入金／出金 (入金: income, 出金: expense) (選択肢: income, expense) 例: `income`
- **description** (任意): string - 取引内容 例: `取引内容`
- **amount** **(必須)**: integer(int64) - 取引金額 例: `5000` (最小: -9223372036854776000, 最大: 9223372036854776000)
- **walletable_id** **(必須)**: integer(int64) - 口座ID 例: `1` (最小: 1)
- **walletable_type** **(必須)**: string - 口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, credit_card, wallet) 例: `bank_account`
- **date** **(必須)**: string - 取引日 (yyyy-mm-dd) 例: `2019-12-17`
- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **balance** (任意): integer(int64) - 残高 (銀行口座等) 例: `10000` (最小: -9223372036854776000, 最大: 9223372036854776000)

### レスポンス (201)

- **wallet_txn** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 明細ID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **date** **(必須)**: string - 取引日(yyyy-mm-dd) 例: `2019-12-17`
  - **amount** **(必須)**: integer(int64) - 取引金額 例: `5000` (最小: -9223372036854776000, 最大: 9223372036854776000)
  - **due_amount** **(必須)**: integer(int64) - 未決済金額 例: `0`
  - **balance** **(必須)**: integer(int64) - 残高(銀行口座等)(Webで残高未設定で登録した場合や口座明細の作成APIでキーを指定しないで登録した場合などはnullとなります) 例: `10000`
  - **entry_side** **(必須)**: string - 入金／出金 (入金: income, 出金: expense) (選択肢: income, expense) 例: `income`
  - **walletable_type** **(必須)**: string - 口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, credit_card, wallet) 例: `bank_account`
  - **walletable_id** **(必須)**: integer(int64) - 口座ID 例: `1` (最小: 1)
  - **description** **(必須)**: string - 取引内容 例: `振込 カ）ABC`
  - **status** **(必須)**: integer(int64) - 明細のステータス（消込待ち: 1, 消込済み: 2, 無視: 3, 消込中: 4, 対象外: 6） (最小: 1, 最大: 6)
  - **rule_matched** **(必須)**: boolean - 登録時に<a href="https://support.freee.co.jp/hc/ja/articles/202848350-明細の自動登録ルールを設定する" target="_blank">自動登録ルールの設定</a>が適用され、登録処理が実行された場合、
trueになります。〜を推測する、〜の消込をするの条件の場合は一致してもfalseになります。
 例: `true`

### GET /api/1/wallet_txns/{id}

**操作**: 口座明細の取得

**説明**: 概要 指定した事業所の口座明細を取得する 定義 amount : 明細金額 due_amount : 取引登録待ち金額 balance : 残高 entry_side income : 入金 expense : 出金 walletable_type bank_account : 銀行口座 credit_card : クレジットカード wallet : その他の決済口座

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 明細ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (200)

- **wallet_txn** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 明細ID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **date** **(必須)**: string - 取引日(yyyy-mm-dd) 例: `2019-12-17`
  - **amount** **(必須)**: integer(int64) - 取引金額 例: `5000` (最小: -9223372036854776000, 最大: 9223372036854776000)
  - **due_amount** **(必須)**: integer(int64) - 未決済金額 例: `0`
  - **balance** **(必須)**: integer(int64) - 残高(銀行口座等)(Webで残高未設定で登録した場合や口座明細の作成APIでキーを指定しないで登録した場合などはnullとなります) 例: `10000`
  - **entry_side** **(必須)**: string - 入金／出金 (入金: income, 出金: expense) (選択肢: income, expense) 例: `income`
  - **walletable_type** **(必須)**: string - 口座区分 (銀行口座: bank_account, クレジットカード: credit_card, 現金: wallet) (選択肢: bank_account, credit_card, wallet) 例: `bank_account`
  - **walletable_id** **(必須)**: integer(int64) - 口座ID 例: `1` (最小: 1)
  - **description** **(必須)**: string - 取引内容 例: `振込 カ）ABC`
  - **status** **(必須)**: integer(int64) - 明細のステータス（消込待ち: 1, 消込済み: 2, 無視: 3, 消込中: 4, 対象外: 6） (最小: 1, 最大: 6)
  - **rule_matched** **(必須)**: boolean - 登録時に<a href="https://support.freee.co.jp/hc/ja/articles/202848350-明細の自動登録ルールを設定する" target="_blank">自動登録ルールの設定</a>が適用され、登録処理が実行された場合、
trueになります。〜を推測する、〜の消込をするの条件の場合は一致してもfalseになります。
 例: `true`

### DELETE /api/1/wallet_txns/{id}

**操作**: 口座明細の削除

**説明**: 概要 指定した事業所の口座明細を削除する 注意点 同期をして取得したデータが「明細」の場合は、削除および再取得はできません。 詳細はfreeeヘルプセンターをご確認ください。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 明細ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (204)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
