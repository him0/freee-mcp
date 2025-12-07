# Companies

## 概要

事業所

## エンドポイント一覧

### GET /api/1/companies

**操作**: 事業所一覧の取得

**説明**: 概要 ユーザーが所属する事業所一覧を取得する

### レスポンス (200)

- **companies** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
    - **name** **(必須)**: string - 事業所名 例: `freee事務所`
    - **name_kana** **(必須)**: string - 事業所名（カナ） 例: `フリージムショ`
    - **display_name** **(必須)**: string - 事業所名 例: `freee事務所`
    - **company_number** **(必須)**: string - 事業所番号（ハイフン無し)(半角英数字10桁) 例: `97e576421b`
    - **role** **(必須)**: string - ユーザーの権限

* admin - 管理者
* simple_accounting - 一般（経理）
* read_only - 取引登録のみ
* self_only - 閲覧のみ
* workflow - 申請・承認 (選択肢: admin, simple_accounting, self_only, read_only, workflow) 例: `admin`

### GET /api/1/companies/{id}

**操作**: 事業所の取得

**説明**: 概要 ユーザーが所属する事業所を取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 事業所ID |
| details | query | いいえ | boolean | 取得情報に勘定科目・税区分コード・品目・取引先・部門・メモタグ・口座の一覧を含める (選択肢: true) |
| account_items | query | いいえ | boolean | 取得情報に勘定科目一覧を含める (選択肢: true) |
| taxes | query | いいえ | boolean | 取得情報に税区分コード一覧を含める (選択肢: true) |
| items | query | いいえ | boolean | 取得情報に品目一覧を含める (選択肢: true) |
| partners | query | いいえ | boolean | 取得情報に取引先一覧を含める (選択肢: true) |
| sections | query | いいえ | boolean | 取得情報に部門一覧を含める (選択肢: true) |
| tags | query | いいえ | boolean | 取得情報にメモタグ一覧を含める (選択肢: true) |
| walletables | query | いいえ | boolean | 取得情報に口座一覧を含める (選択肢: true) |

### レスポンス (200)

- **company** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **name** **(必須)**: string - 事業所の正式名称 (100文字以内) 例: `freee事務所`
  - **name_kana** **(必須)**: string - 正式名称フリガナ (100文字以内) 例: `フリージムショ`
  - **display_name** **(必須)**: string - 事業所名 例: `freee事務所`
  - **tax_at_source_calc_type** **(必須)**: integer(int64) - 源泉徴収税計算（0: 消費税を含める、1: 消費税を含めない） 例: `0` (最小: 0, 最大: 1)
  - **contact_name** **(必須)**: string - 担当者名 (50文字以内) 例: `user1`
  - **head_count** **(必須)**: integer(int64) - 従業員数（0: 経営者のみ、1: 2〜5人、2: 6〜10人、3: 11〜20人、4: 21〜30人、5: 31〜40人、6: 41〜100人、7: 100人以上、13: 21〜50人、14: 51〜100人、15: 101〜300人、16: 501〜1000人、17: 1001人以上、18: 301〜500人 例: `1` (最小: 0, 最大: 99)
  - **corporate_number** **(必須)**: string - 法人番号 (半角数字13桁、法人のみ) 例: `1234567890123`
  - **txn_number_format** **(必須)**: string - 仕訳番号形式（not_used: 使用しない、digits: 数字（例：5091824）、alnum: 英数字（例：59J0P）） (選択肢: not_used, digits, alnum) 例: `not_used`
  - **default_wallet_account_id** (任意): integer(int64) - デフォルトの決済口座が紐づく勘定科目ID 例: `1` (最小: 1)
  - **private_settlement** **(必須)**: boolean - プライベート資金/役員資金（false: 使用しない、true: 使用する） 例: `true`
  - **minus_format** **(必須)**: integer(int64) - マイナスの表示方法（0: -、 1: △） 例: `0` (最小: 0, 最大: 1)
  - **org_code** **(必須)**: integer - 事業所種別コード（1: 法人、 2: 個人事業主） 例: `1` (最小: 1, 最大: 2)
  - **company_number** **(必須)**: string - 事業所番号（ハイフン無し)(半角英数字10桁) 例: `97e576421b`
  - **role** **(必須)**: string - ユーザーの権限

