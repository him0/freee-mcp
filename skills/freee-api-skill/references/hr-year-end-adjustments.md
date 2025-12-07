# 年末調整

## 概要

年末調整の操作

## エンドポイント一覧

### GET /api/v1/yearend_adjustments/{year}/employees

**操作**: 年末調整対象一覧の取得

**説明**: 指定した年の年末調整対象のリスト返します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| year | path | はい | integer | 年末調整対象を取得したい年 |
| limit | query | いいえ | integer | 取得レコードの件数 (デフォルト: 50, 最小: 1, 最大: 100) |
| offset | query | いいえ | integer | 取得レコードのオフセット (デフォルト: 0) |

### レスポンス (200)

successful operation

- **employees** (任意): array[object]
  配列の要素:
    - **employee_id** (任意): integer(int32) - 従業員ID
    - **num** (任意): string - 従業員番号
    - **employee_display_name** (任意): string - 従業員名
    - **is_not_adjust** (任意): boolean - 年末調整対象外
- true - 年末調整対象外
- false - 年末調整対象
    - **status** (任意): string - 年末調整ステータス
- initialized - 入力依頼前
- in_employee_progress - 従業員入力中
- submitted - 従業員入力済
- fixed - 確定 (選択肢: initialized, in_employee_progress, submitted, fixed)
- **total_count** (任意): integer(int32) - 合計件数 (最小: 0, 最大: 2147483647)

### GET /api/v1/yearend_adjustments/{year}/employees/{employee_id}

**操作**: 年末調整の取得

**説明**: 指定した年、従業員IDの年末調整の詳細内容を返します。 年末調整対象外の従業員は、本人情報、給与・賞与、前職情報のみが取得できます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| year | path | はい | integer | 年末調整を取得したい年 |
| employee_id | path | はい | integer | 従業員ID |

### レスポンス (200)

successful operation

- **employee** (任意): object
  - **employee_id** (任意): integer(int32) - 従業員ID
  - **num** (任意): string - 従業員番号<br>
従業員を判別しやすいよう管理することができます。（例: 1人目の正社員を A-001 と入力） 例: `A-001`
  - **last_name** (任意): string - 姓 null不可 例: `山田`
  - **first_name** (任意): string - 名 null不可 例: `太郎`
  - **last_name_kana** (任意): string - 姓カナ 例: `ヤマダ`
  - **first_name_kana** (任意): string - 名カナ 例: `タロウ`
  - **birth_date** (任意): string(date) - 生年月日
  - **entry_date** (任意): string(date) - 入社日
  - **retire_date** (任意): string(date) - 退職日
  - **employment_type** (任意): string - 雇用形態 board-member: 役員, regular: 正社員, fixed-term: 契約社員, part-time: アルバイト・パート, temporary: 派遣社員, (空文字列): その他
  - **title** (任意): string - 肩書
  - **zipcode1** (任意): string - 住民票住所の郵便番号1 例: `141`
  - **zipcode2** (任意): string - 住民票住所の郵便番号2 例: `0031`
  - **prefecture_code** (任意): integer - 住民票住所の都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄) 例: `12` (最小: -1, 最大: 46)
  - **address** (任意): string - 住民票住所の市区町村以降の住所 例: `品川区大崎1-2-2`
  - **address_kana** (任意): string - 住民票住所の市区町村以降の住所カナ 例: `シナガワクオオサキ1-2-2`
  - **payer_type** (任意): string - 所得税納税者区分 kou: 甲, otsu: 乙, hei: 丙 (選択肢: kou, otsu, hei)
  - **widow_type** (任意): string - 寡夫／寡婦かどうか null不可 na: 空白, widow: 寡婦, one_parent: ひとり親 (選択肢: na, widow, one_parent)
  - **disability_type** (任意): string - 障害者かどうか na: 空白, general: 障害者, heavy: 特別障害者 (選択肢: na, general, heavy)
  - **married** (任意): boolean - 配偶者の有無
  - **is_working_student** (任意): boolean - 勤労学生かどうか
  - **is_foreigner** (任意): boolean - 外国人かどうか
  - **other_company_revenue** (任意): integer - その他の事業所の給与収入 例: `1000000` (最小: 0, 最大: 1999999999)
  - **all_other_income** (任意): integer - 給与以外の所得 例: `1000000` (最小: 0, 最大: 1999999999)
  - **householder** (任意): string - 世帯主の続柄 myself: 本人, husband: 夫, wife: 妻, father: 父, mother: 母, child: 子, senior_brother: 兄, junior_brother: 弟, senior_sister: 姉, junior_sister: 妹, grandchild: 孫, grandfather: 祖父, grandmother: 祖母, father_in_law: 義父, mother_in_law: 義母, grandfather_in_law: 義祖父, grandmother_in_law: 義祖母, other: その他 (選択肢: myself, husband, wife, father, mother, child, senior_brother, junior_brother, senior_sister, junior_sister, grandchild, grandfather, grandmother, father_in_law, mother_in_law, grandfather_in_law, grandmother_in_law, other)
  - **householder_name** (任意): string - 世帯主の名前 例: `山田 太郎`
  - **is_calc_income_tax** (任意): boolean - 所得税の計算対象かどうか
- **dependents** (任意): array[object] - 家族情報(年末調整対象外の場合は取得できません。)
  配列の要素:
    - **id** (任意): integer(int32) - 家族情報ID 例: `1`
    - **last_name** (任意): string - 姓 null不可 例: `山田`
    - **first_name** (任意): string - 名 null不可 例: `花子`
    - **last_name_kana** (任意): string - 姓カナ 例: `ヤマダ`
    - **first_name_kana** (任意): string - 名カナ 例: `ハナコ`
    - **relationship** (任意): string - 続柄 null不可 spouse: 配偶者, father: 父, mother: 母, child: 子, senior_brother: 兄, junior_brother: 弟, senior_sister: 姉, junior_sister: 妹, grandchild: 孫, grandfather: 祖父, grandmother: 祖母, father_in_law: 義父, mother_in_law: 義母, grandfather_in_law: 義祖父, grandmother_in_law: 義祖母, other: その他, great_grandfather: 曽祖父, great_grandmother: 曽祖母, spouses_child: 配偶者の連れ子 (選択肢: spouse, father, mother, child, senior_brother, junior_brother, senior_sister, junior_sister, grandchild, grandfather, grandmother, father_in_law, mother_in_law, grandfather_in_law, grandmother_in_law, other, great_grandfather, great_grandmother, spouses_child)
    - **birth_date** (任意): string(date) - 生年月日 null不可 1900年1月1日から現在年+5年12月31日まで登録可能 例: `1999-01-01`
    - **social_insurance_and_tax_dependent** (任意): string - 扶養状況 social_insurance_and_tax: 所得税・住民税と社会保険, tax_only: 所得税・住民税のみ, social_insurance_only: 社会保険のみ, not_dependent: 扶養していない (選択肢: social_insurance_and_tax, tax_only, social_insurance_only, not_dependent)
    - **income** (任意): integer(int32) - 所得 配偶者は「扶養状況」がsocial_insurance_only又はnot_dependentの場合のみ更新可能。配偶者以外は更新可能。 配偶者で「扶養状況」がsocial_insurance_and_tax又はtax_onlyの場合、「給与収入」、「給与以外の所得」から自動で「所得」が計算されます。 (最小: 0, 最大: 999999999)
    - **employment_revenue** (任意): integer(int32) - 給与収入 配偶者は「扶養状況」がsocial_insurance_and_tax又はtax_onlyの場合のみ更新可能。配偶者以外は更新不可。更新不可の場合は0となります。 (最小: 0, 最大: 999999999)
    - **all_other_income** (任意): integer(int32) - 給与以外の所得 配偶者は「扶養状況」がsocial_insurance_and_tax又はtax_onlyの場合のみ更新可能。配偶者以外は更新不可。更新不可の場合は0となります。 (最小: 0, 最大: 999999999)
    - **disability_type** (任意): string - 障害に該当するか null不可 na: 障害なし, general: 一般の障害者, heavy: 特別障害者 (選択肢: na, general, heavy)
    - **residence_type** (任意): string - 同居・別居 null不可 live_in: 同居, resident: 別居(国内), non_resident: 別居(国外) (選択肢: live_in, resident, non_resident)
    - **zipcode1** (任意): string - 住民票住所の郵便番号1 「同居・別居」が「同居」の場合は「年末調整従業員情報」の「住民票住所の郵便番号1」を登録 例: `141`
    - **zipcode2** (任意): string - 住民票住所の郵便番号2 「同居・別居」が「同居」の場合は「年末調整従業員情報」の「住民票住所の郵便番号2」を登録 例: `0031`
    - **prefecture_code** (任意): integer - 住民票住所の都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄)  「同居・別居」が「同居」の場合は「年末調整従業員情報」の「住民票住所の都道府県コード」を登録 例: `12` (最小: -1, 最大: 46)
    - **address** (任意): string - 住民票住所の市区町村以降の住所 「同居・別居」が「同居」の場合は「年末調整従業員情報」の「住民票住所の市区町村以降の住所」を登録 例: `品川区大崎1-2-2`
    - **address_kana** (任意): string - 住民票住所の市区町村以降の住所カナ 「同居・別居」が「同居」の場合は「年末調整従業員情報」の「住民票住所の市区町村以降の住所カナ」を登録 例: `シナガワクオオサキ1-2-2`
    - **annual_remittance_amount** (任意): integer(int32) - 国外居住親族への年間の送金額 「同居・別居」が「同居」、「別居(国内)」の場合は登録不可 (最小: 0, 最大: 999999999)
    - **non_resident_dependents_reason** (任意): string(string) - 非居住者である親族の条件 none: なし, over_16_to_under_30_or_over_70: 16歳以上30歳未満又は70歳以上, study_abroad: 留学, handicapped: 障害者, over_38_man: 38万円以上の支払 続柄が「配偶者」または「同居・別居」が「同居」、「別居(国内)」の場合は登録不可 (選択肢: none, over_16_to_under_30_or_over_70, study_abroad, handicapped, over_38_man)
    - **is_resident_tax_only_deduction** (任意): boolean - 住民税のみの控除対象かどうか
    - **retirement_income** (任意): integer(int32) - 退職所得 (最小: 0, 最大: 999999999)
