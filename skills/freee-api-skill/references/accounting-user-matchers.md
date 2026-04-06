# User matchers

## 概要

自動登録ルール

## エンドポイント一覧

### GET /api/1/user_matchers

操作: 自動登録ルール一覧の取得

説明: 概要 指定した事業所の自動登録ルール一覧を取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 30, 最大: 100) |
| offset | query | いいえ | integer(int64) | 取得レコードのオフセット (デフォルト: 0)。offsetはlimitの倍数である必要があります。 |
| walletable | query | いいえ | string | 口座名で絞込 |
| description | query | いいえ | string | 説明文で絞込 |
| active | query | いいえ | string | 有効/無効/全てで絞込 (有効: active, 無効: inactive, 全て: all) (選択肢: active, inactive, all) |
| act | query | いいえ | integer(int64) | 登録タイプで絞込
* 0: 取引を推測する(manual_standard)
* 1: 取引を登録する(auto_standard)
* 2: 振替を推測する(manual_transfer)
* 3: 振替を登録する(auto_transfer)
* 4: 無視する取引を登録する(auto_ignore)
* 5: 取引テンプレートを推測する(manual_template)
* 6: 未決済取引の消込を推測する(manual_scrub)
* 7: 未決済取引の消込を登録する(auto_scrub)
* 8: 一括振込ファイル消込を推測する(manual_output_zengin_scrub)
* 9: 一括振込ファイル消込を登録する(auto_output_zengin_scrub)
* 10: 無視する取引を推測する(manual_ignore)
* 11: プライベート取引を推測する(manual_private)
* 12: プライベート取引を登録する(auto_private)
 (選択肢: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12) |
| created_by | query | いいえ | integer(int64) | 作成経由で絞込
* 0: ユーザーが作成(user)
* 1: freeeが作成(freee)
 (選択肢: 0, 1) |
| min_amount | query | いいえ | integer(int64) | 最小金額で絞込 |
| max_amount | query | いいえ | integer(int64) | 最大金額で絞込 |
| min_priority | query | いいえ | integer(int64) | 最小優先度で絞込 |
| max_priority | query | いいえ | integer(int64) | 最大優先度で絞込 |
| min_corrected_wallet_txn_count | query | いいえ | integer(int64) | 最小正答件数で絞込 |
| max_corrected_wallet_txn_count | query | いいえ | integer(int64) | 最大正答件数で絞込 |
| min_corrected_wallet_txn_count_percentage | query | いいえ | integer(int64) | 最小正答率で絞込 |
| max_corrected_wallet_txn_count_percentage | query | いいえ | integer(int64) | 最大正答率で絞込 |
| card_label_id | query | いいえ | integer(int64) | カードラベルIDで絞込 |
| entry_side_str | query | いいえ | string | 入金/出金で絞込 (入金: income, 出金: expense) (選択肢: income, expense) |

### レスポンス (200)

- data (必須): array[object]
  配列の要素:
    - id (必須): integer - 自動登録ルールID
    - entry_side_str (必須): string - 入金/出金
* income: 入金
* expense: 出金
 (選択肢: income, expense)
    - description (必須): string - 説明文
    - condition (必須): integer - マッチ条件
* 0: 部分一致
* 1: 前方一致
* 2: 後方一致
* 3: 完全一致
* 4: 指定なし(wildcard)
 (選択肢: 0, 1, 2, 3, 4)
    - priority (必須): integer - 優先度
    - act (必須): integer - 登録タイプ
* 0: 取引を推測する(manual_standard)
* 1: 取引を登録する(auto_standard)
* 2: 振替を推測する(manual_transfer)
* 3: 振替を登録する(auto_transfer)
* 4: 無視する取引を登録する(auto_ignore)
* 5: 取引テンプレートを推測する(manual_template)
* 6: 未決済取引の消込を推測する(manual_scrub)
* 7: 未決済取引の消込を登録する(auto_scrub)
* 8: 一括振込ファイル消込を推測する(manual_output_zengin_scrub)
* 9: 一括振込ファイル消込を登録する(auto_output_zengin_scrub)
* 10: 無視する取引を推測する(manual_ignore)
* 11: プライベート取引を推測する(manual_private)
* 12: プライベート取引を登録する(auto_private)

