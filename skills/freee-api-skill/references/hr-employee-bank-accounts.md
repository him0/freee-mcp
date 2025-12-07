# 従業員の銀行口座

## 概要

従業員の銀行口座の操作

## エンドポイント一覧

### GET /api/v1/employees/{employee_id}/bank_account_rule

**操作**: 従業員の銀行口座の取得

**説明**: 概要 指定した従業員・日付の銀行口座情報を返します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| year | query | はい | integer | 従業員情報を取得したい年 |
| month | query | はい | integer | 従業員情報を取得したい月<br>
締め日支払い日設定が翌月払いの従業員情報の場合は、 指定したmonth + 1の値が検索結果として返します。<br>
翌月払いの従業員の2022/01の従業員情報を取得する場合は、year=2021,month=12を指定してください。<br> |
| employee_id | path | はい | integer | 従業員ID |

### レスポンス (200)

successful operation

- **employee_bank_account_rule** (任意): object
  - **id** (任意): integer(int32) - 銀行口座ルールID
  - **company_id** (任意): integer(int32) - 事業所ID
  - **employee_id** (任意): integer(int32) - 従業員ID
  - **bank_name** (任意): string - 金融機関名
  - **bank_name_kana** (任意): string - 金融機関名カナ
  - **bank_code** (任意): string - 金融機関コード
  - **branch_name** (任意): string - 支店名
  - **branch_name_kana** (任意): string - 支店名カナ
  - **branch_code** (任意): string - 支店コード
  - **account_number** (任意): string - 口座番号
  - **account_name** (任意): string - 口座名義カナ
  - **account_type** (任意): string - 預金種類 ordinary: 普通預金, current: 当座預金, saving: 貯蓄預金

### PUT /api/v1/employees/{employee_id}/bank_account_rule

**操作**: 従業員の銀行口座の更新

**説明**: 概要 指定した従業員の銀行口座1の情報を更新します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| employee_id | path | はい | integer | 従業員ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 更新対象事業所ID（必須） (最小: 1, 最大: 2147483647)
- **year** **(必須)**: integer(int32) - 更新対象年（必須） 例: `2021` (最小: 2000, 最大: 2100)
- **month** **(必須)**: integer(int32) - 更新対象月（必須）<br>
締め日支払い日設定が翌月払いの従業員情報の場合は、 指定したmonth + 1の値が更新されます。<br>
翌月払いの従業員の2022/01の従業員情報を更新する場合は、year=2021,month=12を指定してください。<br> 例: `1` (最小: 1, 最大: 12)
- **employee_bank_account_rule** **(必須)**: object
  - **bank_name** (任意): string - 金融機関名
  - **bank_name_kana** (任意): string - 金融機関名カナ 英字カナのみ
  - **bank_code** (任意): string - 金融機関コード 数値文字列4桁 例: `0000`
  - **branch_name** (任意): string - 支店名
  - **branch_name_kana** (任意): string - 支店名カナ　英字カナのみ
  - **branch_code** (任意): string - 支店コード 数値文字列3桁 例: `000`
  - **account_number** (任意): string - 口座番号 数値文字列7桁 例: `0000000`
  - **account_name** (任意): string - 口座名義カナ　英字カナのみ
  - **account_type** (任意): string - 預金種類 ordinary: 普通預金, current: 当座預金, saving: 貯蓄預金 (選択肢: ordinary, current, saving)

### レスポンス (200)

successful operation

- **employee_bank_account_rule** (任意): object
  - **id** (任意): integer(int32) - 銀行口座ルールID
  - **company_id** (任意): integer(int32) - 事業所ID
  - **employee_id** (任意): integer(int32) - 従業員ID
  - **bank_name** (任意): string - 金融機関名
  - **bank_name_kana** (任意): string - 金融機関名カナ
  - **bank_code** (任意): string - 金融機関コード
  - **branch_name** (任意): string - 支店名
  - **branch_name_kana** (任意): string - 支店名カナ
  - **branch_code** (任意): string - 支店コード
  - **account_number** (任意): string - 口座番号
  - **account_name** (任意): string - 口座名義カナ
  - **account_type** (任意): string - 預金種類 ordinary: 普通預金, current: 当座預金, saving: 貯蓄預金



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
