# Invoices

## 概要

請求書

## エンドポイント一覧

### GET /invoices

操作: 請求書一覧の取得


### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| invoice_number | query | いいえ | string | 請求書番号 |
| subject | query | いいえ | string | 件名 |
| partner_ids | query | いいえ | string | 取引先ID（半角数字のidを半角カンマ区切りスペースなしで指定してください。最大3件まで指定できます。） |
| payment_status | query | いいえ | string | 入金ステータス（unsettled: 入金待ち, settled: 入金済み） (選択肢: settled, unsettled) |
| deal_status | query | いいえ | string | 取引ステータス（registered: 登録済み、 unregistered: 登録待ち） (選択肢: registered, unregistered) |
| sending_status | query | いいえ | string | 送付ステータス（sent: 送付済み、 unsent: 送付待ち） (選択肢: sent, unsent) |
| cancel_status | query | いいえ | string | 取消済み（canceled: 該当する、 uncanceled: 該当しない） (選択肢: canceled, uncanceled) |
| start_billing_date | query | いいえ | string(date) | 請求日の開始日 |
| end_billing_date | query | いいえ | string(date) | 請求日の終了日 |
| start_payment_date | query | いいえ | string(date) | 入金期日の開始日 |
| end_payment_date | query | いいえ | string(date) | 入金期日の終了日 |
| limit | query | いいえ | integer | 取得レコードの件数 (デフォルト: 20, 最小: 1, 最大: 100) |
| offset | query | いいえ | integer | 取得レコードのオフセット (デフォルト: 0) |

### レスポンス (200)

The request has succeeded.

- invoices (必須): array[object]
  配列の要素:
    - id (必須): integer(int64) - 請求書ID (最小: 1, 最大: 9223372036854775000)
    - company_id (必須): integer(int64) - 事業所ID (最小: 1, 最大: 9223372036854775000)
    - invoice_number (必須): string - 請求書番号
    - subject (必須): string - 件名
    - template_id (任意): integer(int64) - 帳票テンプレートID (最小: 1, 最大: 9223372036854775000)
    - billing_date (必須): string(date) - 請求日 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
    - issue_date (任意): string(date) - 発生日 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
    - payment_date (任意): string(date) - 期日
- payment_typeがtransferの場合、入金期日に該当します。
- payment_typeがdirect_debitの場合、振替日に該当します。
- payment_typeがcardの場合、カード支払期日に該当します。 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
    - payment_type (任意): string - 入金方法 (振込: transfer, 振替: direct_debit, カード: card) (選択肢: transfer, direct_debit, card)
    - memo (必須): string - 社内メモ
    - sending_status (必須): string - 送付ステータス（sent: 送付済み、 unsent: 送付待ち） (選択肢: sent, unsent)
    - payment_status (必須): string - 入金ステータス（unsettled: 入金待ち, settled: 入金済み） (選択肢: settled, unsettled)
    - cancel_status (必須): string - 取消済み（canceled: 該当する、 uncanceled: 該当しない） (選択肢: canceled, uncanceled)
    - deal_status (必須): string - 取引ステータス（registered: 登録済み、 unregistered: 登録待ち） (選択肢: registered, unregistered)
    - deal_id (任意): integer(int64) - 取引ID （deal_statusがunregisteredの場合、nullになります。） (最小: 1, 最大: 9223372036854775000)
    - total_amount (必須): number(double) - 合計金額
    - amount_withholding_tax (任意): number - 源泉所得税
    - amount_including_tax (必須): number(double) - 税込金額
    - amount_excluding_tax (必須): number - 小計（税別）
    - amount_tax (必須): number - 消費税額
    - amount_brought_forward (必須): number(double) - 繰越金額 (最小: -999999999999, 最大: 999999999999)
    - partner_id (必須): integer(int64) - 取引先ID (最小: 1, 最大: 9223372036854775000)
    - partner_code (任意): string - 取引先コード
    - partner_name (任意): string - 取引先名
- partner_nameに空文字が戻る場合は、対象レコードをweb画面から更新するか、freee請求書APIから更新すると解消されます。
    - partner_display_name (任意): string - 取引先宛名
- 帳票の宛名に利用されます。
    - company_contact_name (任意): string - 自社担当者 (デフォルト: 表示ユーザー名)
    - email_url_file_downloaded_at (任意): string(string) - URL共有で送付された送付先のメールのダウンロード時刻 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$)
    - email_url_file_downloaded_status (任意): string - URL共有で送付された送付先のメールのダウンロードステータス (選択肢: downloaded, undownloaded)

### POST /invoices

操作: 請求書の作成


説明: 請求書の作成をします。 issue_date, account_item_id, tax_code, item_id, section_id, tag_ids, segment_1_tag_id, segment_2_tag_id, segment_3_tag_id は、取引登録の下書き保存で利用されます。 tag_idsは10個まで設定可能です。

### リクエストボディ

(必須)