* admin - 管理者
* simple_accounting - 一般（経理）
* read_only - 取引登録のみ
* self_only - 閲覧のみ
* workflow - 申請・承認 (選択肢: admin, simple_accounting, self_only, read_only, workflow) 例: `admin`
  - **phone1** **(必須)**: string - 電話番号１ 例: `03-1234-xxxx`
  - **phone2** **(必須)**: string - 電話番号２ 例: `090-1234-xxxx`
  - **fax** **(必須)**: string - FAX 例: `03-1234-xxxx`
  - **zipcode** **(必須)**: string - 郵便番号 例: `000-0000`
  - **prefecture_code** **(必須)**: integer(int64) - 都道府県コード（-1: 設定しない、0: 北海道、1:青森、2:岩手、3:宮城、4:秋田、5:山形、6:福島、7:茨城、8:栃木、9:群馬、10:埼玉、11:千葉、12:東京、13:神奈川、14:新潟、15:富山、16:石川、17:福井、18:山梨、19:長野、20:岐阜、21:静岡、22:愛知、23:三重、24:滋賀、25:京都、26:大阪、27:兵庫、28:奈良、29:和歌山、30:鳥取、31:島根、32:岡山、33:広島、34:山口、35:徳島、36:香川、37:愛媛、38:高知、39:福岡、40:佐賀、41:長崎、42:熊本、43:大分、44:宮崎、45:鹿児島、46:沖縄 例: `4` (最小: -1, 最大: 46)
  - **street_name1** **(必須)**: string - 市区町村・番地 例: `ＸＸ区ＹＹ１−１−１`
  - **street_name2** **(必須)**: string - 建物名・部屋番号など 例: `ビル１Ｆ`
  - **invoice_layout** **(必須)**: string - 請求書レイアウト
* `default_classic` - レイアウト１/クラシック (デフォルト)

* `standard_classic` - レイアウト２/クラシック

* `envelope_classic` - 封筒１/クラシック

* `carried_forward_standard_classic` - レイアウト３（繰越金額欄あり）/クラシック

* `carried_forward_envelope_classic` - 封筒２（繰越金額欄あり）/クラシック

* `default_modern` - レイアウト１/モダン

* `standard_modern` - レイアウト２/モダン

