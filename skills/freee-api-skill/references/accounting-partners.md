# Partners

## 概要

取引先

## エンドポイント一覧

### GET /api/1/partners

**操作**: 取引先一覧の取得

**説明**: 概要 指定した事業所の取引先一覧を取得する 振込元口座ID（payer_walletable_id）, 振込手数料負担（transfer_fee_handling_side）は法人スタータープラン（および旧法人プロフェッショナルプラン）以上で利用可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| start_update_date | query | いいえ | string | 更新日で絞り込み：開始日(yyyy-mm-dd) |
| end_update_date | query | いいえ | string | 更新日で絞り込み：終了日(yyyy-mm-dd) |
| offset | query | いいえ | integer(int64) | 取得レコードのオフセット (デフォルト: 0) |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 50, 最小: 1, 最大: 3000) |
| keyword | query | いいえ | string | 検索キーワード<br>
取引先コード・取引先名・正式名称・カナ名称・ショートカットキー1・2のいずれかに対する部分一致。<br>
以下のいずれかで区切って複数キーワードを指定した場合はAND検索となります。
<ul>
<li>半角スペース</li>
<li>全角スペース</li>
<li>タブ</li>
</ul>
 |

### レスポンス (200)

- **partners** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - 取引先ID 例: `1` (最小: 1)
    - **code** **(必須)**: string - 取引先コード 例: `code001`
    - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
    - **name** **(必須)**: string - 取引先名 例: `ABC商店`
    - **update_date** **(必須)**: string - 更新日 (yyyy-mm-dd) 例: `2019-12-17`
    - **available** **(必須)**: boolean - true: 使用可能、false: 使用停止
<br>
<ul>
  <li>
    本APIでpartnerを作成した場合はtrueになります。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、取引先自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの取引先をパラメータに指定すれば、取引などにfalseの取引先を設定できます。
  </li>
</ul>
    - **shortcut1** (任意): string - ショートカット1 (255文字以内) 例: `ABC`
    - **shortcut2** (任意): string - ショートカット2 (255文字以内) 例: `501`
    - **org_code** (任意): integer(int64) - 事業所種別（null: 未設定、1: 法人、2: 個人） 例: `1` (最小: 1, 最大: 2)
    - **country_code** (任意): string - 地域（JP: 国内、ZZ:国外） 例: `JP`
    - **long_name** (任意): string - 正式名称（255文字以内） 例: `新しい取引先正式名称`
    - **name_kana** (任意): string - カナ名称（255文字以内） 例: `アタラシイトリヒキサキメイショウ`
    - **default_title** (任意): string - 敬称（御中、様、(空白)の3つから選択） 例: `御中`
    - **phone** (任意): string - 電話番号 例: `03-1234-xxxx`
    - **contact_name** (任意): string - 担当者 氏名 例: `営業担当`
    - **email** (任意): string - 担当者 メールアドレス 例: `contact@example.com`
    - **payer_walletable_id** (任意): integer(int64) - 振込元口座ID（一括振込ファイル用）:（未設定の場合は、nullです。） 例: `1` (最小: 1)
    - **transfer_fee_handling_side** (任意): string - 振込手数料負担（一括振込ファイル用）: (振込元(当方): payer, 振込先(先方): payee) (選択肢: payer, payee) 例: `payer`
    - **qualified_invoice_issuer** (任意): boolean - インボイス制度適格請求書発行事業者（true: 対象事業者、false: 非対象事業者）
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `false`
    - **invoice_registration_number** (任意): string - インボイス制度適格請求書発行事業者登録番号
- 先頭T数字13桁の固定14桁の文字列
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `T1000000000001`
    - **address_attributes** (任意): object
    - **partner_doc_setting_attributes** (任意): object
    - **partner_bank_account_attributes** (任意): object

### POST /api/1/partners

**操作**: 取引先の作成