actの種類により、返されるフィールド（tax_name、account_item_name、deal_description等）が異なります。
 (選択肢: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)
    - tax_name (任意): string - 税区分名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

    - min_amount (任意): integer - 最小金額
    - max_amount (任意): integer - 最大金額
    - deal_description (任意): string - 取引の備考
act=0,1,2,3の場合のみ値が返ります。act=4,10,11,12では常にnullです。

    - walletable (任意): string - 口座名
    - transfer_walletable (任意): string - 振替先口座名
act=2,3(振替を推測/登録)の場合のみ値が返ります。

    - account_item_name (任意): string - 勘定科目名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

    - partner_name (任意): string - 取引先名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

    - item_name (任意): string - 品目名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

    - section_name (任意): string - 部門名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

    - division_tag_1_name (任意): string - セグメント1タグ名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

    - division_tag_2_name (任意): string - セグメント2タグ名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

    - division_tag_3_name (任意): string - セグメント3タグ名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

    - default_tag_names (任意): array[string] - メモタグ名の配列
act=0,1(取引を推測/登録)の場合のみ値が返ります。

    - last_updated_user_id (任意): integer - 最終更新ユーザーID
* 0: freeeシステムによる更新

    - user_name (任意): string - 最終更新ユーザー名
    - updated_at (任意): string - 更新日時 (YYYY-MM-DD形式)
    - corrected_wallet_txn_count (任意): integer - 適用明細数(正答件数)
    - corrected_wallet_txn_count_percentage (任意): integer - 適用率(正答率、パーセント)
    - qualified_invoice_setting (任意): string - 適格請求書等
* non_qualified: 該当しない
* qualified: 該当する
* depends_on_partner: 取引先情報に準拠
 (選択肢: non_qualified, qualified, depends_on_partner)
    - suggest_tax_from_walletable_invoice (任意): boolean - 購入データ原本に準拠
* true: 準拠する
* false: 準拠しない

    - card_label (任意): string - カードラベル
    - card_label_id (任意): integer - カードラベルID
    - active (必須): boolean - 有効/無効
* true: 有効
* false: 無効


### POST /api/1/user_matchers

操作: 自動登録ルールの作成

説明: 概要 指定した事業所の自動登録ルールを作成する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |

### リクエストボディ

(必須)

- act (必須): integer - 登録タイプ
* 0: 取引を推測する(manual_standard)
* 1: 取引を登録する(auto_standard)
* 2: 振替を推測する(manual_transfer)
* 3: 振替を登録する(auto_transfer)
* 4: 無視する取引を登録する(auto_ignore)
* 10: 無視する取引を推測する(manual_ignore)
* 11: プライベート取引を推測する(manual_private)
* 12: プライベート取引を登録する(auto_private)

このAPIでは以下のactは非対応です:
5(manual_template), 6(manual_scrub), 7(auto_scrub), 8(manual_output_zengin_scrub), 9(auto_output_zengin_scrub)
 (選択肢: 0, 1, 2, 3, 4, 10, 11, 12)
- active (必須): boolean - 有効/無効
* true: 有効
* false: 無効

- condition (必須): integer - マッチ条件
* 0: 部分一致(partial)
* 1: 前方一致(forward)
* 2: 後方一致(backward)
* 3: 完全一致(exact)
* 4: 指定なし(wildcard)
 (選択肢: 0, 1, 2, 3, 4)
- description (必須): string - 説明文
- entry_side_str (必須): string - 入金/出金
* income: 入金
* expense: 出金
 (選択肢: income, expense)
- priority (必須): integer - 優先度
- tax_name (任意): string - 税区分名
act=0,1(取引を推測/登録)の場合は必須。他のactでは指定しても無視されます。

- walletable (任意): string - 口座名
- card_label (任意): string - カードラベル
- card_label_id (任意): integer - カードラベルID
- transfer_walletable (任意): string - 振替先口座名
act=2,3(振替を推測/登録)の場合に使用。他のactでは指定しても無視されます。

- min_amount (任意): integer - 最小金額
- max_amount (任意): integer - 最大金額
- deal_description (任意): string - 取引の備考
act=4,10,11,12(無視/プライベート)では指定しても無視されます。

