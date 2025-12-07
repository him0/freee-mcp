# 従業員の姓名・住所など

## 概要

従業員の姓名・住所などの操作

## エンドポイント一覧

### GET /api/v1/employees/{employee_id}/profile_rule

**操作**: 従業員の姓名・住所などの取得

**説明**: 概要 指定した従業員・日付の姓名などの情報を返します。 注意点 本APIは、給与計算対象外の従業員には非対応です。employee_idに給与計算対象外の従業員IDを指定した場合、本APIを利用できません。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| year | query | はい | integer | 従業員情報を取得したい年 |
| month | query | はい | integer | 従業員情報を取得したい月<br>
締め日支払い日設定が翌月払いの従業員情報の場合は、指定したmonth + 1の値が検索結果として返します。<br>
翌月払いの従業員の2022/01の従業員情報を取得する場合は、year=2021,month=12を指定してください。<br> |
| employee_id | path | はい | integer | 従業員ID |

### レスポンス (200)

successful operation

- **employee_profile_rule** (任意): object
  - **id** (任意): integer(int32)
  - **company_id** (任意): integer(int32) - 事業所ID
  - **employee_id** (任意): integer(int32) - 従業員ID
  - **last_name** (任意): string - 姓
  - **first_name** (任意): string - 名
  - **last_name_kana** (任意): string - 姓カナ
  - **first_name_kana** (任意): string - 名カナ
  - **zipcode1** (任意): string - 住民票住所の郵便番号1 例: `000`
  - **zipcode2** (任意): string - 住民票住所の郵便番号2 例: `0000`
  - **prefecture_code** (任意): integer - 住民票住所の都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄) 例: `4` (最小: -1, 最大: 46)
  - **address** (任意): string - 住民票住所の市区町村以降の住所
  - **address_kana** (任意): string - 住民票住所の市区町村以降の住所カナ
  - **phone1** (任意): string - 電話番号1（先頭番号、例:03-1111-222x の03部分） 例: `000`
  - **phone2** (任意): string - 電話番号2（中間番号、例:03-1111-222x の1111部分） 例: `0000`
  - **phone3** (任意): string - 電話番号3（末尾番号、例:03-1111-222x の222x部分） 例: `0000`
  - **residential_zipcode1** (任意): string - 現住所の郵便番号１ 例: `000`
  - **residential_zipcode2** (任意): string - 現住所の郵便番号２ 例: `0000`
  - **residential_prefecture_code** (任意): integer - 現住所の都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄) 例: `4` (最小: -1, 最大: 46)
  - **residential_address** (任意): string - 現住所の住所
  - **residential_address_kana** (任意): string - 現住所の住所カナ
  - **employment_type** (任意): string - 雇用形態 board-member: 役員, regular: 正社員, fixed-term: 契約社員, part-time: アルバイト・パート, temporary: 派遣社員, (空文字列): その他
  - **title** (任意): string - 肩書
  - **gender** (任意): string - 性別　unselected: 未選択, male: 男性, female: 女性 (選択肢: unselected, male, female) 例: `male`
  - **married** (任意): boolean - 配偶者の有無
  - **is_working_student** (任意): boolean - 勤労学生かどうか
  - **widow_type** (任意): string - 寡夫／寡婦かどうか na: 空白, widower: 寡夫, widow: 寡婦, special_widow: 特別寡婦, one_parent: ひとり親
  - **disability_type** (任意): string - 障害者かどうか na: 空白, general: 障害者, heavy: 特別障害者
  - **email** (任意): string - メールアドレス 例: `test@example.com`
  - **householder_name** (任意): string - 世帯主の名前 世帯主の続柄がmyselfの場合は空白 例: `山田 吾郎`
  - **householder** (任意): string - 世帯主の続柄 myself:本人, husband:夫, wife:妻, father:父, mother:母, child:子供, senior_brother:兄, junior_brother:弟, senior_sister:姉, junior_sister:妹, grandchild:孫, grandfather:祖父, grandmother:祖母, father_in_law:義父, mother_in_law:義母, grandfather_in_law:義祖父, grandmother_in_law:義祖母, other:その他 (選択肢: myself, husband, wife, father, mother, child, senior_brother, junior_brother, senior_sister, junior_sister, grandchild, grandfather, grandmother, father_in_law, mother_in_law, grandfather_in_law, grandmother_in_law, other) 例: `father`

