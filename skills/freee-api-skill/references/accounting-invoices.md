# Invoices

## 概要

請求書

## エンドポイント一覧

### GET /api/1/invoices

**操作**: 請求書一覧の取得

**説明**: 概要 指定した事業所の請求書一覧を取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込 |
| partner_code | query | いいえ | string | 取引先コードで絞込 |
| start_issue_date | query | いいえ | string | 請求日の開始日(yyyy-mm-dd) |
| end_issue_date | query | いいえ | string | 請求日の終了日(yyyy-mm-dd) |
| start_due_date | query | いいえ | string | 期日の開始日(yyyy-mm-dd) |
| end_due_date | query | いいえ | string | 期日の終了日(yyyy-mm-dd) |
| invoice_number | query | いいえ | string | 請求書番号 |
| description | query | いいえ | string | 概要 |
| invoice_status | query | いいえ | string | 請求書ステータス  (draft: 下書き, applying: 申請中, remanded: 差し戻し, rejected: 却下, approved: 承認済み, unsubmitted: 送付待ち, submitted: 送付済み) (選択肢: draft, applying, remanded, rejected, approved, unsubmitted, submitted) |
| payment_status | query | いいえ | string | 入金ステータス  (unsettled: 入金待ち, settled: 入金済み) (選択肢: unsettled, settled) |
| offset | query | いいえ | integer(int64) | 取得レコードのオフセット (デフォルト: 0) |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 20, 最大: 100)  |

### レスポンス (200)

- **invoices** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - 請求書ID 例: `101` (最小: 1)
    - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
    - **issue_date** **(必須)**: string - 請求日 (yyyy-mm-dd) 例: `2019-12-17`
    - **partner_id** **(必須)**: integer(int64) - 取引先ID 例: `201` (最小: 1)
    - **partner_code** (任意): string - 取引先コード 例: `code001`
    - **invoice_number** **(必須)**: string - 請求書番号 例: `A001`
    - **title** (任意): string - タイトル 例: `請求書`
    - **due_date** (任意): string - 期日 (yyyy-mm-dd) 例: `2019-12-17`
    - **total_amount** **(必須)**: integer(int64) - 合計金額 例: `108000`
    - **total_vat** (任意): integer(int64) - 消費税 例: `8000`
    - **sub_total** (任意): integer(int64) - 小計 例: `100000`
    - **booking_date** (任意): string - 売上計上日 例: `2019-12-17`
    - **description** (任意): string - 概要 例: `８月分請求書`
    - **invoice_status** **(必須)**: string - 請求書ステータス  (draft: 下書き, applying: 申請中, remanded: 差し戻し, rejected: 却下, approved: 承認済み, submitted: 送付済み, unsubmitted: 請求書の承認フローが無効の場合のみ、unsubmitted（送付待ち）の値をとります) (選択肢: draft, applying, remanded, rejected, approved, submitted, unsubmitted)
    - **payment_status** (任意): string - 入金ステータス  (unsettled: 入金待ち, settled: 入金済み) (選択肢: , unsettled, settled)
    - **payment_date** (任意): string - 入金日 例: `2019-12-17`
    - **web_published_at** (任意): string - Web共有日時(最新) 例: `2019-12-17T19:00:00+09:00`
    - **web_downloaded_at** (任意): string - Web共有ダウンロード日時(最新) 例: `2019-12-17T19:00:00+09:00`
    - **web_confirmed_at** (任意): string - Web共有取引先確認日時(最新) 例: `2019-12-17T19:00:00+09:00`
    - **mail_sent_at** (任意): string - メール送信日時(最新) 例: `2019-12-17T19:00:00+09:00`
    - **posting_status** **(必須)**: string - 郵送ステータス(unrequested: リクエスト前, preview_registered: プレビュー登録, preview_failed: プレビュー登録失敗, ordered: 注文中, order_failed: 注文失敗, printing: 印刷中, canceled: キャンセル, posted: 投函済み) (選択肢: , unrequested, preview_registered, preview_failed, ordered, order_failed, printing, canceled, posted) 例: `unrequested`
    - **partner_name** (任意): string - 取引先名 例: `freeeパートナー`
    - **partner_display_name** (任意): string - 請求書に表示する取引先名 例: `株式会社freeeパートナー`
    - **partner_title** (任意): string - 敬称（御中、様、(空白)の3つから選択） 例: `御中`
    - **partner_zipcode** (任意): string - 郵便番号 例: `000-0000`
    - **partner_prefecture_code** (任意): integer(int64) - 都道府県コード（-1: 設定しない、0:北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄 例: `4` (最小: -1, 最大: 46)
    - **partner_prefecture_name** (任意): string - 都道府県 例: `秋田県`
    - **partner_address1** (任意): string - 市区町村・番地 例: `湯沢市`
    - **partner_address2** (任意): string - 建物名・部屋番号など 例: `Aビル`
    - **partner_contact_info** (任意): string - 取引先担当者名 例: `営業担当`
    - **company_name** **(必須)**: string - 事業所名 例: `freee株式会社`
    - **company_zipcode** (任意): string - 郵便番号 例: `000-0000`
    - **company_prefecture_code** (任意): integer(int64) - 都道府県コード（-1: 設定しない、0:北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄 例: `12` (最小: -1, 最大: 46)
    - **company_prefecture_name** (任意): string - 都道府県 例: `東京都`
    - **company_address1** (任意): string - 市区町村・番地 例: `ＸＸ区ＸＸ１−１−１`
    - **company_address2** (任意): string - 建物名・部屋番号など 例: `ビル1F`
    - **company_contact_info** (任意): string - 事業所担当者名 例: `法人営業担当`
    - **payment_type** **(必須)**: string - 支払方法 (振込: transfer, 引き落とし: direct_debit) (選択肢: , transfer, direct_debit) 例: `transfer`
    - **payment_bank_info** (任意): string - 支払口座 例: `ＸＸ銀行ＹＹ支店1111111`
    - **message** (任意): string - メッセージ 例: `下記の通りご請求申し上げます。`
    - **notes** (任意): string - 備考 例: `毎度ありがとうございます`
    - **invoice_layout** **(必須)**: string - 請求書レイアウト
