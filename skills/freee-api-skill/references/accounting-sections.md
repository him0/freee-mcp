# Sections

## 概要

部門

## エンドポイント一覧

### GET /api/1/sections

**操作**: 部門一覧の取得

**説明**: 概要 指定した事業所の部門一覧を取得する 事業所の設定で部門コードを使用する設定にしている場合、レスポンスで部門コード(code)を返します レスポンスの例 GET https://api.freee.co.jp/api/1/sections?company_id=1 // プレミアムプラン、法人スタンダードプラン（および旧法人ベーシックプラン）以上 { &quot;sections&quot; : [ { &quot;id&quot; : 101, &quot;company_id&quot; : 1, &quot;name&quot; : &quot;開発部門&quot;, &quot;long_name&quot;: &quot;開発部門&quot;, &quot;shortcut1&quot; : &quot;DEVELOPER&quot;, &quot;shortcut2&quot; : &quot;123&quot;, &quot;indent_count&quot;: 1, &quot;parent_id&quot;: 11 }, ... ] } // それ以外のプラン ...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| start_update_date | query | いいえ | string | 更新日で絞込：開始日(yyyy-mm-dd) |
| end_update_date | query | いいえ | string | 更新日で絞込：終了日(yyyy-mm-dd) |

### レスポンス (200)

- **sections** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - 部門ID 例: `1` (最小: 1)
    - **name** **(必須)**: string - 部門名 (30文字以内) 例: `開発部門`
    - **available** **(必須)**: boolean - 部門の使用設定（true: 使用する、false: 使用しない）
<br>
<ul>
  <li>
    本APIでsectionを作成した場合はtrueになります。
  </li>
  <li>
    falseにする場合はWeb画面から変更できます。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、部門自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの部門をパラメータに指定すれば、取引などにfalseの部門を設定できます。
  </li>
</ul> 例: `true`
    - **long_name** (任意): string - 正式名称（255文字以内） 例: `開発部門`
    - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
    - **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `DEVELOPER`
    - **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `123`
    - **code** (任意): string - 部門コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)
    - **indent_count** (任意): integer(int64) - <a target="_blank" href="https://support.freee.co.jp/hc/ja/articles/209093566">部門階層</a>
<br>
※ indent_count が 0 のときは第一階層の親部門です。
 例: `0` (最小: 0)
    - **parent_id** (任意): integer(int64) - <a target="_blank" href="https://support.freee.co.jp/hc/ja/articles/209093566">親部門ID</a>
<br>
※ parent_id が null のときは第一階層の親部門です。
 例: `1` (最小: 1)
    - **update_date** (任意): string - 更新日(yyyy-mm-dd) 例: `2020-06-15`

### POST /api/1/sections

**操作**: 部門の作成

**説明**: 概要 指定した事業所の部門を作成する codeを利用するには、事業所の設定で部門コードを使用する設定にする必要があります。 レスポンスの例 // プレミアムプラン、法人スタンダードプラン（および旧法人ベーシックプラン）以上 { &quot;section&quot; : { &quot;id&quot; : 102, &quot;company_id&quot; : 1, &quot;name&quot; : &quot;開発部門&quot;, &quot;shortcut1&quot; : &quot;DEVELOPER&quot;, &quot;shortcut2&quot; : &quot;123&quot;, &quot;indent_count&quot;: 1, &quot;parent_id&quot;: 101 } } // それ以外のプラン { &quot;section&quot; : { &quot;id&quot; : 102, &quot;company_id&quot; : 1, &quot;name&quot; : &quot;開発部門&quot;, &q...

### リクエストボディ

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **name** **(必須)**: string - 部門名 (30文字以内) 例: `開発部門`
- **long_name** (任意): string - 正式名称 (255文字以内) 例: `xxxx開発部門`
- **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `DEVELOPER`
- **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `123`
- **code** (任意): string - 部門コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)
- **parent_id** (任意): integer(int64) - 親部門ID (プレミアムプラン、法人スタンダードプラン（および旧法人ベーシックプラン）以上) 例: `101` (最小: 1)

### レスポンス (201)

- **section** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 部門ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 部門名 (30文字以内) 例: `開発部門`
  - **available** **(必須)**: boolean - 部門の使用設定（true: 使用する、false: 使用しない）