### PUT /api/v1/employees/{employee_id}/profile_rule

**操作**: 従業員の姓名・住所などの更新

**説明**: 概要 指定した従業員の姓名・住所などを更新します。 注意点 本APIは、給与計算対象外の従業員には非対応です。employee_idに給与計算対象外の従業員IDを指定した場合、本APIを利用できません。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| employee_id | path | はい | integer | 従業員ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 更新対象事業所ID（必須） (最小: 1, 最大: 2147483647)
- **year** **(必須)**: integer(int32) - 更新対象年（必須） 例: `2021` (最小: 2000, 最大: 2100)
- **month** **(必須)**: integer(int32) - 更新対象月（必須）<br>
締め日支払い日設定が翌月払いの従業員情報の場合は、指定したmonth + 1の値が更新されます。<br>
翌月払いの従業員の2022/01の従業員情報を更新する場合は、year=2021,month=12を指定してください。<br> 例: `1` (最小: 1, 最大: 12)
- **employee_profile_rule** **(必須)**: object
  - **last_name** **(必須)**: string - 姓 null不可 例: `山田`
  - **first_name** **(必須)**: string - 名 null不可 例: `太郎`
  - **last_name_kana** **(必須)**: string - 姓カナ 例: `ヤマダ`
  - **first_name_kana** **(必須)**: string - 名カナ 例: `タロウ`
  - **zipcode1** (任意): string - 住民票住所の郵便番号1 例: `000`
  - **zipcode2** (任意): string - 住民票住所の郵便番号2 例: `0000`
  - **prefecture_code** (任意): integer - 住民票住所の都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄) 例: `4` (最小: -1, 最大: 46)
  - **address** (任意): string - 住民票住所の市区町村以降の住所
  - **address_kana** (任意): string - 住民票住所の市区町村以降の住所カナ
  - **phone1** (任意): string - 電話番号1（先頭番号、例:03-1111-222x の03部分） 例: `000`
  - **phone2** (任意): string - 電話番号2（中間番号、例:03-1111-222x の1111部分） 例: `0000`
  - **phone3** (任意): string - 電話番号3（末尾番号、例:03-1111-222x の222x部分） 例: `0000`
  - **residential_zipcode1** (任意): string - 現住所の郵便番号１ 例: `000`
  - **residential_zipcode2** (任意): string - 現住所の郵便番号２ 例: `0000`
  - **residential_prefecture_code** (任意): integer - 現住所の都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄) 例: `4` (最小: -1, 最大: 46)
  - **residential_address** (任意): string - 現住所の住所
  - **residential_address_kana** (任意): string - 現住所の住所カナ
  - **employment_type** (任意): string - 雇用形態 board-member: 役員, regular: 正社員, fixed-term: 契約社員, part-time: アルバイト・パート, temporary: 派遣社員, (空文字列): その他 (選択肢: board-member, regular, fixed-term, part-time, temporary, )
  - **title** (任意): string - 肩書
  - **gender** (任意): string - 性別　unselected: 未選択, male: 男性, female: 女性（デフォルト: unselected: 未選択） (選択肢: unselected, male, female) 例: `male`
  - **married** (任意): boolean - null不可 配偶者の有無
  - **is_working_student** (任意): boolean - null不可 勤労学生かどうか
  - **widow_type** (任意): string - 寡夫／寡婦かどうか null不可 na: 空白, widower: 寡夫, widow: 寡婦, special_widow: 特別寡婦, one_parent: ひとり親 (選択肢: na, widower, widow, special_widow, one_parent)
  - **disability_type** (任意): string - 障害者かどうか null不可 na: 空白, general: 障害者, heavy: 特別障害者 (選択肢: na, general, heavy)
  - **email** (任意): string - メールアドレス 例: `test@example.com`
  - **householder_name** (任意): string - 世帯主の名前<br>世帯主の続柄に myself:本人 を指定している場合は、世帯主の名前は自動で従業員名で更新するため指定できません。 例: `山田 吾郎`
  - **householder** (任意): string - 世帯主の続柄 myself:本人, husband:夫, wife:妻, father:父, mother:母, child:子供, senior_brother:兄, junior_brother:弟, senior_sister:姉, junior_sister:妹, grandchild:孫, grandfather:祖父, grandmother:祖母, father_in_law:義父, mother_in_law:義母, grandfather_in_law:義祖父, grandmother_in_law:義祖母, other:その他 (選択肢: myself, husband, wife, father, mother, child, senior_brother, junior_brother, senior_sister, junior_sister, grandchild, grandfather, grandmother, father_in_law, mother_in_law, grandfather_in_law, grandmother_in_law, other) 例: `father`

