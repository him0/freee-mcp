# Payment requests

## 概要

支払依頼

## エンドポイント一覧

### GET /api/1/payment_requests

**操作**: 支払依頼一覧の取得

**説明**: 概要 指定した事業所の支払依頼一覧を取得する 支払依頼APIの使い方については、freee会計支払依頼APIの使い方をご参照ください 注意点 本APIでは、支払依頼の一覧を取得することができます。 申請経路、承認者の指定として部門役職データ連携を活用し、以下のいずれかを利用している支払依頼と申請経路はAPI経由で参照は可能ですが、作成と更新、承認ステータスの変更ができません。 役職指定（申請者の所属部門） 役職指定（申請時に部門指定） 部門および役職指定

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| status | query | いいえ | string | '申請ステータス(draft:下書き, in_progress:申請中, approved:承認済, rejected:却下, feedback:差戻し)、 取引ステータス(unsettled:支払待ち, settled:支払済み)'<br>
approver_id を指定した場合は無効です。
 (選択肢: draft, in_progress, approved, rejected, feedback, unsettled, settled) |
| start_application_date | query | いいえ | string | 申請日で絞込：開始日(yyyy-mm-dd) |
| end_application_date | query | いいえ | string | 申請日で絞込：終了日(yyyy-mm-dd) |
| start_issue_date | query | いいえ | string | 発生日で絞込：開始日(yyyy-mm-dd) |
| end_issue_date | query | いいえ | string | 発生日で絞込：終了日(yyyy-mm-dd) |
| application_number | query | いいえ | integer(int64) | 申請No. |
| title | query | いいえ | string | 申請タイトル |
| applicant_id | query | いいえ | integer(int64) | 申請者のユーザーID |
| approver_id | query | いいえ | integer(int64) | 承認者のユーザーID<br>
'approver_id を指定した場合は、 in_progress: 申請中 の支払依頼のみを返します。'
 |
| min_amount | query | いいえ | integer(int64) | 金額で絞込 (下限金額) |
| max_amount | query | いいえ | integer(int64) | 金額で絞込 (上限金額) |
| partner_id | query | いいえ | integer(int64) | 取引先IDで絞込 |
| partner_code | query | いいえ | string | 取引先コードで絞込 |
| payment_method | query | いいえ | string | 支払方法で絞込 (none: 指定なし, domestic_bank_transfer: 国内振込, abroad_bank_transfer: 国外振込, account_transfer: 口座振替, credit_card: クレジットカード) (選択肢: none, domestic_bank_transfer, abroad_bank_transfer, account_transfer, credit_card) |
| start_payment_date | query | いいえ | string | 支払期限で絞込：開始日(yyyy-mm-dd) |
| end_payment_date | query | いいえ | string | 支払期限で絞込：終了日(yyyy-mm-dd) |
| document_code | query | いいえ | string | 請求書番号で絞込 |
| offset | query | いいえ | integer(int64) | 取得レコードのオフセット (デフォルト: 0) |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 50, 最小: 1, 最大: 500) |

### レスポンス (200)

- **payment_requests** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - 支払依頼ID 例: `1` (最小: 1)
    - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
    - **title** **(必須)**: string - 申請タイトル 例: `仕入代金支払い`
    - **application_date** **(必須)**: string - 申請日 (yyyy-mm-dd) 例: `2019-12-17`
    - **total_amount** **(必須)**: integer(int64) - 合計金額 例: `30000`
    - **status** **(必須)**: string - 申請ステータス(draft:下書き, in_progress:申請中, approved:承認済, rejected:却下, feedback:差戻し) (選択肢: draft, in_progress, approved, rejected, feedback) 例: `draft`
    - **deal_id** (任意): integer(int64) - 取引ID (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_idが表示されます) 例: `1` (最小: 1)
    - **deal_status** (任意): string - 取引ステータス (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_statusが表示されます settled:支払済み, unsettled:支払待ち) (選択肢: settled, unsettled) 例: `settled`
    - **applicant_id** **(必須)**: integer(int64) - 申請者のユーザーID 例: `1` (最小: 1)
    - **approvers** **(必須)**: array[object] - 承認者（配列）
  承認ステップのresource_typeがunspecified (指定なし)の場合はapproversはレスポンスに含まれません。
  しかし、resource_typeがunspecifiedの承認ステップにおいて誰かが承認・却下・差し戻しのいずれかのアクションを取った後は、
  approversはレスポンスに含まれるようになります。
  その場合approversにはアクションを行ったステップのIDとアクションを行ったユーザーのIDが含まれます。
    - **application_number** **(必須)**: string - 申請No. 例: `2`
    - **current_step_id** **(必須)**: integer(int64) - 現在承認ステップID 例: `1` (最小: 1)
    - **current_round** **(必須)**: integer(int64) - 現在のround。差し戻し等により申請がstepの最初からやり直しになるとroundの値が増えます。 例: `1` (最小: 0, 最大: 2147483647)
    - **document_code** **(必須)**: string - 請求書番号 例: `2`
    - **issue_date** **(必須)**: string - 発生日 (yyyy-mm-dd) 例: `2019-12-17`
    - **payment_date** **(必須)**: string - 支払期限 (yyyy-mm-dd) 例: `2019-12-17`
    - **payment_method** **(必須)**: string - 支払方法(none: 指定なし, domestic_bank_transfer: 国内振込, abroad_bank_transfer: 国外振込, account_transfer: 口座振替, credit_card: クレジットカード) (選択肢: none, domestic_bank_transfer, abroad_bank_transfer, account_transfer, credit_card) 例: `none`
    - **partner_id** **(必須)**: integer(int64) - 取引先ID 例: `201` (最小: 1)
    - **partner_code** **(必須)**: string - 取引先コード 例: `code001`
    - **partner_name** **(必須)**: string - 取引先名 例: `freee`
    - **qualified_invoice_status** (任意): string - 適格請求書発行事業者（qualified: 該当する、not_qualified: 該当しない、unspecified: 未選択）
