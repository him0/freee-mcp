# Items

## 概要

品目

## エンドポイント一覧

### GET /api/1/items

**操作**: 品目一覧の取得

**説明**: 概要 指定した事業所の品目一覧を取得する 事業所の設定で品目コードを使用する設定にしている場合、レスポンスで品目コード(code)を返します

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| start_update_date | query | いいえ | string | 更新日で絞り込み：開始日(yyyy-mm-dd) |
| end_update_date | query | いいえ | string | 更新日で絞り込み：終了日(yyyy-mm-dd) |
| offset | query | いいえ | integer(int64) | 取得レコードのオフセット (デフォルト: 0) |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 50, 最小: 1, 最大: 3000) |

### レスポンス (200)

- **items** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - 品目ID 例: `101` (最小: 1)
    - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
    - **name** **(必須)**: string - 品目名 (30文字以内) 例: `タクシー代`
    - **update_date** **(必須)**: string - 更新日(yyyy-mm-dd) 例: `2019-12-17`
    - **available** **(必須)**: boolean - 品目の使用設定（true: 使用する、false: 使用しない）
<br>
<ul>
  <li>
    本APIでitemを作成した場合はtrueになります。
  </li>
  <li>
    falseにする場合はWeb画面から変更できます。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、品目自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの品目をパラメータに指定すれば、取引などにfalseの品目を設定できます。
  </li>
</ul>
    - **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `TAXI`
    - **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `201`
    - **code** (任意): string - 品目コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)

### POST /api/1/items

**操作**: 品目の作成

**説明**: 概要 指定した事業所の品目を作成する codeを利用するには、事業所の設定で品目コードを使用する設定にする必要があります。

### リクエストボディ

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **name** **(必須)**: string - 品目名 (30文字以内) 例: `新しい品目`
- **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `NEWITEM`
- **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `202`
- **code** (任意): string - 品目コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)

### レスポンス (201)

- **item** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 品目ID 例: `101` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 品目名 (30文字以内) 例: `タクシー代`
  - **update_date** **(必須)**: string - 更新日(yyyy-mm-dd) 例: `2019-12-17`
  - **available** **(必須)**: boolean - 品目の使用設定（true: 使用する、false: 使用しない）
<br>
<ul>
  <li>
    本APIでitemを作成した場合はtrueになります。
  </li>
  <li>
    falseにする場合はWeb画面から変更できます。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、品目自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの品目をパラメータに指定すれば、取引などにfalseの品目を設定できます。
  </li>
</ul>
  - **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `TAXI`
  - **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `201`
  - **code** (任意): string - 品目コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)

### GET /api/1/items/{id}

**操作**: 品目の取得

**説明**: 概要 指定した事業所の品目を取得する 事業所の設定で品目コードを使用する設定にしている場合、レスポンスで品目コード(code)を返します

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| id | path | はい | integer(int64) | 品目ID |

### レスポンス (200)

- **item** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 品目ID 例: `101` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 品目名 (30文字以内) 例: `タクシー代`
  - **update_date** **(必須)**: string - 更新日(yyyy-mm-dd) 例: `2019-12-17`
  - **available** **(必須)**: boolean - 品目の使用設定（true: 使用する、false: 使用しない）
<br>
<ul>
  <li>
    本APIでitemを作成した場合はtrueになります。
  </li>
  <li>
    falseにする場合はWeb画面から変更できます。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、品目自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの品目をパラメータに指定すれば、取引などにfalseの品目を設定できます。
  </li>
</ul>
  - **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `TAXI`
  - **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `201`
  - **code** (任意): string - 品目コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)

### PUT /api/1/items/{id}

**操作**: 品目の更新（存在しない場合は作成）

**説明**: 概要 指定した事業所の品目を更新する codeを利用するには、事業所の設定で品目コードを使用する設定にする必要があります。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 品目ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **name** **(必須)**: string - 品目名 (30文字以内) 例: `新しい品目`
- **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `NEWITEM`
- **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `202`
- **code** (任意): string - 品目コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)

### レスポンス (200)

- **item** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 品目ID 例: `101` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 品目名 (30文字以内) 例: `タクシー代`
  - **update_date** **(必須)**: string - 更新日(yyyy-mm-dd) 例: `2019-12-17`
  - **available** **(必須)**: boolean - 品目の使用設定（true: 使用する、false: 使用しない）
<br>
<ul>
  <li>
    本APIでitemを作成した場合はtrueになります。
  </li>
  <li>
    falseにする場合はWeb画面から変更できます。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、品目自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの品目をパラメータに指定すれば、取引などにfalseの品目を設定できます。
  </li>
</ul>
  - **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `TAXI`
  - **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `201`
  - **code** (任意): string - 品目コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)

### DELETE /api/1/items/{id}

**操作**: 品目の削除

**説明**: 概要 指定した事業所の品目を削除する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 品目ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (204)

### PUT /api/1/items/code/upsert

**操作**: 品目の更新（作成）

**説明**: 概要 品目コードをキーに、指定した品目の情報を更新（存在しない場合は作成）する codeを利用するには、事業所の設定で品目コードを使用する設定にする必要があります。

### リクエストボディ

- **code** **(必須)**: string - 品目コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)
- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **item** **(必須)**: object
  - **name** **(必須)**: string - 品目名 (30文字以内) 例: `新しい品目`
  - **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `NEWITEM`
  - **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `202`

### レスポンス (200)

- **item** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 品目ID 例: `101` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 品目名 (30文字以内) 例: `タクシー代`
  - **update_date** **(必須)**: string - 更新日(yyyy-mm-dd) 例: `2019-12-17`
  - **available** **(必須)**: boolean - 品目の使用設定（true: 使用する、false: 使用しない）
<br>
<ul>
  <li>
    本APIでitemを作成した場合はtrueになります。
  </li>
  <li>
    falseにする場合はWeb画面から変更できます。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、品目自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの品目をパラメータに指定すれば、取引などにfalseの品目を設定できます。
  </li>
</ul>
  - **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `TAXI`
  - **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `201`
  - **code** (任意): string - 品目コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