### レスポンス (200)

successful operation

- **employee_profile_rule** (任意): object
  - **id** (任意): integer(int32)
  - **company_id** (任意): integer(int32) - 事業所ID
  - **employee_id** (任意): integer(int32) - 従業員ID
  - **last_name** (任意): string - 姓
  - **first_name** (任意): string - 名
  - **last_name_kana** (任意): string - 姓カナ
  - **first_name_kana** (任意): string - 名カナ
  - **zipcode1** (任意): string - 住民票住所の郵便番号1 例: `000`
  - **zipcode2** (任意): string - 住民票住所の郵便番号2 例: `0000`
  - **prefecture_code** (任意): integer - 住民票住所の都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄) 例: `4` (最小: -1, 最大: 46)
  - **address** (任意): string - 住民票住所の市区町村以降の住所
  - **address_kana** (任意): string - 住民票住所の市区町村以降の住所カナ
  - **phone1** (任意): string - 電話番号1（先頭番号、例:03-1111-222x の03部分） 例: `000`
  - **phone2** (任意): string - 電話番号2（中間番号、例:03-1111-222x の1111部分） 例: `0000`
  - **phone3** (任意): string - 電話番号3（末尾番号、例:03-1111-222x の222x部分） 例: `0000`
  - **residential_zipcode1** (任意): string - 現住所の郵便番号１ 例: `000`
  - **residential_zipcode2** (任意): string - 現住所の郵便番号２ 例: `0000`
  - **residential_prefecture_code** (任意): integer - 現住所の都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄) 例: `4` (最小: -1, 最大: 46)
  - **residential_address** (任意): string - 現住所の住所
  - **residential_address_kana** (任意): string - 現住所の住所カナ
  - **employment_type** (任意): string - 雇用形態 board-member: 役員, regular: 正社員, fixed-term: 契約社員, part-time: アルバイト・パート, temporary: 派遣社員, (空文字列): その他
  - **title** (任意): string - 肩書
  - **gender** (任意): string - 性別　unselected: 未選択, male: 男性, female: 女性 (選択肢: unselected, male, female) 例: `male`
  - **married** (任意): boolean - 配偶者の有無
  - **is_working_student** (任意): boolean - 勤労学生かどうか
  - **widow_type** (任意): string - 寡夫／寡婦かどうか na: 空白, widower: 寡夫, widow: 寡婦, special_widow: 特別寡婦, one_parent: ひとり親
  - **disability_type** (任意): string - 障害者かどうか na: 空白, general: 障害者, heavy: 特別障害者
  - **email** (任意): string - メールアドレス 例: `test@example.com`
  - **householder_name** (任意): string - 世帯主の名前 世帯主の続柄がmyselfの場合は空白 例: `山田 吾郎`
  - **householder** (任意): string - 世帯主の続柄 myself:本人, husband:夫, wife:妻, father:父, mother:母, child:子供, senior_brother:兄, junior_brother:弟, senior_sister:姉, junior_sister:妹, grandchild:孫, grandfather:祖父, grandmother:祖母, father_in_law:義父, mother_in_law:義母, grandfather_in_law:義祖父, grandmother_in_law:義祖母, other:その他 (選択肢: myself, husband, wife, father, mother, child, senior_brother, junior_brother, senior_sister, junior_sister, grandchild, grandfather, grandmother, father_in_law, mother_in_law, grandfather_in_law, grandmother_in_law, other) 例: `father`



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