- company_id (必須): integer(int64) - 事業所ID (最小: 1, 最大: 9223372036854775000)
- template_id (任意): integer(int64) - 帳票テンプレートID（指定しない場合、事業所の既定のテンプレートが指定されます。） (最小: 1, 最大: 9223372036854775000)
- invoice_number (任意): string - 請求書番号<br>
- 採番の設定が、[自動採番する]の場合、指定できません。
- 採番の設定が、[自動採番する]以外の場合、必須になります。
- branch_no (任意): integer - 枝番 (最小: 0, 最大: 2147483647)
- billing_date (必須): string(date) - 請求日 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
- issue_date (任意): string(date) - 発生日（取引登録の下書き保存で利用されます。）
- 入力がない場合、請求日が補完されます。 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
- payment_date (任意): string(date) - 期日
- payment_typeがtransferの場合、入金期日に該当します。
- payment_typeがdirect_debitの場合、振替日に該当します。 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
- payment_type (任意): string - 入金方法 (振込: transfer, 振替: direct_debit) (選択肢: transfer, direct_debit)
- subject (任意): string - 件名
- tax_entry_method (必須): string - 消費税の内税・外税区分（in: 税込表示（内税）、out: 税別表示（外税）） (選択肢: in, out)
- tax_fraction (必須): string - 消費税端数の計算方法（omit: 切り捨て、round_up: 切り上げ、round: 四捨五入） (選択肢: omit, round_up, round)
- line_amount_fraction (任意): string - 金額端数の計算方法（omit: 切り捨て、round_up: 切り上げ、round: 四捨五入） (選択肢: omit, round_up, round)
- withholding_tax_entry_method (必須): string - 源泉徴収の計算方法（in: 税込み価格で計算、out: 税別価格で計算） (選択肢: in, out)
- include_amount_brought_forward (任意): boolean - 繰越金額を含めるかどうか（true: 含める、false: 含めない）<br>
- 含める場合は、amount_brought_forwardに繰越金額を指定することができます。
- 含める場合でamount_brought_forwardの指定がない場合は、 帳票に指定されたpartner_id, partner_codeに紐づく未決済残高が繰越金額として利用されます。
- amount_brought_forward (任意): integer(int64) - 繰越金額<br>
include_amount_brought_forward に true を指定する場合のみ、指定できます。 (最小: -999999999999, 最大: 999999999999)
- invoice_note (任意): string - 備考
- memo (任意): string - 社内メモ
- partner_id (任意): integer(int64) - 取引先ID<br>
取引先IDと取引先コードはどちらか一方を必ず指定してください。<br>
<a href='https://support.freee.co.jp/hc/ja/articles/12515437008409-取引先を登録する#:~:text=確認ください。-,取引先役割,-種別' target='_blank'>取引先役割に関してはヘルプページを御覧ください。</a> (最小: 1, 最大: 9223372036854775000)
- partner_code (任意): string - 取引先コード<br>
取引先コードと取引先IDはどちらか一方を必ず指定してください。<br>
<a href='https://support.freee.co.jp/hc/ja/articles/12515437008409-取引先を登録する#:~:text=確認ください。-,取引先役割,-種別' target='_blank'>取引先役割に関してはヘルプページを御覧ください。</a>
- partner_title (必須): string - 敬称（御中、様、(空白)の3つから選択）
- [非推奨]全角カッコの（空白）は削除予定です。
- 全角カッコの（空白）を指定した場合、はレスポンスは、半角カッコの(空白)になります。 (選択肢: 御中, 様, (空白), （空白）)
- partner_address_zipcode (任意): string - 郵便番号
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく郵便番号が利用されます。 (パターン: ^[0-9]{3}-?[0-9]{4}$)
- partner_address_prefecture_code (任意): integer - 都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄）
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく都道府県コードが利用されます。 (最小: -1, 最大: 46)
- partner_address_street_name1 (任意): string - 取引先 市区町村・番地
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく取引先 市区町村・番地が利用されます。
- partner_address_street_name2 (任意): string - 取引先 建物名・部屋番号など
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく取引先 建物名・部屋番号などが利用されます。
- partner_contact_department (任意): string - 取引先部署
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく取引先部署が利用されます。
- partner_contact_email_cc (任意): string - 取引先担当者メールアドレス（CC）
- 入力がない場合、メールテンプレートに指定されたCCが利用されます。
- カンマ区切りで複数メールアドレスに送付可能です。
- partner_contact_email_to (任意): string - 取引先担当者メールアドレス（TO）
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく取引先担当者メールアドレスが利用されます。
- カンマ区切りで複数メールアドレスに送付可能です。
- partner_contact_name (任意): string - 取引先担当者名
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく取引先担当者名が利用されます。
- partner_display_name (任意): string - 取引先宛名
- 帳票の宛名に利用されます。
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく取引先名称が利用されます。
- partner_sending_method (任意): string - 取引先への送付方法
- 一括送付時に取引先マスタに登録された送付方法以外を利用したい場合に指定します。
- 入力がない場合、取引先マスタに登録された送付方法で一括送付を行います。 (選択肢: email, posting, email_and_posting)
- partner_bank_account (任意): string - 取引先口座
- payment_typeがdirect_debitの場合に指定可能です。
- 入力がない場合またはpayment_typeがtransferの場合、帳票に指定されたpartner_id, partner_codeに紐づく取引先口座が利用されます。
- company_contact_name (任意): string - 自社担当者(デフォルトは表示ユーザー名が補完されます)
- company_name (任意): string - 自社名を上書きする場合に指定します。
- company_description (任意): string - 自社説明を上書きする場合に指定します。
- bank_account_to_transfer (任意): string - 振込先を上書きする場合に指定します。
- lines (必須): array[object] - 請求書の明細行
  配列の要素:
    - type (任意): string - 明細の種類