<br>
<ul>
  <li>
    本APIでsectionを作成した場合はtrueになります。
  </li>
  <li>
    falseにする場合はWeb画面から変更できます。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、部門自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの部門をパラメータに指定すれば、取引などにfalseの部門を設定できます。
  </li>
</ul> 例: `true`
  - **long_name** (任意): string - 正式名称（255文字以内） 例: `開発部門`
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `DEVELOPER`
  - **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `123`
  - **code** (任意): string - 部門コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)
  - **indent_count** (任意): integer(int64) - <a target="_blank" href="https://support.freee.co.jp/hc/ja/articles/209093566">部門階層</a>
<br>
※ indent_count が 0 のときは第一階層の親部門です。
 例: `0` (最小: 0)
  - **parent_id** (任意): integer(int64) - <a target="_blank" href="https://support.freee.co.jp/hc/ja/articles/209093566">親部門ID</a>
<br>
※ parent_id が null のときは第一階層の親部門です。
 例: `1` (最小: 1)
  - **update_date** (任意): string - 更新日(yyyy-mm-dd) 例: `2020-06-15`

### GET /api/1/sections/{id}

**操作**: 部門の取得

**説明**: 概要 指定した事業所の部門を取得する 事業所の設定で部門コードを使用する設定にしている場合、レスポンスで部門コード(code)を返します レスポンスの例 // プレミアムプラン、法人スタンダードプラン（および旧法人ベーシックプラン）以上 { &quot;section&quot; : { &quot;id&quot; : 102, &quot;company_id&quot; : 1, &quot;name&quot; : &quot;開発部門&quot;, &quot;long_name&quot;: &quot;開発部門&quot;, &quot;shortcut1&quot; : &quot;DEVELOPER&quot;, &quot;shortcut2&quot; : &quot;123&quot;, &quot;indent_count&quot;: 1, &quot;parent_id&quot;: 101 } } // それ以外のプラン { &quot;section&quot; : { &quot;id&quot; : 102, &quot;company_id&qu...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 部門ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (200)

- **section** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 部門ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 部門名 (30文字以内) 例: `開発部門`
  - **available** **(必須)**: boolean - 部門の使用設定（true: 使用する、false: 使用しない）
<br>
<ul>
  <li>
    本APIでsectionを作成した場合はtrueになります。
  </li>
  <li>
    falseにする場合はWeb画面から変更できます。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、部門自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの部門をパラメータに指定すれば、取引などにfalseの部門を設定できます。
  </li>
</ul> 例: `true`
  - **long_name** (任意): string - 正式名称（255文字以内） 例: `開発部門`
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `DEVELOPER`
  - **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `123`
  - **code** (任意): string - 部門コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)
  - **indent_count** (任意): integer(int64) - <a target="_blank" href="https://support.freee.co.jp/hc/ja/articles/209093566">部門階層</a>
<br>
※ indent_count が 0 のときは第一階層の親部門です。
 例: `0` (最小: 0)
  - **parent_id** (任意): integer(int64) - <a target="_blank" href="https://support.freee.co.jp/hc/ja/articles/209093566">親部門ID</a>
<br>
※ parent_id が null のときは第一階層の親部門です。
 例: `1` (最小: 1)
  - **update_date** (任意): string - 更新日(yyyy-mm-dd) 例: `2020-06-15`

### PUT /api/1/sections/{id}

**操作**: 部門の更新

**説明**: 概要 指定した事業所の部門を更新する codeを利用するには、事業所の設定で部門コードを使用する設定にする必要があります。 レスポンスの例 // プレミアムプラン、法人スタンダードプラン（および旧法人ベーシックプラン）以上 { &quot;section&quot; : { &quot;id&quot; : 102, &quot;company_id&quot; : 1, &quot;name&quot; : &quot;開発部門&quot;, &quot;long_name&quot;: &quot;開発部門&quot;, &quot;shortcut1&quot; : &quot;DEVELOPER&quot;, &quot;shortcut2&quot; : &quot;123&quot;, &quot;indent_count&quot;: 1, &quot;parent_id&quot;: 101 } } // それ以外のプラン { &quot;section&quot; : { &quot;id&quot; : 102, &quot;company_id&quot; : 1...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) |  |

