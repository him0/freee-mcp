# Account items

## 概要

勘定科目

## エンドポイント一覧

### GET /api/1/account_items/{id}

**操作**: 勘定科目の取得

**説明**: 概要 指定した勘定科目を取得する 事業所の設定で勘定科目コードを使用する設定にしている場合、レスポンスで勘定科目コード(code)を返します

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| id | path | はい | integer(int64) | 勘定科目ID |

### レスポンス (200)

- **account_item** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 勘定科目ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 勘定科目名 (30文字以内) 例: `ソフトウェア`
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **tax_code** **(必須)**: integer(int64) - 税区分コード 例: `1` (最小: 0, 最大: 2147483647)
  - **account_category** **(必須)**: string - 勘定科目カテゴリー 例: `現金・預金`
  - **account_category_id** **(必須)**: integer(int64) - 勘定科目のカテゴリーID 例: `1` (最小: 1)
  - **shortcut** (任意): string - ショートカット1 (20文字以内) 例: `SOFUTO`
  - **shortcut_num** (任意): string - ショートカット2 (20文字以内) 例: `123`
  - **code** (任意): string - 勘定科目コード 例: `123`
  - **searchable** **(必須)**: integer(int64) - 検索可能:2, 検索不可：3 例: `2` (最小: 2, 最大: 3)
  - **accumulated_dep_account_item_name** (任意): string - 減価償却累計額勘定科目（法人のみ利用可能） 例: `減価償却累計額`
  - **accumulated_dep_account_item_id** (任意): integer(int64) - 減価償却累計額勘定科目ID（法人のみ利用可能） 例: `1` (最小: 1)
  - **items** (任意): array[object]
  - **partners** (任意): array[object]
  - **available** **(必須)**: boolean - 勘定科目の使用設定（true: 使用する、false: 使用しない） 例: `true`
  - **walletable_id** **(必須)**: integer(int64) - 口座ID 例: `1` (最小: 1)
  - **group_name** (任意): string - 決算書表示名（小カテゴリー） 例: `売掛金`
  - **group_id** (任意): integer(int64) - 決算書表示名ID（小カテゴリー） 例: `1` (最小: 1)
  - **corresponding_income_name** (任意): string - 収入取引相手勘定科目名 例: `売掛金`
  - **corresponding_income_id** (任意): integer(int64) - 収入取引相手勘定科目ID 例: `1` (最小: 1)
  - **corresponding_expense_name** (任意): string - 支出取引相手勘定科目名 例: `買掛金`
  - **corresponding_expense_id** (任意): integer(int64) - 支出取引相手勘定科目ID 例: `1` (最小: 1)

### PUT /api/1/account_items/{id}

**操作**: 勘定科目の更新

**説明**: 概要 指定した勘定科目を更新する 注意点 tax_codeは、指定した事業所の税区分一覧の取得APIでavailableの値がtrue、かつ経過措置税区分ではない5%の税区分を確認して、そのcodeを指定して勘定科目の更新をしてください。例 課対仕入の場合、34を指定してください codeを利用するには、事業所の設定で勘定科目コードを使用する設定にする必要があります。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 勘定科目ID |

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **account_item** **(必須)**: object
  - **name** (任意): string - 勘定科目名 (30文字以内)