- item: 品目行
- tax_rate、quantityは必須になります。
- text: テキスト行
- descriptionのみ入力可能です。
- 入力がない場合、itemが利用されます。 (選択肢: item, text)
    - description (任意): string - 摘要（品名）
    - sales_date (任意): string(date) - 取引日 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
    - unit (任意): string - 明細の単位名
    - quantity (任意): number - 明細の数量 (整数部は8桁まで、小数部は3桁まで) (最小: -99999999.999, 最大: 99999999.999)
    - unit_price (任意): string - 明細の単価 (整数部は13桁まで、小数部は3桁まで) (パターン: ^-?[0-9]{0,13}(\.[0-9]{1,3})?$)
    - tax_rate (任意): number - 税率（%）（帳票の税額計算に用います。） (選択肢: 0, 8, 10)
    - reduced_tax_rate (任意): boolean - 軽減税率対象（true: 対象、 false: 対象外）trueはtax_rate:8の時のみ指定可能です。
    - withholding (任意): boolean - 源泉徴収対象
    - account_item_id (任意): integer - 勘定科目ID（取引登録の下書き保存で利用されます。） (最小: 1, 最大: 2147483647)
    - tax_code (任意): integer - 税区分コード（取引登録の下書き保存で利用されます。） (最小: 0, 最大: 2147483647)
    - item_id (任意): integer - 品目ID（取引登録の下書き保存で利用されます。） (最小: 1, 最大: 2147483647)
    - section_id (任意): integer - 部門ID<br>
- 取引登録の下書き保存で利用されます。
- 親部門は利用できません。
- グループ管理で制限された部門は利用できません。
<br>
<a href="https://support.freee.co.jp/hc/ja/articles/215225263" target="_blank">グループ管理の設定はヘルプページを御覧ください。</a> (最小: 1, 最大: 2147483647)
    - tag_ids (任意): array[integer]
    - segment_1_tag_id (任意): integer(int64) - セグメント１ID<br>
- 取引登録の下書き保存で利用されます。
- freee会計法人向け プロフェッショナルプラン以上で利用可能です。
<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定はヘルプページを御覧ください。</a> (最小: 1, 最大: 9223372036854775000)
    - segment_2_tag_id (任意): integer(int64) - セグメント２ID<br>
- 取引登録の下書き保存で利用されます。
- freee会計法人向け エンタープライズプランで利用可能です。
<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定はヘルプページを御覧ください。</a> (最小: 1, 最大: 9223372036854775000)
    - segment_3_tag_id (任意): integer(int64) - セグメント３ID<br>
- 取引登録の下書き保存で利用されます。
- freee会計法人向け エンタープライズプランで利用可能です。
<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定はヘルプページを御覧ください。</a> (最小: 1, 最大: 9223372036854775000)

### レスポンス (201)

The request has succeeded and a new resource has been created as a result.

- invoice (必須): object
  - id (必須): integer(int64) - 請求書ID (最小: 1, 最大: 9223372036854775000)
  - company_id (必須): integer(int64) - 事業所ID (最小: 1, 最大: 9223372036854775000)
  - invoice_number (必須): string - 請求書番号
  - branch_no (任意): integer - 枝番 (最小: 0, 最大: 2147483647)
  - subject (必須): string - 件名
  - template_id (任意): integer(int64) - 帳票テンプレートID (最小: 1, 最大: 9223372036854775000)
  - template_name (任意): string - 帳票テンプレート名
  - billing_date (必須): string(date) - 請求日 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
  - issue_date (任意): string(date) - 発生日 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
  - payment_date (任意): string(date) - 期日
