# Receipts

## 概要

ファイルボックス（証憑ファイル）

## エンドポイント一覧

### GET /api/1/receipts

**操作**: ファイルボックス（証憑ファイル）一覧の取得

**説明**: 概要 指定した事業所のファイルボックス（証憑ファイル）一覧を取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| start_date | query | はい | string | アップロード日 (yyyy-mm-dd) |
| end_date | query | はい | string | アップロード日 (yyyy-mm-dd) |
| user_name | query | いいえ | string | アップロードしたユーザー名、メールアドレス |
| number | query | いいえ | integer(int64) | アップロードファイルNo |
| comment_type | query | いいえ | string | posted:コメントあり, raised:未解決, resolved:解決済 (選択肢: posted, raised, resolved) |
| comment_important | query | いいえ | boolean | trueの時、お気に入りコメント付きが対象 |
| category | query | いいえ | string | all:すべて、without_deal:未登録、with_expense_application_line:経費申請中, with_deal:登録済み、ignored:無視 (選択肢: all, without_deal, with_expense_application_line, with_deal, ignored) |
| offset | query | いいえ | integer(int64) | 取得レコードのオフセット (デフォルト: 0) |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 50, 最小: 1, 最大: 3000) |

### レスポンス (200)

- **receipts** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - ファイルボックス（証憑ファイル）ID 例: `1` (最小: 1)
    - **status** **(必須)**: string - ステータス(confirmed:確認済み、deleted:削除済み、ignored:無視) (選択肢: confirmed, deleted, ignored) 例: `confirmed`
    - **description** (任意): string - メモ 例: `タクシー利用`
    - **mime_type** **(必須)**: string - MIMEタイプ 例: `image/png`
    - **origin** **(必須)**: string - アップロード元種別 (選択肢: unknown, web, mobile_camera, mobile_album, scansnap, scannable, dropbox, mail, safety_contact_file, public_api) 例: `public_api`
    - **created_at** **(必須)**: string - アップロード日時（ISO8601形式） 例: `2019-12-17T18:30:24+09:00`
    - **user** **(必須)**: object
    - **receipt_metadatum** (任意): object
    - **qualified_invoice** (任意): string - 適格請求書等（qualified: 該当する、not_qualified: 該当しない、unselected: 未選択、null: OCR解析結果が保存されている時等） (選択肢: qualified, not_qualified, unselected) 例: `qualified`
    - **invoice_registration_number** (任意): string - インボイス制度適格請求書発行事業者登録番号（null: OCR解析結果が保存されている時等）
- 先頭T数字13桁の固定14桁の文字列
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `T1000000000001` (パターン: ^T[1-9][0-9]{12}$)
    - **document_type** (任意): string - 書類の種類（receipt: 領収書、invoice: 請求書、other: その他、null: OCR解析結果が保存されている時等） (選択肢: receipt, invoice, other) 例: `receipt`

### POST /api/1/receipts

**操作**: ファイルボックス（証憑ファイル）のアップロード

**説明**: 概要 ファイルボックス（証憑ファイル）をアップロードする 注意点 リクエストヘッダーの Content-Type は、multipart/form-dataにのみ対応しています。 インボイス制度適格請求書発行事業者登録番号はOCR解析結果が採用されます。OCR解析結果を確認する場合は、Web画面にてご確認ください。上書きする場合は、ファイルボックス（証憑ファイル）の更新APIをご利用ください。 以下の制限を満たさない場合アップロードに失敗します。 ファイルサイズの制限： 64MBまで 月間アップロード容量の制限： 月間合計10GBまで 1分間あたりのアップロード数制限： 300ファイルまで プランによる月間アップロード数の制限： 以下のリンクからご確認ください 【個人】freee会計のプランについて 【法人】freee会計のプランについて（2024年7月以降）

### レスポンス (201)

- **receipt** **(必須)**: object
  - **id** **(必須)**: integer(int64) - ファイルボックス（証憑ファイル）ID 例: `1` (最小: 1)
  - **status** **(必須)**: string - ステータス(confirmed:確認済み、deleted:削除済み、ignored:無視) (選択肢: confirmed, deleted, ignored) 例: `confirmed`
  - **description** (任意): string - メモ 例: `タクシー利用`
  - **mime_type** **(必須)**: string - MIMEタイプ 例: `image/png`
  - **origin** **(必須)**: string - アップロード元種別 (選択肢: unknown, web, mobile_camera, mobile_album, scansnap, scannable, dropbox, mail, safety_contact_file, public_api) 例: `public_api`
  - **created_at** **(必須)**: string - アップロード日時（ISO8601形式） 例: `2019-12-17T18:30:24+09:00`
  - **user** **(必須)**: object
  - **receipt_metadatum** (任意): object
  - **qualified_invoice** (任意): string - 適格請求書等（qualified: 該当する、not_qualified: 該当しない、unselected: 未選択、null: OCR解析結果が保存されている時等） (選択肢: qualified, not_qualified, unselected) 例: `qualified`
  - **invoice_registration_number** (任意): string - インボイス制度適格請求書発行事業者登録番号（null: OCR解析結果が保存されている時等）
- 先頭T数字13桁の固定14桁の文字列
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `T1000000000001` (パターン: ^T[1-9][0-9]{12}$)
  - **document_type** (任意): string - 書類の種類（receipt: 領収書、invoice: 請求書、other: その他、null: OCR解析結果が保存されている時等） (選択肢: receipt, invoice, other) 例: `receipt`

### GET /api/1/receipts/{id}

**操作**: ファイルボックス（証憑ファイル）の取得