- qualified_invoice_setting (任意): string - 適格請求書等
* non_qualified: 該当しない
* qualified: 該当する
* depends_on_partner: 取引先情報に準拠
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
depends_on_partnerを指定する場合は、partner_nameの指定が必要です。
 (選択肢: non_qualified, qualified, depends_on_partner)
- suggest_tax_from_walletable_invoice (任意): boolean - 購入データ原本に準拠
* true: 準拠する
* false: 準拠しない
act=0,1(取引を推測/登録)かつ購入データ原本に対応した口座を指定した場合のみ使用可能。それ以外では指定しても無視されます。

- account_item_name (任意): string - 勘定科目名
act=0,1(取引を推測/登録)の場合は必須。他のactでは指定しても無視されます。

- partner_name (任意): string - 取引先名
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
指定した名前が登録されていない場合、新規にタグとして作成されます。

- item_name (任意): string - 品目名
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
指定した名前が登録されていない場合、新規にタグとして作成されます。

- section_name (任意): string - 部門名
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
指定した名前が登録されていない場合、新規にタグとして作成されます。

- division_tag_1_name (任意): string - セグメント1タグ名
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
指定した名前が登録されていない場合、新規にタグとして作成されます。

- division_tag_2_name (任意): string - セグメント2タグ名
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
指定した名前が登録されていない場合、新規にタグとして作成されます。

- division_tag_3_name (任意): string - セグメント3タグ名
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
指定した名前が登録されていない場合、新規にタグとして作成されます。

- default_tag_names (任意): array[string] - メモタグ名の配列
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
指定した名前が登録されていない場合、新規にタグとして作成されます。


### レスポンス (201)

- id (必須): integer - 自動登録ルールID
- entry_side_str (必須): string - 入金/出金
* income: 入金
* expense: 出金
 (選択肢: income, expense)
- description (必須): string - 説明文
- condition (必須): integer - マッチ条件
* 0: 部分一致(partial)
* 1: 前方一致(forward)
* 2: 後方一致(backward)
* 3: 完全一致(exact)
* 4: 指定なし(wildcard)
 (選択肢: 0, 1, 2, 3, 4)
- priority (必須): integer - 優先度
- act (必須): integer - 登録タイプ
* 0: 取引を推測する(manual_standard)
* 1: 取引を登録する(auto_standard)
* 2: 振替を推測する(manual_transfer)
* 3: 振替を登録する(auto_transfer)
* 4: 無視する取引を登録する(auto_ignore)
* 10: 無視する取引を推測する(manual_ignore)
* 11: プライベート取引を推測する(manual_private)
* 12: プライベート取引を登録する(auto_private)

このAPIでは以下のactは非対応です(show時は400エラー、create/update時は指定不可):
5(manual_template), 6(manual_scrub), 7(auto_scrub), 8(manual_output_zengin_scrub), 9(auto_output_zengin_scrub)

actの種類により、返されるフィールド（tax_name、account_item_name、deal_description等）が異なります。
 (選択肢: 0, 1, 2, 3, 4, 10, 11, 12)
- tax_name (任意): string - 税区分名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- tax_code (任意): integer - 税区分コード
- suggested_tax_name (任意): string - 勘定科目の設定に基づいてシステムが推測した税区分名。画面には表示されません。
- min_amount (任意): integer - 最小金額
- max_amount (任意): integer - 最大金額
- deal_description (任意): string - 取引の備考
act=0,1,2,3の場合のみ値が返ります。act=4,10,11,12では常にnullです。

- walletable (任意): string - 口座名
- transfer_walletable (任意): string - 振替先口座名
act=2,3(振替を推測/登録)の場合のみ値が返ります。

- origin_deal_id (任意): integer - 元取引ID
- origin_deal_code (任意): integer - 元取引コード
- last_updated_user_id (必須): integer - 最終更新ユーザーID
* 0: freeeシステムによる更新

- user_name (必須): string - 最終更新ユーザー名
- updated_at (任意): string - 更新日時 (YYYY-MM-DD形式)
- corrected_wallet_txn_count (任意): integer - 適用明細数(正答件数)
- corrected_wallet_txn_count_percentage (任意): integer - 適用率(正答率、パーセント)
- qualified_invoice_setting (必須): string - 適格請求書等
* non_qualified: 該当しない
* qualified: 該当する
* depends_on_partner: 取引先情報に準拠
 (選択肢: non_qualified, qualified, depends_on_partner)