口座に紐付かない勘定科目の更新時は必須です。
口座に紐付く勘定科目の更新時は指定することができません。
 例: `新しい勘定科目`
  - **shortcut** (任意): string - ショートカット1 (20文字以内) 例: `NEWACCOUNTITEM`
  - **shortcut_num** (任意): string - ショートカット2 (20文字以内) 例: `999`
  - **code** (任意): string - 勘定科目コード 例: `999` (パターン: ^[0-9a-zA-Z_-]+$)
  - **tax_code** **(必須)**: integer(int64) - 税区分コード 指定できるコードは本APIの注意点をご確認ください。 例: `1` (最小: 0, 最大: 2147483647)
  - **group_name** **(必須)**: string - 決算書表示名（小カテゴリー） Selectablesフォーム用選択項目情報エンドポイント(account_groups.name)で取得可能です 例: `その他預金`
  - **account_category_id** **(必須)**: integer(int64) - 勘定科目カテゴリーID Selectablesフォーム用選択項目情報エンドポイント(account_groups.account_category_id)で取得可能です 例: `1` (最小: 1)
  - **corresponding_income_id** **(必須)**: integer(int64) - 収入取引相手勘定科目ID 例: `1`
  - **corresponding_expense_id** **(必須)**: integer(int64) - 支出取引相手勘定科目ID 例: `1` (最小: 1)
  - **accumulated_dep_account_item_id** (任意): integer(int64) - 減価償却累計額勘定科目ID（法人のみ利用可能） 例: `1` (最小: 1)
  - **searchable** (任意): integer(int64) - 検索可能:2, 検索不可：3(登録時未指定の場合は2で登録されます。更新時未指定の場合はsearchableは変更されません。) 例: `2` (最小: 2, 最大: 3)
  - **items** (任意): array[object] - 品目
  - **partners** (任意): array[object] - 取引先

### レスポンス (200)

- **account_item** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 勘定科目ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 勘定科目名 (30文字以内) 例: `ソフトウェア`
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **tax_code** **(必須)**: integer(int64) - 税区分コード 例: `1` (最小: 0, 最大: 2147483647)
  - **account_category** **(必須)**: string - 勘定科目カテゴリー 例: `現金・預金`
  - **account_category_id** **(必須)**: integer(int64) - 勘定科目のカテゴリーID 例: `1` (最小: 1)
  - **shortcut** (任意): string - ショートカット1 (20文字以内) 例: `SOFUTO`
  - **shortcut_num** (任意): string - ショートカット2 (20文字以内) 例: `123`
  - **code** (任意): string - 勘定科目コード 例: `123`
  - **searchable** **(必須)**: integer(int64) - 検索可能:2, 検索不可：3 例: `2` (最小: 2, 最大: 3)
  - **accumulated_dep_account_item_name** (任意): string - 減価償却累計額勘定科目（法人のみ利用可能） 例: `減価償却累計額`
  - **accumulated_dep_account_item_id** (任意): integer(int64) - 減価償却累計額勘定科目ID（法人のみ利用可能） 例: `1` (最小: 1)
  - **items** (任意): array[object]
  - **partners** (任意): array[object]
  - **available** **(必須)**: boolean - 勘定科目の使用設定（true: 使用する、false: 使用しない） 例: `true`
  - **walletable_id** **(必須)**: integer(int64) - 口座ID 例: `1` (最小: 1)
  - **group_name** (任意): string - 決算書表示名（小カテゴリー） 例: `売掛金`
  - **group_id** (任意): integer(int64) - 決算書表示名ID（小カテゴリー） 例: `1` (最小: 1)
  - **corresponding_income_name** (任意): string - 収入取引相手勘定科目名 例: `売掛金`
  - **corresponding_income_id** (任意): integer(int64) - 収入取引相手勘定科目ID 例: `1` (最小: 1)
  - **corresponding_expense_name** (任意): string - 支出取引相手勘定科目名 例: `買掛金`
  - **corresponding_expense_id** (任意): integer(int64) - 支出取引相手勘定科目ID 例: `1` (最小: 1)

### DELETE /api/1/account_items/{id}

**操作**: 勘定科目の削除

**説明**: 概要 指定した勘定科目を削除する 注意点 削除できる勘定科目は、追加で作成したカスタム勘定科目のみです。 デフォルトで存在する勘定科目や口座の勘定科目は削除できません。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 勘定科目ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (204)

### GET /api/1/account_items

**操作**: 勘定科目一覧の取得