**説明**: 概要 指定した事業所の取引先を作成する 取引先名称（name）は重複不可です。 codeを利用するには、事業所の設定から取引先コードの利用を有効にする必要があります。 取引先コードの利用を有効にしている場合は、 codeの指定は必須です。 name、codeそれぞれ重複不可です。 振込元口座ID（payer_walletable_id）, 振込手数料負担（transfer_fee_handling_side）, 支払期日設定（payment_term_attributes）, 請求の入金期日設定（invoice_payment_term_attributes）は法人スタータープラン（および旧法人プロフェッショナルプラン）以上で利用可能です。

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **name** **(必須)**: string - 取引先名 (255文字以内、重複不可) 例: `新しい取引先`
- **code** (任意): string - 取引先コード（取引先コードの利用を有効にしている場合は、codeの指定は必須です。ただし重複は不可。） 例: `code001`
- **shortcut1** (任意): string - ショートカット１ (255文字以内) 例: `NEWPARTNER`
- **shortcut2** (任意): string - ショートカット２ (255文字以内) 例: `502`
- **org_code** (任意): integer(int64) - 事業所種別（null: 未設定、1: 法人、2: 個人） (選択肢: 1, 2) 例: `1`
- **country_code** (任意): string - 地域（JP: 国内、ZZ:国外）、指定しない場合JPになります。 (選択肢: JP, ZZ) 例: `JP`
- **long_name** (任意): string - 正式名称（255文字以内） 例: `新しい取引先正式名称`
- **name_kana** (任意): string - カナ名称（255文字以内） 例: `アタラシイトリヒキサキメイショウ`
- **default_title** (任意): string - 敬称（御中、様、(空白)の3つから選択） 例: `御中`
- **phone** (任意): string - 電話番号 例: `03-1234-xxxx`
- **contact_name** (任意): string - 担当者 氏名 (255文字以内) 例: `営業担当`
- **email** (任意): string - 担当者 メールアドレス (255文字以内) 例: `contact@example.com`
- **payer_walletable_id** (任意): integer(int64) - 振込元口座ID（一括振込ファイル用）:（walletableのtypeが'bank_account'のidのみ指定できます。また、未設定にする場合は、nullを指定してください。） 例: `1` (最小: 1)
- **transfer_fee_handling_side** (任意): string - 振込手数料負担（一括振込ファイル用）: (振込元(当方): payer, 振込先(先方): payee)、指定しない場合payerになります。 (選択肢: payer, payee) 例: `payer`
- **qualified_invoice_issuer** (任意): boolean - インボイス制度適格請求書発行事業者（true: 対象事業者、false: 非対象事業者）
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `false`
- **invoice_registration_number** (任意): string - インボイス制度適格請求書発行事業者登録番号
- 先頭T数字13桁の固定14桁の文字列
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `T1000000000001` (パターン: ^T?[1-9][0-9]{12}$)
- **address_attributes** (任意): object
  - **zipcode** (任意): string - 郵便番号（8文字以内） 例: `000-0000`
  - **prefecture_code** (任意): integer(int64) - 都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄 例: `4` (最小: -1, 最大: 46)
  - **street_name1** (任意): string - 市区町村・番地（255文字以内） 例: `ＸＸ区ＹＹ１−１−１`
  - **street_name2** (任意): string - 建物名・部屋番号など（255文字以内） 例: `ビル１Ｆ`
- **partner_doc_setting_attributes** (任意): object
  - **sending_method** (任意): string - 請求書送付方法(email:メール、posting:郵送、email_and_posting:メールと郵送、null:設定しない) (選択肢: email, posting, email_and_posting) 例: `posting`
- **partner_bank_account_attributes** (任意): object
  - **bank_name** (任意): string - 銀行名 例: `freee銀行`
  - **bank_name_kana** (任意): string - 銀行名（カナ） 例: `フリーギンコウ`
  - **bank_code** (任意): string - 銀行コード 例: `0001`
  - **branch_name** (任意): string - 支店名 例: `銀座支店`
  - **branch_kana** (任意): string - 支店名（カナ） 例: `ギンザシテン`
  - **branch_code** (任意): string - 支店番号 例: `101`
  - **account_type** (任意): string - 口座種別(ordinary:普通、checking：当座、earmarked：納税準備預金、savings：貯蓄、other:その他)、指定しない場合ordinaryになります。 例: `ordinary`
  - **account_number** (任意): string - 口座番号 例: `1010101`
  - **long_account_name** (任意): string - 受取人名 例: `freee太郎`
  - **account_name** (任意): string - 受取人名（カナ） 例: `フリータロウ`
- **payment_term_attributes** (任意): object
  - **cutoff_day** (任意): integer(int64) - 締め日（29, 30, 31日の末日を指定する場合は、32を指定してください。） 例: `15` (最小: 1, 最大: 32)
  - **additional_months** (任意): integer(int64) - 支払月（当月を指定する場合は、0を指定してください。） 例: `1` (最小: 0, 最大: 6)
  - **fixed_day** (任意): integer(int64) - 支払日（29, 30, 31日の末日を指定する場合は、32を指定してください。） 例: `32` (最小: 1, 最大: 32)
- **invoice_payment_term_attributes** (任意): object
  - **cutoff_day** (任意): integer(int64) - 締め日（29, 30, 31日の末日を指定する場合は、32を指定してください。） 例: `15` (最小: 1, 最大: 32)
  - **additional_months** (任意): integer - 入金月（当月を指定する場合は、0を指定してください。） 例: `1` (最小: 0, 最大: 6)
  - **fixed_day** (任意): integer(int64) - 入金日（29, 30, 31日の末日を指定する場合は、32を指定してください。） 例: `32` (最小: 1, 最大: 32)

### レスポンス (201)