* `envelope_modern` - 封筒/モダン (選択肢: default_classic, standard_classic, envelope_classic, carried_forward_standard_classic, carried_forward_envelope_classic, default_modern, standard_modern, envelope_modern) 例: `default_classic`
  - **amount_fraction** **(必須)**: integer(int64) - 金額端数処理方法（0: 切り捨て、1: 切り上げ、2: 四捨五入） 例: `0` (最小: 0, 最大: 2)
  - **use_partner_code** **(必須)**: boolean - 取引先コードの利用設定（true: 有効、 false: 無効） 例: `true`
  - **industry_class** **(必須)**: string - 種別（agriculture_forestry_fisheries_ore: 農林水産業/鉱業,construction: 建設,manufacturing_processing: 製造/加工,it: IT,transportation_logistics: 運輸/物流,retail_wholesale: 小売/卸売,finance_insurance: 金融/保険,real_estate_rental: 不動産/レンタル,profession: 士業/学術/専門技術サービス,design_production: デザイン/制作,food: 飲食,leisure_entertainment: レジャー/娯楽,lifestyle: 生活関連サービス,education: 教育/学習支援,medical_welfare: 医療/福祉,other_services: その他サービス,other_association: NPO、一般社団法人等,other: その他, "": 未選択） (選択肢: agriculture_forestry_fisheries_ore, construction, manufacturing_processing, it, transportation_logistics, retail_wholesale, finance_insurance, real_estate_rental, profession, design_production, food, leisure_entertainment, lifestyle, education, medical_welfare, other_services, other_association, other, ) 例: `agriculture_forestry_fisheries_ore`
  - **industry_code** **(必須)**: string - ### 業種 法人<br>
  - '': 未選択
  - agriculture: 農業
  - forestry: 林業
  - fishing_industry: 漁業、水産養殖業
  - mining: 鉱業、採石業、砂利採取業
  - civil_contractors: 土木工事業
  - pavement: 舗装工事業
  - carpenter: とび、大工、左官等の建設工事業
  - renovation: リフォーム工事業
  - electrical_plumbing: 電気、管工事等の設備工事業
  - grocery: 食料品の製造加工業
  - machinery_manufacturing: 機械器具の製造加工業
  - printing: 印刷業
  - other_manufacturing: その他の製造加工業
  - software_development: 受託：ソフトウェア、アプリ開発業
  - system_development: 受託：システム開発業
  - survey_analysis: 受託：調査、分析等の情報処理業
  - server_management: 受託：サーバー運営管理
  - website_production: 受託：ウェブサイト制作
  - online_service_management: オンラインサービス運営業
  - online_advertising_agency: オンライン広告代理店業
  - online_advertising_planning_production: オンライン広告企画・制作業
  - online_media_management: オンラインメディア運営業
  - portal_site_management: ポータルサイト運営業
  - other_it_services: その他、IT サービス業
  - transport_delivery: 輸送業、配送業
  - delivery: バイク便等の配達業
  - other_transportation_logistics: その他の運輸業、物流業
  - other_wholesale: 卸売業：その他
  - clothing_wholesale_fiber: 卸売業：衣類卸売／繊維
  - food_wholesale: 卸売業：飲食料品
  - entrusted_development_wholesale: 卸売業：機械器具
  - online_shop: 小売業：無店舗　オンラインショップ
  - fashion_grocery_store: 小売業：店舗あり　ファッション、雑貨
  - food_store: 小売業：店舗あり　生鮮食品、飲食料品
  - entrusted_store: 小売業：店舗あり　機械、器具
  - other_store: 小売業：店舗あり　その他
  - financial_instruments_exchange: 金融業：金融商品取引
  - commodity_futures_investment_advisor: 金融業：商品先物取引、商品投資顧問
  - other_financial: 金融業：その他
  - brokerage_insurance: 保険業：仲介、代理
  - other_insurance: 保険業：その他
  - real_estate_developer: 不動産業：ディベロッパー
  - real_estate_brokerage: 不動産業：売買、仲介
  - rent_coin_parking_management: 不動産業：賃貸、コインパーキング、管理
  - rental_office_co_working_space: 不動産業：レンタルオフィス、コワーキングスペース
  - rental_lease: レンタル業、リース業
  - cpa_tax_accountant: 士業：公認会計士事務所、税理士事務所
  - law_office: 士業：法律事務所
  - judicial_and_administrative_scrivener: 士業：司法書士事務所／行政書士事務所
  - labor_consultant: 士業：社会保険労務士事務所
  - other_profession: 士業：その他
  - business_consultant: 経営コンサルタント
  - academic_research_development: 学術・開発研究機関
  - advertising_agency: 広告代理店
  - advertising_planning_production: 広告企画／制作
  - design_development: ソフトウェア、アプリ開発業（受託）
  - apparel_industry_design: 服飾デザイン業、工業デザイン業
  - website_design: ウェブサイト制作（受託）
  - advertising_planning_design: 広告企画／制作業
  - other_design: その他、デザイン／制作
  - restaurants_coffee_shops: レストラン、喫茶店等の飲食店業
  - sale_of_lunch: 弁当の販売業
  - bread_confectionery_manufacture_sale: パン、菓子等の製造販売業
  - delivery_catering_mobile_catering: デリバリー業、ケータリング業、移動販売業
  - hotel_inn: 宿泊業：ホテル、旅館
  - homestay: 宿泊業：民泊
  - travel_agency: 旅行代理店業
  - leisure_sports_facility_management: レジャー、スポーツ等の施設運営業
  - show_event_management: ショー、イベント等の興行、イベント運営業
  - barber: ビューティ、ヘルスケア業：床屋、理容室
  - beauty_salon: ビューティ、ヘルスケア業：美容室
  - spa_sand_bath_sauna: ビューティ、ヘルスケア業：スパ、砂風呂、サウナ等
  - este_ail_salon: ビューティ、ヘルスケア業：その他、エステサロン、ネイルサロン等
  - bridal_planning_introduce_wedding: 冠婚葬祭業：ブライダルプランニング、結婚式場紹介等
  - memorial_ceremony_funeral: 冠婚葬祭業：メモリアルセレモニー、葬儀等
  - moving: 引っ越し業
  - courier_industry: 宅配業
  - house_maid_cleaning_agency: 家事代行サービス業：無店舗　ハウスメイド、掃除代行等
  - re_tailoring_clothes: 家事代行サービス業：店舗あり　衣類修理、衣類仕立て直し等
  - training_institute_management: 研修所等の施設運営業
  - tutoring_school: 学習塾、進学塾等の教育・学習支援業
  - music_calligraphy_abacus_classroom: 音楽教室、書道教室、そろばん教室等の教育・学習支援業
  - english_school: 英会話スクール等の語学学習支援業
  - tennis_yoga_judo_school: テニススクール、ヨガ教室、柔道場等のスポーツ指導、支援業
  - culture_school: その他、カルチャースクール等の教育・学習支援業
  - seminar_planning_management: セミナー等の企画、運営業
  - hospital_clinic: 医療業：病院、一般診療所、クリニック等
  - dental_clinic: 医療業：歯科診療所
  - other_medical_services: 医療業：その他、医療サービス等
  - nursery: 福祉業：保育所等、児童向け施設型サービス
  - nursing_home: 福祉業：老人ホーム等、老人向け施設型サービス
  - rehabilitation_support_services: 福祉業：療育支援サービス等、障害者等向け施設型サービス
  - other_welfare: 福祉業：その他、施設型福祉サービス
  - visit_welfare_service: 福祉業：訪問型福祉サービス
  - recruitment_temporary_staffing: 人材紹介業、人材派遣業
  - life_related_recruitment_temporary_staffing: 生活関連サービスの人材紹介業、人材派遣業
  - car_maintenance_car_repair: 自動車整備業、自動車修理業
  - machinery_equipment_maintenance_repair: 機械機器類の整備業、修理業
  - cleaning_maintenance_building_management: 清掃業、メンテナンス業、建物管理業
  - security: 警備業
  - other_services: その他のサービス業
  - npo: 'NPO'
  - general_incorporated_association: '一般社団法人'
  - general_incorporated_foundation: '一般財団法人'
  - other_association: 'その他組織'