**説明**: 概要 指定した事業所の勘定科目一覧を取得する 定義 default_tax_code : リクエストした日時を基準とした税区分コード 注意点 default_tax_code は勘定科目作成・更新時に利用するものではありません 事業所の設定で勘定科目コードを使用する設定にしている場合、レスポンスで勘定科目コード(code)を返します

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| base_date | query | いいえ | string | 基準日:指定した場合、勘定科目に紐づく税区分(default_tax_code)が、基準日の税率に基づいて返ります。 |
| start_update_date | query | いいえ | string | 更新日で絞込：開始日(yyyy-mm-dd) |
| end_update_date | query | いいえ | string | 更新日で絞込：終了日(yyyy-mm-dd) |

### レスポンス (200)

- **account_items** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - 勘定科目ID 例: `1` (最小: 1)
    - **name** **(必須)**: string - 勘定科目名 (30文字以内) 例: `ソフトウェア`
    - **tax_code** **(必須)**: integer(int64) - 税区分コード 例: `1`
    - **shortcut** (任意): string - ショートカット1 (20文字以内) 例: `SOFUTO`
    - **shortcut_num** (任意): string - ショートカット2 (20文字以内) 例: `123`
    - **code** (任意): string - 勘定科目コード 例: `123`
    - **default_tax_code** **(必須)**: integer(int64) - デフォルト設定がされている税区分コード 例: `34`
    - **account_category** **(必須)**: string - 勘定科目カテゴリー 例: `現金・預金`
    - **account_category_id** **(必須)**: integer(int64) - 勘定科目のカテゴリーID 例: `1` (最小: 1)
    - **categories** **(必須)**: array[string]
    - **available** **(必須)**: boolean - 勘定科目の使用設定（true: 使用する、false: 使用しない） 例: `true`
    - **walletable_id** **(必須)**: integer(int64) - 口座ID 例: `1` (最小: 1)
    - **group_name** (任意): string - 決算書表示名（小カテゴリー） 例: `売掛金`
    - **group_id** (任意): integer(int64) - 決算書表示名ID（小カテゴリー） 例: `1` (最小: 1)
    - **corresponding_income_name** (任意): string - 収入取引相手勘定科目名 例: `売掛金`
    - **corresponding_income_id** (任意): integer(int64) - 収入取引相手勘定科目ID 例: `1` (最小: 1)
    - **corresponding_expense_name** (任意): string - 支出取引相手勘定科目名 例: `買掛金`
    - **corresponding_expense_id** (任意): integer(int64) - 支出取引相手勘定科目ID 例: `1` (最小: 1)
    - **update_date** (任意): string - 更新日(yyyy-mm-dd) 例: `2020-06-15`

### POST /api/1/account_items

**操作**: 勘定科目の作成

**説明**: 概要 指定した事業所の勘定科目を作成する 注意点 tax_codeは、指定した事業所の税区分一覧の取得APIでavailableの値がtrue、かつ経過措置税区分ではない5%の税区分を確認して、そのcodeを指定して勘定科目の作成をしてください。例 課対仕入の場合、34を指定してください codeを利用するには、事業所の設定で勘定科目コードを使用する設定にする必要があります。

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **account_item** **(必須)**: object
  - **name** **(必須)**: string - 勘定科目名 (30文字以内) 例: `新しい勘定科目`
  - **shortcut** (任意): string - ショートカット1 (20文字以内) 例: `NEWACCOUNTITEM`
  - **shortcut_num** (任意): string - ショートカット2 (20文字以内) 例: `999`
  - **code** (任意): string - 勘定科目コード 例: `999` (パターン: ^[0-9a-zA-Z_-]+$)
  - **tax_code** **(必須)**: integer(int64) - 税区分コード 指定できるコードは本APIの注意点をご確認ください。 例: `1` (最小: 0, 最大: 2147483647)
  - **group_name** **(必須)**: string - 決算書表示名（小カテゴリー） Selectablesフォーム用選択項目情報エンドポイント(account_groups.name)で取得可能です 例: `その他預金`
  - **account_category_id** **(必須)**: integer(int64) - 勘定科目カテゴリーID Selectablesフォーム用選択項目情報エンドポイント(account_groups.account_category_id)で取得可能です 例: `1` (最小: 1)
  - **corresponding_income_id** **(必須)**: integer(int64) - 収入取引相手勘定科目ID 例: `1` (最小: 1)
  - **corresponding_expense_id** **(必須)**: integer(int64) - 支出取引相手勘定科目ID 例: `1` (最小: 1)
  - **accumulated_dep_account_item_id** (任意): integer(int64) - 減価償却累計額勘定科目ID（法人のみ利用可能） 例: `1` (最小: 1)
  - **searchable** (任意): integer(int64) - 検索可能:2, 検索不可：3(登録時未指定の場合は2で登録されます。更新時未指定の場合はsearchableは変更されません。) 例: `2` (最小: 2, 最大: 3)
  - **items** (任意): array[object] - 品目
  - **partners** (任意): array[object] - 取引先