* `default_classic` - レイアウト１/クラシック (デフォルト)

* `standard_classic` - レイアウト２/クラシック

* `envelope_classic` - 封筒１/クラシック

* `carried_forward_standard_classic` - レイアウト３（繰越金額欄あり）/クラシック

* `carried_forward_envelope_classic` - 封筒２（繰越金額欄あり）/クラシック

* `default_modern` - レイアウト１/モダン

* `standard_modern` - レイアウト２/モダン

* `envelope_modern` - 封筒/モダン (選択肢: default_classic, standard_classic, envelope_classic, carried_forward_standard_classic, carried_forward_envelope_classic, default_modern, standard_modern, envelope_modern) 例: `default_classic`
    - **tax_entry_method** **(必須)**: string - 請求書の消費税計算方法(inclusive: 内税, exclusive: 外税) (選択肢: , inclusive, exclusive) 例: `exclusive`
    - **deal_id** (任意): integer(int64) - 取引ID (invoice_statusがsubmitted, unsubmittedの時IDが表示されます) 例: `1` (最小: 1)
    - **invoice_contents** (任意): array[object] - 請求内容
    - **total_amount_per_vat_rate** **(必須)**: object

### GET /api/1/invoices/{id}

**操作**: 請求書の取得

**説明**: 概要 指定した事業所の請求書を取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| id | path | はい | integer(int64) | 請求書ID |

### レスポンス (200)