- **partner** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 取引先ID 例: `1` (最小: 1)
  - **code** **(必須)**: string - 取引先コード 例: `code001`
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 取引先名 例: `ABC商店`
  - **update_date** **(必須)**: string - 更新日 (yyyy-mm-dd) 例: `2019-12-17`
  - **available** **(必須)**: boolean - true: 使用可能、false: 使用停止
<br>
<ul>
  <li>
    本APIでpartnerを作成した場合はtrueになります。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、取引先自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの取引先をパラメータに指定すれば、取引などにfalseの取引先を設定できます。
  </li>
</ul>
  - **shortcut1** (任意): string - ショートカット1 (255文字以内) 例: `ABC`
  - **shortcut2** (任意): string - ショートカット2 (255文字以内) 例: `501`
  - **org_code** (任意): integer(int64) - 事業所種別（null: 未設定、1: 法人、2: 個人） 例: `1` (最小: 1, 最大: 2)
  - **country_code** (任意): string - 地域（JP: 国内、ZZ:国外） 例: `JP`
  - **long_name** (任意): string - 正式名称（255文字以内） 例: `新しい取引先正式名称`
  - **name_kana** (任意): string - カナ名称（255文字以内） 例: `アタラシイトリヒキサキメイショウ`
  - **default_title** (任意): string - 敬称（御中、様、(空白)の3つから選択） 例: `御中`
  - **phone** (任意): string - 電話番号 例: `03-1234-xxxx`
  - **contact_name** (任意): string - 担当者 氏名 例: `営業担当`
  - **email** (任意): string - 担当者 メールアドレス 例: `contact@example.com`
  - **payer_walletable_id** (任意): integer(int64) - 振込元口座ID（一括振込ファイル用）:（未設定の場合は、nullです。） 例: `1` (最小: 1)
  - **transfer_fee_handling_side** (任意): string - 振込手数料負担（一括振込ファイル用）: (振込元(当方): payer, 振込先(先方): payee) (選択肢: payer, payee) 例: `payer`
  - **qualified_invoice_issuer** (任意): boolean - インボイス制度適格請求書発行事業者（true: 対象事業者、false: 非対象事業者）
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `false`
  - **invoice_registration_number** (任意): string - インボイス制度適格請求書発行事業者登録番号
- 先頭T数字13桁の固定14桁の文字列
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `T1000000000001`
  - **address_attributes** (任意): object
  - **partner_doc_setting_attributes** (任意): object
  - **partner_bank_account_attributes** (任意): object
  - **payment_term_attributes** (任意): object
  - **invoice_payment_term_attributes** (任意): object

### GET /api/1/partners/{id}

**操作**: 取引先の取得

**説明**: 概要 指定した事業所の取引先を取得する 振込元口座ID（payer_walletable_id）, 振込手数料負担（transfer_fee_handling_side）, 支払期日設定（payment_term_attributes）, 請求の入金期日設定（invoice_payment_term_attributes）は法人スタータープラン（および旧法人プロフェッショナルプラン）以上で利用可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 取引先ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (200)

- **partner** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 取引先ID 例: `1` (最小: 1)
  - **code** **(必須)**: string - 取引先コード 例: `code001`
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 取引先名 例: `ABC商店`
  - **update_date** **(必須)**: string - 更新日 (yyyy-mm-dd) 例: `2019-12-17`
  - **available** **(必須)**: boolean - true: 使用可能、false: 使用停止
<br>
<ul>
  <li>
    本APIでpartnerを作成した場合はtrueになります。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、取引先自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの取引先をパラメータに指定すれば、取引などにfalseの取引先を設定できます。
  </li>
</ul>
  - **shortcut1** (任意): string - ショートカット1 (255文字以内) 例: `ABC`
  - **shortcut2** (任意): string - ショートカット2 (255文字以内) 例: `501`
  - **org_code** (任意): integer(int64) - 事業所種別（null: 未設定、1: 法人、2: 個人） 例: `1` (最小: 1, 最大: 2)
  - **country_code** (任意): string - 地域（JP: 国内、ZZ:国外） 例: `JP`
  - **long_name** (任意): string - 正式名称（255文字以内） 例: `新しい取引先正式名称`
  - **name_kana** (任意): string - カナ名称（255文字以内） 例: `アタラシイトリヒキサキメイショウ`
  - **default_title** (任意): string - 敬称（御中、様、(空白)の3つから選択） 例: `御中`
  - **phone** (任意): string - 電話番号 例: `03-1234-xxxx`
  - **contact_name** (任意): string - 担当者 氏名 例: `営業担当`
  - **email** (任意): string - 担当者 メールアドレス 例: `contact@example.com`
  - **payer_walletable_id** (任意): integer(int64) - 振込元口座ID（一括振込ファイル用）:（未設定の場合は、nullです。） 例: `1` (最小: 1)
  - **transfer_fee_handling_side** (任意): string - 振込手数料負担（一括振込ファイル用）: (振込元(当方): payer, 振込先(先方): payee) (選択肢: payer, payee) 例: `payer`
  - **qualified_invoice_issuer** (任意): boolean - インボイス制度適格請求書発行事業者（true: 対象事業者、false: 非対象事業者）
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `false`
  - **invoice_registration_number** (任意): string - インボイス制度適格請求書発行事業者登録番号