- **insurances** (任意): array[object] - 保険料情報(年末調整対象外の場合は取得できません。)
  配列の要素:
    - **id** (任意): integer - 保険料id (最小: 1, 最大: 2147483647)
    - **type** (任意): string - 保険の種類 life_care_pension_insurance: 生命保険・介護医療保険・個人年金保険, earthquake_non_life_insurance: 地震保険・旧長期損害保険, social_insurance: 社会保険, other_insurance: その他の保険（小規模企業共済等） (選択肢: life_care_pension_insurance, earthquake_non_life_insurance, social_insurance, other_insurance)
    - **category** (任意): string - 区分<br>
保険会社等が発行する証明書類に基づいて区分を設定してください。<br>
保険の種類によって設定可能な値が変わります。<br>
・life_care_pension_insurance<br>
　life: 生命保険<br>
　care: 介護保険<br>
　pension: 個人年金保険<br>
・earthquake_non_life_insurance<br>
　earthquake: 地震保険<br>
　old_long_term_non_life: 旧長期損害保険<br>
・social_insurance<br>
　national_pension: 国民年金<br>
　national_pension_fund_premium: 国民年金基金<br>
　national_health: 国民健康保険<br>
　health: 健康保険<br>
　care_insurance_deduction_of_pension: 介護保険<br>
　employee_pension: 厚生年金<br>
　advanced_elderly_medical: 後期高齢者医療保険<br>
　none: その他（印刷後に手書き）<br>
・other_insurance<br>
　sema: 独立行政法人中小企業基盤整備機構の共済契約の掛金<br>
　idc: 個人型確定拠出年金（iDeCo）<br>
　cdc: 企業型確定拠出年金<br>
　dsma: 心身障害者扶養共済制度に関する契約の掛金<br> (選択肢: life, care, pension, earthquake, old_long_term_non_life, national_pension, national_pension_fund_premium, national_health, care_insurance_deduction_of_pension, health, employee_pension, advanced_elderly_medical, sema, idc, cdc, dsma, none) 例: `life`
    - **new_or_old** (任意): string - 新旧区分<br>
区分が生命保険または個人年金保険の時のみ、新制度なら new を、旧制度なら old を指定します。<br>
上記以外の保険では none を指定してください。 (選択肢: new, old, none)
    - **company_name** (任意): string - 保険会社等の名称<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `freee生命保険株式会社`
    - **kind_of_purpose** (任意): string - 保険等の種類（目的）<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `利差配当付終身`
    - **period** (任意): string - 保険期間又は年金支払期間<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 (選択肢: 終身, 0年, 1年, 2年, 3年, 4年, 5年, 6年, 7年, 8年, 9年, 10年, 11年, 12年, 13年, 14年, 15年, 16年, 17年, 18年, 19年, 20年, 21年, 22年, 23年, 24年, 25年, 26年, 27年, 28年, 29年, 30年, 31年, 32年, 33年, 34年, 35年, 36年, 37年, 38年, 39年, 40年, 41年, 42年, 43年, 44年, 45年, 46年, 47年, 48年, 49年, 50年, 51年, 52年, 53年, 54年, 55年, 56年, 57年, 58年, 59年, 60年, 61年, 62年, 63年, 64年, 65年, 66年, 67年, 68年, 69年, 70年, 71年, 72年, 73年, 74年, 75年, 76年, 77年, 78年, 79年, 80年, 81年, 82年, 83年, 84年, 85年, 86年, 87年, 88年, 89年, 90年, 91年, 92年, 93年, 94年, 95年, 96年, 97年, 98年, 99年, 100年, ) 例: `終身`
    - **policyholder_last_name** (任意): string - 保険等の契約者 姓<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `契約`
    - **policyholder_first_name** (任意): string - 保険等の契約者 名<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `太郎`
    - **recipient_last_name** (任意): string - 保険金等の受取人 姓<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険、地震保険・旧長期損害保険または社会保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `受取`
    - **recipient_first_name** (任意): string - 保険金等の受取人 名<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険、地震保険・旧長期損害保険または社会保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `太郎`
    - **recipient_relationship** (任意): string - 保険金等の受取人 あなたとの続柄 myself: 本人, husband: 夫, wife: 妻, father: 父, mother: 母, child: 子, senior_brother: 兄, junior_brother: 弟, senior_sister: 姉, junior_sister: 妹, grandchild: 孫, grandfather: 祖父, grandmother: 祖母, father_in_law: 義父, mother_in_law: 義母, grandfather_in_law: 義祖父, grandmother_in_law: 義祖母, other: その他, "": 空欄<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険、地震保険・旧長期損害保険または社会保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 (選択肢: myself, husband, wife, father, mother, child, senior_brother, junior_brother, senior_sister, junior_sister, grandchild, grandfather, grandmother, father_in_law, mother_in_law, grandfather_in_law, grandmother_in_law, other, ) 例: `child`
    - **payment_start_date** (任意): string - 年金の支払開始日 1900年1月1日から現在年+100の12月31日まで登録可能。<br>
区分が個人年金保険の時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `2000-04-01` (パターン: ^([1-2][0-9]{3}-[0-9]{2}-[0-9]{2})?$)
    - **amount** (任意): integer - 保険料額 例: `1000000` (最小: 0, 最大: 99999999)
    - **certification_type** (任意): string - 電子的控除証明書などの認証方法を利用した場合、その認証方法が反映されます。<br>
xml: 電子的控除証明書を利用。証明書画像データの提出が免除されます。またrecipient_first_name、recipient_last_name、recipient_relationship以外のカラムが更新不可となります。 (選択肢: xml)
- **housing_loan_deduction** (任意): integer(int32) - 住宅借入金等特別控除(年末調整対象外の場合は取得できません。) 例: `500000` (最小: 0, 最大: 999999999)
- **housing_loans** (任意): array[object] - 住宅ローン(年末調整対象外の場合は取得できません。)
  配列の要素:
    - **id** (任意): integer(int32) - 住宅ローンID 例: `1` (最小: 1, 最大: 2147483647)
    - **residence_start_date** (任意): string(date) - 居住開始の年月日 例: `2022-03-31`
    - **remaining_balance_at_yearend** (任意): integer - 住宅借入金等年末残高 例: `5000000` (最小: -999999999, 最大: 999999999)
    - **category** (任意): string - 住宅借入金等特別控除区分 general: 住: 一般の住宅借入金等, qualified: 認: 認定住宅の新築等, extension: 増: 特定増改築等, earthquake: 震: 震災特例法による特別控除 (選択肢: general, qualified, extension, earthquake)
    - **specific_case_type** (任意): string - 特定取得/特別特定取得 not_qualified: 該当しない, specified: 特定取得, special_specified_or_special_exception: 特別特定取得または特別特例取得, exception_special_exception: 特例特別特例取得 special_residential_house 特家 (選択肢: not_qualified, specified, special_specified_or_special_exception, exception_special_exception, special_residential_house)
- **payroll_and_bonus** (任意): object
  - **fixed_payroll** (任意): integer(int32) - 確定給与額 例: `10000000` (最小: -999999999, 最大: 999999999)
  - **fixed_payroll_deduction** (任意): integer(int32) - 確定給与控除額 例: `1000000` (最小: -999999999, 最大: 999999999)
  - **fixed_payroll_income_tax** (任意): integer(int32) - 確定給与所得税額 例: `1000000` (最小: -999999999, 最大: 999999999)
  - **fixed_bonus** (任意): integer(int32) - 確定賞与額 例: `10000000` (最小: -999999999, 最大: 999999999)
  - **fixed_bonus_deduction** (任意): integer(int32) - 確定賞与控除額 例: `1000000` (最小: -999999999, 最大: 999999999)
  - **fixed_bonus_income_tax** (任意): integer(int32) - 確定賞与所得税額 例: `1000000` (最小: -999999999, 最大: 999999999)
  - **unentered_payroll_amount** (任意): integer(int32) - 未入力給与額 例: `500000` (最小: -999999999, 最大: 999999999)
  - **unentered_payroll_deduction_amount** (任意): integer(int32) - 未入力給与控除額 例: `500000` (最小: -999999999, 最大: 999999999)
  - **unentered_payroll_income_tax_amount** (任意): integer(int32) - 未入力給与所得税額 例: `500000` (最小: -999999999, 最大: 999999999)
  - **unentered_bonus_amount** (任意): integer(int32) - 未入力賞与額 例: `500000` (最小: -999999999, 最大: 999999999)
  - **unentered_bonus_deduction_amount** (任意): integer(int32) - 未入力賞与控除額 例: `500000` (最小: -999999999, 最大: 999999999)
  - **unentered_bonus_income_tax_amount** (任意): integer(int32) - 未入力賞与所得税額 例: `500000` (最小: -999999999, 最大: 999999999)