- suggest_tax_from_walletable_invoice (必須): boolean - 購入データ原本に準拠
* true: 準拠する
* false: 準拠しない

- walletable_bank_name (任意): string - 口座の銀行名
- card_label (任意): string - カードラベル
- card_label_id (任意): integer - カードラベルID
- account_item_name (任意): string - 勘定科目名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- partner_name (任意): string - 取引先名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- item_name (任意): string - 品目名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- section_name (任意): string - 部門名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- division_tag_1_name (任意): string - セグメント1タグ名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- division_tag_2_name (任意): string - セグメント2タグ名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- division_tag_3_name (任意): string - セグメント3タグ名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- default_tag_names (任意): array[string] - メモタグ名の配列
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- active (必須): boolean - 有効/無効
* true: 有効
* false: 無効


### GET /api/1/user_matchers/{id}

操作: 自動登録ルールの取得

説明: 概要 指定した事業所の自動登録ルールを取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 自動登録ルールID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (200)

- id (必須): integer - 自動登録ルールID
- entry_side_str (必須): string - 入金/出金
* income: 入金
* expense: 出金
 (選択肢: income, expense)
- description (必須): string - 説明文
- condition (必須): integer - マッチ条件
* 0: 部分一致(partial)
* 1: 前方一致(forward)
* 2: 後方一致(backward)
* 3: 完全一致(exact)
* 4: 指定なし(wildcard)
 (選択肢: 0, 1, 2, 3, 4)
- priority (必須): integer - 優先度
- act (必須): integer - 登録タイプ
* 0: 取引を推測する(manual_standard)
* 1: 取引を登録する(auto_standard)
* 2: 振替を推測する(manual_transfer)
* 3: 振替を登録する(auto_transfer)
* 4: 無視する取引を登録する(auto_ignore)
* 10: 無視する取引を推測する(manual_ignore)
* 11: プライベート取引を推測する(manual_private)
* 12: プライベート取引を登録する(auto_private)

このAPIでは以下のactは非対応です(show時は400エラー、create/update時は指定不可):
5(manual_template), 6(manual_scrub), 7(auto_scrub), 8(manual_output_zengin_scrub), 9(auto_output_zengin_scrub)

actの種類により、返されるフィールド（tax_name、account_item_name、deal_description等）が異なります。
 (選択肢: 0, 1, 2, 3, 4, 10, 11, 12)
- tax_name (任意): string - 税区分名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- tax_code (任意): integer - 税区分コード
- suggested_tax_name (任意): string - 勘定科目の設定に基づいてシステムが推測した税区分名。画面には表示されません。
- min_amount (任意): integer - 最小金額
- max_amount (任意): integer - 最大金額
- deal_description (任意): string - 取引の備考
act=0,1,2,3の場合のみ値が返ります。act=4,10,11,12では常にnullです。

- walletable (任意): string - 口座名
- transfer_walletable (任意): string - 振替先口座名
act=2,3(振替を推測/登録)の場合のみ値が返ります。

- origin_deal_id (任意): integer - 元取引ID
- origin_deal_code (任意): integer - 元取引コード
- last_updated_user_id (必須): integer - 最終更新ユーザーID
* 0: freeeシステムによる更新

- user_name (必須): string - 最終更新ユーザー名
- updated_at (任意): string - 更新日時 (YYYY-MM-DD形式)
- corrected_wallet_txn_count (任意): integer - 適用明細数(正答件数)
- corrected_wallet_txn_count_percentage (任意): integer - 適用率(正答率、パーセント)
- qualified_invoice_setting (必須): string - 適格請求書等
* non_qualified: 該当しない
* qualified: 該当する
* depends_on_partner: 取引先情報に準拠
 (選択肢: non_qualified, qualified, depends_on_partner)
- suggest_tax_from_walletable_invoice (必須): boolean - 購入データ原本に準拠
* true: 準拠する
* false: 準拠しない