- 支払依頼をインボイス要件をみたす申請として扱うかどうかを表します。
 (選択肢: qualified, not_qualified, unspecified) 例: `qualified`
    - **input_mode** (任意): string - 内税/外税（inclusive: 内税、exclusive: 外税）
外税の支払依頼は他のエンドポイントで利用できないため、Web 画面からご確認ください。 (選択肢: inclusive, exclusive) 例: `inclusive`

### POST /api/1/payment_requests

**操作**: 支払依頼の作成

**説明**: 概要 指定した事業所の支払依頼を作成する 支払依頼APIの使い方については、freee会計支払依頼APIの使い方をご参照ください 注意点 申請ステータス(下書き、申請中)の指定と変更、及び承認操作（承認する、却下する、申請者へ差し戻す、特権承認する、承認済み・却下済みを取り消す）は以下を参考にして行ってください。 承認操作は申請ステータスが申請中、承認済み、却下のものだけが対象です。 初回申請の場合 申請の作成（POST） 作成済みの申請の申請ステータス変更・更新する場合 申請の更新（PUT） 申請中、承認済み、却下の申請の承認操作を行う場合 承認操作の実行（POST） 申請の削除（DELETE）が可能なのは申請ステータスが下書き、差戻しの場合のみです 申請経路、承認者の指定として部門役職データ連携を活用し、以下のいずれかを利用している支払依頼は本API経由で作成ができません。 役職指定（申請者の所属部門） 役職指定（申請時に部門指定） 部門および役職指定 本APIでは支払依頼の項目行一覧(payment_request_lines)は、最大100行までになります。

### リクエストボディ

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **title** **(必須)**: string - 申請タイトル 例: `仕入代金支払い`
- **application_date** (任意): string - 申請日 (yyyy-mm-dd)<br>
指定しない場合は当日の日付が登録されます。
 例: `2019-12-17`
- **description** (任意): string - 備考 例: `◯◯連携先ID: cx12345`
- **payment_request_lines** **(必須)**: array[object] - 支払依頼の項目行一覧（配列）
  配列の要素:
    - **line_type** (任意): string - '行の種類 (deal_line: 支払依頼の通常取引行, negative_line: 支払依頼の控除・マイナス行, withholding_tax: 源泉所得税行)'<br>
'デフォルトは deal_line: 支払依頼の通常取引行 です'
 (選択肢: deal_line, negative_line, withholding_tax) 例: `deal_line`
    - **description** (任意): string - 内容 例: `原稿料`
    - **amount** **(必須)**: integer(int64) - 金額 例: `30000` (最小: 0, 最大: 99999999999)
    - **account_item_id** (任意): integer(int64) - 勘定科目ID 例: `1` (最小: 1)
    - **tax_code** (任意): integer(int64) - 税区分コード<br>
勘定科目IDを指定する場合は必須です。
 例: `1` (最小: 0, 最大: 2147483647)
    - **item_id** (任意): integer(int64) - 品目ID 例: `1` (最小: 1)
    - **section_id** (任意): integer(int64) - 部門ID 例: `1` (最小: 1)
    - **tag_ids** (任意): array[integer] - メモタグID 例: `[1,2,3]`
    - **segment_1_tag_id** (任意): integer(int64) - セグメント１タグID<br>
セグメントタグ一覧の取得APIを利用して取得してください。<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定</a><br>
 例: `1` (最小: 1)
    - **segment_2_tag_id** (任意): integer(int64) - セグメント２タグID<br>
セグメントタグ一覧の取得APIを利用して取得してください。<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定</a><br>
 例: `1` (最小: 1)
    - **segment_3_tag_id** (任意): integer(int64) - セグメント３タグID<br>
セグメントタグ一覧の取得APIを利用して取得してください。<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定</a><br>
 例: `1` (最小: 1)
- **approver_id** (任意): integer(int64) - 承認者のユーザーID<br>
「承認者を指定」の経路を申請経路として使用する場合に指定してください。<br>
指定する承認者のユーザーIDは、申請経路APIを利用して取得してください。
 例: `1` (最小: 1)
- **approval_flow_route_id** **(必須)**: integer(int64) - 申請経路ID<br>
指定する申請経路IDは、申請経路APIを利用して取得してください。
 例: `1` (最小: 1)
- **parent_id** (任意): integer(int64) - 親申請ID(法人エンタープライズプラン、法人アドバンスプラン（および旧法人プロフェッショナルプラン）)<br>
<ul>
  <li>承認済みの既存各種申請IDのみ指定可能です。</li>
  <li>各種申請一覧APIを利用して取得してください。</li>
</ul>
 例: `2` (最小: 1)
- **draft** **(必須)**: boolean - 支払依頼のステータス<br>
falseを指定した時は申請中（in_progress）で支払依頼を作成します。<br>
trueを指定した時は下書き（draft）で支払依頼を作成します。
 例: `true`