- **previous_job** (任意): object
  - **income** (任意): integer - 前職の支払金額 例: `5000000` (最小: -999999999, 最大: 999999999)
  - **deduction** (任意): integer - 前職の社会保険料等の金額 例: `1200000` (最小: -999999999, 最大: 999999999)
  - **withholding_tax_amount** (任意): integer - 前職の源泉徴収額 例: `100000` (最小: -999999999, 最大: 999999999)
  - **company_name** (任意): string - 前職の社名 例: `株式会社 前職`
  - **company_address** (任意): string - 前職の事業所住所 例: `品川区大崎1-2-2`
  - **retire_date** (任意): string(date) - 前職の退職日 現在年-10年1月1日から現在年+5年12月31日まで登録可能 例: `2022-03-31`

### PUT /api/v1/yearend_adjustments/{year}/employees/{employee_id}

**操作**: 年末調整従業員情報の更新

**説明**: 概要 指定した従業員の姓名・住所などを更新します。 注意点 本APIは、年末調整が確定済みの従業員には非対応です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| year | path | はい | integer | 更新対象年 |
| employee_id | path | はい | integer | 従業員ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 更新対象事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **employee** **(必須)**: object
  - **last_name** **(必須)**: string - 姓 null不可 例: `山田`
  - **first_name** **(必須)**: string - 名 null不可 例: `太郎`
  - **last_name_kana** **(必須)**: string - 姓カナ 例: `ヤマダ`
  - **first_name_kana** **(必須)**: string - 名カナ 例: `タロウ`
  - **zipcode1** **(必須)**: string - 住民票住所の郵便番号1 例: `141`
  - **zipcode2** **(必須)**: string - 住民票住所の郵便番号2 例: `0031`
  - **prefecture_code** **(必須)**: integer - 住民票住所の都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄) 例: `12` (最小: -1, 最大: 46)
  - **address** **(必須)**: string - 住民票住所の市区町村以降の住所 例: `品川区大崎1-2-2`
  - **address_kana** (任意): string - 住民票住所の市区町村以降の住所カナ 例: `シナガワクオオサキ1-2-2`
  - **payer_type** (任意): string - 所得税納税者区分 kou: 甲, otsu: 乙, hei: 丙 (選択肢: kou, otsu, hei)
  - **widow_type** (任意): string - 寡夫／寡婦かどうか null不可 na: 空白, widow: 寡婦, one_parent: ひとり親 (選択肢: na, widow, one_parent)
  - **disability_type** (任意): string - 障害者かどうか null不可 na: 空白, general: 障害者, heavy: 特別障害者 (選択肢: na, general, heavy)
  - **married** (任意): boolean - 配偶者の有無 null不可
  - **is_working_student** (任意): boolean - 勤労学生かどうか null不可
  - **is_foreigner** (任意): boolean - 外国人かどうか null不可
  - **other_company_revenue** (任意): integer - その他の事業所の給与収入 例: `1000000` (最小: 0, 最大: 1999999999)
  - **all_other_income** (任意): integer - 給与以外の所得 例: `1000000` (最小: 0, 最大: 1999999999)
  - **householder** (任意): string - 世帯主の続柄 myself: 本人, husband: 夫, wife: 妻, father: 父, mother: 母, child: 子, senior_brother: 兄, junior_brother: 弟, senior_sister: 姉, junior_sister: 妹, grandchild: 孫, grandfather: 祖父, grandmother: 祖母, father_in_law: 義父, mother_in_law: 義母, grandfather_in_law: 義祖父, grandmother_in_law: 義祖母, other: その他 (選択肢: myself, husband, wife, father, mother, child, senior_brother, junior_brother, senior_sister, junior_sister, grandchild, grandfather, grandmother, father_in_law, mother_in_law, grandfather_in_law, grandmother_in_law, other)
  - **householder_name** (任意): string - 世帯主の名前 例: `山田 太郎`

### レスポンス (200)

successful operation

- **employees** (任意): object
  - **employee_id** (任意): integer(int32) - 従業員ID
  - **num** (任意): string - 従業員番号<br>
従業員を判別しやすいよう管理することができます。（例: 1人目の正社員を A-001 と入力） 例: `A-001`
  - **last_name** (任意): string - 姓 null不可 例: `山田`
  - **first_name** (任意): string - 名 null不可 例: `太郎`
  - **last_name_kana** (任意): string - 姓カナ 例: `ヤマダ`
  - **first_name_kana** (任意): string - 名カナ 例: `タロウ`
  - **birth_date** (任意): string(date) - 生年月日
  - **entry_date** (任意): string(date) - 入社日
  - **retire_date** (任意): string(date) - 退職日
  - **employment_type** (任意): string - 雇用形態 board-member: 役員, regular: 正社員, fixed-term: 契約社員, part-time: アルバイト・パート, temporary: 派遣社員, (空文字列): その他
  - **title** (任意): string - 肩書
  - **zipcode1** (任意): string - 住民票住所の郵便番号1 例: `141`
  - **zipcode2** (任意): string - 住民票住所の郵便番号2 例: `0031`
  - **prefecture_code** (任意): integer - 住民票住所の都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄) 例: `12` (最小: -1, 最大: 46)
  - **address** (任意): string - 住民票住所の市区町村以降の住所 例: `品川区大崎1-2-2`
  - **address_kana** (任意): string - 住民票住所の市区町村以降の住所カナ 例: `シナガワクオオサキ1-2-2`
  - **payer_type** (任意): string - 所得税納税者区分 kou: 甲, otsu: 乙, hei: 丙 (選択肢: kou, otsu, hei)
  - **widow_type** (任意): string - 寡夫／寡婦かどうか null不可 na: 空白, widow: 寡婦, one_parent: ひとり親 (選択肢: na, widow, one_parent)
  - **disability_type** (任意): string - 障害者かどうか na: 空白, general: 障害者, heavy: 特別障害者 (選択肢: na, general, heavy)
  - **married** (任意): boolean - 配偶者の有無
  - **is_working_student** (任意): boolean - 勤労学生かどうか
  - **is_foreigner** (任意): boolean - 外国人かどうか
  - **other_company_revenue** (任意): integer - その他の事業所の給与収入 例: `1000000` (最小: 0, 最大: 1999999999)
  - **all_other_income** (任意): integer - 給与以外の所得 例: `1000000` (最小: 0, 最大: 1999999999)
  - **householder** (任意): string - 世帯主の続柄 myself: 本人, husband: 夫, wife: 妻, father: 父, mother: 母, child: 子, senior_brother: 兄, junior_brother: 弟, senior_sister: 姉, junior_sister: 妹, grandchild: 孫, grandfather: 祖父, grandmother: 祖母, father_in_law: 義父, mother_in_law: 義母, grandfather_in_law: 義祖父, grandmother_in_law: 義祖母, other: その他 (選択肢: myself, husband, wife, father, mother, child, senior_brother, junior_brother, senior_sister, junior_sister, grandchild, grandfather, grandmother, father_in_law, mother_in_law, grandfather_in_law, grandmother_in_law, other)
  - **householder_name** (任意): string - 世帯主の名前 例: `山田 太郎`
  - **is_calc_income_tax** (任意): boolean - 所得税の計算対象かどうか

### PUT /api/v1/yearend_adjustments/{year}/payroll_and_bonus/{employee_id}

**操作**: 年末調整従業員給与・賞与の更新

**説明**: 概要 指定した従業員の給与・賞与を更新します。 注意点 本APIは、年末調整が確定済みの従業員には非対応です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| year | path | はい | integer | 更新対象年 |
| employee_id | path | はい | integer | 従業員ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 更新対象事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **payroll_and_bonus** **(必須)**: object
  - **unentered_payroll_amount** (任意): integer(int32) - 未入力給与額 例: `1000000` (最小: -999999999, 最大: 999999999)
  - **unentered_payroll_deduction_amount** (任意): integer(int32) - 未入力給与控除額 例: `1000000` (最小: -999999999, 最大: 999999999)
  - **unentered_payroll_income_tax_amount** (任意): integer(int32) - 未入力給与所得税額 例: `1000000` (最小: -999999999, 最大: 999999999)
  - **unentered_bonus_amount** (任意): integer(int32) - 未入力賞与額 例: `1000000` (最小: -999999999, 最大: 999999999)
  - **unentered_bonus_deduction_amount** (任意): integer(int32) - 未入力賞与控除額 例: `1000000` (最小: -999999999, 最大: 999999999)
  - **unentered_bonus_income_tax_amount** (任意): integer(int32) - 未入力賞与所得税額 例: `1000000` (最小: -999999999, 最大: 999999999)

### レスポンス (200)

successful operation

