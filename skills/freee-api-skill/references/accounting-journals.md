# Journals

## 概要

仕訳帳

## エンドポイント一覧

### GET /api/1/journals

**操作**: 仕訳帳のダウンロード要求

**説明**: 概要 ユーザーが所属する事業所の仕訳帳のダウンロードをリクエストします。 生成されるファイルのファイル形式と出力項目に関しては、ヘルプページをご参照ください。 定義 download_type generic (旧CSV) generic_v2 (新CSV（freee汎用形式）) csv (弥生会計) pdf (PDF) encoding : download_typeがgeneric, generic_v2の場合のみ有効で、指定しない場合はsjisになります。無効なdownload_typeのうちcsvの場合はsjisでファイル出力されるので、レスポンスでsjisがかえります。 sjis utf-8 visible_tags : download_typeがgeneric, csv, pdfの場合のみ有効です。指定しない場合は従来の仕様の仕訳帳が出力されます。 partner : 取引先タグ item : 品目タグ tag : メモタグ section : 部門タグ description : 備考欄 wallet_txn_description : 明細の備考欄 segment_1...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| download_type | query | はい | string | ダウンロード形式 (選択肢: generic, generic_v2, csv, pdf) |
| encoding | query | いいえ | string | 文字コード (選択肢: sjis, utf-8) |
| company_id | query | はい | integer(int64) | 事業所ID |
| visible_tags[] | query | いいえ | array[string] | 補助科目やコメントとして出力する項目 |
| visible_ids[] | query | いいえ | array[string] | 追加出力するID項目 |
| start_date | query | いいえ | string | 取得開始日 (yyyy-mm-dd) |
| end_date | query | いいえ | string | 取得終了日 (yyyy-mm-dd) |

### GET /api/1/journals/reports/{id}/status

**操作**: 仕訳帳のステータスの取得

**説明**: 概要 仕訳帳のダウンロードリクエストのステータスを取得する 定義 status enqueued : 実行待ち working : 実行中 uploaded : 準備完了 id : 受け付けID

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| id | path | はい | integer(int64) | 受け付けID |

### レスポンス (200)

- **journals** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 受け付けID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **download_type** **(必須)**: string - ダウンロード形式 (選択肢: generic, generic_v2, csv, pdf) 例: `csv`
  - **encoding** (任意): string - 文字コード (選択肢: sjis, utf-8) 例: `sjis`
  - **status** **(必須)**: string - ダウンロードリクエストのステータス (選択肢: enqueued, working, uploaded, failed) 例: `enqueued`
  - **start_date** **(必須)**: string - 取得開始日 (yyyy-mm-dd) 例: `2019-12-17`
  - **end_date** **(必須)**: string - 取得終了日 (yyyy-mm-dd) 例: `2019-12-17`
  - **visible_tags** (任意): array[string]
  - **visible_ids** (任意): array[string]
  - **download_url** (任意): string - ダウンロードURL 例: `https://api.freee.co.jp/api/1/journals/reports/1/download`

### GET /api/1/journals/reports/{id}/download

**操作**: 仕訳帳のダウンロード

**説明**: 概要 仕訳帳をダウンロードする 定義 id : 受け付けID

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 受け付けID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (200)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
