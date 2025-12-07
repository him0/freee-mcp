# Fixed assets

## 概要

固定資産台帳

## エンドポイント一覧

### GET /api/1/fixed_assets

**操作**: 固定資産一覧の取得

**説明**: 概要 指定した事業所の固定資産一覧を取得する 定義 このAPIは法人エンタープライズに加入している事業所のみが利用できます。 target_date : 表示したい会計期間の開始年月日。開始年月日以外を指定した場合は、その日付が含まれる会計期間が対象となります。 depreciation_amount : 本年分の償却費合計 depreciation_method : 償却方法 depreciation_account_item_id : 減価償却に使う勘定科目 acquisition_cost : 取得価額 opening_balance : 期首残高 undepreciated_balance : 未償却残高。土地などの償却しない固定資産はnullが返ります。 opening_accumulated_depreciation : 期首減価償却累計額 closing_accumulated_depreciation : 期末減価償却累計額 注意点 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があり...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| target_date | query | はい | string | 表示したい会計期間の開始年月日。開始年月日以外を指定した場合は、その日付が含まれる会計期間が対象となります。 |
| offset | query | いいえ | integer(int64) | 取得レコードのオフセット (デフォルト: 0) |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 50, 最小: 1, 最大: 200) |

### レスポンス (200)

- **fixed_assets** **(必須)**: array[object]
  配列の要素:
    - **company_id** (任意): integer(int64) - 事業所ID 例: `1` (最小: 1)
    - **id** (任意): integer(int64) - 固定資産ID 例: `1` (最小: 1)
    - **name** (任意): string - 固定資産名 例: `pc`
    - **management_number** (任意): string - 管理番号 例: `pc-0001`
    - **account_item_id** (任意): integer(int64) - 勘定科目ID 例: `22` (最小: 1)
    - **section_id** (任意): integer(int64) - 部門ID 例: `0` (最小: 1)
    - **item_id** (任意): integer(int64) - 品目ID 例: `0` (最小: 1)
    - **depreciation_method** (任意): string - 償却方法:(少額償却: small_sum_method, 一括償却: lump_sum_method, 定額法: straight_line_method, 定率法: multiple_method, 旧定率法: old_multiple_method, 旧定額法: old_straight_line_method, 償却なし: non_depreciate_method, 任意償却: voluntary_method, 即時償却: immediate_method, 均等償却: equal_method) (選択肢: small_sum_method, lump_sum_method, straight_line_method, multiple_method, old_multiple_method, old_straight_line_method, non_depreciate_method, voluntary_method, immediate_method, equal_method) 例: `straight_line_method`
    - **depreciation_account_item_id** (任意): integer(int64) - 減価償却に使う勘定科目ID 例: `99` (最小: 1)
    - **prefecture_code** (任意): integer(int64) - 都道府県コード（-1: 設定しない、0:北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄 例: `4` (最小: -1, 最大: 46)
    - **city_name** (任意): string - 申告先市区町村 例: `港区`
    - **depreciation_amount** (任意): integer(int64) - 本年分の償却費合計 例: `18533`
    - **acquisition_cost** (任意): integer(int64) - 取得価額 例: `150000`
    - **opening_balance** (任意): integer(int64) - 期首残高（取得日が会計期間に含まれるとき期首残高は0になります。） 例: `92000`
    - **undepreciated_balance** (任意): integer(int64) - 未償却残高 例: `46000`
    - **opening_accumulated_depreciation** (任意): integer(int64) - 期首減価償却累計額 例: `100000`
    - **closing_accumulated_depreciation** (任意): integer(int64) - 期末減価償却累計額 例: `46000`
    - **life_years** (任意): integer(int64) - 耐用年数 例: `5`
    - **acquisition_date** (任意): string(date) - 取得日 例: `2021-07-13`
    - **created_at** (任意): string - 作成日時（ISO8601形式） 例: `2021-07-15T18:30:24+09:00`
    - **depreciation_status** (任意): string - 売却もしくは除却ステータス: (売却済: sold, 除却済: retired, 償却済: depreciated, 償却中: depreciation, 償却なし: non_depreciation) (選択肢: sold, retired, depreciated, depreciation, non_depreciation) 例: `depreciation`
    - **retire_date** (任意): string(date) - 除却日、もしくは売却日 例: `2022-03-24`
- **fiscal_year** **(必須)**: object
  - **start_date** **(必須)**: string - 会計年度開始日 (yyyy-mm-dd) 例: `2022-01-01`
  - **end_date** **(必須)**: string - 会計年度終了日 (yyyy-mm-dd) 例: `2022-12-31`
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** **(必須)**: array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。`



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