- 先頭T数字13桁の固定14桁の文字列
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `T1000000000001`
  - **address_attributes** (任意): object
  - **partner_doc_setting_attributes** (任意): object
  - **partner_bank_account_attributes** (任意): object
  - **payment_term_attributes** (任意): object
  - **invoice_payment_term_attributes** (任意): object

### PUT /api/1/partners/{id}

**操作**: 取引先の更新

**説明**: 概要 指定した取引先の情報を更新する 取引先名称（name）は重複不可です。 codeを指定、更新することはできません。 振込元口座ID（payer_walletable_id）, 振込手数料負担（transfer_fee_handling_side）, 支払期日設定（payment_term_attributes）, 請求の入金期日設定（invoice_payment_term_attributes）は法人スタータープラン（および旧法人プロフェッショナルプラン）以上で利用可能です。 支払期日設定（payment_term_attributes）, 請求の入金期日設定（invoice_payment_term_attributes）にnull型を入力することにより、期日を未設定に変更可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 取引先ID |

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **name** **(必須)**: string - 取引先名 (255文字以内、重複不可) 例: `新しい取引先`
- **available** (任意): boolean - true: 使用可能、false: 使用停止 例: `false`
- **shortcut1** (任意): string - ショートカット１ (255文字以内) 例: `NEWPARTNER`
- **shortcut2** (任意): string - ショートカット２ (255文字以内) 例: `502`
- **org_code** (任意): integer(int64) - 事業所種別（null: 未設定、1: 法人、2: 個人） (選択肢: 1, 2) 例: `1`
- **country_code** (任意): string - 地域（JP: 国内、ZZ:国外）、指定しない場合JPになります。 (選択肢: JP, ZZ) 例: `JP`
- **long_name** (任意): string - 正式名称（255文字以内） 例: `新しい取引先正式名称`
- **name_kana** (任意): string - カナ名称（255文字以内） 例: `アタラシイトリヒキサキメイショウ`
- **default_title** (任意): string - 敬称（御中、様、(空白)の3つから選択） 例: `御中`
- **phone** (任意): string - 電話番号 例: `03-1234-xxxx`
- **contact_name** (任意): string - 担当者 氏名 (255文字以内) 例: `営業担当`
- **email** (任意): string - 担当者 メールアドレス (255文字以内) 例: `contact@example.com`
- **payer_walletable_id** (任意): integer(int64) - 振込元口座ID（一括振込ファイル用）:（walletableのtypeが'bank_account'のidのみ指定できます。また、未設定にする場合は、nullを指定してください。） 例: `1` (最小: 1)
- **transfer_fee_handling_side** (任意): string - 振込手数料負担（一括振込ファイル用）: (振込元(当方): payer, 振込先(先方): payee)、指定しない場合payerになります。 (選択肢: payer, payee) 例: `payer`
- **qualified_invoice_issuer** (任意): boolean - インボイス制度適格請求書発行事業者（true: 対象事業者、false: 非対象事業者）
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `false`
- **invoice_registration_number** (任意): string - インボイス制度適格請求書発行事業者登録番号
- 先頭T数字13桁の固定14桁の文字列
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `T1000000000001` (パターン: ^T?[1-9][0-9]{12}$)
- **address_attributes** (任意): object
  - **zipcode** (任意): string - 郵便番号（8文字以内） 例: `000-0000`
  - **prefecture_code** (任意): integer(int64) - 都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄 例: `4` (最小: -1, 最大: 46)
  - **street_name1** (任意): string - 市区町村・番地（255文字以内） 例: `ＸＸ区ＹＹ１−１−１`
  - **street_name2** (任意): string - 建物名・部屋番号など（255文字以内） 例: `ビル１Ｆ`
- **partner_doc_setting_attributes** (任意): object
  - **sending_method** (任意): string - 請求書送付方法(email:メール、posting:郵送、email_and_posting:メールと郵送、null:設定しない) (選択肢: email, posting, email_and_posting) 例: `posting`
