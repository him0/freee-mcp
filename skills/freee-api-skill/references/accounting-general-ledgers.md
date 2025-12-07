# General ledgers

## 概要

総勘定元帳

## エンドポイント一覧

### GET /api/1/reports/general_ledgers

**操作**: 総勘定元帳一覧の取得（β版）

**説明**: 概要 指定した事業所の総勘定元帳一覧を取得する ※このAPIはβ版として提供しています。 このAPIは法人アドバンスプラン（および旧法人プロフェッショナルプラン）・法人エンタープライズプランに加入している事業所のみが利用できます。 利用状況によって事前の告知なく提供プラン・コール数の上限を変更する可能性があります。 他エンドポイントと比べてレスポンスタイムが遅い場合があります。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| start_date | query | はい | string(date) | 期間で絞込：開始日 (yyyy-mm-dd) |
| end_date | query | はい | string(date) | 期間で絞込：終了日 (yyyy-mm-dd) |
| account_item_name | query | いいえ | string | 勘定科目名で絞込 |
| tax_name | query | いいえ | string | 税区分名で絞込 (選択肢: 課税, 対象外, 非課税, 不課税, 輸出等, 未選択, 課税売上, 輸出売上, 非課売上, 非資売上, 有価譲渡, 対外売上, 課税売返, 輸出売返, 非課売返, 非資売返, 課税売倒, 輸出売倒, 非課売倒, 非資売倒, 課税売回, 課対輸本, 非対輸本, 共対輸本, 課対輸税, 非対輸税, 共対輸税, 地消貨割, 課対仕入, 非対仕入, 共対仕入, 非課仕入, 対外仕入, 課対仕返, 非対仕返, 共対仕返, 非課仕返, 課売上一, 課売上二, 課売上三, 課売上四, 課売上五, 課売上六, 課対輸返, 非対輸返, 共対輸返, 課売返一, 課売返二, 課売返三, 課売返四, 課売返五, 課売返六) |
| tax_rate | query | いいえ | string | 税率で絞込 (選択肢: tax_rate_5, tax_rate_8, tax_rate_10, tax_rate_r8, tax_rate_5_exempt_80, tax_rate_5_exempt_50, tax_rate_8_exempt_80, tax_rate_8_exempt_50, tax_rate_10_exempt_80, tax_rate_10_exempt_50, tax_rate_r8_exempt_80, tax_rate_r8_exempt_50) |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ：only, 決算整理仕訳以外：without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| cost_allocation | query | いいえ | string | 配賦仕訳で絞込（配賦仕訳のみ：only,配賦仕訳以外：without）。指定されない場合、配賦仕訳を含む金額が返却されます。 (選択肢: only, without) |
| partner_name | query | いいえ | string | 取引先で絞込（未選択を指定すると、取引先が未選択で絞り込めます） |
| item_name | query | いいえ | string | 品目で絞込（未選択を指定すると、品目が未選択で絞り込めます） |
| section_name | query | いいえ | string | 部門で絞込（未選択を指定すると、部門が未選択で絞り込めます） |
| tag_name | query | いいえ | string | メモタグで絞込<br>
取引数が多すぎる場合はタイムアウトする場合があります。<br>
その場合はWeb画面よりPDF/CSV出力をご利用ください。
 |
| segment_tag_1_name | query | いいえ | string | セグメント１タグ名で絞込（未選択を指定すると、セグメント１タグが未選択で絞り込めます） |
| segment_tag_2_name | query | いいえ | string | セグメント２タグ名で絞込（未選択を指定すると、セグメント２タグが未選択で絞り込めます） |
| segment_tag_3_name | query | いいえ | string | セグメント３タグ名で絞込（未選択を指定すると、セグメント３タグが未選択で絞り込めます） |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト)、全てのステータス: all)<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: all, without_in_progress) |

### レスポンス (200)

- **general_ledgers** **(必須)**: array[object]
  配列の要素:
    - **account_item_id** (任意): integer(int64) - 勘定科目ID 例: `1`
    - **account_item_name** (任意): string - 勘定科目名 例: `売掛金`
    - **total_amount** (任意): integer(int64) - 発生額累計 例: `100`
    - **final_balance** (任意): integer(int64) - 残高 例: `100`
    - **debit_amount** (任意): integer(int64) - 借方発生額累計 例: `100`
    - **credit_amount** (任意): integer(int64) - 貸方発生額累計 例: `100`



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