- walletable_bank_name (任意): string - 口座の銀行名
- card_label (任意): string - カードラベル
- card_label_id (任意): integer - カードラベルID
- account_item_name (任意): string - 勘定科目名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- partner_name (任意): string - 取引先名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- item_name (任意): string - 品目名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- section_name (任意): string - 部門名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- division_tag_1_name (任意): string - セグメント1タグ名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- division_tag_2_name (任意): string - セグメント2タグ名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- division_tag_3_name (任意): string - セグメント3タグ名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- default_tag_names (任意): array[string] - メモタグ名の配列
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- active (必須): boolean - 有効/無効
* true: 有効
* false: 無効


### PUT /api/1/user_matchers/{id}

操作: 自動登録ルールの更新

説明: 概要 指定した事業所の自動登録ルールを更新する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 自動登録ルールID |
| company_id | query | はい | integer(int64) | 事業所ID |

### リクエストボディ

(必須)

- act (必須): integer - 登録タイプ
* 0: 取引を推測する(manual_standard)
* 1: 取引を登録する(auto_standard)
* 2: 振替を推測する(manual_transfer)
* 3: 振替を登録する(auto_transfer)
* 4: 無視する取引を登録する(auto_ignore)
* 10: 無視する取引を推測する(manual_ignore)
* 11: プライベート取引を推測する(manual_private)
* 12: プライベート取引を登録する(auto_private)

このAPIでは以下のactは非対応です:
5(manual_template), 6(manual_scrub), 7(auto_scrub), 8(manual_output_zengin_scrub), 9(auto_output_zengin_scrub)
 (選択肢: 0, 1, 2, 3, 4, 10, 11, 12)
- active (必須): boolean - 有効/無効
* true: 有効
* false: 無効

- condition (必須): integer - マッチ条件
* 0: 部分一致(partial)
* 1: 前方一致(forward)
* 2: 後方一致(backward)
* 3: 完全一致(exact)
* 4: 指定なし(wildcard)
 (選択肢: 0, 1, 2, 3, 4)
- description (必須): string - 説明文
- entry_side_str (必須): string - 入金/出金
* income: 入金
* expense: 出金
 (選択肢: income, expense)
- priority (必須): integer - 優先度
- tax_name (任意): string - 税区分名
act=0,1(取引を推測/登録)の場合は必須。他のactでは指定しても無視されます。

- walletable (任意): string - 口座名
- card_label (任意): string - カードラベル
- card_label_id (任意): integer - カードラベルID
- transfer_walletable (任意): string - 振替先口座名
act=2,3(振替を推測/登録)の場合に使用。他のactでは指定しても無視されます。

- min_amount (任意): integer - 最小金額
- max_amount (任意): integer - 最大金額
- deal_description (任意): string - 取引の備考
act=4,10,11,12(無視/プライベート)では指定しても無視されます。

- qualified_invoice_setting (任意): string - 適格請求書等
* non_qualified: 該当しない
* qualified: 該当する
* depends_on_partner: 取引先情報に準拠
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
depends_on_partnerを指定する場合は、partner_nameの指定が必要です。
 (選択肢: non_qualified, qualified, depends_on_partner)
- suggest_tax_from_walletable_invoice (任意): boolean - 購入データ原本に準拠
* true: 準拠する
* false: 準拠しない
act=0,1(取引を推測/登録)かつ購入データ原本に対応した口座を指定した場合のみ使用可能。それ以外では指定しても無視されます。

- account_item_name (任意): string - 勘定科目名
act=0,1(取引を推測/登録)の場合は必須。他のactでは指定しても無視されます。

- partner_name (任意): string - 取引先名
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
指定した名前が登録されていない場合、新規にタグとして作成されます。

- item_name (任意): string - 品目名
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
指定した名前が登録されていない場合、新規にタグとして作成されます。

- section_name (任意): string - 部門名
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
指定した名前が登録されていない場合、新規にタグとして作成されます。

- division_tag_1_name (任意): string - セグメント1タグ名
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
指定した名前が登録されていない場合、新規にタグとして作成されます。

- division_tag_2_name (任意): string - セグメント2タグ名
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
指定した名前が登録されていない場合、新規にタグとして作成されます。

- division_tag_3_name (任意): string - セグメント3タグ名
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
指定した名前が登録されていない場合、新規にタグとして作成されます。