- **partner_bank_account_attributes** (任意): object
  - **bank_name** (任意): string - 銀行名 例: `freee銀行`
  - **bank_name_kana** (任意): string - 銀行名（カナ） 例: `フリーギンコウ`
  - **bank_code** (任意): string - 銀行コード 例: `0001`
  - **branch_name** (任意): string - 支店名 例: `銀座支店`
  - **branch_kana** (任意): string - 支店名（カナ） 例: `ギンザシテン`
  - **branch_code** (任意): string - 支店番号 例: `101`
  - **account_type** (任意): string - 口座種別(ordinary:普通、checking：当座、earmarked：納税準備預金、savings：貯蓄、other:その他)、指定しない場合ordinaryになります。 例: `ordinary`
  - **account_number** (任意): string - 口座番号 例: `1010101`
  - **long_account_name** (任意): string - 受取人名 例: `freee太郎`
  - **account_name** (任意): string - 受取人名（カナ） 例: `フリータロウ`
- **payment_term_attributes** (任意): object
  - **cutoff_day** (任意): integer(int64) - 締め日（29, 30, 31日の末日を指定する場合は、32を指定してください。） 例: `15` (最小: 1, 最大: 32)
  - **additional_months** (任意): integer(int64) - 支払月（当月を指定する場合は、0を指定してください。） 例: `1` (最小: 0, 最大: 6)
  - **fixed_day** (任意): integer(int64) - 支払日（29, 30, 31日の末日を指定する場合は、32を指定してください。） 例: `32` (最小: 1, 最大: 32)
- **invoice_payment_term_attributes** (任意): object
  - **cutoff_day** (任意): integer(int64) - 締め日（29, 30, 31日の末日を指定する場合は、32を指定してください。） 例: `15` (最小: 1, 最大: 32)
  - **additional_months** (任意): integer(int64) - 入金月（当月を指定する場合は、0を指定してください。） 例: `1` (最小: 0, 最大: 6)
  - **fixed_day** (任意): integer(int64) - 入金日（29, 30, 31日の末日を指定する場合は、32を指定してください。） 例: `32` (最小: 1, 最大: 32)

### レスポンス (200)

- **partner** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 取引先ID 例: `1` (最小: 1)
  - **code** **(必須)**: string - 取引先コード 例: `code001`
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 取引先名 例: `ABC商店`
  - **update_date** **(必須)**: string - 更新日 (yyyy-mm-dd) 例: `2019-12-17`
  - **available** **(必須)**: boolean - true: 使用可能、false: 使用停止
<br>
<ul>
  <li>
    本APIでpartnerを作成した場合はtrueになります。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、取引先自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの取引先をパラメータに指定すれば、取引などにfalseの取引先を設定できます。
  </li>
</ul>
  - **shortcut1** (任意): string - ショートカット1 (255文字以内) 例: `ABC`
  - **shortcut2** (任意): string - ショートカット2 (255文字以内) 例: `501`
  - **org_code** (任意): integer(int64) - 事業所種別（null: 未設定、1: 法人、2: 個人） 例: `1` (最小: 1, 最大: 2)
  - **country_code** (任意): string - 地域（JP: 国内、ZZ:国外） 例: `JP`
  - **long_name** (任意): string - 正式名称（255文字以内） 例: `新しい取引先正式名称`
  - **name_kana** (任意): string - カナ名称（255文字以内） 例: `アタラシイトリヒキサキメイショウ`
  - **default_title** (任意): string - 敬称（御中、様、(空白)の3つから選択） 例: `御中`
  - **phone** (任意): string - 電話番号 例: `03-1234-xxxx`
  - **contact_name** (任意): string - 担当者 氏名 例: `営業担当`
  - **email** (任意): string - 担当者 メールアドレス 例: `contact@example.com`
  - **payer_walletable_id** (任意): integer(int64) - 振込元口座ID（一括振込ファイル用）:（未設定の場合は、nullです。） 例: `1` (最小: 1)
  - **transfer_fee_handling_side** (任意): string - 振込手数料負担（一括振込ファイル用）: (振込元(当方): payer, 振込先(先方): payee) (選択肢: payer, payee) 例: `payer`
  - **qualified_invoice_issuer** (任意): boolean - インボイス制度適格請求書発行事業者（true: 対象事業者、false: 非対象事業者）
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `false`
  - **invoice_registration_number** (任意): string - インボイス制度適格請求書発行事業者登録番号
- 先頭T数字13桁の固定14桁の文字列
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `T1000000000001`
  - **address_attributes** (任意): object
  - **partner_doc_setting_attributes** (任意): object
  - **partner_bank_account_attributes** (任意): object
  - **payment_term_attributes** (任意): object
  - **invoice_payment_term_attributes** (任意): object

### DELETE /api/1/partners/{id}

**操作**: 取引先の削除

**説明**: 概要 指定した事業所の取引先を削除する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 取引先ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (204)

### PUT /api/1/partners/code/{code}

**操作**: 取引先コードでの取引先の更新