**説明**: 概要 指定した事業所のファイルボックス（証憑ファイル）を取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | ファイルボックス（証憑ファイル）ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (200)

- **receipt** **(必須)**: object
  - **id** **(必須)**: integer(int64) - ファイルボックス（証憑ファイル）ID 例: `1` (最小: 1)
  - **status** **(必須)**: string - ステータス(confirmed:確認済み、deleted:削除済み、ignored:無視) (選択肢: confirmed, deleted, ignored) 例: `confirmed`
  - **description** (任意): string - メモ 例: `タクシー利用`
  - **mime_type** **(必須)**: string - MIMEタイプ 例: `image/png`
  - **origin** **(必須)**: string - アップロード元種別 (選択肢: unknown, web, mobile_camera, mobile_album, scansnap, scannable, dropbox, mail, safety_contact_file, public_api) 例: `public_api`
  - **created_at** **(必須)**: string - アップロード日時（ISO8601形式） 例: `2019-12-17T18:30:24+09:00`
  - **user** **(必須)**: object
  - **receipt_metadatum** (任意): object
  - **qualified_invoice** (任意): string - 適格請求書等（qualified: 該当する、not_qualified: 該当しない、unselected: 未選択、null: OCR解析結果が保存されている時等） (選択肢: qualified, not_qualified, unselected) 例: `qualified`
  - **invoice_registration_number** (任意): string - インボイス制度適格請求書発行事業者登録番号（null: OCR解析結果が保存されている時等）
- 先頭T数字13桁の固定14桁の文字列
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `T1000000000001` (パターン: ^T[1-9][0-9]{12}$)
  - **document_type** (任意): string - 書類の種類（receipt: 領収書、invoice: 請求書、other: その他、null: OCR解析結果が保存されている時等） (選択肢: receipt, invoice, other) 例: `receipt`

### PUT /api/1/receipts/{id}

**操作**: ファイルボックス（証憑ファイル）の更新

**説明**: 概要 ファイルボックス（証憑ファイル）を更新する 注意点 本APIでは、証憑ファイルの再アップロードはできません。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | ファイルボックス（証憑ファイル）ID |

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **description** (任意): string - メモ (255文字以内) 例: `メモ`
- **receipt_metadatum** (任意): object
  - **partner_name** (任意): string - 発行元 例: `freeeパートナー`
  - **issue_date** (任意): string - 発行日 (yyyy-mm-dd) 例: `2019-12-17`
  - **amount** (任意): integer(int64) - 金額 例: `5250` (最小: -999999999999, 最大: 999999999999)
- **qualified_invoice** (任意): string - 適格請求書等（qualified: 該当する、not_qualified: 該当しない、unselected: 未選択） (選択肢: qualified, not_qualified, unselected) 例: `qualified`
- **invoice_registration_number** (任意): string - インボイス制度適格請求書発行事業者登録番号
- 先頭T数字13桁の固定14桁の文字列
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `T1000000000001` (パターン: ^T?[1-9][0-9]{12}$)
- **document_type** (任意): string - 書類の種類（receipt: 領収書、invoice: 請求書、other: その他） (選択肢: receipt, invoice, other) 例: `receipt`

### レスポンス (200)

- **receipt** **(必須)**: object
  - **id** **(必須)**: integer(int64) - ファイルボックス（証憑ファイル）ID 例: `1` (最小: 1)
  - **status** **(必須)**: string - ステータス(confirmed:確認済み、deleted:削除済み、ignored:無視) (選択肢: confirmed, deleted, ignored) 例: `confirmed`
  - **description** (任意): string - メモ 例: `タクシー利用`
  - **mime_type** **(必須)**: string - MIMEタイプ 例: `image/png`
  - **origin** **(必須)**: string - アップロード元種別 (選択肢: unknown, web, mobile_camera, mobile_album, scansnap, scannable, dropbox, mail, safety_contact_file, public_api) 例: `public_api`
  - **created_at** **(必須)**: string - アップロード日時（ISO8601形式） 例: `2019-12-17T18:30:24+09:00`
  - **user** **(必須)**: object
  - **receipt_metadatum** (任意): object
  - **qualified_invoice** (任意): string - 適格請求書等（qualified: 該当する、not_qualified: 該当しない、unselected: 未選択、null: OCR解析結果が保存されている時等） (選択肢: qualified, not_qualified, unselected) 例: `qualified`
  - **invoice_registration_number** (任意): string - インボイス制度適格請求書発行事業者登録番号（null: OCR解析結果が保存されている時等）
- 先頭T数字13桁の固定14桁の文字列
<a target="_blank" href="https://www.invoice-kohyo.nta.go.jp/index.html">国税庁インボイス制度適格請求書発行事業者公表サイト</a>
 例: `T1000000000001` (パターン: ^T[1-9][0-9]{12}$)
  - **document_type** (任意): string - 書類の種類（receipt: 領収書、invoice: 請求書、other: その他、null: OCR解析結果が保存されている時等） (選択肢: receipt, invoice, other) 例: `receipt`

### DELETE /api/1/receipts/{id}

**操作**: ファイルボックス（証憑ファイル）の削除

**説明**: 概要 ファイルボックス（証憑ファイル）を削除する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | ファイルボックス（証憑ファイル）ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (204)

### GET /api/1/receipts/{id}/download

**操作**: ファイルボックス（証憑ファイル）のダウンロード

**説明**: 概要 指定した事業所のファイルボックス（証憑ファイル）をダウンロードする

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | ファイルボックス（証憑ファイル）ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (200)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