- payment_typeがtransferの場合、入金期日に該当します。
- payment_typeがdirect_debitの場合、振替日に該当します。 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
  - payment_type (任意): string - 入金方法 (振込: transfer, 振替: direct_debit) (選択肢: transfer, direct_debit)
  - invoice_note (必須): string - 備考
  - memo (必須): string - 社内メモ
  - sending_status (必須): string - 送付ステータス（sent: 送付済み、 unsent: 送付待ち） (選択肢: sent, unsent)
  - payment_status (必須): string - 入金ステータス（unsettled: 入金待ち, settled: 入金済み） (選択肢: settled, unsettled)
  - cancel_status (必須): string - 取消済み（canceled: 該当する、 uncanceled: 該当しない） (選択肢: canceled, uncanceled)
  - deal_status (必須): string - 取引ステータス（registered: 登録済み、 unregistered: 登録待ち） (選択肢: registered, unregistered)
  - deal_id (任意): integer(int64) - 取引ID （deal_statusがunregisteredの場合、nullになります。） (最小: 1, 最大: 9223372036854775000)
  - tax_entry_method (任意): string - 消費税の内税・外税区分（in: 税込表示（内税）、out: 税別表示（外税）） (選択肢: in, out)
  - tax_fraction (任意): string - 消費税端数の計算方法（omit: 切り捨て、round_up: 切り上げ、round: 四捨五入） (選択肢: omit, round_up, round)
  - line_amount_fraction (任意): string - 金額端数の計算方法（omit: 切り捨て、round_up: 切り上げ、round: 四捨五入） (選択肢: omit, round_up, round)
  - withholding_tax_entry_method (任意): string - 源泉徴収の計算方法（in: 税込み価格で計算、out: 税別価格で計算） (選択肢: in, out)
  - total_amount (必須): number(double) - 合計金額
  - created_at (必須): string - 作成日時 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$)
  - amount_withholding_tax (任意): number - 源泉所得税
  - amount_including_tax (必須): number(double) - 税込金額
  - amount_excluding_tax (必須): number - 小計（税別）
  - amount_tax (必須): number - 消費税額
  - amount_including_tax_10 (任意): number(double) - 10%対象 税込
  - amount_excluding_tax_10 (任意): number(double) - 10%対象 税抜
  - amount_tax_10 (任意): number(double) - 10%対象 消費税
  - amount_including_tax_8 (任意): number(double) - 8%対象 税込
  - amount_excluding_tax_8 (任意): number(double) - 8%対象 税抜
  - amount_tax_8 (任意): number(double) - 8%対象 消費税
  - amount_including_tax_8_reduced (任意): number(double) - 軽減税率8%対象 税込
  - amount_excluding_tax_8_reduced (任意): number(double) - 軽減税率8%対象 税抜
  - amount_tax_8_reduced (任意): number(double) - 軽減税率8%対象 消費税
  - amount_including_tax_0 (任意): number(double) - 0%対象 税込
  - amount_excluding_tax_0 (任意): number(double) - 0%対象 税抜
  - amount_tax_0 (任意): number(double) - 0%対象 消費税
  - amount_brought_forward (必須): number(double) - 繰越金額 (最小: -999999999999, 最大: 999999999999)
  - partner_id (必須): integer(int64) - 取引先ID (最小: 1, 最大: 9223372036854775000)
  - partner_code (任意): string - 取引先コード
  - partner_name (任意): string - 取引先名
- partner_nameに空文字が戻る場合は、対象レコードをweb画面から更新するか、freee請求書APIから更新すると解消されます。
  - partner_title (任意): string - 敬称（御中、様、(空白)の3つから選択） (選択肢: 御中, 様, (空白))
  - partner_address_zipcode (任意): string - 郵便番号
  - partner_address_prefecture_code (任意): integer - 都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄） (最小: -1, 最大: 46)
  - partner_address_street_name1 (任意): string - 取引先 市区町村・番地
  - partner_address_street_name2 (任意): string - 取引先 建物名・部屋番号など
  - partner_contact_department (任意): string - 取引先部署
  - partner_contact_email_cc (任意): string - 取引先担当者メールアドレス（CC）
  - partner_contact_email_to (任意): string - 取引先担当者メールアドレス（TO）
  - partner_contact_name (任意): string - 取引先担当者名
  - partner_display_name (任意): string - 取引先宛名
- 帳票の宛名に利用されます。
  - partner_bank_account (任意): string - 取引先口座
  - partner_sending_method (任意): string - 取引先への送付方法 (選択肢: email, posting, email_and_posting)
  - company_contact_name (任意): string - 自社担当者名
  - company_name (任意): string - 自社名
  - company_description (任意): string - 自社情報
  - bank_account_to_transfer (任意): string - 振込先
  - template (任意): object - 帳票テンプレート情報（帳票テンプレート作成の際に設定できる項目です。）
  - lines (必須): array[object] - 請求書の明細行

### GET /invoices/templates

操作: 使用可能な請求書の帳票テンプレート一覧の取得


説明: 使用可能な請求書の帳票テンプレート一覧を返します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (200)

The request has succeeded.

- templates (必須): array[object]
  配列の要素:
    - id (必須): integer - 帳票テンプレートID (最小: 1, 最大: 2147483647)
    - name (必須): string - 帳票テンプレート名

### GET /invoices/{id}

操作: 請求書の取得


説明: 指定されたIDの請求書を返します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| id | path | はい | integer | 請求書ID |

### レスポンス (200)

The request has succeeded.

- invoice (必須): object
  - id (必須): integer(int64) - 請求書ID (最小: 1, 最大: 9223372036854775000)
  - company_id (必須): integer(int64) - 事業所ID (最小: 1, 最大: 9223372036854775000)
  - invoice_number (必須): string - 請求書番号
  - branch_no (任意): integer - 枝番 (最小: 0, 最大: 2147483647)
  - subject (必須): string - 件名
  - template_id (任意): integer(int64) - 帳票テンプレートID (最小: 1, 最大: 9223372036854775000)
  - template_name (任意): string - 帳票テンプレート名
  - billing_date (必須): string(date) - 請求日 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
  - issue_date (任意): string(date) - 発生日 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
  - payment_date (任意): string(date) - 期日