**説明**: 概要 取引先コードをキーに、指定した取引先の情報を更新する このAPIを利用するには、事業所の設定から取引先コードの利用を有効にする必要があります。 コードを日本語に設定している場合は、URLエンコードしてURLに含めるようにしてください。 取引先名称（name）は重複不可です。 振込元口座ID（payer_walletable_id）, 振込手数料負担（transfer_fee_handling_side）, 支払期日設定（payment_term_attributes）, 請求の入金期日設定（invoice_payment_term_attributes）は法人スタータープラン（および旧法人プロフェッショナルプラン）以上で利用可能です。 支払期日設定（payment_term_attributes）, 請求の入金期日設定（invoice_payment_term_attributes）にnull型を入力することにより、期日を未設定に変更可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| code | path | はい | string | 取引先コード |

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **name** **(必須)**: string - 取引先名 (255文字以内、重複不可) 例: `新しい取引先`
- **available** (任意): boolean - true: 使用可能、false: 使用停止 例: `false`
- **shortcut1** (任意): string - ショートカット１ (255文字以内) 例: `NEWPARTNER`
- **shortcut2** (任意): string - ショートカット２ (255文字以内) 例: `502`
- **org_code** (任意): integer(int64) - 事業所種別（null: 未設定、1: 法人、2: 個人） (選択肢: 1, 2) 例: `1`
- **country_code** (任意): string - 地域（JP: 国内、ZZ:国外）、指定しない場合JPになります。 (選択肢: JP, ZZ) 例: `JP`
- **long_name** (任意): string - 正式名称（255文字以内） 例: `新しい取引先正式名称`
- **name_kana** (任意): string - カナ名称（255文字以内） 例: `アタラシイトリヒキサキメイショウ`
- **default_title** (任意): string - 敬称（御中、様、(空白)の3つから選択） 例: `御中`
- **phone** (任意): string - 電話番号 例: `03-1234-xxxx`
- **contact_name** (任意): string - 担当者 氏名 (255文字以内) 例: `営業担当`
- **email** (任意): string - 担当者 メールアドレス (255文字以内) 例: `contact@example.com`
- **payer_walletable_id** (任意): integer(int64) - 振込元口座ID（一括振込ファイル用）:（walletableのtypeが'bank_account'のidのみ指定できます。また、未設定にする場合は、nullを指定してください。） 例: `1` (最小: 1)
- **transfer_fee_handling_side** (任意): string - 振込手数料負担（一括振込ファイル用）: (振込元(当方): payer, 振込先(先方): payee)、指定しない場合payerになります。 (選択肢: payer, payee) 例: `payer`
- **qualified_invoice_issuer** (任意): boolean - インボイス制度適格請求書発行事業者（true: 対象事業者、false: 非対象事業者）
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `false`
- **invoice_registration_number** (任意): string - インボイス制度適格請求書発行事業者登録番号
- 先頭T数字13桁の固定14桁の文字列
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `T1000000000001` (パターン: ^T?[1-9][0-9]{12}$)
- **address_attributes** (任意): object
  - **zipcode** (任意): string - 郵便番号（8文字以内） 例: `000-0000`
  - **prefecture_code** (任意): integer(int64) - 都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄 例: `4` (最小: -1, 最大: 46)
  - **street_name1** (任意): string - 市区町村・番地（255文字以内） 例: `ＸＸ区ＹＹ１−１−１`
  - **street_name2** (任意): string - 建物名・部屋番号など（255文字以内） 例: `ビル１Ｆ`
- **partner_doc_setting_attributes** (任意): object
  - **sending_method** (任意): string - 請求書送付方法(email:メール、posting:郵送、email_and_posting:メールと郵送、null:設定しない) (選択肢: email, posting, email_and_posting) 例: `posting`
- **partner_bank_account_attributes** (任意): object
  - **bank_name** (任意): string - 銀行名 例: `freee銀行`
  - **bank_name_kana** (任意): string - 銀行名（カナ） 例: `フリーギンコウ`
  - **bank_code** (任意): string - 銀行コード 例: `0001`
  - **branch_name** (任意): string - 支店名 例: `銀座支店`
  - **branch_kana** (任意): string - 支店名（カナ） 例: `ギンザシテン`
  - **branch_code** (任意): string - 支店番号 例: `101`
  - **account_type** (任意): string - 口座種別(ordinary:普通、checking：当座、earmarked：納税準備預金、savings：貯蓄、other:その他)、指定しない場合ordinaryになります。 例: `ordinary`
  - **account_number** (任意): string - 口座番号 例: `1010101`
  - **long_account_name** (任意): string - 受取人名 例: `freee太郎`
  - **account_name** (任意): string - 受取人名（カナ） 例: `フリータロウ`
- **payment_term_attributes** (任意): object
  - **cutoff_day** (任意): integer(int64) - 締め日（29, 30, 31日の末日を指定する場合は、32を指定してください。） 例: `15` (最小: 1, 最大: 32)
  - **additional_months** (任意): integer(int64) - 支払月（当月を指定する場合は、0を指定してください。） 例: `1` (最小: 0, 最大: 6)
  - **fixed_day** (任意): integer(int64) - 支払日（29, 30, 31日の末日を指定する場合は、32を指定してください。） 例: `32` (最小: 1, 最大: 32)