- **document_code** (任意): string - 請求書番号（255文字以内） 例: `2`
- **receipt_ids** (任意): array[integer] - ファイルボックス（証憑ファイル）ID（配列）
- **issue_date** **(必須)**: string - 発生日 (yyyy-mm-dd) 例: `2019-12-17`
- **payment_date** (任意): string - 支払期限 (yyyy-mm-dd) 例: `2019-12-17`
- **payment_method** (任意): string - '支払方法(none: 指定なし, domestic_bank_transfer: 国内振込, abroad_bank_transfer: 国外振込, account_transfer: 口座振替, credit_card: クレジットカード)'<br>
'デフォルトは none: 指定なし です。'
 (選択肢: none, domestic_bank_transfer, abroad_bank_transfer, account_transfer, credit_card) 例: `none`
- **partner_id** (任意): integer(int64) - 支払先の取引先ID 例: `201` (最小: 1)
- **partner_code** (任意): string - 支払先の取引先コード<br>
支払先の取引先ID指定時には無効
 例: `code001`
- **bank_code** (任意): string - 銀行コード（半角数字1桁〜4桁）<br>
支払先指定時には無効
 例: `0001`
- **bank_name** (任意): string - 銀行名（255文字以内）<br>
支払先指定時には無効
 例: `freee銀行`
- **bank_name_kana** (任意): string - 銀行名（カナ）（15文字以内）<br>
支払先指定時には無効
 例: `フリーギンコウ`
- **branch_code** (任意): string - 支店番号（半角数字1桁〜3桁）<br>
支払先指定時には無効
 例: `101`
- **branch_name** (任意): string - 支店名（255文字以内）<br>
支払先指定時には無効
 例: `銀座支店`
- **branch_kana** (任意): string - 支店名（カナ）（15文字以内）<br>
指定可能な文字は、英数・カナ・丸括弧・ハイフン・スペースのみです。<br>
支払先指定時には無効
 例: `ギンザシテン`
- **account_name** (任意): string - 受取人名（カナ）（48文字以内）<br>
支払先指定時には無効
 例: `フリータロウ`
- **account_number** (任意): string - 口座番号（半角数字1桁〜7桁）<br>
支払先指定時には無効
 例: `1010101`
- **account_type** (任意): string - '口座種別(ordinary: 普通、checking: 当座、earmarked: 納税準備預金、savings: 貯蓄、other: その他)'<br>
'支払先指定時には無効'<br>
'デフォルトは ordinary: 普通 です'
 (選択肢: ordinary, checking, earmarked, savings, other) 例: `ordinary`
- **qualified_invoice_status** (任意): string - 適格請求書発行事業者（qualified: 該当する、not_qualified: 該当しない、unspecified: 未選択）
- 支払依頼をインボイス要件をみたす申請として扱うかどうかを表します。
- qualified_invoice_statusキーをリクエストに含めない場合、unspecifiedが適用されます。
- issue_dateが2023年9月30日以前の場合、unspecified以外利用できません。
- インボイス経過措置の税区分の設定が使用する設定になっていない場合、unspecified以外利用できません。
 (選択肢: qualified, not_qualified, unspecified) 例: `qualified`

### レスポンス (201)

- **payment_request** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 支払依頼ID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **title** **(必須)**: string - 申請タイトル 例: `仕入代金支払い`
  - **application_date** **(必須)**: string - 申請日 (yyyy-mm-dd) 例: `2019-12-17`
  - **description** **(必須)**: string - 備考 例: `◯◯連携先ID: cx12345`
  - **total_amount** **(必須)**: integer(int64) - 合計金額 例: `30000`
  - **status** **(必須)**: string - 申請ステータス(draft:下書き, in_progress:申請中, approved:承認済, rejected:却下, feedback:差戻し) (選択肢: draft, in_progress, approved, rejected, feedback) 例: `draft`
  - **payment_request_lines** **(必須)**: array[object] - 支払依頼の項目行一覧（配列）
  - **deal_id** **(必須)**: integer(int64) - 取引ID (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_idが表示されます) 例: `1` (最小: 1)
  - **deal_status** **(必須)**: string - 取引ステータス (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_statusが表示されます settled:支払済み, unsettled:支払待ち) (選択肢: settled, unsettled) 例: `settled`
  - **applicant_id** **(必須)**: integer(int64) - 申請者のユーザーID 例: `1` (最小: 1)
  - **approvers** **(必須)**: array[object] - 承認者（配列）
  承認ステップのresource_typeがunspecified (指定なし)の場合はapproversはレスポンスに含まれません。
  しかし、resource_typeがunspecifiedの承認ステップにおいて誰かが承認・却下・差し戻しのいずれかのアクションを取った後は、
  approversはレスポンスに含まれるようになります。
  その場合approversにはアクションを行ったステップのIDとアクションを行ったユーザーのIDが含まれます。
  - **application_number** **(必須)**: string - 申請No. 例: `2`
  - **approval_flow_route_id** **(必須)**: integer(int64) - 申請経路ID 例: `1` (最小: 1)
  - **comments** **(必須)**: array[object] - 支払依頼のコメント一覧（配列）
  - **approval_flow_logs** **(必須)**: array[object] - 支払依頼の承認履歴（配列）
  - **current_step_id** **(必須)**: integer(int64) - 現在承認ステップID 例: `1` (最小: 1)
  - **current_round** **(必須)**: integer(int64) - 現在のround。差し戻し等により申請がstepの最初からやり直しになるとroundの値が増えます。 例: `1` (最小: 0, 最大: 2147483647)
  - **document_code** **(必須)**: string - 請求書番号 例: `2`
  - **receipt_ids** **(必須)**: array[integer] - ファイルボックス（証憑ファイル）ID 例: `[1,2,3]`
  - **issue_date** **(必須)**: string - 発生日 (yyyy-mm-dd) 例: `2019-12-17`
  - **payment_date** **(必須)**: string - 支払期限 (yyyy-mm-dd) 例: `2019-12-17`
  - **payment_method** **(必須)**: string - 支払方法(none: 指定なし, domestic_bank_transfer: 国内振込, abroad_bank_transfer: 国外振込, account_transfer: 口座振替, credit_card: クレジットカード) (選択肢: none, domestic_bank_transfer, abroad_bank_transfer, account_transfer, credit_card) 例: `none`
  - **partner_id** **(必須)**: integer(int64) - 取引先ID 例: `201` (最小: 1)
  - **partner_code** (任意): string - 取引先コード 例: `code001`
  - **partner_name** **(必須)**: string - 取引先名 例: `freee`
  - **bank_name** **(必須)**: string - 銀行名 例: `freee銀行`
  - **bank_name_kana** **(必須)**: string - 銀行名（カナ） 例: `フリーギンコウ`
  - **bank_code** **(必須)**: string - 銀行コード 例: `0001`
  - **branch_name** **(必須)**: string - 支店名 例: `銀座支店`
  - **branch_kana** **(必須)**: string - 支店名（カナ） 例: `ギンザシテン`
  - **branch_code** **(必須)**: string - 支店番号 例: `101`
  - **account_type** **(必須)**: string - 口座種別(ordinary:普通、checking:当座、earmarked:納税準備預金、savings:貯蓄、other:その他) (選択肢: ordinary, checking, earmarked, savings, other) 例: `ordinary`
  - **account_number** **(必須)**: string - 口座番号 例: `1010101`
  - **account_name** **(必須)**: string - 受取人名（カナ） 例: `フリータロウ`
  - **qualified_invoice_status** (任意): string - 適格請求書発行事業者（qualified: 該当する、not_qualified: 該当しない、unspecified: 未選択）