### レスポンス (201)

- **account_item** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 勘定科目ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 勘定科目名 (30文字以内) 例: `ソフトウェア`
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **tax_code** **(必須)**: integer(int64) - 税区分コード 例: `1` (最小: 0, 最大: 2147483647)
  - **account_category** **(必須)**: string - 勘定科目カテゴリー 例: `現金・預金`
  - **account_category_id** **(必須)**: integer(int64) - 勘定科目のカテゴリーID 例: `1` (最小: 1)
  - **shortcut** (任意): string - ショートカット1 (20文字以内) 例: `SOFUTO`
  - **shortcut_num** (任意): string - ショートカット2 (20文字以内) 例: `123`
  - **code** (任意): string - 勘定科目コード 例: `123`
  - **searchable** **(必須)**: integer(int64) - 検索可能:2, 検索不可：3 例: `2` (最小: 2, 最大: 3)
  - **accumulated_dep_account_item_name** (任意): string - 減価償却累計額勘定科目（法人のみ利用可能） 例: `減価償却累計額`
  - **accumulated_dep_account_item_id** (任意): integer(int64) - 減価償却累計額勘定科目ID（法人のみ利用可能） 例: `1` (最小: 1)
  - **items** (任意): array[object]
  - **partners** (任意): array[object]
  - **available** **(必須)**: boolean - 勘定科目の使用設定（true: 使用する、false: 使用しない） 例: `true`
  - **walletable_id** **(必須)**: integer(int64) - 口座ID 例: `1` (最小: 1)
  - **group_name** (任意): string - 決算書表示名（小カテゴリー） 例: `売掛金`
  - **group_id** (任意): integer(int64) - 決算書表示名ID（小カテゴリー） 例: `1` (最小: 1)
  - **corresponding_income_name** (任意): string - 収入取引相手勘定科目名 例: `売掛金`
  - **corresponding_income_id** (任意): integer(int64) - 収入取引相手勘定科目ID 例: `1` (最小: 1)
  - **corresponding_expense_name** (任意): string - 支出取引相手勘定科目名 例: `買掛金`
  - **corresponding_expense_id** (任意): integer(int64) - 支出取引相手勘定科目ID 例: `1` (最小: 1)

### PUT /api/1/account_items/code/upsert

**操作**: 勘定科目の更新（存在しない場合は作成）

**説明**: 概要 勘定科目コードをキーに、指定した勘定科目の情報を更新（存在しない場合は作成）する 注意点 tax_codeは、指定した事業所の税区分一覧の取得APIでavailableの値がtrue、かつ経過措置税区分ではない5%の税区分を確認して、そのcodeを指定して勘定科目の更新をしてください。例 課対仕入の場合、34を指定してください codeを利用するには、事業所の設定で勘定科目コードを使用する設定にする必要があります。

### リクエストボディ

**(必須)**

- **code** **(必須)**: string - 勘定科目コード 例: `999` (パターン: ^[0-9a-zA-Z_-]+$)
- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **account_item** **(必須)**: object
  - **name** (任意): string - 勘定科目名 (30文字以内)