- payment_typeがtransferの場合、入金期日に該当します。
- payment_typeがdirect_debitの場合、振替日に該当します。
- payment_typeがcardの場合、カード支払期日に該当します。 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
  - payment_type (任意): string - 入金方法 (振込: transfer, 振替: direct_debit, カード: card) (選択肢: transfer, direct_debit, card)
  - invoice_note (必須): string - 備考
  - memo (必須): string - 社内メモ
  - sending_status (必須): string - 送付ステータス（sent: 送付済み、 unsent: 送付待ち） (選択肢: sent, unsent)
  - payment_status (必須): string - 入金ステータス（unsettled: 入金待ち, settled: 入金済み） (選択肢: settled, unsettled)
  - cancel_status (必須): string - 取消済み（canceled: 該当する、 uncanceled: 該当しない） (選択肢: canceled, uncanceled)
  - deal_status (必須): string - 取引ステータス（registered: 登録済み、 unregistered: 登録待ち） (選択肢: registered, unregistered)
  - deal_id (任意): integer(int64) - 取引ID （deal_statusがunregisteredの場合、nullになります。） (最小: 1, 最大: 9223372036854775000)
  - tax_entry_method (任意): string - 消費税の内税・外税区分（in: 税込表示（内税）、out: 税別表示（外税）） (選択肢: in, out)
  - tax_fraction (任意): string - 消費税端数の計算方法（omit: 切り捨て、round_up: 切り上げ、round: 四捨五入） (選択肢: omit, round_up, round)
  - line_amount_fraction (任意): string - 金額端数の計算方法（omit: 切り捨て、round_up: 切り上げ、round: 四捨五入） (選択肢: omit, round_up, round)
  - withholding_tax_entry_method (任意): string - 源泉徴収の計算方法（in: 税込み価格で計算、out: 税別価格で計算） (選択肢: in, out)
  - total_amount (必須): number(double) - 合計金額
  - created_at (必須): string - 作成日時 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$)
  - amount_withholding_tax (任意): number - 源泉所得税
  - amount_including_tax (必須): number(double) - 税込金額
  - amount_excluding_tax (必須): number - 小計（税別）
  - amount_tax (必須): number - 消費税額
  - amount_including_tax_10 (任意): number(double) - 10%対象 税込
  - amount_excluding_tax_10 (任意): number(double) - 10%対象 税抜
  - amount_tax_10 (任意): number(double) - 10%対象 消費税
  - amount_including_tax_8 (任意): number(double) - 8%対象 税込
  - amount_excluding_tax_8 (任意): number(double) - 8%対象 税抜
  - amount_tax_8 (任意): number(double) - 8%対象 消費税
  - amount_including_tax_8_reduced (任意): number(double) - 軽減税率8%対象 税込
  - amount_excluding_tax_8_reduced (任意): number(double) - 軽減税率8%対象 税抜
  - amount_tax_8_reduced (任意): number(double) - 軽減税率8%対象 消費税
  - amount_including_tax_0 (任意): number(double) - 0%対象 税込
  - amount_excluding_tax_0 (任意): number(double) - 0%対象 税抜
  - amount_tax_0 (任意): number(double) - 0%対象 消費税
  - amount_brought_forward (必須): number(double) - 繰越金額 (最小: -999999999999, 最大: 999999999999)
  - partner_id (必須): integer(int64) - 取引先ID (最小: 1, 最大: 9223372036854775000)
  - partner_code (任意): string - 取引先コード
  - partner_name (任意): string - 取引先名
- partner_nameに空文字が戻る場合は、対象レコードをweb画面から更新するか、freee請求書APIから更新すると解消されます。
  - partner_title (任意): string - 敬称（御中、様、(空白)の3つから選択） (選択肢: 御中, 様, (空白))
  - partner_address_zipcode (任意): string - 郵便番号
  - partner_address_prefecture_code (任意): integer - 都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄） (最小: -1, 最大: 46)
  - partner_address_street_name1 (任意): string - 取引先 市区町村・番地
  - partner_address_street_name2 (任意): string - 取引先 建物名・部屋番号など
  - partner_contact_department (任意): string - 取引先部署
  - partner_contact_name (任意): string - 取引先担当者名
  - partner_display_name (任意): string - 取引先宛名
- 帳票の宛名に利用されます。
  - partner_bank_account (任意): string - 取引先口座
  - company_contact_name (任意): string - 自社担当者名
  - company_name (任意): string - 自社名 (上書きした場合のみ反映されます、デフォルトがテンプレートの自社名になります。)
  - company_description (任意): string - 自社情報 (上書きした場合のみ反映されます、デフォルトがテンプレートの自社情報になります。)
  - bank_account_to_transfer (任意): string - 振込先
  - template (任意): object - 帳票テンプレート情報（帳票テンプレート作成の際に設定できる項目です。）
  - lines (必須): array[object] - 請求書の明細行
  - email_url_file_downloaded_at (任意): string(string) - URL共有で送付された送付先のメールのダウンロード時刻 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$)
  - email_url_file_downloaded_status (任意): string - URL共有で送付された送付先のメールのダウンロードステータス (選択肢: downloaded, undownloaded)