- 支払依頼をインボイス要件をみたす申請として扱うかどうかを表します。
 (選択肢: qualified, not_qualified, unspecified) 例: `qualified`

### GET /api/1/payment_requests/{id}

**操作**: 支払依頼の取得

**説明**: 概要 指定した事業所の支払依頼を取得する 支払依頼APIの使い方については、freee会計支払依頼APIの使い方をご参照ください 注意点 申請経路、承認者の指定として部門役職データ連携を活用し、以下のいずれかを利用している支払依頼と申請経路はAPI経由で参照は可能ですが、作成と更新、承認ステータスの変更ができません。 役職指定（申請者の所属部門） 役職指定（申請時に部門指定） 部門および役職指定

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 支払依頼ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (200)

- **payment_request** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 支払依頼ID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **title** **(必須)**: string - 申請タイトル 例: `仕入代金支払い`
  - **application_date** **(必須)**: string - 申請日 (yyyy-mm-dd) 例: `2019-12-17`
  - **description** **(必須)**: string - 備考 例: `◯◯連携先ID: cx12345`
  - **total_amount** **(必須)**: integer(int64) - 合計金額 例: `30000`
  - **status** **(必須)**: string - 申請ステータス(draft:下書き, in_progress:申請中, approved:承認済, rejected:却下, feedback:差戻し) (選択肢: draft, in_progress, approved, rejected, feedback) 例: `draft`
  - **payment_request_lines** **(必須)**: array[object] - 支払依頼の項目行一覧（配列）
  - **deal_id** **(必須)**: integer(int64) - 取引ID (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_idが表示されます) 例: `1` (最小: 1)
  - **deal_status** **(必須)**: string - 取引ステータス (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_statusが表示されます settled:支払済み, unsettled:支払待ち) (選択肢: settled, unsettled) 例: `settled`
  - **applicant_id** **(必須)**: integer(int64) - 申請者のユーザーID 例: `1` (最小: 1)
  - **approvers** **(必須)**: array[object] - 承認者（配列）
  承認ステップのresource_typeがunspecified (指定なし)の場合はapproversはレスポンスに含まれません。
  しかし、resource_typeがunspecifiedの承認ステップにおいて誰かが承認・却下・差し戻しのいずれかのアクションを取った後は、
  approversはレスポンスに含まれるようになります。
  その場合approversにはアクションを行ったステップのIDとアクションを行ったユーザーのIDが含まれます。
  - **application_number** **(必須)**: string - 申請No. 例: `2`
  - **approval_flow_route_id** **(必須)**: integer(int64) - 申請経路ID 例: `1` (最小: 1)
  - **comments** **(必須)**: array[object] - 支払依頼のコメント一覧（配列）
  - **approval_flow_logs** **(必須)**: array[object] - 支払依頼の承認履歴（配列）
  - **current_step_id** **(必須)**: integer(int64) - 現在承認ステップID 例: `1` (最小: 1)
  - **current_round** **(必須)**: integer(int64) - 現在のround。差し戻し等により申請がstepの最初からやり直しになるとroundの値が増えます。 例: `1` (最小: 0, 最大: 2147483647)
  - **document_code** **(必須)**: string - 請求書番号 例: `2`
  - **receipt_ids** **(必須)**: array[integer] - ファイルボックス（証憑ファイル）ID 例: `[1,2,3]`
  - **issue_date** **(必須)**: string - 発生日 (yyyy-mm-dd) 例: `2019-12-17`
  - **payment_date** **(必須)**: string - 支払期限 (yyyy-mm-dd) 例: `2019-12-17`
  - **payment_method** **(必須)**: string - 支払方法(none: 指定なし, domestic_bank_transfer: 国内振込, abroad_bank_transfer: 国外振込, account_transfer: 口座振替, credit_card: クレジットカード) (選択肢: none, domestic_bank_transfer, abroad_bank_transfer, account_transfer, credit_card) 例: `none`
  - **partner_id** **(必須)**: integer(int64) - 取引先ID 例: `201` (最小: 1)
  - **partner_code** (任意): string - 取引先コード 例: `code001`
  - **partner_name** **(必須)**: string - 取引先名 例: `freee`
  - **bank_name** **(必須)**: string - 銀行名 例: `freee銀行`
  - **bank_name_kana** **(必須)**: string - 銀行名（カナ） 例: `フリーギンコウ`
  - **bank_code** **(必須)**: string - 銀行コード 例: `0001`
  - **branch_name** **(必須)**: string - 支店名 例: `銀座支店`
  - **branch_kana** **(必須)**: string - 支店名（カナ） 例: `ギンザシテン`
  - **branch_code** **(必須)**: string - 支店番号 例: `101`
  - **account_type** **(必須)**: string - 口座種別(ordinary:普通、checking:当座、earmarked:納税準備預金、savings:貯蓄、other:その他) (選択肢: ordinary, checking, earmarked, savings, other) 例: `ordinary`
  - **account_number** **(必須)**: string - 口座番号 例: `1010101`
  - **account_name** **(必須)**: string - 受取人名（カナ） 例: `フリータロウ`
  - **qualified_invoice_status** (任意): string - 適格請求書発行事業者（qualified: 該当する、not_qualified: 該当しない、unspecified: 未選択）