<br>
<br>
### 業種 個人<br>
  - '': 未選択
  - manufacturing: 製造業
  - education: 教育
  - medical: 医療/福祉
  - ict: ソフトウェア・情報サービス業
  - food: 飲食業
  - construction: 建設業
  - transportation: 運送業
  - trading: 卸売業
  - retail: 小売業
  - finance: 金融/保険業
  - real_estate: 不動産業
  - agriculture: 農業
  - travel: 旅行・宿泊業
  - accountant: 専門業（税理士・会計士）
  - lawer: その他専門業（法律など）
  - consultant: サービス業（コンサルティング）
  - recruit: サービス業（人材）
  - publication: サービス業（出版）
  - design: サービス業（デザイン）
  - barber: サービス業（理容・美容）
  - others: その他サービス業
  - company_employee: 会社員
  - others_side_business: その他(副業や株取引のみなど)
  - others_deduction: その他(医療費などの控除のみ)
  - default: 未定 (選択肢: , agriculture, forestry, fishing_industry, mining, civil_contractors, pavement, carpenter, renovation, electrical_plumbing, grocery, machinery_manufacturing, printing, other_manufacturing, software_development, system_development, survey_analysis, server_management, website_production, online_service_management, online_advertising_agency, online_advertising_planning_production, online_media_management, portal_site_management, other_it_services, transport_delivery, delivery, other_transportation_logistics, other_wholesale, clothing_wholesale_fiber, food_wholesale, entrusted_development_wholesale, online_shop, fashion_grocery_store, food_store, entrusted_store, other_store, financial_instruments_exchange, commodity_futures_investment_advisor, other_financial, brokerage_insurance, other_insurance, real_estate_developer, real_estate_brokerage, rent_coin_parking_management, rental_office_co_working_space, rental_lease, cpa_tax_accountant, law_office, judicial_and_administrative_scrivener, labor_consultant, other_profession, business_consultant, academic_research_development, advertising_agency, advertising_planning_production, design_development, apparel_industry_design, website_design, advertising_planning_design, other_design, restaurants_coffee_shops, sale_of_lunch, bread_confectionery_manufacture_sale, delivery_catering_mobile_catering, hotel_inn, homestay, travel_agency, leisure_sports_facility_management, show_event_management, barber, beauty_salon, spa_sand_bath_sauna, este_ail_salon, bridal_planning_introduce_wedding, memorial_ceremony_funeral, moving, courier_industry, house_maid_cleaning_agency, re_tailoring_clothes, training_institute_management, tutoring_school, music_calligraphy_abacus_classroom, english_school, tennis_yoga_judo_school, culture_school, seminar_planning_management, hospital_clinic, dental_clinic, other_medical_services, nursery, nursing_home, rehabilitation_support_services, other_welfare, visit_welfare_service, recruitment_temporary_staffing, life_related_recruitment_temporary_staffing, car_maintenance_car_repair, machinery_equipment_maintenance_repair, cleaning_maintenance_building_management, security, other_services, npo, general_incorporated_association, general_incorporated_foundation, other_association, manufacturing, education, medical, ict, food, construction, transportation, trading, retail, finance, real_estate, travel, accountant, lawer, consultant, recruit, publication, design, others, company_employee, others_side_business, others_deduction, default)
  - **workflow_setting** **(必須)**: string - 仕訳承認フロー（enable: 有効、 disable: 無効） (選択肢: enable, disable) 例: `disabled`
  - **fiscal_years** **(必須)**: array[object]
  - **account_items** (任意): array[object]
  - **tax_codes** (任意): array[object]
  - **items** (任意): array[object]
  - **partners** (任意): array[object]
  - **sections** (任意): array[object]
  - **tags** (任意): array[object]
  - **walletables** (任意): array[object]



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