- default_tag_names (任意): array[string] - メモタグ名の配列
act=0,1(取引を推測/登録)の場合のみ使用可能。他のactでは指定しても無視されます。
指定した名前が登録されていない場合、新規にタグとして作成されます。


### レスポンス (200)

- id (必須): integer - 自動登録ルールID
- entry_side_str (必須): string - 入金/出金
* income: 入金
* expense: 出金
 (選択肢: income, expense)
- description (必須): string - 説明文
- condition (必須): integer - マッチ条件
* 0: 部分一致(partial)
* 1: 前方一致(forward)
* 2: 後方一致(backward)
* 3: 完全一致(exact)
* 4: 指定なし(wildcard)
 (選択肢: 0, 1, 2, 3, 4)
- priority (必須): integer - 優先度
- act (必須): integer - 登録タイプ
* 0: 取引を推測する(manual_standard)
* 1: 取引を登録する(auto_standard)
* 2: 振替を推測する(manual_transfer)
* 3: 振替を登録する(auto_transfer)
* 4: 無視する取引を登録する(auto_ignore)
* 10: 無視する取引を推測する(manual_ignore)
* 11: プライベート取引を推測する(manual_private)
* 12: プライベート取引を登録する(auto_private)

このAPIでは以下のactは非対応です(show時は400エラー、create/update時は指定不可):
5(manual_template), 6(manual_scrub), 7(auto_scrub), 8(manual_output_zengin_scrub), 9(auto_output_zengin_scrub)

actの種類により、返されるフィールド（tax_name、account_item_name、deal_description等）が異なります。
 (選択肢: 0, 1, 2, 3, 4, 10, 11, 12)
- tax_name (任意): string - 税区分名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- tax_code (任意): integer - 税区分コード
- suggested_tax_name (任意): string - 勘定科目の設定に基づいてシステムが推測した税区分名。画面には表示されません。
- min_amount (任意): integer - 最小金額
- max_amount (任意): integer - 最大金額
- deal_description (任意): string - 取引の備考
act=0,1,2,3の場合のみ値が返ります。act=4,10,11,12では常にnullです。

- walletable (任意): string - 口座名
- transfer_walletable (任意): string - 振替先口座名
act=2,3(振替を推測/登録)の場合のみ値が返ります。

- origin_deal_id (任意): integer - 元取引ID
- origin_deal_code (任意): integer - 元取引コード
- last_updated_user_id (必須): integer - 最終更新ユーザーID
* 0: freeeシステムによる更新

- user_name (必須): string - 最終更新ユーザー名
- updated_at (任意): string - 更新日時 (YYYY-MM-DD形式)
- corrected_wallet_txn_count (任意): integer - 適用明細数(正答件数)
- corrected_wallet_txn_count_percentage (任意): integer - 適用率(正答率、パーセント)
- qualified_invoice_setting (必須): string - 適格請求書等
* non_qualified: 該当しない
* qualified: 該当する
* depends_on_partner: 取引先情報に準拠
 (選択肢: non_qualified, qualified, depends_on_partner)
- suggest_tax_from_walletable_invoice (必須): boolean - 購入データ原本に準拠
* true: 準拠する
* false: 準拠しない

- walletable_bank_name (任意): string - 口座の銀行名
- card_label (任意): string - カードラベル
- card_label_id (任意): integer - カードラベルID
- account_item_name (任意): string - 勘定科目名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- partner_name (任意): string - 取引先名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- item_name (任意): string - 品目名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- section_name (任意): string - 部門名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- division_tag_1_name (任意): string - セグメント1タグ名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- division_tag_2_name (任意): string - セグメント2タグ名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- division_tag_3_name (任意): string - セグメント3タグ名
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- default_tag_names (任意): array[string] - メモタグ名の配列
act=0,1(取引を推測/登録)の場合のみ値が返ります。

- active (必須): boolean - 有効/無効
* true: 有効
* false: 無効


### DELETE /api/1/user_matchers/{id}

操作: 自動登録ルールの削除

説明: 概要 指定した事業所の自動登録ルールを削除する このAPIでは以下のact(登録タイプ)の自動登録ルールは削除できません: 5(manual_template), 6(manual_scrub), 7(auto_scrub), 8(manual_output_zengin_scrub), 9(auto_output_zengin_scrub)

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 自動登録ルールID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (204)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
