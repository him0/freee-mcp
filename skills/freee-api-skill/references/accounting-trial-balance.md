# Trial balance

## 概要

試算表

## エンドポイント一覧

### GET /api/1/reports/trial_bs

**操作**: 貸借対照表の取得

**説明**: 概要 指定した事業所の貸借対照表を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 opening_balance : 期首残高 debit_amount : 借方金額 credit_amount: 貸方金額 closing_balance : 期末残高 composition_ratio : 構成比 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date を指定した場合、以下を同時に指定することはできません。 fiscal_year start_month end_month 0を指定すると未選択で絞り込めます p...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、部門、セグメント の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない
 (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| section_id | query | いいえ | integer(int64) | 部門IDで絞込（0を指定すると、部門が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト)、全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_bs** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag）(条件に指定した時のみ含まれる） (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **section_id** (任意): integer(int64) - 部門ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_bs_two_years

**操作**: 貸借対照表(前年比較)の取得

**説明**: 概要 指定した事業所の貸借対照表(前年比較)を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 last_year_closing_balance: 前年度期末残高 closing_balance : 期末残高 year_on_year : 前年比 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date を指定した場合、以下を同時に指定することはできません。 fiscal_year start_month end_month 0を指定すると未選択で絞り込めます partner_idに0を指定して絞り込んだ場合 取引先...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、部門、セグメント の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| section_id | query | いいえ | integer(int64) | 部門IDで絞込（0を指定すると、部門が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト)、全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_bs_two_years** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag）(条件に指定した時のみ含まれる） (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **section_id** (任意): integer(int64) - 部門ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_bs_three_years

**操作**: 貸借対照表(３期間比較)の取得

**説明**: 概要 指定した事業所の貸借対照表(３期間比較)を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 two_years_before_closing_balance: 前々年度期末残高 last_year_closing_balance: 前年度期末残高 closing_balance : 期末残高 year_on_year : 前年比 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date を指定した場合、以下を同時に指定することはできません。 fiscal_year start_month end_month 0を...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、部門、セグメント の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| section_id | query | いいえ | integer(int64) | 部門IDで絞込（0を指定すると、部門が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト)、全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_bs_three_years** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag）(条件に指定した時のみ含まれる） (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **section_id** (任意): integer(int64) - 部門ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_pl

**操作**: 損益計算書の取得

**説明**: 概要 指定した事業所の損益計算書を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 opening_balance : 期首残高 debit_amount : 借方金額 credit_amount: 貸方金額 closing_balance : 期末残高 composition_ratio : 構成比 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 配賦仕訳の絞り込み（cost_allocation）は法人スタンダードプラン（および旧法人ベーシックプラン）以上で利用可能です。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date を指定した場合、以下を同時に指定...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、部門、セグメント の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| section_id | query | いいえ | integer(int64) | 部門IDで絞込（0を指定すると、部門が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| cost_allocation | query | いいえ | string | 配賦仕訳で絞込（配賦仕訳のみ：only,配賦仕訳以外：without）。指定されない場合、配賦仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト)、全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_pl** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag）(条件に指定した時のみ含まれる） (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **section_id** (任意): integer(int64) - 部門ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **cost_allocation** (任意): string - 配賦仕訳のみ：only,配賦仕訳以外：without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_pl_two_years

**操作**: 損益計算書(前年比較)の取得

**説明**: 概要 指定した事業所の損益計算書(前年比較)を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 last_year_closing_balance: 前年度期末残高 closing_balance : 期末残高 year_on_year : 前年比 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 配賦仕訳の絞り込み（cost_allocation）は法人スタンダードプラン（および旧法人ベーシックプラン）以上で利用可能です。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date を指定した場合、以下を同時に指定することはできません。 fiscal_year sta...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、部門、セグメント の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| section_id | query | いいえ | integer(int64) | 部門IDで絞込（0を指定すると、部門が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| cost_allocation | query | いいえ | string | 配賦仕訳で絞込（配賦仕訳のみ：only,配賦仕訳以外：without）。指定されない場合、配賦仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト)、全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_pl_two_years** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag）(条件に指定した時のみ含まれる） (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **section_id** (任意): integer(int64) - 部門ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **cost_allocation** (任意): string - 配賦仕訳のみ：only,配賦仕訳以外：without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_pl_three_years

**操作**: 損益計算書(３期間比較)の取得

**説明**: 概要 指定した事業所の損益計算書(３期間比較)を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 two_years_before_closing_balance: 前々年度期末残高 last_year_closing_balance: 前年度期末残高 closing_balance : 期末残高 year_on_year : 前年比 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 配賦仕訳の絞り込み（cost_allocation）は法人スタンダードプラン（および旧法人ベーシックプラン）以上で利用可能です。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、部門、セグメント の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| section_id | query | いいえ | integer(int64) | 部門IDで絞込（0を指定すると、部門が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| cost_allocation | query | いいえ | string | 配賦仕訳で絞込（配賦仕訳のみ：only,配賦仕訳以外：without）。指定されない場合、配賦仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト)、全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_pl_three_years** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag）(条件に指定した時のみ含まれる） (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **section_id** (任意): integer(int64) - 部門ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **cost_allocation** (任意): string - 配賦仕訳のみ：only,配賦仕訳以外：without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_pl_sections

**操作**: 損益計算書(部門比較)の取得

**説明**: 概要 指定した事業所の損益計算書(部門比較)を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 closing_balance : 期末残高 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 配賦仕訳の絞り込み（cost_allocation）は法人スタンダードプラン（および旧法人ベーシックプラン）以上で利用可能です。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date を指定した場合、以下を同時に指定することはできません。 fiscal_year start_month end_month 0を指定すると未選択で絞り込めます partner_idに0を指定して...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| section_ids | query | はい | string | 出力する部門の指定（半角数字のidを半角カンマ区切りスペースなしで指定してください。0を指定すると、未選択の部門で比較できます。） |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、セグメント の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, account_item, segment_1_tag, segment_2_tag, segment_3_tag) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| cost_allocation | query | いいえ | string | 配賦仕訳で絞込（配賦仕訳のみ：only,配賦仕訳以外：without）。指定されない場合、配賦仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト)、全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_pl_sections** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **section_ids** **(必須)**: string - 出力する部門の指定 例: `123`
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag）(条件に指定した時のみ含まれる） (選択肢: partner, item, account_item, segment_1_tag, segment_2_tag, segment_3_tag)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **cost_allocation** (任意): string - 配賦仕訳のみ：only,配賦仕訳以外：without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_pl_segment_1_tags

**操作**: 損益計算書(セグメント１比較)の取得

**説明**: 概要 指定した事業所の損益計算書(セグメント１比較)を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 closing_balance : 期末残高 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 配賦仕訳の絞り込み（cost_allocation）は法人スタンダードプラン（および旧法人ベーシックプラン）以上で利用可能です。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date を指定した場合、以下を同時に指定することはできません。 fiscal_year start_month end_month 0を指定すると未選択で絞り込めます partner_idに0を...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| segment_1_tag_ids | query | はい | string | 出力するセグメント１タグIDの指定（半角数字のidを半角カンマ区切りスペースなしで指定してください。0を指定すると、未選択のセグメントで比較できます） |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、部門 の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, section, account_item) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| section_id | query | いいえ | integer(int64) | 部門IDで絞込（0を指定すると、部門が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| cost_allocation | query | いいえ | string | 配賦仕訳で絞込（配賦仕訳のみ：only,配賦仕訳以外：without）。指定されない場合、配賦仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト)、全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_pl_segment_1_tags** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **segment_1_tag_ids** **(必須)**: string - セグメント１タグID 例: `123`
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item）(条件に指定した時のみ含まれる） (選択肢: partner, item, section, account_item)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **section_id** (任意): integer(int64) - 部門ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **cost_allocation** (任意): string - 配賦仕訳のみ：only,配賦仕訳以外：without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_pl_segment_2_tags

**操作**: 損益計算書(セグメント２比較)の取得

**説明**: 概要 指定した事業所の損益計算書(セグメント２比較)を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 closing_balance : 期末残高 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 配賦仕訳の絞り込み（cost_allocation）は法人スタンダードプラン（および旧法人ベーシックプラン）以上で利用可能です。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date を指定した場合、以下を同時に指定することはできません。 fiscal_year start_month end_month 0を指定すると未選択で絞り込めます partner_idに0を...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| segment_2_tag_ids | query | はい | string | 出力するセグメント２タグIDの指定（半角数字のidを半角カンマ区切りスペースなしで指定してください。0を指定すると、未選択のセグメントで比較できます） |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、部門 の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, section, account_item) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| section_id | query | いいえ | integer(int64) | 部門IDで絞込（0を指定すると、部門が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| cost_allocation | query | いいえ | string | 配賦仕訳で絞込（配賦仕訳のみ：only,配賦仕訳以外：without）。指定されない場合、配賦仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト)、全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_pl_segment_2_tags** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **segment_2_tag_ids** **(必須)**: string - セグメント２タグID 例: `123`
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item）(条件に指定した時のみ含まれる） (選択肢: partner, item, section, account_item)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **section_id** (任意): integer(int64) - 部門ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **cost_allocation** (任意): string - 配賦仕訳のみ：only,配賦仕訳以外：without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_pl_segment_3_tags

**操作**: 損益計算書(セグメント３比較)の取得

**説明**: 概要 指定した事業所の損益計算書(セグメント３比較)を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 closing_balance : 期末残高 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 配賦仕訳の絞り込み（cost_allocation）は法人スタンダードプラン（および旧法人ベーシックプラン）以上で利用可能です。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date を指定した場合、以下を同時に指定することはできません。 fiscal_year start_month end_month 0を指定すると未選択で絞り込めます partner_idに0を...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| segment_3_tag_ids | query | はい | string | 出力するセグメント３タグIDの指定（半角数字のidを半角カンマ区切りスペースなしで指定してください。0を指定すると、未選択のセグメントで比較できます） |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、部門 の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, section, account_item) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| section_id | query | いいえ | integer(int64) | 部門IDで絞込（0を指定すると、部門が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| cost_allocation | query | いいえ | string | 配賦仕訳で絞込（配賦仕訳のみ：only,配賦仕訳以外：without）。指定されない場合、配賦仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト)、全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_pl_segment_3_tags** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **segment_3_tag_ids** **(必須)**: string - セグメント３タグID 例: `123`
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item）(条件に指定した時のみ含まれる） (選択肢: partner, item, section, account_item)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **section_id** (任意): integer(int64) - 部門ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **cost_allocation** (任意): string - 配賦仕訳のみ：only,配賦仕訳以外：without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_cr

**操作**: 製造原価報告書の取得

**説明**: 概要 指定した事業所の製造原価報告書を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 opening_balance : 期首残高 debit_amount : 借方金額 credit_amount: 貸方金額 closing_balance : 期末残高 composition_ratio : 構成比 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 配賦仕訳の絞り込み（cost_allocation）は法人スタンダードプラン（および旧法人ベーシックプラン）以上で利用可能です。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date を指定した場合、以下を同時に...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、部門、セグメント の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| section_id | query | いいえ | integer(int64) | 部門IDで絞込（0を指定すると、部門が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| cost_allocation | query | いいえ | string | 配賦仕訳で絞込（配賦仕訳のみ：only,配賦仕訳以外：without）。指定されない場合、配賦仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト), 全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_cr** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag）(条件に指定した時のみ含まれる） (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **section_id** (任意): integer(int64) - 部門ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **cost_allocation** (任意): string - 配賦仕訳のみ：only,配賦仕訳以外：without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_cr_two_years

**操作**: 製造原価報告書(前年比較)の取得

**説明**: 概要 指定した事業所の製造原価報告書(前年比較)を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 last_year_closing_balance: 前年度期末残高 closing_balance : 期末残高 year_on_year : 前年比 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 配賦仕訳の絞り込み（cost_allocation）は法人スタンダードプラン（および旧法人ベーシックプラン）以上で利用可能です。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date を指定した場合、以下を同時に指定することはできません。 fiscal_year s...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、部門、セグメント の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| section_id | query | いいえ | integer(int64) | 部門IDで絞込（0を指定すると、部門が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| cost_allocation | query | いいえ | string | 配賦仕訳で絞込（配賦仕訳のみ：only,配賦仕訳以外：without）。指定されない場合、配賦仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト), 全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_cr_two_years** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag）(条件に指定した時のみ含まれる） (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1`
  - **section_id** (任意): integer(int64) - 部門ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **cost_allocation** (任意): string - 配賦仕訳のみ：only,配賦仕訳以外：without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_cr_three_years

**操作**: 製造原価報告書(３期間比較)の取得

**説明**: 概要 指定した事業所の製造原価報告書(３期間比較)を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 two_years_before_closing_balance: 前々年度期末残高 last_year_closing_balance: 前年度期末残高 closing_balance : 期末残高 year_on_year : 前年比 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 配賦仕訳の絞り込み（cost_allocation）は法人スタンダードプラン（および旧法人ベーシックプラン）以上で利用可能です。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_da...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、部門、セグメント の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| section_id | query | いいえ | integer(int64) | 部門IDで絞込（0を指定すると、部門が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| cost_allocation | query | いいえ | string | 配賦仕訳で絞込（配賦仕訳のみ：only,配賦仕訳以外：without）。指定されない場合、配賦仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト), 全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_cr_three_years** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag）(条件に指定した時のみ含まれる） (選択肢: partner, item, section, account_item, segment_1_tag, segment_2_tag, segment_3_tag)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **section_id** (任意): integer(int64) - 部門ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **cost_allocation** (任意): string - 配賦仕訳のみ：only,配賦仕訳以外：without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_cr_sections

**操作**: 製造原価報告書(部門比較)の取得

**説明**: 概要 指定した事業所の製造原価報告書(部門比較)を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 closing_balance : 期末残高 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 配賦仕訳の絞り込み（cost_allocation）は法人スタンダードプラン（および旧法人ベーシックプラン）以上で利用可能です。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date を指定した場合、以下を同時に指定することはできません。 fiscal_year start_month end_month 0を指定すると未選択で絞り込めます partner_idに0を指定...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| section_ids | query | はい | string | 出力する部門の指定（半角数字のidを半角カンマ区切りスペースなしで指定してください。0を指定すると、未選択の部門で比較できます） |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、セグメント の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, account_item, segment_1_tag, segment_2_tag, segment_3_tag) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| cost_allocation | query | いいえ | string | 配賦仕訳で絞込（配賦仕訳のみ：only,配賦仕訳以外：without）。指定されない場合、配賦仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト)、全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_cr_sections** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **section_ids** **(必須)**: string - 出力する部門の指定 例: `123`
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 勘定科目: account_item, セグメント１タグ: segment_1_tag, セグメント２タグ: segment_2_tag, セグメント３タグ: segment_3_tag）(条件に指定した時のみ含まれる） (選択肢: partner, item, account_item, segment_1_tag, segment_2_tag, segment_3_tag)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **cost_allocation** (任意): string - 配賦仕訳のみ：only,配賦仕訳以外：without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_cr_segment_1_tags

**操作**: 製造原価報告書(セグメント１比較)の取得

**説明**: 概要 指定した事業所の製造原価報告書(セグメント１比較)を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 closing_balance : 期末残高 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date を指定した場合、以下を同時に指定することはできません。 fiscal_year start_month end_month 0を指定すると未選択で絞り込めます partner_idに0を指定して絞り込んだ場合 取引先が設定されていない取引、振替伝票の金額がレスポンスに返却されます レスポンスの例 GET htt...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| segment_1_tag_ids | query | はい | string | 出力するセグメント１タグIDの指定（半角数字のidを半角カンマ区切りスペースなしで指定してください。0を指定すると、未選択のセグメントで比較できます） |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、部門 の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, section, account_item) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| section_id | query | いいえ | integer(int64) | 部門IDで絞込（0を指定すると、部門が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| cost_allocation | query | いいえ | string | 配賦仕訳で絞込（配賦仕訳のみ：only,配賦仕訳以外：without）。指定されない場合、配賦仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト)、全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_cr_segment_1_tags** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **segment_1_tag_ids** **(必須)**: string - セグメント１タグID 例: `123`
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item）(条件に指定した時のみ含まれる） (選択肢: partner, item, section, account_item)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **section_id** (任意): integer(int64) - 部門ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **cost_allocation** (任意): string - 配賦仕訳のみ：only,配賦仕訳以外：without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_cr_segment_2_tags

**操作**: 製造原価報告書(セグメント２比較)の取得

**説明**: 概要 指定した事業所の製造原価報告書(セグメント２比較)を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 closing_balance : 期末残高 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date を指定した場合、以下を同時に指定することはできません。 fiscal_year start_month end_month 0を指定すると未選択で絞り込めます partner_idに0を指定して絞り込んだ場合 取引先が設定されていない取引、振替伝票の金額がレスポンスに返却されます レスポンスの例 GET htt...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| segment_2_tag_ids | query | はい | string | 出力するセグメント２タグIDの指定（半角数字のidを半角カンマ区切りスペースなしで指定してください。0を指定すると、未選択のセグメントで比較できます） |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、部門 の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, section, account_item) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| section_id | query | いいえ | integer(int64) | 部門IDで絞込（0を指定すると、部門が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| cost_allocation | query | いいえ | string | 配賦仕訳で絞込（配賦仕訳のみ：only,配賦仕訳以外：without）。指定されない場合、配賦仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト)、全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_cr_segment_2_tags** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **segment_2_tag_ids** **(必須)**: string - セグメント２タグID 例: `123`
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item）(条件に指定した時のみ含まれる） (選択肢: partner, item, section, account_item)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **section_id** (任意): integer(int64) - 部門ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **cost_allocation** (任意): string - 配賦仕訳のみ：only,配賦仕訳以外：without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`

### GET /api/1/reports/trial_cr_segment_3_tags

**操作**: 製造原価報告書(セグメント３比較)の取得

**説明**: 概要 指定した事業所の製造原価報告書(セグメント３比較)を取得する 定義 created_at : 作成日時 account_item_name : 勘定科目名 hierarchy_level: 階層レベル parent_account_category_name: 上位勘定科目カテゴリー名 closing_balance : 期末残高 注意点 会計年度が指定されない場合、現在の会計年度がデフォルトとなります。 up_to_dateがfalseの場合、残高の集計が完了していません。最新の集計結果を確認したい場合は、時間を空けて再度取得する必要があります。 partner_codeとpartner_idは同時に指定することはできません。 start_date / end_date を指定した場合、以下を同時に指定することはできません。 fiscal_year start_month end_month 0を指定すると未選択で絞り込めます partner_idに0を指定して絞り込んだ場合 取引先が設定されていない取引、振替伝票の金額がレスポンスに返却されます レスポンスの例 GET htt...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| segment_3_tag_ids | query | はい | string | 出力するセグメント３タグIDの指定（半角数字のidを半角カンマ区切りスペースなしで指定してください。0を指定すると、未選択のセグメントで比較できます） |
| fiscal_year | query | いいえ | integer(int64) | 会計年度 |
| start_month | query | いいえ | integer(int64) | 発生月で絞込：開始会計月(1-12)。指定されない場合、現在の会計年度の期首月が指定されます。 |
| end_month | query | いいえ | integer(int64) | 発生月で絞込：終了会計月(1-12)(会計年度が10月始まりでstart_monthが11なら11, 12, 1, ... 9のいずれかを指定する)。指定されない場合、現在の会計年度の期末月が指定されます。 |
| start_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| account_item_display_type | query | いいえ | string | 勘定科目の表示（勘定科目: account_item, 決算書表示:group）。指定されない場合、勘定科目: account_itemが指定されます。 (選択肢: account_item, group) |
| breakdown_display_type | query | いいえ | string | 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item） ※勘定科目はaccount_item_display_typeが「group」の時のみ指定できます。

取引先、品目、部門 の各項目が単独で5,000以上登録されている場合は、breakdown_display_type で該当項目を指定するとエラーになります。

例）取引先の登録数が5,000以上、品目の登録数が4,999以下の場合
* breakdown_display_type: 取引先を指定 → エラーになる
* breakdown_display_type: 品目を指定 → エラーにならない (選択肢: partner, item, section, account_item) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込（0を指定すると、取引先が未選択で絞り込めます） |
| partner_code | query | いいえ | string | 取引先コードで絞込（事業所設定で取引先コードの利用を有効にしている場合のみ利用可能です） |
| item_id | query | いいえ | integer(int64) | 品目IDで絞込（0を指定すると、品目が未選択で絞り込めます） |
| section_id | query | いいえ | integer(int64) | 部門IDで絞込（0を指定すると、部門が未選択で絞り込めます） |
| adjustment | query | いいえ | string | 決算整理仕訳で絞込（決算整理仕訳のみ: only, 決算整理仕訳以外: without）。指定されない場合、決算整理仕訳を含む金額が返却されます。 (選択肢: only, without) |
| cost_allocation | query | いいえ | string | 配賦仕訳で絞込（配賦仕訳のみ：only,配賦仕訳以外：without）。指定されない場合、配賦仕訳を含む金額が返却されます。 (選択肢: only, without) |
| approval_flow_status | query | いいえ | string | 承認ステータスで絞込 (未承認を除く: without_in_progress (デフォルト)、全てのステータス: all)<br>
プレミアムプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）以上で指定可能です。<br>
事業所の設定から仕訳承認フローの利用を有効にした場合に指定可能です。
 (選択肢: without_in_progress, all) |

### レスポンス (200)

- **trial_cr_segment_3_tags** **(必須)**: object
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **segment_3_tag_ids** **(必須)**: string - セグメント３タグID 例: `123`
  - **fiscal_year** (任意): integer(int64) - 会計年度(条件に指定した時、または条件に月、日条件がない時のみ含まれる） 例: `2019`
  - **start_month** (任意): integer(int64) - 発生月で絞込：開始会計月(1-12)(条件に指定した時のみ含まれる） 例: `1` (最小: 1, 最大: 12)
  - **end_month** (任意): integer(int64) - 発生月で絞込：終了会計月(1-12)(条件に指定した時のみ含まれる） 例: `12` (最小: 1, 最大: 12)
  - **start_date** (任意): string - 発生日で絞込：開始日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **end_date** (任意): string - 発生日で絞込：終了日(yyyy-mm-dd)(条件に指定した時のみ含まれる） 例: `2019-12-17`
  - **account_item_display_type** (任意): string - 勘定科目の表示（勘定科目: account_item, 決算書表示:group）(条件に指定した時のみ含まれる） (選択肢: account_item, group)
  - **breakdown_display_type** (任意): string - 内訳の表示（取引先: partner, 品目: item, 部門: section, 勘定科目: account_item）(条件に指定した時のみ含まれる） (選択肢: partner, item, section, account_item)
  - **partner_id** (任意): integer(int64) - 取引先ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **partner_code** (任意): string - 取引先コード(条件に指定した時のみ含まれる） 例: `code001`
  - **item_id** (任意): integer(int64) - 品目ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **section_id** (任意): integer(int64) - 部門ID(条件に指定した時のみ含まれる） 例: `1` (最小: 1)
  - **adjustment** (任意): string - 決算整理仕訳のみ: only, 決算整理仕訳以外: without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **cost_allocation** (任意): string - 配賦仕訳のみ：only,配賦仕訳以外：without(条件に指定した時のみ含まれる） (選択肢: only, without) 例: `only`
  - **approval_flow_status** (任意): string - 未承認を除く: without_in_progress (デフォルト), 全てのステータス: all(条件に指定した時のみ含まれる） (選択肢: without_in_progress, all) 例: `without_in_progress`
  - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
  - **balances** **(必須)**: array[object]
- **up_to_date** **(必須)**: boolean - 集計結果が最新かどうか 例: `true`
- **up_to_date_reasons** (任意): array[object] - 集計が最新でない場合の要因情報
  配列の要素:
    - **code** **(必須)**: string - コード (選択肢: depreciation_creating, depreciation_create_error) 例: `depreciation_creating`
    - **message** **(必須)**: string - 集計が最新でない理由 例: `当期の固定資産の償却作成が完了していないため、正しい集計結果でない可能性があります。しばらく時間をおいてからもう一度お試しください。`



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