- **payroll_and_bonus** (任意): object
  - **fixed_payroll** (任意): integer(int32) - 確定給与額 例: `10000000` (最小: -999999999, 最大: 999999999)
  - **fixed_payroll_deduction** (任意): integer(int32) - 確定給与控除額 例: `1000000` (最小: -999999999, 最大: 999999999)
  - **fixed_payroll_income_tax** (任意): integer(int32) - 確定給与所得税額 例: `1000000` (最小: -999999999, 最大: 999999999)
  - **fixed_bonus** (任意): integer(int32) - 確定賞与額 例: `10000000` (最小: -999999999, 最大: 999999999)
  - **fixed_bonus_deduction** (任意): integer(int32) - 確定賞与控除額 例: `1000000` (最小: -999999999, 最大: 999999999)
  - **fixed_bonus_income_tax** (任意): integer(int32) - 確定賞与所得税額 例: `1000000` (最小: -999999999, 最大: 999999999)
  - **unentered_payroll_amount** (任意): integer(int32) - 未入力給与額 例: `500000` (最小: -999999999, 最大: 999999999)
  - **unentered_payroll_deduction_amount** (任意): integer(int32) - 未入力給与控除額 例: `500000` (最小: -999999999, 最大: 999999999)
  - **unentered_payroll_income_tax_amount** (任意): integer(int32) - 未入力給与所得税額 例: `500000` (最小: -999999999, 最大: 999999999)
  - **unentered_bonus_amount** (任意): integer(int32) - 未入力賞与額 例: `500000` (最小: -999999999, 最大: 999999999)
  - **unentered_bonus_deduction_amount** (任意): integer(int32) - 未入力賞与控除額 例: `500000` (最小: -999999999, 最大: 999999999)
  - **unentered_bonus_income_tax_amount** (任意): integer(int32) - 未入力賞与所得税額 例: `500000` (最小: -999999999, 最大: 999999999)

### PUT /api/v1/yearend_adjustments/{year}/dependents/{employee_id}

**操作**: 年末調整家族情報の更新

**説明**: 概要 指定した年末調整の家族情報を更新します。 注意点 本APIは、年末調整が確定済みの従業員には非対応です。 idがない場合は新規作成、destroyがtrueの場合は削除になります。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| year | path | はい | integer | 更新対象年 |
| employee_id | path | はい | integer | 従業員ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 更新対象事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **dependents** **(必須)**: array[object] - 家族情報
  配列の要素:
    - **id** (任意): integer(int32) - 家族情報ID（idがない場合は新規作成になる) 例: `1` (最小: 1, 最大: 2147483647)
    - **destroy** (任意): boolean - 家族情報を削除するか true: 削除する, false: 削除しない 例: `false`
    - **last_name** **(必須)**: string - 姓 null不可 例: `山田`
    - **first_name** **(必須)**: string - 名 null不可 例: `花子`
    - **last_name_kana** (任意): string - 姓カナ 例: `ヤマダ`
    - **first_name_kana** (任意): string - 名カナ 例: `ハナコ`
    - **relationship** **(必須)**: string - 続柄 null不可 spouse: 配偶者, father: 父, mother: 母, child: 子, senior_brother: 兄, junior_brother: 弟, senior_sister: 姉, junior_sister: 妹, grandchild: 孫, grandfather: 祖父, grandmother: 祖母, father_in_law: 義父, mother_in_law: 義母, grandfather_in_law: 義祖父, grandmother_in_law: 義祖母, other: その他, great_grandfather: 曽祖父, great_grandmother: 曽祖母, spouses_child: 配偶者の連れ子 (選択肢: spouse, father, mother, child, senior_brother, junior_brother, senior_sister, junior_sister, grandchild, grandfather, grandmother, father_in_law, mother_in_law, grandfather_in_law, grandmother_in_law, other, great_grandfather, great_grandmother, spouses_child)
    - **birth_date** **(必須)**: string(date) - 生年月日 null不可 1900年1月1日から現在年+5の12月31日まで登録可能 例: `1999-01-01` (パターン: ^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$)
    - **social_insurance_and_tax_dependent** **(必須)**: string - 扶養状況 social_insurance_and_tax: 所得税・住民税と社会保険, tax_only: 所得税・住民税のみ, social_insurance_only: 社会保険のみ, not_dependent: 扶養していない (選択肢: social_insurance_and_tax, tax_only, social_insurance_only, not_dependent)
    - **income** (任意): integer(int32) - 所得 配偶者は「扶養状況」がsocial_insurance_only又はnot_dependentの場合のみ更新可能。配偶者以外は更新可能。 配偶者で「扶養状況」がsocial_insurance_and_tax又はtax_onlyの場合、「給与収入」、「給与以外の所得」から自動で「所得」が計算されます。 (最小: 0, 最大: 999999999)
    - **employment_revenue** (任意): integer(int32) - 給与収入 配偶者は「扶養状況」がsocial_insurance_and_tax又はtax_onlyの場合のみ更新可能。配偶者以外は更新不可。更新不可の場合は0となります。 (最小: 0, 最大: 999999999)
    - **all_other_income** (任意): integer(int32) - 給与以外の所得 配偶者は「扶養状況」がsocial_insurance_and_tax又はtax_onlyの場合のみ更新可能。配偶者以外は更新不可。更新不可の場合は0となります。 (最小: 0, 最大: 999999999)
    - **disability_type** **(必須)**: string - 障害に該当するか null不可 na: 障害なし, general: 一般の障害者, heavy: 特別障害者 (選択肢: na, general, heavy)
    - **residence_type** **(必須)**: string - 同居・別居 null不可 live_in: 同居, resident: 別居(国内), non_resident: 別居(国外) (選択肢: live_in, resident, non_resident)
    - **zipcode1** (任意): string - 住民票住所の郵便番号1 「同居・別居」が「同居」の場合は「年末調整従業員情報」の「住民票住所の郵便番号1」を登録 例: `141`
    - **zipcode2** (任意): string - 住民票住所の郵便番号2 「同居・別居」が「同居」の場合は「年末調整従業員情報」の「住民票住所の郵便番号2」を登録 例: `0031`
    - **prefecture_code** (任意): integer - 住民票住所の都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄)  「同居・別居」が「同居」の場合は「年末調整従業員情報」の「住民票住所の都道府県コード」を登録 例: `12` (最小: -1, 最大: 46)
    - **address** (任意): string - 住民票住所の市区町村以降の住所 「同居・別居」が「同居」の場合は「年末調整従業員情報」の「住民票住所の市区町村以降の住所」を登録 例: `品川区大崎1-2-2`
    - **address_kana** (任意): string - 住民票住所の市区町村以降の住所カナ 「同居・別居」が「同居」の場合は「年末調整従業員情報」の「住民票住所の市区町村以降の住所カナ」を登録 例: `シナガワクオオサキ1-2-2`
    - **annual_remittance_amount** (任意): integer(int32) - 国外居住親族への年間の送金額 「同居・別居」が「同居」、「別居(国内)」の場合は登録不可 (最小: 0, 最大: 999999999)
    - **non_resident_dependents_reason** (任意): string(string) - 非居住者である親族の条件 none: なし, over_16_to_under_30_or_over_70: 16歳以上30歳未満又は70歳以上, study_abroad: 留学, handicapped: 障害者, over_38_man: 38万円以上の支払 続柄が「配偶者」または「同居・別居」が「同居」、「別居(国内)」の場合は登録不可 (選択肢: none, over_16_to_under_30_or_over_70, study_abroad, handicapped, over_38_man)
    - **is_resident_tax_only_deduction** (任意): boolean - 住民税のみの控除対象かどうか
    - **retirement_income** (任意): integer(int32) - 退職所得 (最小: 0, 最大: 999999999)

### レスポンス (200)

successful operation