### PUT /invoices/{id}

操作: 請求書の更新


説明: 請求書の更新をします。 issue_date, account_item_id, tax_code, item_id, section_id, tag_ids, segment_1_tag_id, segment_2_tag_id, segment_3_tag_id は、取引登録の下書き保存で利用されます。 tag_idsは10個まで設定可能です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer | 請求書ID |

### リクエストボディ

(必須)

- company_id (必須): integer(int64) - 事業所ID (最小: 1, 最大: 9223372036854775000)
- template_id (任意): integer(int64) - 帳票テンプレートID（指定しない場合、事業所の既定のテンプレートが指定されます。） (最小: 1, 最大: 9223372036854775000)
- invoice_number (任意): string - 請求書番号<br>
- 採番の設定が、[自動採番する]の場合、指定できません。
- 採番の設定が、[自動採番する]以外の場合、必須になります。
- branch_no (任意): integer - 枝番 (最小: 0, 最大: 2147483647)
- billing_date (必須): string(date) - 請求日 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
- issue_date (任意): string(date) - 発生日（取引登録の下書き保存で利用されます。）
- 入力がない場合、請求日が補完されます。 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
- payment_date (任意): string(date) - 期日
- payment_typeがtransferの場合、入金期日に該当します。
- payment_typeがdirect_debitの場合、振替日に該当します。 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
- payment_type (任意): string - 入金方法 (振込: transfer, 振替: direct_debit) (選択肢: transfer, direct_debit)
- subject (任意): string - 件名
- tax_entry_method (必須): string - 消費税の内税・外税区分（in: 税込表示（内税）、out: 税別表示（外税）） (選択肢: in, out)
- tax_fraction (必須): string - 消費税端数の計算方法（omit: 切り捨て、round_up: 切り上げ、round: 四捨五入） (選択肢: omit, round_up, round)
- line_amount_fraction (任意): string - 金額端数の計算方法（omit: 切り捨て、round_up: 切り上げ、round: 四捨五入） (選択肢: omit, round_up, round)
- withholding_tax_entry_method (必須): string - 源泉徴収の計算方法（in: 税込み価格で計算、out: 税別価格で計算） (選択肢: in, out)
- include_amount_brought_forward (任意): boolean - 繰越金額を含めるかどうか（true: 含める、false: 含めない）<br>
- 含める場合は、amount_brought_forwardに繰越金額を指定することができます。
- 含める場合でamount_brought_forwardの指定がない場合は、 帳票に指定されたpartner_id, partner_codeに紐づく未決済残高が繰越金額として利用されます。
- amount_brought_forward (任意): integer(int64) - 繰越金額<br>
include_amount_brought_forward に true を指定する場合のみ、指定できます。 (最小: -999999999999, 最大: 999999999999)
- invoice_note (任意): string - 備考
- memo (任意): string - 社内メモ
- partner_id (任意): integer(int64) - 取引先ID<br>
取引先IDと取引先コードはどちらか一方を必ず指定してください。<br>
<a href='https://support.freee.co.jp/hc/ja/articles/12515437008409-取引先を登録する#:~:text=確認ください。-,取引先役割,-種別' target='_blank'>取引先役割に関してはヘルプページを御覧ください。</a> (最小: 1, 最大: 9223372036854775000)
- partner_code (任意): string - 取引先コード<br>
取引先コードと取引先IDはどちらか一方を必ず指定してください。<br>
<a href='https://support.freee.co.jp/hc/ja/articles/12515437008409-取引先を登録する#:~:text=確認ください。-,取引先役割,-種別' target='_blank'>取引先役割に関してはヘルプページを御覧ください。</a>
- partner_title (必須): string - 敬称（御中、様、(空白)の3つから選択）
- [非推奨]全角カッコの（空白）は削除予定です。
- 全角カッコの（空白）を指定した場合、はレスポンスは、半角カッコの(空白)になります。 (選択肢: 御中, 様, (空白), （空白）)
- partner_address_zipcode (任意): string - 郵便番号
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく郵便番号が利用されます。 (パターン: ^[0-9]{3}-?[0-9]{4}$)
- partner_address_prefecture_code (任意): integer - 都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄）
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく都道府県コードが利用されます。 (最小: -1, 最大: 46)
- partner_address_street_name1 (任意): string - 取引先 市区町村・番地
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく取引先 市区町村・番地が利用されます。
- partner_address_street_name2 (任意): string - 取引先 建物名・部屋番号など
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく取引先 建物名・部屋番号などが利用されます。
- partner_contact_department (任意): string - 取引先部署
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく取引先部署が利用されます。
- partner_contact_email_cc (任意): string - 取引先担当者メールアドレス（CC）
- 入力がない場合、メールテンプレートに指定されたCCが利用されます。
- カンマ区切りで複数メールアドレスに送付可能です。
- partner_contact_email_to (任意): string - 取引先担当者メールアドレス（TO）
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく取引先担当者メールアドレスが利用されます。
- カンマ区切りで複数メールアドレスに送付可能です。
- partner_contact_name (任意): string - 取引先担当者名
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく取引先担当者名が利用されます。
- partner_display_name (任意): string - 取引先宛名
- 帳票の宛名に利用されます。
- 入力がない場合、帳票に指定されたpartner_id, partner_codeに紐づく取引先名称が利用されます。
- partner_sending_method (任意): string - 取引先への送付方法
- 一括送付時に取引先マスタに登録された送付方法以外を利用したい場合に指定します。
- 入力がない場合、取引先マスタに登録された送付方法で一括送付を行います。 (選択肢: email, posting, email_and_posting)
- partner_bank_account (任意): string - 取引先口座
- payment_typeがdirect_debitの場合に指定可能です。
- 入力がない場合またはpayment_typeがtransferの場合、帳票に指定されたpartner_id, partner_codeに紐づく取引先口座が利用されます。
- company_contact_name (任意): string - 自社担当者(デフォルトは表示ユーザー名が補完されます)
- company_name (任意): string - 自社名を上書きする場合に指定します。
- company_description (任意): string - 自社説明を上書きする場合に指定します。
- bank_account_to_transfer (任意): string - 振込先を上書きする場合に指定します。
- lines (必須): array[object] - 請求書の明細行
  配列の要素:
    - type (任意): string - 明細の種類
