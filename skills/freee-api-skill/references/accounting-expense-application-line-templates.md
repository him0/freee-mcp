# Expense application line templates

## 概要

経費科目

## エンドポイント一覧

### GET /api/1/expense_application_line_templates

**操作**: 経費科目一覧の取得

**説明**: 概要 指定した事業所の経費科目一覧を取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| offset | query | いいえ | integer(int64) | 取得レコードのオフセット (デフォルト: 0) |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 20, 最小: 1, 最大: 100) |

### レスポンス (200)

- **expense_application_line_templates** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - 経費科目ID 例: `1` (最小: 1)
    - **name** **(必須)**: string - 経費科目名 例: `交通費`
    - **account_item_id** (任意): integer(int64) - 勘定科目ID 例: `1` (最小: 1)
    - **account_item_name** **(必須)**: string - 勘定科目名 例: `旅費交通費`
    - **tax_code** (任意): integer(int64) - 税区分コード 例: `1` (最小: 0, 最大: 2147483647)
    - **tax_name** **(必須)**: string - 税区分名 例: `課対仕入`
    - **description** (任意): string - 経費科目の説明 例: `電車、バス、飛行機などの交通費`
    - **line_description** (任意): string - 内容の補足 例: `移動区間`
    - **required_receipt** (任意): boolean - 添付ファイルの必須/任意 例: `true`

### POST /api/1/expense_application_line_templates

**操作**: 経費科目の作成

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **name** **(必須)**: string - 経費科目名 (100文字以内) 例: `交通費`
- **account_item_id** **(必須)**: integer(int64) - 勘定科目ID 例: `1` (最小: 1)
- **item_id** (任意): integer(int64) - 品目ID 例: `1` (最小: 1)
- **tax_code** **(必須)**: integer(int64) - 税区分コード（税区分のdisplay_categoryがtax_5: 5%表示の税区分, tax_r8: 軽減税率8%表示の税区分に該当するtax_codeのみ利用可能です。税区分のdisplay_categoryは /taxes/companies/{:company_id}のAPIから取得可能です。） 例: `1` (最小: 0, 最大: 2147483647)
- **description** (任意): string - 経費科目の説明 (1000文字以内) 例: `電車、バス、飛行機などの交通費`
- **line_description** (任意): string - 内容の補足 (1000文字以内) 例: `移動区間`
- **required_receipt** (任意): boolean - 添付ファイルの必須/任意<br>
falseを指定した時は申請時の領収書の添付を任意とします。<br>
trueを指定した時は申請時の領収書の添付を必須とします。<br>
未指定の時は申請時の領収書の添付を任意とします。 例: `true`

### レスポンス (201)

- **expense_application_line_template** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 経費科目ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 経費科目名 例: `交通費`
  - **account_item_id** (任意): integer(int64) - 勘定科目ID 例: `1` (最小: 1)
  - **account_item_name** **(必須)**: string - 勘定科目名 例: `旅費交通費`
  - **tax_code** (任意): integer(int64) - 税区分コード 例: `1` (最小: 0, 最大: 2147483647)
  - **tax_name** **(必須)**: string - 税区分名 例: `課対仕入`
  - **description** (任意): string - 経費科目の説明 例: `電車、バス、飛行機などの交通費`
  - **line_description** (任意): string - 内容の補足 例: `移動区間`
  - **required_receipt** (任意): boolean - 添付ファイルの必須/任意 例: `true`

### GET /api/1/expense_application_line_templates/{id}

**操作**: 経費科目の取得

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 経費科目ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (200)

- **expense_application_line_template** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 経費科目ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 経費科目名 例: `交通費`
  - **account_item_id** (任意): integer(int64) - 勘定科目ID 例: `1` (最小: 1)
  - **account_item_name** **(必須)**: string - 勘定科目名 例: `旅費交通費`
  - **tax_code** (任意): integer(int64) - 税区分コード 例: `1` (最小: 0, 最大: 2147483647)
  - **tax_name** **(必須)**: string - 税区分名 例: `課対仕入`
  - **description** (任意): string - 経費科目の説明 例: `電車、バス、飛行機などの交通費`
  - **line_description** (任意): string - 内容の補足 例: `移動区間`
  - **required_receipt** (任意): boolean - 添付ファイルの必須/任意 例: `true`

### PUT /api/1/expense_application_line_templates/{id}

**操作**: 経費科目の更新

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 経費科目ID |

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **name** **(必須)**: string - 経費科目名 (100文字以内) 例: `交通費`
- **account_item_id** **(必須)**: integer(int64) - 勘定科目ID 例: `1` (最小: 1)
- **item_id** (任意): integer(int64) - 品目ID 例: `1` (最小: 1)
- **tax_code** **(必須)**: integer(int64) - 税区分コード（税区分のdisplay_categoryがtax_5: 5%表示の税区分, tax_r8: 軽減税率8%表示の税区分に該当するtax_codeのみ利用可能です。税区分のdisplay_categoryは /taxes/companies/{:company_id}のAPIから取得可能です。） 例: `1` (最小: 0, 最大: 2147483647)
- **description** (任意): string - 経費科目の説明 (1000文字以内) 例: `電車、バス、飛行機などの交通費`
- **line_description** (任意): string - 内容の補足 (1000文字以内) 例: `移動区間`
- **required_receipt** (任意): boolean - 添付ファイルの必須/任意<br>
falseを指定した時は申請時の領収書の添付を任意とします。<br>
trueを指定した時は申請時の領収書の添付を必須とします。<br>
未指定の時は申請時の領収書の添付を任意とします。 例: `true`

### レスポンス (200)

- **expense_application_line_template** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 経費科目ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 経費科目名 例: `交通費`
  - **account_item_id** (任意): integer(int64) - 勘定科目ID 例: `1` (最小: 1)
  - **account_item_name** **(必須)**: string - 勘定科目名 例: `旅費交通費`
  - **tax_code** (任意): integer(int64) - 税区分コード 例: `1` (最小: 0, 最大: 2147483647)
  - **tax_name** **(必須)**: string - 税区分名 例: `課対仕入`
  - **description** (任意): string - 経費科目の説明 例: `電車、バス、飛行機などの交通費`
  - **line_description** (任意): string - 内容の補足 例: `移動区間`
  - **required_receipt** (任意): boolean - 添付ファイルの必須/任意 例: `true`

### DELETE /api/1/expense_application_line_templates/{id}

**操作**: 経費科目の削除

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 経費科目ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (204)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