- **invoice** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 請求書ID 例: `101` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1`
  - **issue_date** **(必須)**: string - 請求日 (yyyy-mm-dd) 例: `2019-12-17`
  - **partner_id** **(必須)**: integer(int64) - 取引先ID 例: `201` (最小: 1)
  - **partner_code** (任意): string - 取引先コード 例: `code001`
  - **invoice_number** **(必須)**: string - 請求書番号 例: `A001`
  - **title** (任意): string - タイトル 例: `請求書`
  - **due_date** (任意): string - 期日 (yyyy-mm-dd) 例: `2019-12-17`
  - **total_amount** **(必須)**: integer(int64) - 合計金額 例: `108000`
  - **total_vat** (任意): integer(int64) - 消費税 例: `8000`
  - **sub_total** (任意): integer(int64) - 小計 例: `100000`
  - **booking_date** (任意): string - 売上計上日 例: `2019-12-17`
  - **description** (任意): string - 概要 例: `８月分請求書`
  - **invoice_status** **(必須)**: string - 請求書ステータス  (draft: 下書き, applying: 申請中, remanded: 差し戻し, rejected: 却下, approved: 承認済み, submitted: 送付済み, unsubmitted: 請求書の承認フローが無効の場合のみ、unsubmitted（送付待ち）の値をとります) (選択肢: draft, applying, remanded, rejected, approved, submitted, unsubmitted)
  - **payment_status** (任意): string - 入金ステータス  (unsettled: 入金待ち, settled: 入金済み) (選択肢: , unsettled, settled)
  - **payment_date** (任意): string - 入金日 例: `2019-12-17`
  - **web_published_at** (任意): string - Web共有日時(最新) 例: `2019-12-17T19:00:00+09:00`
  - **web_downloaded_at** (任意): string - Web共有ダウンロード日時(最新) 例: `2019-12-17T19:00:00+09:00`
  - **web_confirmed_at** (任意): string - Web共有取引先確認日時(最新) 例: `2019-12-17T19:00:00+09:00`
  - **mail_sent_at** (任意): string - メール送信日時(最新) 例: `2019-12-17T19:00:00+09:00`
  - **posting_status** **(必須)**: string - 郵送ステータス(unrequested: リクエスト前, preview_registered: プレビュー登録, preview_failed: プレビュー登録失敗, ordered: 注文中, order_failed: 注文失敗, printing: 印刷中, canceled: キャンセル, posted: 投函済み) (選択肢: , unrequested, preview_registered, preview_failed, ordered, order_failed, printing, canceled, posted) 例: `unrequested`
  - **partner_name** (任意): string - 取引先名 例: `freeeパートナー`
  - **partner_display_name** (任意): string - 請求書に表示する取引先名 例: `株式会社freeeパートナー`
  - **partner_title** (任意): string - 敬称（御中、様、(空白)の3つから選択） 例: `御中`
  - **partner_zipcode** (任意): string - 郵便番号 例: `000-0000`
  - **partner_prefecture_code** (任意): integer(int64) - 都道府県コード（-1: 設定しない、0:北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄 例: `4` (最小: -1, 最大: 46)
  - **partner_prefecture_name** (任意): string - 都道府県 例: `秋田県`
  - **partner_address1** (任意): string - 市区町村・番地 例: `湯沢市`
  - **partner_address2** (任意): string - 建物名・部屋番号など 例: `Aビル`
  - **partner_contact_info** (任意): string - 取引先担当者名 例: `営業担当`
  - **company_name** **(必須)**: string - 事業所名 例: `freee株式会社`
  - **company_zipcode** (任意): string - 郵便番号 例: `000-0000`
  - **company_prefecture_code** (任意): integer(int64) - 都道府県コード（-1: 設定しない、0:北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄 例: `12` (最小: -1, 最大: 46)
  - **company_prefecture_name** (任意): string - 都道府県 例: `東京都`
  - **company_address1** (任意): string - 市区町村・番地 例: `ＸＸ区ＸＸ１−１−１`
  - **company_address2** (任意): string - 建物名・部屋番号など 例: `ビル1F`
  - **company_contact_info** (任意): string - 事業所担当者名 例: `法人営業担当`
  - **payment_type** **(必須)**: string - 支払方法 (振込: transfer, 引き落とし: direct_debit) (選択肢: , transfer, direct_debit) 例: `transfer`
  - **payment_bank_info** (任意): string - 支払口座 例: `ＸＸ銀行ＹＹ支店1111111`
  - **message** (任意): string - メッセージ 例: `下記の通りご請求申し上げます。`
  - **notes** (任意): string - 備考 例: `毎度ありがとうございます`
  - **invoice_layout** **(必須)**: string - 請求書レイアウト
* `default_classic` - レイアウト１/クラシック (デフォルト)

* `standard_classic` - レイアウト２/クラシック

* `envelope_classic` - 封筒１/クラシック

* `carried_forward_standard_classic` - レイアウト３（繰越金額欄あり）/クラシック

* `carried_forward_envelope_classic` - 封筒２（繰越金額欄あり）/クラシック

* `default_modern` - レイアウト１/モダン

* `standard_modern` - レイアウト２/モダン

* `envelope_modern` - 封筒/モダン (選択肢: default_classic, standard_classic, envelope_classic, carried_forward_standard_classic, carried_forward_envelope_classic, default_modern, standard_modern, envelope_modern) 例: `default_classic`
  - **tax_entry_method** **(必須)**: string - 請求書の消費税計算方法(inclusive: 内税, exclusive: 外税) (選択肢: , inclusive, exclusive) 例: `exclusive`
  - **deal_id** (任意): integer(int64) - 取引ID (invoice_statusがsubmitted, unsubmittedの時IDが表示されます) 例: `1` (最小: 1)
  - **invoice_contents** (任意): array[object] - 請求内容
  - **total_amount_per_vat_rate** **(必須)**: object
  - **related_quotation_ids** (任意): array[integer] - 関連する見積書ID(配列)<br>
下記で作成したものが該当します。

<a href="https://support.freee.co.jp/hc/ja/articles/203318410#1-2" target="_blank">見積書・納品書を納品書・請求書に変換する</a><br>
<a href="https://support.freee.co.jp/hc/ja/articles/209076226" target="_blank">複数の見積書・納品書から合算請求書を作成する</a><br>




## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