- **dependents** (任意): array[object] - 家族情報
  配列の要素:
    - **id** (任意): integer(int32) - 家族情報ID 例: `1`
    - **last_name** (任意): string - 姓 null不可 例: `山田`
    - **first_name** (任意): string - 名 null不可 例: `花子`
    - **last_name_kana** (任意): string - 姓カナ 例: `ヤマダ`
    - **first_name_kana** (任意): string - 名カナ 例: `ハナコ`
    - **relationship** (任意): string - 続柄 null不可 spouse: 配偶者, father: 父, mother: 母, child: 子, senior_brother: 兄, junior_brother: 弟, senior_sister: 姉, junior_sister: 妹, grandchild: 孫, grandfather: 祖父, grandmother: 祖母, father_in_law: 義父, mother_in_law: 義母, grandfather_in_law: 義祖父, grandmother_in_law: 義祖母, other: その他, great_grandfather: 曽祖父, great_grandmother: 曽祖母, spouses_child: 配偶者の連れ子 (選択肢: spouse, father, mother, child, senior_brother, junior_brother, senior_sister, junior_sister, grandchild, grandfather, grandmother, father_in_law, mother_in_law, grandfather_in_law, grandmother_in_law, other, great_grandfather, great_grandmother, spouses_child)
    - **birth_date** (任意): string(date) - 生年月日 null不可 1900年1月1日から現在年+5年12月31日まで登録可能 例: `1999-01-01`
    - **social_insurance_and_tax_dependent** (任意): string - 扶養状況 social_insurance_and_tax: 所得税・住民税と社会保険, tax_only: 所得税・住民税のみ, social_insurance_only: 社会保険のみ, not_dependent: 扶養していない (選択肢: social_insurance_and_tax, tax_only, social_insurance_only, not_dependent)
    - **income** (任意): integer(int32) - 所得 配偶者は「扶養状況」がsocial_insurance_only又はnot_dependentの場合のみ更新可能。配偶者以外は更新可能。 配偶者で「扶養状況」がsocial_insurance_and_tax又はtax_onlyの場合、「給与収入」、「給与以外の所得」から自動で「所得」が計算されます。 (最小: 0, 最大: 999999999)
    - **employment_revenue** (任意): integer(int32) - 給与収入 配偶者は「扶養状況」がsocial_insurance_and_tax又はtax_onlyの場合のみ更新可能。配偶者以外は更新不可。更新不可の場合は0となります。 (最小: 0, 最大: 999999999)
    - **all_other_income** (任意): integer(int32) - 給与以外の所得 配偶者は「扶養状況」がsocial_insurance_and_tax又はtax_onlyの場合のみ更新可能。配偶者以外は更新不可。更新不可の場合は0となります。 (最小: 0, 最大: 999999999)
    - **disability_type** (任意): string - 障害に該当するか null不可 na: 障害なし, general: 一般の障害者, heavy: 特別障害者 (選択肢: na, general, heavy)
    - **residence_type** (任意): string - 同居・別居 null不可 live_in: 同居, resident: 別居(国内), non_resident: 別居(国外) (選択肢: live_in, resident, non_resident)
    - **zipcode1** (任意): string - 住民票住所の郵便番号1 「同居・別居」が「同居」の場合は「年末調整従業員情報」の「住民票住所の郵便番号1」を登録 例: `141`
    - **zipcode2** (任意): string - 住民票住所の郵便番号2 「同居・別居」が「同居」の場合は「年末調整従業員情報」の「住民票住所の郵便番号2」を登録 例: `0031`
    - **prefecture_code** (任意): integer - 住民票住所の都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄)  「同居・別居」が「同居」の場合は「年末調整従業員情報」の「住民票住所の都道府県コード」を登録 例: `12` (最小: -1, 最大: 46)
    - **address** (任意): string - 住民票住所の市区町村以降の住所 「同居・別居」が「同居」の場合は「年末調整従業員情報」の「住民票住所の市区町村以降の住所」を登録 例: `品川区大崎1-2-2`
    - **address_kana** (任意): string - 住民票住所の市区町村以降の住所カナ 「同居・別居」が「同居」の場合は「年末調整従業員情報」の「住民票住所の市区町村以降の住所カナ」を登録 例: `シナガワクオオサキ1-2-2`
    - **annual_remittance_amount** (任意): integer(int32) - 国外居住親族への年間の送金額 「同居・別居」が「同居」、「別居(国内)」の場合は登録不可 (最小: 0, 最大: 999999999)
    - **non_resident_dependents_reason** (任意): string(string) - 非居住者である親族の条件 none: なし, over_16_to_under_30_or_over_70: 16歳以上30歳未満又は70歳以上, study_abroad: 留学, handicapped: 障害者, over_38_man: 38万円以上の支払 続柄が「配偶者」または「同居・別居」が「同居」、「別居(国内)」の場合は登録不可 (選択肢: none, over_16_to_under_30_or_over_70, study_abroad, handicapped, over_38_man)
    - **is_resident_tax_only_deduction** (任意): boolean - 住民税のみの控除対象かどうか
    - **retirement_income** (任意): integer(int32) - 退職所得 (最小: 0, 最大: 999999999)

### PUT /api/v1/yearend_adjustments/{year}/previous_jobs/{employee_id}

**操作**: 年末調整従業員前職情報の更新

**説明**: 概要 指定した従業員の前職情報を更新します。 注意点 本APIは、年末調整が確定済みの従業員には非対応です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| year | path | はい | integer | 更新対象年 |
| employee_id | path | はい | integer | 従業員ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 更新対象事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **previous_job** **(必須)**: object
  - **income** **(必須)**: integer - 前職の支払金額 例: `5000000` (最小: -999999999, 最大: 999999999)
  - **deduction** **(必須)**: integer - 前職の社会保険料等の金額 例: `1200000` (最小: -999999999, 最大: 999999999)
  - **withholding_tax_amount** **(必須)**: integer - 前職の源泉徴収額 例: `100000` (最小: -999999999, 最大: 999999999)
  - **company_name** **(必須)**: string - 前職の社名 例: `株式会社 前職`
  - **company_address** **(必須)**: string - 前職の事業所住所 例: `品川区大崎1-2-2`
  - **retire_date** **(必須)**: string(date) - 前職の退職日 現在年-10年1月1日から現在年+5年12月31日まで登録可能 例: `2022-03-31`

### レスポンス (200)

successful operation

- **previous_job** (任意): object
  - **income** (任意): integer - 前職の支払金額 例: `5000000` (最小: -999999999, 最大: 999999999)
  - **deduction** (任意): integer - 前職の社会保険料等の金額 例: `1200000` (最小: -999999999, 最大: 999999999)
  - **withholding_tax_amount** (任意): integer - 前職の源泉徴収額 例: `100000` (最小: -999999999, 最大: 999999999)
  - **company_name** (任意): string - 前職の社名 例: `株式会社 前職`
  - **company_address** (任意): string - 前職の事業所住所 例: `品川区大崎1-2-2`
  - **retire_date** (任意): string(date) - 前職の退職日 現在年-10年1月1日から現在年+5年12月31日まで登録可能 例: `2022-03-31`

### DELETE /api/v1/yearend_adjustments/{year}/previous_jobs/{employee_id}

**操作**: 年末調整従業員前職情報の削除

**説明**: 概要 指定した従業員の前職情報を削除します。 注意点 本APIは、年末調整が確定済みの従業員には非対応です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| year | path | はい | integer | 更新対象年 |
| employee_id | path | はい | integer | 従業員ID |

### レスポンス (204)

successful operation

### POST /api/v1/yearend_adjustments/{year}/insurances/{employee_id}

**操作**: 年末調整従業員保険料情報の作成

**説明**: 概要 指定した従業員の保険料情報を作成します。 注意点 本APIは、年末調整が確定済みの従業員には非対応です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| year | path | はい | integer | 作成対象年 |
| employee_id | path | はい | integer | 従業員ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 更新対象事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **insurance** **(必須)**: object
  - **type** **(必須)**: string - 保険の種類 life_care_pension_insurance: 生命保険・介護医療保険・個人年金保険, earthquake_non_life_insurance: 地震保険・旧長期損害保険, social_insurance: 社会保険, other_insurance: その他の保険（小規模企業共済等） (選択肢: life_care_pension_insurance, earthquake_non_life_insurance, social_insurance, other_insurance)
  - **category** **(必須)**: string - 区分<br>
保険会社等が発行する証明書類に基づいて区分を設定してください。<br>
保険の種類によって設定可能な値が変わります。<br>
・life_care_pension_insurance<br>
　life: 生命保険<br>
　care: 介護保険<br>
　pension: 個人年金保険<br>
・earthquake_non_life_insurance<br>
　earthquake: 地震保険<br>
　old_long_term_non_life: 旧長期損害保険<br>
・social_insurance<br>
　national_pension: 国民年金<br>
　national_pension_fund_premium: 国民年金基金<br>
　national_health: 国民健康保険<br>
　health: 健康保険<br>
　care_insurance_deduction_of_pension: 介護保険<br>
　employee_pension: 厚生年金<br>
　advanced_elderly_medical: 後期高齢者医療保険<br>
　none: その他（印刷後に手書き）<br>
・other_insurance<br>
　sema: 独立行政法人中小企業基盤整備機構の共済契約の掛金<br>
　idc: 個人型確定拠出年金（iDeCo）<br>
　cdc: 企業型確定拠出年金<br>
　dsma: 心身障害者扶養共済制度に関する契約の掛金<br> (選択肢: life, care, pension, earthquake, old_long_term_non_life, national_pension, national_pension_fund_premium, national_health, care_insurance_deduction_of_pension, health, employee_pension, advanced_elderly_medical, sema, idc, cdc, dsma, none) 例: `life`
  - **new_or_old** **(必須)**: string - 新旧区分<br>
