# Quotations

## 概要

見積書

## エンドポイント一覧

### GET /api/1/quotations

**操作**: 見積書一覧の取得

**説明**: 概要 指定した事業所の見積書一覧を取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込 |
| partner_code | query | いいえ | string | 取引先コードで絞込 |
| start_issue_date | query | いいえ | string | 見積日の開始日(yyyy-mm-dd) |
| end_issue_date | query | いいえ | string | 見積日の終了日(yyyy-mm-dd) |
| quotation_number | query | いいえ | string | 見積書番号 |
| description | query | いいえ | string | 概要 |
| quotation_status | query | いいえ | string | 見積書ステータス  (unsubmitted: 送付待ち, submitted: 送付済み, all: 全て) (選択肢: all, unsubmitted, submitted) |
| offset | query | いいえ | integer(int64) | 取得レコードのオフセット (デフォルト: 0) |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 20, 最大: 100)  |

### レスポンス (200)

- **quotations** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - 見積書ID 例: `101` (最小: 1)
    - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
    - **issue_date** **(必須)**: string - 見積日 (yyyy-mm-dd) 例: `2019-12-17`
    - **partner_id** **(必須)**: integer(int64) - 取引先ID 例: `201` (最小: 1)
    - **partner_code** (任意): string - 取引先コード 例: `code001`
    - **quotation_number** **(必須)**: string - 見積書番号 例: `A001`
    - **title** (任意): string - タイトル 例: `見積書`
    - **total_amount** **(必須)**: integer(int64) - 合計金額 例: `108000`
    - **total_vat** (任意): integer(int64) - 消費税 例: `8000`
    - **sub_total** (任意): integer(int64) - 小計 例: `100000`
    - **description** (任意): string - 概要 例: `８月分見積書`
    - **quotation_status** **(必須)**: string - 見積書ステータス  (unsubmitted: 送付待ち, submitted: 送付済み, all: 全て) (選択肢: unsubmitted, submitted, all)
    - **web_published_at** (任意): string - Web共有日時(最新) 例: `2019-12-17T19:00:00+09:00`
    - **web_downloaded_at** (任意): string - Web共有ダウンロード日時(最新) 例: `2019-12-17T19:00:00+09:00`
    - **web_confirmed_at** (任意): string - Web共有取引先確認日時(最新) 例: `2019-12-17T19:00:00+09:00`
    - **mail_sent_at** (任意): string - メール送信日時(最新) 例: `2019-12-17T19:00:00+09:00`
    - **partner_name** (任意): string - 取引先名 例: `freeeパートナー`
    - **partner_display_name** (任意): string - 見積書に表示する取引先名 例: `株式会社freeeパートナー`
    - **partner_title** **(必須)**: string - 敬称（御中、様、(空白)の3つから選択） 例: `御中`
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
    - **message** (任意): string - メッセージ 例: `下記の通り御見積もり申し上げます。`
    - **notes** (任意): string - 備考 例: `毎度お世話になっております。`
    - **quotation_layout** **(必須)**: string - 見積書レイアウト
* `default_classic` - レイアウト１/クラシック (デフォルト)

* `standard_classic` - レイアウト２/クラシック

* `envelope_classic` - 封筒１/クラシック

* `default_modern` - レイアウト１/モダン

* `standard_modern` - レイアウト２/モダン

* `envelope_modern` - 封筒/モダン (選択肢: default_classic, standard_classic, envelope_classic, default_modern, standard_modern, envelope_modern) 例: `default_classic`
    - **tax_entry_method** **(必須)**: string - 見積書の消費税計算方法(inclusive: 内税, exclusive: 外税) (選択肢: , inclusive, exclusive) 例: `exclusive`
    - **quotation_contents** (任意): array[object] - 見積内容
    - **total_amount_per_vat_rate** **(必須)**: object

### GET /api/1/quotations/{id}

**操作**: 見積書の取得