- **invoice_payment_term_attributes** (任意): object
  - **cutoff_day** (任意): integer(int64) - 締め日（29, 30, 31日の末日を指定する場合は、32を指定してください。） 例: `15` (最小: 1, 最大: 32)
  - **additional_months** (任意): integer(int64) - 入金月（当月を指定する場合は、0を指定してください。） 例: `1` (最小: 0, 最大: 6)
  - **fixed_day** (任意): integer(int64) - 入金日（29, 30, 31日の末日を指定する場合は、32を指定してください。） 例: `32` (最小: 1, 最大: 32)

### レスポンス (200)

- **partner** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 取引先ID 例: `1` (最小: 1)
  - **code** **(必須)**: string - 取引先コード 例: `code001`
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 取引先名 例: `ABC商店`
  - **update_date** **(必須)**: string - 更新日 (yyyy-mm-dd) 例: `2019-12-17`
  - **available** **(必須)**: boolean - true: 使用可能、false: 使用停止
<br>
<ul>
  <li>
    本APIでpartnerを作成した場合はtrueになります。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、取引先自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの取引先をパラメータに指定すれば、取引などにfalseの取引先を設定できます。
  </li>
</ul>
  - **shortcut1** (任意): string - ショートカット1 (255文字以内) 例: `ABC`
  - **shortcut2** (任意): string - ショートカット2 (255文字以内) 例: `501`
  - **org_code** (任意): integer(int64) - 事業所種別（null: 未設定、1: 法人、2: 個人） 例: `1` (最小: 1, 最大: 2)
  - **country_code** (任意): string - 地域（JP: 国内、ZZ:国外） 例: `JP`
  - **long_name** (任意): string - 正式名称（255文字以内） 例: `新しい取引先正式名称`
  - **name_kana** (任意): string - カナ名称（255文字以内） 例: `アタラシイトリヒキサキメイショウ`
  - **default_title** (任意): string - 敬称（御中、様、(空白)の3つから選択） 例: `御中`
  - **phone** (任意): string - 電話番号 例: `03-1234-xxxx`
  - **contact_name** (任意): string - 担当者 氏名 例: `営業担当`
  - **email** (任意): string - 担当者 メールアドレス 例: `contact@example.com`
  - **payer_walletable_id** (任意): integer(int64) - 振込元口座ID（一括振込ファイル用）:（未設定の場合は、nullです。） 例: `1` (最小: 1)
  - **transfer_fee_handling_side** (任意): string - 振込手数料負担（一括振込ファイル用）: (振込元(当方): payer, 振込先(先方): payee) (選択肢: payer, payee) 例: `payer`
  - **qualified_invoice_issuer** (任意): boolean - インボイス制度適格請求書発行事業者（true: 対象事業者、false: 非対象事業者）
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `false`
  - **invoice_registration_number** (任意): string - インボイス制度適格請求書発行事業者登録番号
- 先頭T数字13桁の固定14桁の文字列
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `T1000000000001`
  - **address_attributes** (任意): object
  - **partner_doc_setting_attributes** (任意): object
  - **partner_bank_account_attributes** (任意): object
  - **payment_term_attributes** (任意): object
  - **invoice_payment_term_attributes** (任意): object

### PUT /api/1/partners/upsert_by_code

**操作**: 取引先の更新（存在しない場合は作成）

**説明**: 概要 取引先コードをキーに、指定した取引先の情報を更新（存在しない場合は作成）する このAPIを利用するには、事業所の設定から取引先コードの利用を有効にする必要があります。 取引先名称（name）は重複不可です。 振込元口座ID（payer_walletable_id）, 振込手数料負担（transfer_fee_handling_side）, 支払期日設定（payment_term_attributes）, 請求の入金期日設定（invoice_payment_term_attributes）は法人スタータープラン（および旧法人プロフェッショナルプラン）以上で利用可能です。 支払期日設定（payment_term_attributes）, 請求の入金期日設定（invoice_payment_term_attributes）にnull型を入力することにより、期日を未設定に変更可能です。

### リクエストボディ

**(必須)**