区分が生命保険または個人年金保険の時のみ、新制度なら new を、旧制度なら old を指定します。<br>
上記以外の保険では none を指定してください。 (選択肢: new, old, none)
  - **company_name** (任意): string - 保険会社等の名称<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `freee生命保険株式会社`
  - **kind_of_purpose** (任意): string - 保険等の種類（目的）<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `利差配当付終身`
  - **period** (任意): string - 保険期間又は年金支払期間<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 (選択肢: 終身, 0年, 1年, 2年, 3年, 4年, 5年, 6年, 7年, 8年, 9年, 10年, 11年, 12年, 13年, 14年, 15年, 16年, 17年, 18年, 19年, 20年, 21年, 22年, 23年, 24年, 25年, 26年, 27年, 28年, 29年, 30年, 31年, 32年, 33年, 34年, 35年, 36年, 37年, 38年, 39年, 40年, 41年, 42年, 43年, 44年, 45年, 46年, 47年, 48年, 49年, 50年, 51年, 52年, 53年, 54年, 55年, 56年, 57年, 58年, 59年, 60年, 61年, 62年, 63年, 64年, 65年, 66年, 67年, 68年, 69年, 70年, 71年, 72年, 73年, 74年, 75年, 76年, 77年, 78年, 79年, 80年, 81年, 82年, 83年, 84年, 85年, 86年, 87年, 88年, 89年, 90年, 91年, 92年, 93年, 94年, 95年, 96年, 97年, 98年, 99年, 100年, ) 例: `終身`
  - **policyholder_last_name** (任意): string - 保険等の契約者 姓<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `契約`
  - **policyholder_first_name** (任意): string - 保険等の契約者 名<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `太郎`
  - **recipient_last_name** (任意): string - 保険金等の受取人 姓<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険、地震保険・旧長期損害保険または社会保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `受取`
  - **recipient_first_name** (任意): string - 保険金等の受取人 名<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険、地震保険・旧長期損害保険または社会保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `太郎`
  - **recipient_relationship** (任意): string - 保険金等の受取人 あなたとの続柄 myself: 本人, husband: 夫, wife: 妻, father: 父, mother: 母, child: 子, senior_brother: 兄, junior_brother: 弟, senior_sister: 姉, junior_sister: 妹, grandchild: 孫, grandfather: 祖父, grandmother: 祖母, father_in_law: 義父, mother_in_law: 義母, grandfather_in_law: 義祖父, grandmother_in_law: 義祖母, other: その他, "": 空欄<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険、地震保険・旧長期損害保険または社会保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 (選択肢: myself, husband, wife, father, mother, child, senior_brother, junior_brother, senior_sister, junior_sister, grandchild, grandfather, grandmother, father_in_law, mother_in_law, grandfather_in_law, grandmother_in_law, other, ) 例: `child`
  - **payment_start_date** (任意): string - 年金の支払開始日 1900年1月1日から現在年+100の12月31日まで登録可能。<br>
区分が個人年金保険の時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `2000-04-01` (パターン: ^([1-2][0-9]{3}-[0-9]{2}-[0-9]{2})?$)
  - **amount** **(必須)**: integer - 保険料額 例: `1000000` (最小: 0, 最大: 99999999)

### レスポンス (201)

successful operation

- **insurances** (任意): array[object]
  配列の要素:
    - **id** (任意): integer - 保険料id (最小: 1, 最大: 2147483647)
    - **type** (任意): string - 保険の種類 life_care_pension_insurance: 生命保険・介護医療保険・個人年金保険, earthquake_non_life_insurance: 地震保険・旧長期損害保険, social_insurance: 社会保険, other_insurance: その他の保険（小規模企業共済等） (選択肢: life_care_pension_insurance, earthquake_non_life_insurance, social_insurance, other_insurance)
    - **category** (任意): string - 区分<br>
保険会社等が発行する証明書類に基づいて区分を設定してください。<br>
保険の種類によって設定可能な値が変わります。<br>
・life_care_pension_insurance<br>
　life: 生命保険<br>
　care: 介護保険<br>
　pension: 個人年金保険<br>
・earthquake_non_life_insurance<br>
　earthquake: 地震保険<br>
　old_long_term_non_life: 旧長期損害保険<br>
・social_insurance<br>
　national_pension: 国民年金<br>
　national_pension_fund_premium: 国民年金基金<br>
　national_health: 国民健康保険<br>
　health: 健康保険<br>
　care_insurance_deduction_of_pension: 介護保険<br>
　employee_pension: 厚生年金<br>
　advanced_elderly_medical: 後期高齢者医療保険<br>
　none: その他（印刷後に手書き）<br>
・other_insurance<br>
　sema: 独立行政法人中小企業基盤整備機構の共済契約の掛金<br>
　idc: 個人型確定拠出年金（iDeCo）<br>
　cdc: 企業型確定拠出年金<br>
　dsma: 心身障害者扶養共済制度に関する契約の掛金<br> (選択肢: life, care, pension, earthquake, old_long_term_non_life, national_pension, national_pension_fund_premium, national_health, care_insurance_deduction_of_pension, health, employee_pension, advanced_elderly_medical, sema, idc, cdc, dsma, none) 例: `life`
    - **new_or_old** (任意): string - 新旧区分<br>
区分が生命保険または個人年金保険の時のみ、新制度なら new を、旧制度なら old を指定します。<br>
上記以外の保険では none を指定してください。 (選択肢: new, old, none)
    - **company_name** (任意): string - 保険会社等の名称<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `freee生命保険株式会社`
    - **kind_of_purpose** (任意): string - 保険等の種類（目的）<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `利差配当付終身`
    - **period** (任意): string - 保険期間又は年金支払期間<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 (選択肢: 終身, 0年, 1年, 2年, 3年, 4年, 5年, 6年, 7年, 8年, 9年, 10年, 11年, 12年, 13年, 14年, 15年, 16年, 17年, 18年, 19年, 20年, 21年, 22年, 23年, 24年, 25年, 26年, 27年, 28年, 29年, 30年, 31年, 32年, 33年, 34年, 35年, 36年, 37年, 38年, 39年, 40年, 41年, 42年, 43年, 44年, 45年, 46年, 47年, 48年, 49年, 50年, 51年, 52年, 53年, 54年, 55年, 56年, 57年, 58年, 59年, 60年, 61年, 62年, 63年, 64年, 65年, 66年, 67年, 68年, 69年, 70年, 71年, 72年, 73年, 74年, 75年, 76年, 77年, 78年, 79年, 80年, 81年, 82年, 83年, 84年, 85年, 86年, 87年, 88年, 89年, 90年, 91年, 92年, 93年, 94年, 95年, 96年, 97年, 98年, 99年, 100年, ) 例: `終身`
    - **policyholder_last_name** (任意): string - 保険等の契約者 姓<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `契約`
    - **policyholder_first_name** (任意): string - 保険等の契約者 名<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `太郎`
    - **recipient_last_name** (任意): string - 保険金等の受取人 姓<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険、地震保険・旧長期損害保険または社会保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `受取`
    - **recipient_first_name** (任意): string - 保険金等の受取人 名<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険、地震保険・旧長期損害保険または社会保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `太郎`
    - **recipient_relationship** (任意): string - 保険金等の受取人 あなたとの続柄 myself: 本人, husband: 夫, wife: 妻, father: 父, mother: 母, child: 子, senior_brother: 兄, junior_brother: 弟, senior_sister: 姉, junior_sister: 妹, grandchild: 孫, grandfather: 祖父, grandmother: 祖母, father_in_law: 義父, mother_in_law: 義母, grandfather_in_law: 義祖父, grandmother_in_law: 義祖母, other: その他, "": 空欄<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険、地震保険・旧長期損害保険または社会保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 (選択肢: myself, husband, wife, father, mother, child, senior_brother, junior_brother, senior_sister, junior_sister, grandchild, grandfather, grandmother, father_in_law, mother_in_law, grandfather_in_law, grandmother_in_law, other, ) 例: `child`
    - **payment_start_date** (任意): string - 年金の支払開始日 1900年1月1日から現在年+100の12月31日まで登録可能。<br>
区分が個人年金保険の時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `2000-04-01` (パターン: ^([1-2][0-9]{3}-[0-9]{2}-[0-9]{2})?$)
    - **amount** (任意): integer - 保険料額 例: `1000000` (最小: 0, 最大: 99999999)
    - **certification_type** (任意): string - 電子的控除証明書などの認証方法を利用した場合、その認証方法が反映されます。<br>
xml: 電子的控除証明書を利用。証明書画像データの提出が免除されます。またrecipient_first_name、recipient_last_name、recipient_relationship以外のカラムが更新不可となります。 (選択肢: xml)

### PUT /api/v1/yearend_adjustments/{year}/insurances/{employee_id}/{id}

**操作**: 年末調整従業員保険料情報の更新

**説明**: 概要 指定した従業員の保険料情報を更新します。 注意点 本APIは、年末調整が確定済みの従業員には非対応です。 certification_type="xml"の場合、recipient_first_name、recipient_last_name、recipient_relationshipのみが更新の対象となります。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| year | path | はい | integer | 更新対象年 |
| employee_id | path | はい | integer | 従業員ID |
| id | path | はい | integer | 保険料ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 更新対象事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **insurance** **(必須)**: object
  - **type** **(必須)**: string - 保険の種類 life_care_pension_insurance: 生命保険・介護医療保険・個人年金保険, earthquake_non_life_insurance: 地震保険・旧長期損害保険, social_insurance: 社会保険, other_insurance: その他の保険（小規模企業共済等） (選択肢: life_care_pension_insurance, earthquake_non_life_insurance, social_insurance, other_insurance)
  - **category** **(必須)**: string - 区分<br>