- item: 品目行
- tax_rate、quantityは必須になります。
- text: テキスト行
- descriptionのみ入力可能です。
- 入力がない場合、itemが利用されます。 (選択肢: item, text)
    - description (任意): string - 摘要（品名）
    - sales_date (任意): string(date) - 取引日 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
    - unit (任意): string - 明細の単位名
    - quantity (任意): number - 明細の数量 (整数部は8桁まで、小数部は3桁まで) (最小: -99999999.999, 最大: 99999999.999)
    - unit_price (任意): string - 明細の単価 (整数部は13桁まで、小数部は3桁まで) (パターン: ^-?[0-9]{0,13}(\.[0-9]{1,3})?$)
    - tax_rate (任意): number - 税率（%）（帳票の税額計算に用います。） (選択肢: 0, 8, 10)
    - reduced_tax_rate (任意): boolean - 軽減税率対象（true: 対象、 false: 対象外）trueはtax_rate:8の時のみ指定可能です。
    - withholding (任意): boolean - 源泉徴収対象
    - account_item_id (任意): integer - 勘定科目ID（取引登録の下書き保存で利用されます。） (最小: 1, 最大: 2147483647)
    - tax_code (任意): integer - 税区分コード（取引登録の下書き保存で利用されます。） (最小: 0, 最大: 2147483647)
    - item_id (任意): integer - 品目ID（取引登録の下書き保存で利用されます。） (最小: 1, 最大: 2147483647)
    - section_id (任意): integer - 部門ID<br>
- 取引登録の下書き保存で利用されます。
- 親部門は利用できません。
- グループ管理で制限された部門は利用できません。
<br>
<a href="https://support.freee.co.jp/hc/ja/articles/215225263" target="_blank">グループ管理の設定はヘルプページを御覧ください。</a> (最小: 1, 最大: 2147483647)
    - tag_ids (任意): array[integer]
    - segment_1_tag_id (任意): integer(int64) - セグメント１ID<br>
- 取引登録の下書き保存で利用されます。
- freee会計法人向け プロフェッショナルプラン以上で利用可能です。
<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定はヘルプページを御覧ください。</a> (最小: 1, 最大: 9223372036854775000)
    - segment_2_tag_id (任意): integer(int64) - セグメント２ID<br>
- 取引登録の下書き保存で利用されます。
- freee会計法人向け エンタープライズプランで利用可能です。
<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定はヘルプページを御覧ください。</a> (最小: 1, 最大: 9223372036854775000)
    - segment_3_tag_id (任意): integer(int64) - セグメント３ID<br>
- 取引登録の下書き保存で利用されます。
- freee会計法人向け エンタープライズプランで利用可能です。
<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定はヘルプページを御覧ください。</a> (最小: 1, 最大: 9223372036854775000)

### レスポンス (200)

The request has succeeded.

- invoice (必須): object
  - id (必須): integer(int64) - 請求書ID (最小: 1, 最大: 9223372036854775000)
  - company_id (必須): integer(int64) - 事業所ID (最小: 1, 最大: 9223372036854775000)
  - invoice_number (必須): string - 請求書番号
  - branch_no (任意): integer - 枝番 (最小: 0, 最大: 2147483647)
  - subject (必須): string - 件名
  - template_id (任意): integer(int64) - 帳票テンプレートID (最小: 1, 最大: 9223372036854775000)
  - template_name (任意): string - 帳票テンプレート名
  - billing_date (必須): string(date) - 請求日 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
  - issue_date (任意): string(date) - 発生日 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
  - payment_date (任意): string(date) - 期日