- **code** **(必須)**: string - 取引先コード 例: `code001`
- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **partner** **(必須)**: object
  - **name** **(必須)**: string - 取引先名 (255文字以内、重複不可) 例: `新しい取引先`
  - **available** (任意): boolean - true: 使用可能、false: 使用停止 例: `false`
  - **shortcut1** (任意): string - ショートカット１ (255文字以内) 例: `NEWPARTNER`
  - **shortcut2** (任意): string - ショートカット２ (255文字以内) 例: `502`
  - **org_code** (任意): integer(int64) - 事業所種別（null: 未設定、1: 法人、2: 個人） (選択肢: 1, 2) 例: `1`
  - **country_code** (任意): string - 地域（JP: 国内、ZZ:国外）、指定しない場合JPになります。 (選択肢: JP, ZZ) 例: `JP`
  - **long_name** (任意): string - 正式名称（255文字以内） 例: `新しい取引先正式名称`
  - **name_kana** (任意): string - カナ名称（255文字以内） 例: `アタラシイトリヒキサキメイショウ`
  - **default_title** (任意): string - 敬称（御中、様、(空白)の3つから選択） 例: `御中`
  - **phone** (任意): string - 電話番号 例: `03-1234-xxxx`
  - **contact_name** (任意): string - 担当者 氏名 (255文字以内) 例: `営業担当`
  - **email** (任意): string - 担当者 メールアドレス (255文字以内) 例: `contact@example.com`
  - **payer_walletable_id** (任意): integer(int64) - 振込元口座ID（一括振込ファイル用）:（walletableのtypeが'bank_account'のidのみ指定できます。また、未設定にする場合は、nullを指定してください。） 例: `1` (最小: 1)
  - **transfer_fee_handling_side** (任意): string - 振込手数料負担（一括振込ファイル用）: (振込元(当方): payer, 振込先(先方): payee)、指定しない場合payerになります。 (選択肢: payer, payee) 例: `payer`
  - **qualified_invoice_issuer** (任意): boolean - インボイス制度適格請求書発行事業者（true: 対象事業者、false: 非対象事業者）
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `false`
  - **invoice_registration_number** (任意): string - インボイス制度適格請求書発行事業者登録番号
- 先頭T数字13桁の固定14桁の文字列
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `T1000000000001` (パターン: ^T?[1-9][0-9]{12}$)
  - **address_attributes** (任意): object
  - **partner_doc_setting_attributes** (任意): object
  - **partner_bank_account_attributes** (任意): object
  - **payment_term_attributes** (任意): object
  - **invoice_payment_term_attributes** (任意): object

### レスポンス (200)

- **partner** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 取引先ID 例: `1` (最小: 1)
  - **code** **(必須)**: string - 取引先コード 例: `code001`
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 取引先名 例: `ABC商店`
  - **update_date** **(必須)**: string - 更新日 (yyyy-mm-dd) 例: `2019-12-17`
  - **available** **(必須)**: boolean - true: 使用可能、false: 使用停止
<br>
<ul>
  <li>
    本APIでpartnerを作成した場合はtrueになります。
  </li>
  <li>
    trueの場合、Web画面での取引登録時などに入力候補として表示されます。
  </li>
  <li>
    falseの場合、取引先自体は削除せず、Web画面での取引登録時などに入力候補として表示されません。ただし取引（収入・支出）の作成APIなどでfalseの取引先をパラメータに指定すれば、取引などにfalseの取引先を設定できます。
  </li>
</ul>
  - **shortcut1** (任意): string - ショートカット1 (255文字以内) 例: `ABC`
  - **shortcut2** (任意): string - ショートカット2 (255文字以内) 例: `501`
  - **org_code** (任意): integer(int64) - 事業所種別（null: 未設定、1: 法人、2: 個人） 例: `1` (最小: 1, 最大: 2)
  - **country_code** (任意): string - 地域（JP: 国内、ZZ:国外） 例: `JP`
  - **long_name** (任意): string - 正式名称（255文字以内） 例: `新しい取引先正式名称`
  - **name_kana** (任意): string - カナ名称（255文字以内） 例: `アタラシイトリヒキサキメイショウ`
  - **default_title** (任意): string - 敬称（御中、様、(空白)の3つから選択） 例: `御中`
  - **phone** (任意): string - 電話番号 例: `03-1234-xxxx`
  - **contact_name** (任意): string - 担当者 氏名 例: `営業担当`
  - **email** (任意): string - 担当者 メールアドレス 例: `contact@example.com`
  - **payer_walletable_id** (任意): integer(int64) - 振込元口座ID（一括振込ファイル用）:（未設定の場合は、nullです。） 例: `1` (最小: 1)
  - **transfer_fee_handling_side** (任意): string - 振込手数料負担（一括振込ファイル用）: (振込元(当方): payer, 振込先(先方): payee) (選択肢: payer, payee) 例: `payer`
  - **qualified_invoice_issuer** (任意): boolean - インボイス制度適格請求書発行事業者（true: 対象事業者、false: 非対象事業者）
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `false`
  - **invoice_registration_number** (任意): string - インボイス制度適格請求書発行事業者登録番号
- 先頭T数字13桁の固定14桁の文字列
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `T1000000000001`
  - **address_attributes** (任意): object
  - **partner_doc_setting_attributes** (任意): object
  - **partner_bank_account_attributes** (任意): object
  - **payment_term_attributes** (任意): object
  - **invoice_payment_term_attributes** (任意): object



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