保険会社等が発行する証明書類に基づいて区分を設定してください。<br>
保険の種類によって設定可能な値が変わります。<br>
・life_care_pension_insurance<br>
　life: 生命保険<br>
　care: 介護保険<br>
　pension: 個人年金保険<br>
・earthquake_non_life_insurance<br>
　earthquake: 地震保険<br>
　old_long_term_non_life: 旧長期損害保険<br>
・social_insurance<br>
　national_pension: 国民年金<br>
　national_pension_fund_premium: 国民年金基金<br>
　national_health: 国民健康保険<br>
　health: 健康保険<br>
　care_insurance_deduction_of_pension: 介護保険<br>
　employee_pension: 厚生年金<br>
　advanced_elderly_medical: 後期高齢者医療保険<br>
　none: その他（印刷後に手書き）<br>
・other_insurance<br>
　sema: 独立行政法人中小企業基盤整備機構の共済契約の掛金<br>
　idc: 個人型確定拠出年金（iDeCo）<br>
　cdc: 企業型確定拠出年金<br>
　dsma: 心身障害者扶養共済制度に関する契約の掛金<br> (選択肢: life, care, pension, earthquake, old_long_term_non_life, national_pension, national_pension_fund_premium, national_health, care_insurance_deduction_of_pension, health, employee_pension, advanced_elderly_medical, sema, idc, cdc, dsma, none) 例: `life`
  - **new_or_old** **(必須)**: string - 新旧区分<br>
区分が生命保険または個人年金保険の時のみ、新制度なら new を、旧制度なら old を指定します。<br>
上記以外の保険では none を指定してください。 (選択肢: new, old, none)
  - **company_name** (任意): string - 保険会社等の名称<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `freee生命保険株式会社`
  - **kind_of_purpose** (任意): string - 保険等の種類（目的）<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `利差配当付終身`
  - **period** (任意): string - 保険期間又は年金支払期間<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 (選択肢: 終身, 0年, 1年, 2年, 3年, 4年, 5年, 6年, 7年, 8年, 9年, 10年, 11年, 12年, 13年, 14年, 15年, 16年, 17年, 18年, 19年, 20年, 21年, 22年, 23年, 24年, 25年, 26年, 27年, 28年, 29年, 30年, 31年, 32年, 33年, 34年, 35年, 36年, 37年, 38年, 39年, 40年, 41年, 42年, 43年, 44年, 45年, 46年, 47年, 48年, 49年, 50年, 51年, 52年, 53年, 54年, 55年, 56年, 57年, 58年, 59年, 60年, 61年, 62年, 63年, 64年, 65年, 66年, 67年, 68年, 69年, 70年, 71年, 72年, 73年, 74年, 75年, 76年, 77年, 78年, 79年, 80年, 81年, 82年, 83年, 84年, 85年, 86年, 87年, 88年, 89年, 90年, 91年, 92年, 93年, 94年, 95年, 96年, 97年, 98年, 99年, 100年, ) 例: `終身`
  - **policyholder_last_name** (任意): string - 保険等の契約者 姓<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `契約`
  - **policyholder_first_name** (任意): string - 保険等の契約者 名<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `太郎`
  - **recipient_last_name** (任意): string - 保険金等の受取人 姓<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険、地震保険・旧長期損害保険または社会保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `受取`
  - **recipient_first_name** (任意): string - 保険金等の受取人 名<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険、地震保険・旧長期損害保険または社会保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `太郎`
  - **recipient_relationship** (任意): string - 保険金等の受取人 あなたとの続柄 myself: 本人, husband: 夫, wife: 妻, father: 父, mother: 母, child: 子, senior_brother: 兄, junior_brother: 弟, senior_sister: 姉, junior_sister: 妹, grandchild: 孫, grandfather: 祖父, grandmother: 祖母, father_in_law: 義父, mother_in_law: 義母, grandfather_in_law: 義祖父, grandmother_in_law: 義祖母, other: その他, "": 空欄<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険、地震保険・旧長期損害保険または社会保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 (選択肢: myself, husband, wife, father, mother, child, senior_brother, junior_brother, senior_sister, junior_sister, grandchild, grandfather, grandmother, father_in_law, mother_in_law, grandfather_in_law, grandmother_in_law, other, ) 例: `child`
  - **payment_start_date** (任意): string - 年金の支払開始日 1900年1月1日から現在年+100の12月31日まで登録可能。<br>
区分が個人年金保険の時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `2000-04-01` (パターン: ^([1-2][0-9]{3}-[0-9]{2}-[0-9]{2})?$)
  - **amount** **(必須)**: integer - 保険料額 例: `1000000` (最小: 0, 最大: 99999999)

### レスポンス (200)

successful operation

- **insurances** (任意): array[object]
  配列の要素:
    - **id** (任意): integer - 保険料id (最小: 1, 最大: 2147483647)
    - **type** (任意): string - 保険の種類 life_care_pension_insurance: 生命保険・介護医療保険・個人年金保険, earthquake_non_life_insurance: 地震保険・旧長期損害保険, social_insurance: 社会保険, other_insurance: その他の保険（小規模企業共済等） (選択肢: life_care_pension_insurance, earthquake_non_life_insurance, social_insurance, other_insurance)
    - **category** (任意): string - 区分<br>
保険会社等が発行する証明書類に基づいて区分を設定してください。<br>
保険の種類によって設定可能な値が変わります。<br>
・life_care_pension_insurance<br>
　life: 生命保険<br>
　care: 介護保険<br>
　pension: 個人年金保険<br>
・earthquake_non_life_insurance<br>
　earthquake: 地震保険<br>
　old_long_term_non_life: 旧長期損害保険<br>
・social_insurance<br>
　national_pension: 国民年金<br>
　national_pension_fund_premium: 国民年金基金<br>
　national_health: 国民健康保険<br>
　health: 健康保険<br>
　care_insurance_deduction_of_pension: 介護保険<br>
　employee_pension: 厚生年金<br>
　advanced_elderly_medical: 後期高齢者医療保険<br>
　none: その他（印刷後に手書き）<br>
・other_insurance<br>
　sema: 独立行政法人中小企業基盤整備機構の共済契約の掛金<br>
　idc: 個人型確定拠出年金（iDeCo）<br>
　cdc: 企業型確定拠出年金<br>
　dsma: 心身障害者扶養共済制度に関する契約の掛金<br> (選択肢: life, care, pension, earthquake, old_long_term_non_life, national_pension, national_pension_fund_premium, national_health, care_insurance_deduction_of_pension, health, employee_pension, advanced_elderly_medical, sema, idc, cdc, dsma, none) 例: `life`
    - **new_or_old** (任意): string - 新旧区分<br>
区分が生命保険または個人年金保険の時のみ、新制度なら new を、旧制度なら old を指定します。<br>
上記以外の保険では none を指定してください。 (選択肢: new, old, none)
    - **company_name** (任意): string - 保険会社等の名称<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `freee生命保険株式会社`
    - **kind_of_purpose** (任意): string - 保険等の種類（目的）<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `利差配当付終身`
    - **period** (任意): string - 保険期間又は年金支払期間<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 (選択肢: 終身, 0年, 1年, 2年, 3年, 4年, 5年, 6年, 7年, 8年, 9年, 10年, 11年, 12年, 13年, 14年, 15年, 16年, 17年, 18年, 19年, 20年, 21年, 22年, 23年, 24年, 25年, 26年, 27年, 28年, 29年, 30年, 31年, 32年, 33年, 34年, 35年, 36年, 37年, 38年, 39年, 40年, 41年, 42年, 43年, 44年, 45年, 46年, 47年, 48年, 49年, 50年, 51年, 52年, 53年, 54年, 55年, 56年, 57年, 58年, 59年, 60年, 61年, 62年, 63年, 64年, 65年, 66年, 67年, 68年, 69年, 70年, 71年, 72年, 73年, 74年, 75年, 76年, 77年, 78年, 79年, 80年, 81年, 82年, 83年, 84年, 85年, 86年, 87年, 88年, 89年, 90年, 91年, 92年, 93年, 94年, 95年, 96年, 97年, 98年, 99年, 100年, ) 例: `終身`
    - **policyholder_last_name** (任意): string - 保険等の契約者 姓<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `契約`
    - **policyholder_first_name** (任意): string - 保険等の契約者 名<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険または地震保険・旧長期損害保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `太郎`
    - **recipient_last_name** (任意): string - 保険金等の受取人 姓<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険、地震保険・旧長期損害保険または社会保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `受取`
    - **recipient_first_name** (任意): string - 保険金等の受取人 名<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険、地震保険・旧長期損害保険または社会保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `太郎`
    - **recipient_relationship** (任意): string - 保険金等の受取人 あなたとの続柄 myself: 本人, husband: 夫, wife: 妻, father: 父, mother: 母, child: 子, senior_brother: 兄, junior_brother: 弟, senior_sister: 姉, junior_sister: 妹, grandchild: 孫, grandfather: 祖父, grandmother: 祖母, father_in_law: 義父, mother_in_law: 義母, grandfather_in_law: 義祖父, grandmother_in_law: 義祖母, other: その他, "": 空欄<br>
保険の種類にて、生命保険・介護医療保険・個人年金保険、地震保険・旧長期損害保険または社会保険を選択している時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 (選択肢: myself, husband, wife, father, mother, child, senior_brother, junior_brother, senior_sister, junior_sister, grandchild, grandfather, grandmother, father_in_law, mother_in_law, grandfather_in_law, grandmother_in_law, other, ) 例: `child`
    - **payment_start_date** (任意): string - 年金の支払開始日 1900年1月1日から現在年+100の12月31日まで登録可能。<br>