**説明**: 概要 指定した事業所の見積書詳細を取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| id | path | はい | integer(int64) | 見積書ID |

### レスポンス (200)

- **quotation** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 見積書ID 例: `101` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **issue_date** **(必須)**: string - 見積日 (yyyy-mm-dd) 例: `2019-12-17`
  - **partner_id** **(必須)**: integer(int64) - 取引先ID 例: `201` (最小: 1)
  - **partner_code** (任意): string - 取引先コード 例: `code001`
  - **quotation_number** **(必須)**: string - 見積書番号 例: `A001`
  - **title** (任意): string - タイトル 例: `見積書`
  - **total_amount** **(必須)**: integer(int64) - 合計金額 例: `108000`
  - **total_vat** (任意): integer(int64) - 消費税 例: `8000`
  - **sub_total** (任意): integer(int64) - 小計 例: `100000`
  - **description** (任意): string - 概要 例: `８月分見積書`
  - **quotation_status** **(必須)**: string - 見積書ステータス  (unsubmitted: 送付待ち, submitted: 送付済み, all: 全て) (選択肢: unsubmitted, submitted, all)
  - **web_published_at** (任意): string - Web共有日時(最新) 例: `2019-12-17T19:00:00+09:00`
  - **web_downloaded_at** (任意): string - Web共有ダウンロード日時(最新) 例: `2019-12-17T19:00:00+09:00`
  - **web_confirmed_at** (任意): string - Web共有取引先確認日時(最新) 例: `2019-12-17T19:00:00+09:00`
  - **mail_sent_at** (任意): string - メール送信日時(最新) 例: `2019-12-17T19:00:00+09:00`
  - **partner_name** (任意): string - 取引先名 例: `freeeパートナー`
  - **partner_display_name** (任意): string - 見積書に表示する取引先名 例: `株式会社freeeパートナー`
  - **partner_title** **(必須)**: string - 敬称（御中、様、(空白)の3つから選択） 例: `御中`
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
  - **message** (任意): string - メッセージ 例: `下記の通り御見積もり申し上げます。`
  - **notes** (任意): string - 備考 例: `毎度お世話になっております。`
  - **quotation_layout** **(必須)**: string - 見積書レイアウト
* `default_classic` - レイアウト１/クラシック (デフォルト)

* `standard_classic` - レイアウト２/クラシック

* `envelope_classic` - 封筒１/クラシック

* `default_modern` - レイアウト１/モダン

* `standard_modern` - レイアウト２/モダン

* `envelope_modern` - 封筒/モダン (選択肢: default_classic, standard_classic, envelope_classic, default_modern, standard_modern, envelope_modern) 例: `default_classic`
  - **tax_entry_method** **(必須)**: string - 見積書の消費税計算方法(inclusive: 内税, exclusive: 外税) (選択肢: , inclusive, exclusive) 例: `exclusive`
  - **quotation_contents** (任意): array[object] - 見積内容
  - **total_amount_per_vat_rate** **(必須)**: object
  - **related_invoice_id** (任意): integer(int64) - 関連する請求書ID<br>
下記で作成したものが該当します。

<a href="https://support.freee.co.jp/hc/ja/articles/203318410#1-2" target="_blank">見積書・納品書を納品書・請求書に変換する</a><br>
<a href="https://support.freee.co.jp/hc/ja/articles/209076226" target="_blank">複数の見積書・納品書から合算請求書を作成する</a><br>
 例: `1` (最小: 1)
  - **related_quotation_ids** (任意): array[integer] - 関連する見積書ID(配列)<br>
下記で作成したものが該当します。

<a href="https://support.freee.co.jp/hc/ja/articles/203318410#1-2" target="_blank">見積書・納品書を納品書・請求書に変換する</a><br>
<a href="https://support.freee.co.jp/hc/ja/articles/209076226" target="_blank">複数の見積書・納品書から合算請求書を作成する</a><br>
 例: `1`



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