### リクエストボディ

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **name** **(必須)**: string - 部門名 (30文字以内) 例: `開発部門`
- **long_name** (任意): string - 正式名称 (255文字以内) 例: `xxxx開発部門`
- **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `DEVELOPER`
- **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `123`
- **code** (任意): string - 部門コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)
- **parent_id** (任意): integer(int64) - 親部門ID (プレミアムプラン、法人スタンダードプラン（および旧法人ベーシックプラン）以上) 例: `101` (最小: 1)

### レスポンス (200)

- **section** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 部門ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 部門名 (30文字以内) 例: `開発部門`
  - **available** **(必須)**: boolean - 部門の使用設定（true: 使用する、false: 使用しない）
<br>
<ul>
  <li>
    本APIでsectionを作成した場合はtrueになります。
  </li>
  <li>
    falseにする場合はWeb画面から変更できます。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、部門自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの部門をパラメータに指定すれば、取引などにfalseの部門を設定できます。
  </li>
</ul> 例: `true`
  - **long_name** (任意): string - 正式名称（255文字以内） 例: `開発部門`
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `DEVELOPER`
  - **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `123`
  - **code** (任意): string - 部門コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)
  - **indent_count** (任意): integer(int64) - <a target="_blank" href="https://support.freee.co.jp/hc/ja/articles/209093566">部門階層</a>
<br>
※ indent_count が 0 のときは第一階層の親部門です。
 例: `0` (最小: 0)
  - **parent_id** (任意): integer(int64) - <a target="_blank" href="https://support.freee.co.jp/hc/ja/articles/209093566">親部門ID</a>
<br>
※ parent_id が null のときは第一階層の親部門です。
 例: `1` (最小: 1)
  - **update_date** (任意): string - 更新日(yyyy-mm-dd) 例: `2020-06-15`

### DELETE /api/1/sections/{id}

**操作**: 部門の削除

**説明**: 概要 指定した事業所の部門を削除する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) |  |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (204)

### PUT /api/1/sections/code/upsert

**操作**: 部門の更新（存在しない場合は作成）

**説明**: 概要 部門コードをキーに、指定した部門の情報を更新（存在しない場合は作成）する 注意点 codeを利用するには、事業所の設定で部門コードを使用する設定にする必要があります。

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **code** **(必須)**: string - 部門コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)
- **section** **(必須)**: object
  - **name** **(必須)**: string - 部門名 (30文字以内) 例: `開発部門`
  - **long_name** (任意): string - 正式名称 (255文字以内) 例: `xxxx開発部門`
  - **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `DEVELOPER`
  - **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `123`
  - **parent_code** (任意): string - 親部門コード。親部門コードの値が空の場合は、codeで指定した部門が親部門になる。 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)

### レスポンス (200)

- **section** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 部門ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 部門名 (30文字以内) 例: `開発部門`
  - **available** **(必須)**: boolean - 部門の使用設定（true: 使用する、false: 使用しない）
<br>
<ul>
  <li>
    本APIでsectionを作成した場合はtrueになります。
  </li>
  <li>
    falseにする場合はWeb画面から変更できます。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、部門自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの部門をパラメータに指定すれば、取引などにfalseの部門を設定できます。
  </li>
</ul> 例: `true`
  - **long_name** (任意): string - 正式名称（255文字以内） 例: `開発部門`
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **shortcut1** (任意): string - ショートカット１ (20文字以内) 例: `DEVELOPER`
  - **shortcut2** (任意): string - ショートカット２ (20文字以内) 例: `123`
  - **code** (任意): string - 部門コード 例: `code001` (パターン: ^[0-9a-zA-Z_-]+$)
  - **indent_count** (任意): integer(int64) - <a target="_blank" href="https://support.freee.co.jp/hc/ja/articles/209093566">部門階層</a>
<br>
※ indent_count が 0 のときは第一階層の親部門です。
 例: `0` (最小: 0)
  - **parent_id** (任意): integer(int64) - <a target="_blank" href="https://support.freee.co.jp/hc/ja/articles/209093566">親部門ID</a>
<br>
※ parent_id が null のときは第一階層の親部門です。
 例: `1` (最小: 1)
  - **update_date** (任意): string - 更新日(yyyy-mm-dd) 例: `2020-06-15`



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