区分が個人年金保険の時のみ、入力した値が反映されます。<br>
上記以外の保険では入力した値は反映されません。 例: `2000-04-01` (パターン: ^([1-2][0-9]{3}-[0-9]{2}-[0-9]{2})?$)
    - **amount** (任意): integer - 保険料額 例: `1000000` (最小: 0, 最大: 99999999)
    - **certification_type** (任意): string - 電子的控除証明書などの認証方法を利用した場合、その認証方法が反映されます。<br>
xml: 電子的控除証明書を利用。証明書画像データの提出が免除されます。またrecipient_first_name、recipient_last_name、recipient_relationship以外のカラムが更新不可となります。 (選択肢: xml)

### DELETE /api/v1/yearend_adjustments/{year}/insurances/{employee_id}/{id}

**操作**: 年末調整従業員保険料情報の削除

**説明**: 概要 指定した従業員の保険料情報を削除します。 注意点 本APIは、年末調整が確定済みの従業員には非対応です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| year | path | はい | integer | 更新対象年 |
| employee_id | path | はい | integer | 従業員ID |
| id | path | はい | integer | 保険料ID |

### レスポンス (204)

successful operation

### PUT /api/v1/yearend_adjustments/{year}/housing_loan_deductions/{employee_id}

**操作**: 年末調整従業員住宅ローン控除額の更新

**説明**: 概要 指定した従業員の住宅ローン控除額を更新します。 注意点 本APIは、年末調整が確定済みの従業員には非対応です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| year | path | はい | integer | 更新対象年 |
| employee_id | path | はい | integer | 従業員ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 更新対象事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **housing_loan_deduction** **(必須)**: integer(int32) - 住宅借入金等特別控除（必須） 例: `1` (最小: 0, 最大: 999999999)

### レスポンス (200)

successful operation

- **housing_loan_deduction** (任意): integer(int32) - 住宅借入金等特別控除 例: `1` (最小: 0, 最大: 999999999)
- **housing_loans** (任意): array[object] - 住宅ローン
  配列の要素:
    - **id** (任意): integer(int32) - 住宅ローンID 例: `1` (最小: 1, 最大: 2147483647)
    - **residence_start_date** (任意): string(date) - 居住開始の年月日 例: `2022-03-31`
    - **remaining_balance_at_yearend** (任意): integer - 住宅借入金等年末残高 例: `5000000` (最小: -999999999, 最大: 999999999)
    - **category** (任意): string - 住宅借入金等特別控除区分 general: 住: 一般の住宅借入金等, qualified: 認: 認定住宅の新築等, extension: 増: 特定増改築等, earthquake: 震: 震災特例法による特別控除 (選択肢: general, qualified, extension, earthquake)
    - **specific_case_type** (任意): string - 特定取得/特別特定取得 not_qualified: 該当しない, specified: 特定取得, special_specified_or_special_exception: 特別特定取得または特別特例取得, exception_special_exception: 特例特別特例取得 special_residential_house 特家 (選択肢: not_qualified, specified, special_specified_or_special_exception, exception_special_exception, special_residential_house)

### POST /api/v1/yearend_adjustments/{year}/housing_loans/{employee_id}

**操作**: 年末調整従業員住宅ローンの作成

**説明**: 概要 指定した従業員の住宅ローンを作成します。 注意点 本APIは、年末調整が確定済みの従業員には非対応です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| year | path | はい | integer | 作成対象年 |
| employee_id | path | はい | integer | 従業員ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 更新対象事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **housing_loan** **(必須)**: object
  - **residence_start_date** **(必須)**: string(date) - 居住開始の年月日 2000年1月1日から現在年+5の12月31日まで登録可能 例: `2022-03-31` (パターン: ^[2-9][0-9]{3}-[0-9]{2}-[0-9]{2}$)
  - **remaining_balance_at_yearend** **(必須)**: integer - 住宅借入金等年末残高 例: `5000000` (最小: -999999999, 最大: 999999999)
  - **category** **(必須)**: string - 住宅借入金等特別控除区分 general: 住: 一般の住宅借入金等, qualified: 認: 認定住宅の新築等, extension: 増: 特定増改築等, earthquake: 震: 震災特例法による特別控除 (選択肢: general, qualified, extension, earthquake)
  - **specific_case_type** **(必須)**: string - 特定取得/特別特定取得 not_qualified: 該当しない, specified: 特定取得, special_specified_or_special_exception: 特別特定取得または特別特例取得, exception_special_exception: 特例特別特例取得 special_residential_house 特家 (選択肢: not_qualified, specified, special_specified_or_special_exception, exception_special_exception, special_residential_house)

### レスポンス (201)

successful operation

- **housing_loan_deduction** (任意): integer(int32) - 住宅借入金等特別控除 例: `500000` (最小: 0, 最大: 999999999)
- **housing_loans** (任意): array[object] - 住宅ローン
  配列の要素:
    - **id** (任意): integer(int32) - 住宅ローンID 例: `1` (最小: 1, 最大: 2147483647)
    - **residence_start_date** (任意): string(date) - 居住開始の年月日 例: `2022-03-31`
    - **remaining_balance_at_yearend** (任意): integer - 住宅借入金等年末残高 例: `5000000` (最小: -999999999, 最大: 999999999)
    - **category** (任意): string - 住宅借入金等特別控除区分 general: 住: 一般の住宅借入金等, qualified: 認: 認定住宅の新築等, extension: 増: 特定増改築等, earthquake: 震: 震災特例法による特別控除 (選択肢: general, qualified, extension, earthquake)
    - **specific_case_type** (任意): string - 特定取得/特別特定取得 not_qualified: 該当しない, specified: 特定取得, special_specified_or_special_exception: 特別特定取得または特別特例取得, exception_special_exception: 特例特別特例取得 special_residential_house 特家 (選択肢: not_qualified, specified, special_specified_or_special_exception, exception_special_exception, special_residential_house)

### PUT /api/v1/yearend_adjustments/{year}/housing_loans/{employee_id}/{id}

**操作**: 年末調整従業員住宅ローンの更新

**説明**: 概要 指定した従業員の住宅ローンを更新します。 注意点 本APIは、年末調整が確定済みの従業員には非対応です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| year | path | はい | integer | 更新対象年 |
| employee_id | path | はい | integer | 従業員ID |
| id | path | はい | integer | 住宅ローンID |

### リクエストボディ

- **company_id** **(必須)**: integer(int32) - 更新対象事業所ID（必須） 例: `1` (最小: 1, 最大: 2147483647)
- **housing_loan** **(必須)**: object
  - **residence_start_date** **(必須)**: string(date) - 居住開始の年月日 2000年1月1日から現在年+5の12月31日まで登録可能 例: `2022-03-31` (パターン: ^[2-9][0-9]{3}-[0-9]{2}-[0-9]{2}$)
  - **remaining_balance_at_yearend** **(必須)**: integer - 住宅借入金等年末残高 例: `5000000` (最小: -999999999, 最大: 999999999)
  - **category** **(必須)**: string - 住宅借入金等特別控除区分 general: 住: 一般の住宅借入金等, qualified: 認: 認定住宅の新築等, extension: 増: 特定増改築等, earthquake: 震: 震災特例法による特別控除 (選択肢: general, qualified, extension, earthquake)
  - **specific_case_type** **(必須)**: string - 特定取得/特別特定取得 not_qualified: 該当しない, specified: 特定取得, special_specified_or_special_exception: 特別特定取得または特別特例取得, exception_special_exception: 特例特別特例取得 special_residential_house 特家 (選択肢: not_qualified, specified, special_specified_or_special_exception, exception_special_exception, special_residential_house)

### レスポンス (200)

successful operation

- **housing_loan_deduction** (任意): integer(int32) - 住宅借入金等特別控除 例: `500000` (最小: 0, 最大: 999999999)
- **housing_loans** (任意): array[object] - 住宅ローン
  配列の要素:
    - **id** (任意): integer(int32) - 住宅ローンID 例: `1` (最小: 1, 最大: 2147483647)
    - **residence_start_date** (任意): string(date) - 居住開始の年月日 例: `2022-03-31`
    - **remaining_balance_at_yearend** (任意): integer - 住宅借入金等年末残高 例: `5000000` (最小: -999999999, 最大: 999999999)
    - **category** (任意): string - 住宅借入金等特別控除区分 general: 住: 一般の住宅借入金等, qualified: 認: 認定住宅の新築等, extension: 増: 特定増改築等, earthquake: 震: 震災特例法による特別控除 (選択肢: general, qualified, extension, earthquake)
    - **specific_case_type** (任意): string - 特定取得/特別特定取得 not_qualified: 該当しない, specified: 特定取得, special_specified_or_special_exception: 特別特定取得または特別特例取得, exception_special_exception: 特例特別特例取得 special_residential_house 特家 (選択肢: not_qualified, specified, special_specified_or_special_exception, exception_special_exception, special_residential_house)

### DELETE /api/v1/yearend_adjustments/{year}/housing_loans/{employee_id}/{id}

**操作**: 年末調整従業員住宅ローンの削除

**説明**: 概要 指定した従業員の住宅ローンを削除します。 注意点 本APIは、年末調整が確定済みの従業員には非対応です。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| year | path | はい | integer | 更新対象年 |
| employee_id | path | はい | integer | 従業員ID |
| id | path | はい | integer | 住宅ローンID |

### レスポンス (204)

successful operation



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