口座に紐付かない勘定科目の更新時は必須です。
口座に紐付く勘定科目の更新時は指定することができません。
 例: `新しい勘定科目`
  - **shortcut** (任意): string - ショートカット1 (20文字以内) 例: `NEWACCOUNTITEM`
  - **shortcut_num** (任意): string - ショートカット2 (20文字以内) 例: `999`
  - **tax_code** **(必須)**: integer(int64) - 税区分コード 指定できるコードは本APIの注意点をご確認ください。 例: `1` (最小: 0, 最大: 2147483647)
  - **group_name** **(必須)**: string - 決算書表示名（小カテゴリー） Selectablesフォーム用選択項目情報エンドポイント(account_groups.name)で取得可能です 例: `その他預金`
  - **account_category_id** **(必須)**: integer(int64) - 勘定科目カテゴリーID Selectablesフォーム用選択項目情報エンドポイント(account_groups.account_category_id)で取得可能です 例: `1` (最小: 1)
  - **corresponding_income_id** **(必須)**: integer(int64) - 収入取引相手勘定科目ID 例: `1` (最小: 1)
  - **corresponding_expense_id** **(必須)**: integer(int64) - 支出取引相手勘定科目ID 例: `1` (最小: 1)
  - **accumulated_dep_account_item_id** (任意): integer(int64) - 減価償却累計額勘定科目ID（法人のみ利用可能） 例: `1` (最小: 1)
  - **searchable** (任意): integer(int64) - 検索可能:2, 検索不可：3(登録時未指定の場合は2で登録されます。更新時未指定の場合はsearchableは変更されません。) 例: `2` (最小: 2, 最大: 3)
  - **items** (任意): array[object] - 品目
  - **partners** (任意): array[object] - 取引先

### レスポンス (200)

- **account_item** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 勘定科目ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 勘定科目名 (30文字以内) 例: `ソフトウェア`
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **tax_code** **(必須)**: integer(int64) - 税区分コード 例: `1` (最小: 0, 最大: 2147483647)
  - **account_category** **(必須)**: string - 勘定科目カテゴリー 例: `現金・預金`
  - **account_category_id** **(必須)**: integer(int64) - 勘定科目のカテゴリーID 例: `1` (最小: 1)
  - **shortcut** (任意): string - ショートカット1 (20文字以内) 例: `SOFUTO`
  - **shortcut_num** (任意): string - ショートカット2 (20文字以内) 例: `123`
  - **code** (任意): string - 勘定科目コード 例: `123`
  - **searchable** **(必須)**: integer(int64) - 検索可能:2, 検索不可：3 例: `2` (最小: 2, 最大: 3)
  - **accumulated_dep_account_item_name** (任意): string - 減価償却累計額勘定科目（法人のみ利用可能） 例: `減価償却累計額`
  - **accumulated_dep_account_item_id** (任意): integer(int64) - 減価償却累計額勘定科目ID（法人のみ利用可能） 例: `1` (最小: 1)
  - **items** (任意): array[object]
  - **partners** (任意): array[object]
  - **available** **(必須)**: boolean - 勘定科目の使用設定（true: 使用する、false: 使用しない） 例: `true`
  - **walletable_id** **(必須)**: integer(int64) - 口座ID 例: `1` (最小: 1)
  - **group_name** (任意): string - 決算書表示名（小カテゴリー） 例: `売掛金`
  - **group_id** (任意): integer(int64) - 決算書表示名ID（小カテゴリー） 例: `1` (最小: 1)
  - **corresponding_income_name** (任意): string - 収入取引相手勘定科目名 例: `売掛金`
  - **corresponding_income_id** (任意): integer(int64) - 収入取引相手勘定科目ID 例: `1` (最小: 1)
  - **corresponding_expense_name** (任意): string - 支出取引相手勘定科目名 例: `買掛金`
  - **corresponding_expense_id** (任意): integer(int64) - 支出取引相手勘定科目ID 例: `1` (最小: 1)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