- 支払依頼をインボイス要件をみたす申請として扱うかどうかを表します。
 (選択肢: qualified, not_qualified, unspecified) 例: `qualified`

### PUT /api/1/payment_requests/{id}

**操作**: 支払依頼の更新

**説明**: 概要 指定した事業所の支払依頼を更新する 支払依頼APIの使い方については、freee会計支払依頼APIの使い方をご参照ください 注意点 本APIでは、支払依頼を更新することができます。 本APIでは、status(申請ステータス): draft:下書き, in_progress:申請中, feedback:差戻しのみ更新可能です。 申請ステータス(下書き、申請中)の指定と変更、及び承認操作（承認する、却下する、申請者へ差し戻す、特権承認する、承認済み・却下済みを取り消す）は以下を参考にして行ってください。 承認操作は申請ステータスが申請中、承認済み、却下のものだけが対象です。 初回申請の場合 申請の作成（POST） 作成済みの申請の申請ステータス変更・更新する場合 申請の更新（PUT） 申請中、承認済み、却下の申請の承認操作を行う場合 承認操作の実行（POST） 申請の削除（DELETE）が可能なのは申請ステータスが下書き、差戻しの場合のみです 申請経路、承認者の指定として部門役職データ連携を活用し、以下のいずれかを利用している支払依頼は本API経由で更新ができません。 役職指定（申...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 支払依頼ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1`
- **title** **(必須)**: string - 申請タイトル<br>
申請者が、下書き状態もしくは差戻し状態の支払依頼に対して指定する場合のみ有効
 例: `仕入代金支払い`
- **application_date** (任意): string - 申請日 (yyyy-mm-dd)<br>
指定しない場合は当日の日付が登録されます。<br>
申請者が、下書き状態もしくは差戻し状態の支払依頼に対して指定する場合のみ有効
 例: `2019-12-17`
- **description** (任意): string - 備考 例: `◯◯連携先ID: cx12345`
- **payment_request_lines** **(必須)**: array[object] - 支払依頼の項目行一覧（配列）
  配列の要素:
    - **id** (任意): integer(int64) - 支払依頼の項目行ID: 既存項目行を更新する場合に指定します。IDを指定しない項目行は、新規行として扱われ追加されます。また、payment_request_linesに含まれない既存の項目行は削除されます。更新後も残したい行は、必ず支払依頼の項目行IDを指定してpayment_request_linesに含めてください。 例: `1` (最小: 1)
    - **line_type** (任意): string - '行の種類 (deal_line: 支払依頼の通常取引行, negative_line: 支払依頼の控除・マイナス行, withholding_tax: 源泉所得税行)'<br>
'デフォルトは deal_line: 支払依頼の通常取引行 です'
 (選択肢: deal_line, negative_line, withholding_tax) 例: `deal_line`
    - **description** (任意): string - 内容 例: `原稿料`
    - **amount** **(必須)**: integer(int64) - 金額 例: `30000` (最小: 0, 最大: 99999999999)
    - **account_item_id** (任意): integer(int64) - 勘定科目ID 例: `1` (最小: 1)
    - **tax_code** (任意): integer(int64) - 税区分コード<br>
勘定科目IDを指定する場合は必須です。
 例: `1` (最小: 0, 最大: 2147483647)
    - **item_id** (任意): integer(int64) - 品目ID 例: `1` (最小: 1)
    - **section_id** (任意): integer(int64) - 部門ID 例: `1` (最小: 1)
    - **tag_ids** (任意): array[integer] - メモタグID 例: `[1,2,3]`
    - **segment_1_tag_id** (任意): integer(int64) - セグメント１タグID<br>
セグメントタグ一覧の取得APIを利用して取得してください。<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定</a><br>
 例: `1` (最小: 1)
    - **segment_2_tag_id** (任意): integer(int64) - セグメント２タグID<br>
セグメントタグ一覧の取得APIを利用して取得してください。<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定</a><br>
 例: `1` (最小: 1)
    - **segment_3_tag_id** (任意): integer(int64) - セグメント３タグID<br>
セグメントタグ一覧の取得APIを利用して取得してください。<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定</a><br>
 例: `1` (最小: 1)
- **approver_id** (任意): integer(int64) - 承認者のユーザーID<br>
「承認者を指定」の経路を申請経路として使用する場合に指定してください。<br>
指定する承認者のユーザーIDは、申請経路APIを利用して取得してください。
 例: `1` (最小: 1)
- **approval_flow_route_id** **(必須)**: integer(int64) - 申請経路ID<br>
指定する申請経路IDは、申請経路APIを利用して取得してください。
 例: `1` (最小: 1)
- **draft** **(必須)**: boolean - 支払依頼のステータス<br>
falseを指定した時は申請中（in_progress）で支払依頼を更新します。<br>
trueを指定した時は下書き（draft）で支払依頼を更新します。
 例: `true`
- **document_code** (任意): string - 請求書番号（255文字以内） 例: `2`
- **receipt_ids** (任意): array[integer] - ファイルボックス（証憑ファイル）ID（配列）
- **issue_date** **(必須)**: string - 発生日 (yyyy-mm-dd) 例: `2019-12-17`
- **payment_date** (任意): string - 支払期限 (yyyy-mm-dd) 例: `2019-12-17`
- **payment_method** (任意): string - '支払方法(none: 指定なし, domestic_bank_transfer: 国内振込, abroad_bank_transfer: 国外振込, account_transfer: 口座振替, credit_card: クレジットカード)'<br>
'デフォルトは none: 指定なし です。'
 (選択肢: none, domestic_bank_transfer, abroad_bank_transfer, account_transfer, credit_card) 例: `none`
- **partner_id** (任意): integer(int64) - 支払先の取引先ID 例: `201` (最小: 1)
- **partner_code** (任意): string - 支払先の取引先コード<br>
支払先の取引先ID指定時には無効
 例: `code001`
- **bank_code** (任意): string - 銀行コード（半角数字1桁〜4桁）<br>
支払先指定時には無効
 例: `0001`
- **bank_name** (任意): string - 銀行名（255文字以内）<br>
支払先指定時には無効
 例: `freee銀行`
- **bank_name_kana** (任意): string - 銀行名（カナ）（15文字以内）<br>
支払先指定時には無効
 例: `フリーギンコウ`
- **branch_code** (任意): string - 支店番号（半角数字1桁〜3桁）<br>
支払先指定時には無効
 例: `101`
- **branch_name** (任意): string - 支店名（255文字以内）<br>
支払先指定時には無効
 例: `銀座支店`
- **branch_kana** (任意): string - 支店名（カナ）（15文字以内）<br>
指定可能な文字は、英数・カナ・丸括弧・ハイフン・スペースのみです。<br>
支払先指定時には無効
 例: `ギンザシテン`
- **account_name** (任意): string - 受取人名（カナ）（48文字以内）<br>
支払先指定時には無効
 例: `フリータロウ`
- **account_number** (任意): string - 口座番号（半角数字1桁〜7桁）<br>
支払先指定時には無効
 例: `1010101`
- **account_type** (任意): string - '口座種別(ordinary: 普通、checking: 当座、earmarked: 納税準備預金、savings: 貯蓄、other: その他)'<br>
'支払先指定時には無効'<br>
'デフォルトは ordinary: 普通 です'
 (選択肢: ordinary, checking, earmarked, savings, other) 例: `ordinary`
- **qualified_invoice_status** (任意): string - 適格請求書発行事業者（qualified: 該当する、not_qualified: 該当しない、unspecified: 未選択）
- 支払依頼をインボイス要件をみたす申請として扱うかどうかを表します。
- qualified_invoice_statusキーをリクエストに含めない場合、unspecifiedが適用されます。
- issue_dateが2023年9月30日以前の場合、unspecified以外利用できません。
- インボイス経過措置の税区分の設定が使用する設定になっていない場合、unspecified以外利用できません。
 (選択肢: qualified, not_qualified, unspecified) 例: `qualified`

### レスポンス (200)

- **payment_request** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 支払依頼ID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **title** **(必須)**: string - 申請タイトル 例: `仕入代金支払い`
  - **application_date** **(必須)**: string - 申請日 (yyyy-mm-dd) 例: `2019-12-17`
  - **description** **(必須)**: string - 備考 例: `◯◯連携先ID: cx12345`
  - **total_amount** **(必須)**: integer(int64) - 合計金額 例: `30000`
  - **status** **(必須)**: string - 申請ステータス(draft:下書き, in_progress:申請中, approved:承認済, rejected:却下, feedback:差戻し) (選択肢: draft, in_progress, approved, rejected, feedback) 例: `draft`
  - **payment_request_lines** **(必須)**: array[object] - 支払依頼の項目行一覧（配列）
  - **deal_id** **(必須)**: integer(int64) - 取引ID (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_idが表示されます) 例: `1` (最小: 1)
  - **deal_status** **(必須)**: string - 取引ステータス (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_statusが表示されます settled:支払済み, unsettled:支払待ち) (選択肢: settled, unsettled) 例: `settled`
  - **applicant_id** **(必須)**: integer(int64) - 申請者のユーザーID 例: `1` (最小: 1)
  - **approvers** **(必須)**: array[object] - 承認者（配列）
  承認ステップのresource_typeがunspecified (指定なし)の場合はapproversはレスポンスに含まれません。
  しかし、resource_typeがunspecifiedの承認ステップにおいて誰かが承認・却下・差し戻しのいずれかのアクションを取った後は、
  approversはレスポンスに含まれるようになります。
  その場合approversにはアクションを行ったステップのIDとアクションを行ったユーザーのIDが含まれます。
  - **application_number** **(必須)**: string - 申請No. 例: `2`
  - **approval_flow_route_id** **(必須)**: integer(int64) - 申請経路ID 例: `1` (最小: 1)
  - **comments** **(必須)**: array[object] - 支払依頼のコメント一覧（配列）
  - **approval_flow_logs** **(必須)**: array[object] - 支払依頼の承認履歴（配列）
  - **current_step_id** **(必須)**: integer(int64) - 現在承認ステップID 例: `1` (最小: 1)
  - **current_round** **(必須)**: integer(int64) - 現在のround。差し戻し等により申請がstepの最初からやり直しになるとroundの値が増えます。 例: `1` (最小: 0, 最大: 2147483647)
  - **document_code** **(必須)**: string - 請求書番号 例: `2`
  - **receipt_ids** **(必須)**: array[integer] - ファイルボックス（証憑ファイル）ID 例: `[1,2,3]`
  - **issue_date** **(必須)**: string - 発生日 (yyyy-mm-dd) 例: `2019-12-17`
  - **payment_date** **(必須)**: string - 支払期限 (yyyy-mm-dd) 例: `2019-12-17`
  - **payment_method** **(必須)**: string - 支払方法(none: 指定なし, domestic_bank_transfer: 国内振込, abroad_bank_transfer: 国外振込, account_transfer: 口座振替, credit_card: クレジットカード) (選択肢: none, domestic_bank_transfer, abroad_bank_transfer, account_transfer, credit_card) 例: `none`
  - **partner_id** **(必須)**: integer(int64) - 取引先ID 例: `201` (最小: 1)
  - **partner_code** (任意): string - 取引先コード 例: `code001`
  - **partner_name** **(必須)**: string - 取引先名 例: `freee`
  - **bank_name** **(必須)**: string - 銀行名 例: `freee銀行`
  - **bank_name_kana** **(必須)**: string - 銀行名（カナ） 例: `フリーギンコウ`
  - **bank_code** **(必須)**: string - 銀行コード 例: `0001`
  - **branch_name** **(必須)**: string - 支店名 例: `銀座支店`
  - **branch_kana** **(必須)**: string - 支店名（カナ） 例: `ギンザシテン`
  - **branch_code** **(必須)**: string - 支店番号 例: `101`
  - **account_type** **(必須)**: string - 口座種別(ordinary:普通、checking:当座、earmarked:納税準備預金、savings:貯蓄、other:その他) (選択肢: ordinary, checking, earmarked, savings, other) 例: `ordinary`
  - **account_number** **(必須)**: string - 口座番号 例: `1010101`
  - **account_name** **(必須)**: string - 受取人名（カナ） 例: `フリータロウ`
  - **qualified_invoice_status** (任意): string - 適格請求書発行事業者（qualified: 該当する、not_qualified: 該当しない、unspecified: 未選択）
- 支払依頼をインボイス要件をみたす申請として扱うかどうかを表します。
 (選択肢: qualified, not_qualified, unspecified) 例: `qualified`

### DELETE /api/1/payment_requests/{id}

**操作**: 支払依頼の削除

**説明**: 概要 指定した事業所の支払依頼を削除する 支払依頼APIの使い方については、freee会計支払依頼APIの使い方をご参照ください 注意点 本APIでは、支払依頼の承認操作（承認する、却下する、申請者へ差し戻す、特権承認する、承認済み・却下済みを取り消す）を行うことができます。 申請ステータス(下書き、申請中)の指定と変更、及び承認操作（承認する、却下する、申請者へ差し戻す、特権承認する、承認済み・却下済みを取り消す）は以下を参考にして行ってください。 承認操作は申請ステータスが申請中、承認済み、却下のものだけが対象です。 初回申請の場合 申請の作成（POST） 作成済みの申請の申請ステータス変更・更新する場合 申請の更新（PUT） 申請中、承認済み、却下の申請の承認操作を行う場合 承認操作の実行（POST） 申請の削除（DELETE）が可能なのは申請ステータスが下書き、差戻しの場合のみです 申請経路、承認者の指定として部門役職データ連携を活用し、以下のいずれかを利用している支払依頼はAPI経由で承認ステータスの変更ができません。 役職指定（申請者の所属部門） 役職指定（申請時に部門指定...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 支払依頼ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (204)

### POST /api/1/payment_requests/{id}/actions

**操作**: 支払依頼の承認操作

**説明**: 概要 指定した事業所の支払依頼の承認操作を行う 支払依頼APIの使い方については、freee会計支払依頼APIの使い方をご参照ください 注意点 本APIでは、支払依頼の承認操作（承認する、却下する、申請者へ差し戻す、特権承認する、承認済み・却下済みを取り消す）を行うことができます。 申請ステータス(下書き、申請中)の指定と変更、及び承認操作（承認する、却下する、申請者へ差し戻す、特権承認する、承認済み・却下済みを取り消す）は以下を参考にして行ってください。 承認操作は申請ステータスが申請中、承認済み、却下のものだけが対象です。 初回申請の場合 申請の作成（POST） 作成済みの申請の申請ステータス変更・更新する場合 申請の更新（PUT） 申請中、承認済み、却下の申請の承認操作を行う場合 承認操作の実行（POST） 申請の削除（DELETE）が可能なのは申請ステータスが下書き、差戻しの場合のみです 申請経路、承認者の指定として部門役職データ連携を活用し、以下のいずれかを利用している支払依頼はAPI経由で承認ステータスの変更ができません。 役職指定（申請者の所属部門） 役職指定（申請時に部...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 支払依頼ID |

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **approval_action** **(必須)**: string - 操作(approve: 承認する、force_approve: 特権承認する、cancel: 申請を取り消す、reject: 却下する、feedback: 申請者へ差し戻す、force_feedback: 承認済み・却下済みを取り消す) (選択肢: approve, force_approve, cancel, reject, feedback, force_feedback) 例: `approve`
- **target_step_id** **(必須)**: integer(int64) - 対象承認ステップID 支払依頼の取得APIレスポンス.current_step_idを送信してください。 例: `1` (最小: 1)
- **target_round** **(必須)**: integer(int64) - 対象round。差し戻し等により申請がstepの最初からやり直しになるとroundの値が増えます。支払依頼の取得APIレスポンス.current_roundを送信してください。 例: `1` (最小: 0, 最大: 2147483647)
- **next_approver_id** (任意): integer(int64) - 次ステップの承認者のユーザーID 例: `1` (最小: 1)

### レスポンス (201)

- **payment_request** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 支払依頼ID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **title** **(必須)**: string - 申請タイトル 例: `仕入代金支払い`
  - **application_date** **(必須)**: string - 申請日 (yyyy-mm-dd) 例: `2019-12-17`
  - **description** **(必須)**: string - 備考 例: `◯◯連携先ID: cx12345`
  - **total_amount** **(必須)**: integer(int64) - 合計金額 例: `30000`
  - **status** **(必須)**: string - 申請ステータス(draft:下書き, in_progress:申請中, approved:承認済, rejected:却下, feedback:差戻し) (選択肢: draft, in_progress, approved, rejected, feedback) 例: `draft`
  - **payment_request_lines** **(必須)**: array[object] - 支払依頼の項目行一覧（配列）
  - **deal_id** **(必須)**: integer(int64) - 取引ID (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_idが表示されます) 例: `1` (最小: 1)
  - **deal_status** **(必須)**: string - 取引ステータス (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_statusが表示されます settled:支払済み, unsettled:支払待ち) (選択肢: settled, unsettled) 例: `settled`
  - **applicant_id** **(必須)**: integer(int64) - 申請者のユーザーID 例: `1` (最小: 1)
  - **approvers** **(必須)**: array[object] - 承認者（配列）
  承認ステップのresource_typeがunspecified (指定なし)の場合はapproversはレスポンスに含まれません。
  しかし、resource_typeがunspecifiedの承認ステップにおいて誰かが承認・却下・差し戻しのいずれかのアクションを取った後は、
  approversはレスポンスに含まれるようになります。
  その場合approversにはアクションを行ったステップのIDとアクションを行ったユーザーのIDが含まれます。
  - **application_number** **(必須)**: string - 申請No. 例: `2`
  - **approval_flow_route_id** **(必須)**: integer(int64) - 申請経路ID 例: `1` (最小: 1)
  - **comments** **(必須)**: array[object] - 支払依頼のコメント一覧（配列）
  - **approval_flow_logs** **(必須)**: array[object] - 支払依頼の承認履歴（配列）
  - **current_step_id** **(必須)**: integer(int64) - 現在承認ステップID 例: `1` (最小: 1)
  - **current_round** **(必須)**: integer(int64) - 現在のround。差し戻し等により申請がstepの最初からやり直しになるとroundの値が増えます。 例: `1` (最小: 0, 最大: 2147483647)
  - **document_code** **(必須)**: string - 請求書番号 例: `2`
  - **receipt_ids** **(必須)**: array[integer] - ファイルボックス（証憑ファイル）ID 例: `[1,2,3]`
  - **issue_date** **(必須)**: string - 発生日 (yyyy-mm-dd) 例: `2019-12-17`
  - **payment_date** **(必須)**: string - 支払期限 (yyyy-mm-dd) 例: `2019-12-17`
  - **payment_method** **(必須)**: string - 支払方法(none: 指定なし, domestic_bank_transfer: 国内振込, abroad_bank_transfer: 国外振込, account_transfer: 口座振替, credit_card: クレジットカード) (選択肢: none, domestic_bank_transfer, abroad_bank_transfer, account_transfer, credit_card) 例: `none`
  - **partner_id** **(必須)**: integer(int64) - 取引先ID 例: `201` (最小: 1)
  - **partner_code** (任意): string - 取引先コード 例: `code001`
  - **partner_name** **(必須)**: string - 取引先名 例: `freee`
  - **bank_name** **(必須)**: string - 銀行名 例: `freee銀行`
  - **bank_name_kana** **(必須)**: string - 銀行名（カナ） 例: `フリーギンコウ`
  - **bank_code** **(必須)**: string - 銀行コード 例: `0001`
  - **branch_name** **(必須)**: string - 支店名 例: `銀座支店`
  - **branch_kana** **(必須)**: string - 支店名（カナ） 例: `ギンザシテン`
  - **branch_code** **(必須)**: string - 支店番号 例: `101`
  - **account_type** **(必須)**: string - 口座種別(ordinary:普通、checking:当座、earmarked:納税準備預金、savings:貯蓄、other:その他) (選択肢: ordinary, checking, earmarked, savings, other) 例: `ordinary`
  - **account_number** **(必須)**: string - 口座番号 例: `1010101`
  - **account_name** **(必須)**: string - 受取人名（カナ） 例: `フリータロウ`
  - **qualified_invoice_status** (任意): string - 適格請求書発行事業者（qualified: 該当する、not_qualified: 該当しない、unspecified: 未選択）
- 支払依頼をインボイス要件をみたす申請として扱うかどうかを表します。
 (選択肢: qualified, not_qualified, unspecified) 例: `qualified`



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