- payment_typeがtransferの場合、入金期日に該当します。
- payment_typeがdirect_debitの場合、振替日に該当します。 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2}$)
  - payment_type (任意): string - 入金方法 (振込: transfer, 振替: direct_debit) (選択肢: transfer, direct_debit)
  - invoice_note (必須): string - 備考
  - memo (必須): string - 社内メモ
  - sending_status (必須): string - 送付ステータス（sent: 送付済み、 unsent: 送付待ち） (選択肢: sent, unsent)
  - payment_status (必須): string - 入金ステータス（unsettled: 入金待ち, settled: 入金済み） (選択肢: settled, unsettled)
  - cancel_status (必須): string - 取消済み（canceled: 該当する、 uncanceled: 該当しない） (選択肢: canceled, uncanceled)
  - deal_status (必須): string - 取引ステータス（registered: 登録済み、 unregistered: 登録待ち） (選択肢: registered, unregistered)
  - deal_id (任意): integer(int64) - 取引ID （deal_statusがunregisteredの場合、nullになります。） (最小: 1, 最大: 9223372036854775000)
  - tax_entry_method (任意): string - 消費税の内税・外税区分（in: 税込表示（内税）、out: 税別表示（外税）） (選択肢: in, out)
  - tax_fraction (任意): string - 消費税端数の計算方法（omit: 切り捨て、round_up: 切り上げ、round: 四捨五入） (選択肢: omit, round_up, round)
  - line_amount_fraction (任意): string - 金額端数の計算方法（omit: 切り捨て、round_up: 切り上げ、round: 四捨五入） (選択肢: omit, round_up, round)
  - withholding_tax_entry_method (任意): string - 源泉徴収の計算方法（in: 税込み価格で計算、out: 税別価格で計算） (選択肢: in, out)
  - total_amount (必須): number(double) - 合計金額
  - created_at (必須): string - 作成日時 (パターン: ^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}(:[0-9]{2})?$)
  - amount_withholding_tax (任意): number - 源泉所得税
  - amount_including_tax (必須): number(double) - 税込金額
  - amount_excluding_tax (必須): number - 小計（税別）
  - amount_tax (必須): number - 消費税額
  - amount_including_tax_10 (任意): number(double) - 10%対象 税込
  - amount_excluding_tax_10 (任意): number(double) - 10%対象 税抜
  - amount_tax_10 (任意): number(double) - 10%対象 消費税
  - amount_including_tax_8 (任意): number(double) - 8%対象 税込
  - amount_excluding_tax_8 (任意): number(double) - 8%対象 税抜
  - amount_tax_8 (任意): number(double) - 8%対象 消費税
  - amount_including_tax_8_reduced (任意): number(double) - 軽減税率8%対象 税込
  - amount_excluding_tax_8_reduced (任意): number(double) - 軽減税率8%対象 税抜
  - amount_tax_8_reduced (任意): number(double) - 軽減税率8%対象 消費税
  - amount_including_tax_0 (任意): number(double) - 0%対象 税込
  - amount_excluding_tax_0 (任意): number(double) - 0%対象 税抜
  - amount_tax_0 (任意): number(double) - 0%対象 消費税
  - amount_brought_forward (必須): number(double) - 繰越金額 (最小: -999999999999, 最大: 999999999999)
  - partner_id (必須): integer(int64) - 取引先ID (最小: 1, 最大: 9223372036854775000)
  - partner_code (任意): string - 取引先コード
  - partner_name (任意): string - 取引先名
- partner_nameに空文字が戻る場合は、対象レコードをweb画面から更新するか、freee請求書APIから更新すると解消されます。
  - partner_title (任意): string - 敬称（御中、様、(空白)の3つから選択） (選択肢: 御中, 様, (空白))
  - partner_address_zipcode (任意): string - 郵便番号
  - partner_address_prefecture_code (任意): integer - 都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄） (最小: -1, 最大: 46)
  - partner_address_street_name1 (任意): string - 取引先 市区町村・番地
  - partner_address_street_name2 (任意): string - 取引先 建物名・部屋番号など
  - partner_contact_department (任意): string - 取引先部署
  - partner_contact_email_cc (任意): string - 取引先担当者メールアドレス（CC）
  - partner_contact_email_to (任意): string - 取引先担当者メールアドレス（TO）
  - partner_contact_name (任意): string - 取引先担当者名
  - partner_display_name (任意): string - 取引先宛名
- 帳票の宛名に利用されます。
  - partner_bank_account (任意): string - 取引先口座
  - partner_sending_method (任意): string - 取引先への送付方法 (選択肢: email, posting, email_and_posting)
  - company_contact_name (任意): string - 自社担当者名
  - company_name (任意): string - 自社名
  - company_description (任意): string - 自社情報
  - bank_account_to_transfer (任意): string - 振込先
  - template (任意): object - 帳票テンプレート情報（帳票テンプレート作成の際に設定できる項目です。）
  - lines (必須): array[object] - 請求書の明細行



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [invoice-api-schema.json](../../openapi/invoice-api-schema.json)
