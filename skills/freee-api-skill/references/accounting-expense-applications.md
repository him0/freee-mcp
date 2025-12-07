# Expense applications

## 概要

経費精算

## エンドポイント一覧

### GET /api/1/expense_applications

**操作**: 経費申請一覧の取得

**説明**: 概要 指定した事業所の経費申請一覧を取得する 経費精算APIの使い方については、freee会計経費精算APIの使い方をご参照ください 注意点 本APIでは、経費申請の一覧を取得することができます。 申請経路、承認者の指定として部門役職データ連携を活用し、以下のいずれかを利用している経費申請と申請経路はAPI経由で参照は可能ですが、作成と更新、承認ステータスの変更ができません。 役職指定（申請者の所属部門） 役職指定（申請時に部門指定） 部門および役職指定

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| status | query | いいえ | string | 申請ステータス(draft:下書き, in_progress:申請中, approved:承認済, rejected:却下, feedback:差戻し)、 取引ステータス(unsettled:清算待ち, settled:精算済み) (選択肢: draft, in_progress, approved, rejected, feedback, unsettled, settled) |
| payroll_attached | query | いいえ | boolean | true:給与連携あり、false:給与連携なし、未指定時:絞り込みなし |
| start_transaction_date | query | いいえ | string | 発生日(経費申請項目の日付)で絞込：開始日(yyyy-mm-dd) |
| end_transaction_date | query | いいえ | string | 発生日(経費申請項目の日付)で絞込：終了日(yyyy-mm-dd) |
| application_number | query | いいえ | integer(int64) | 申請No. |
| title | query | いいえ | string | 申請タイトル |
| start_issue_date | query | いいえ | string | 申請日で絞込：開始日(yyyy-mm-dd) |
| end_issue_date | query | いいえ | string | 申請日で絞込：終了日(yyyy-mm-dd) |
| applicant_id | query | いいえ | integer(int64) | 申請者のユーザーID |
| approver_id | query | いいえ | integer(int64) | 承認者のユーザーID |
| min_amount | query | いいえ | integer(int64) | 金額で絞込 (下限金額) |
| max_amount | query | いいえ | integer(int64) | 金額で絞込 (上限金額) |
| offset | query | いいえ | integer(int64) | 取得レコードのオフセット (デフォルト: 0) |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 50, 最小: 1, 最大: 500) |

### レスポンス (200)

- **expense_applications** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - 経費申請ID 例: `1` (最小: 1)
    - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
    - **title** **(必須)**: string - 申請タイトル 例: `大阪出張`
    - **issue_date** **(必須)**: string - 申請日 (yyyy-mm-dd) 例: `2019-12-17`
    - **description** (任意): string - 備考 例: `◯◯連携先ID: cx12345`
    - **total_amount** (任意): integer(int64) - 合計金額 例: `30000`
    - **status** **(必須)**: string - 申請ステータス(draft:下書き, in_progress:申請中, approved:承認済, rejected:却下, feedback:差戻し) (選択肢: draft, in_progress, approved, rejected, feedback) 例: `draft`
    - **section_id** (任意): integer(int64) - 部門ID 例: `101` (最小: 1)
    - **tag_ids** (任意): array[integer] - メモタグID
    - **purchase_lines** (任意): array[object] - 経費申請の申請行一覧（配列）
    - **deal_id** **(必須)**: integer(int64) - 取引ID (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_idが表示されます) 例: `1` (最小: 1)
    - **deal_status** **(必須)**: string - 取引ステータス (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_statusが表示されます settled:精算済み, unsettled:清算待ち) (選択肢: settled, unsettled) 例: `settled`
    - **applicant_id** **(必須)**: integer(int64) - 申請者のユーザーID 例: `1` (最小: 1)
    - **application_number** **(必須)**: string - 申請No. 例: `2`
    - **current_step_id** (任意): integer(int64) - 現在承認ステップID 例: `1` (最小: 1)
    - **current_round** (任意): integer(int64) - 現在のround。差し戻し等により申請がstepの最初からやり直しになるとroundの値が増えます。 例: `1` (最小: 0, 最大: 2147483647)
    - **segment_1_tag_id** (任意): integer(int64) - セグメント１タグID 例: `1` (最小: 1)
    - **segment_2_tag_id** (任意): integer(int64) - セグメント２タグID 例: `2` (最小: 1)
    - **segment_3_tag_id** (任意): integer(int64) - セグメント３タグID 例: `3` (最小: 1)

### POST /api/1/expense_applications

**操作**: 経費申請の作成

**説明**: 概要 指定した事業所の経費申請を作成する 経費精算APIの使い方については、freee会計経費精算APIの使い方をご参照ください 注意点 申請ステータス(下書き、申請中)の指定と変更、及び承認操作（承認する、却下する、申請者へ差し戻す、特権承認する、承認済み・却下済みを取り消す）は以下を参考にして行ってください。 承認操作は申請ステータスが申請中、承認済み、却下のものだけが対象です。 初回申請の場合 申請の作成（POST） 作成済みの申請の申請ステータス変更・更新する場合 申請の更新（PUT） 申請中、承認済み、却下の申請の承認操作を行う場合 承認操作の実行（POST） 申請の削除（DELETE）が可能なのは申請ステータスが下書き、差戻しの場合のみです 申請経路、承認者の指定として部門役職データ連携を活用し、以下のいずれかを利用している経費申請は本API経由で作成ができません。 役職指定（申請者の所属部門） 役職指定（申請時に部門指定） 部門および役職指定 申請時には、申請タイトル(title)に加え、項目行については金額(amount)、日付(transaction_date)、内容...

### リクエストボディ

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **title** **(必須)**: string - 申請タイトル (250文字以内) 例: `大阪出張`
- **issue_date** (任意): string - 申請日 (yyyy-mm-dd)<br>
指定しない場合は当日の日付が登録されます。
 例: `2019-12-17`
- **description** (任意): string - 備考 (10000文字以内) 例: `◯◯連携先ID: cx12345`
- **section_id** (任意): integer(int64) - 部門ID 例: `101` (最小: 1)
- **tag_ids** (任意): array[integer] - メモタグID
- **purchase_lines** (任意): array[object] - 経費申請の申請行一覧（配列）
  配列の要素:
    - **receipt_id** (任意): integer(int64) - ファイルボックス（証憑ファイル）ID 例: `606` (最小: 1)
    - **transaction_date** **(必須)**: string - 発生日(yyyy-mm-dd) 例: `2019-12-17`
    - **sub_receipt_ids** (任意): array[integer] - 補足資料（配列）
  receipt_id（証憑ファイル）を指定してください。
  receipt_id（証憑ファイル）は5個まで指定できます
    - **expense_application_lines** (任意): array[object] - 明細行一覧（配列）
- **approval_flow_route_id** (任意): integer(int64) - 申請経路ID<br>
<ul>
    <li>経費申請のステータスを申請中として作成する場合は、必ず指定してください。</li>
    <li>指定する申請経路IDは、申請経路APIを利用して取得してください。</li>
    <li>
        未指定の場合は、基本経路を設定している事業所では基本経路が、基本経路を設定していない事業所では利用可能な申請経路の中から最初の申請経路が自動的に使用されます。
        <ul>
           <li>意図しない申請経路を持った経費申請の作成を防ぐために、使用する申請経路IDを指定することを推奨します。</li>
        </ul>
    </li>
    <li>
        法人スタータープラン、法人スタンダードプラン（および旧法人ベーシックプラン）の事業所では以下のデフォルトで用意された申請経路のみ指定できます
        <ul>
        <li>指定なし</li>
        <li>承認者を指定</li>
        </ul>
    </li>
</ul>
 例: `1` (最小: 1)
- **approver_id** (任意): integer(int64) - 承認者のユーザーID<br>
「承認者を指定」の経路を申請経路として使用する場合に指定してください。<br>
指定する承認者のユーザーIDは、申請経路APIを利用して取得してください。
 例: `1` (最小: 1)
- **draft** (任意): boolean - 経費申請のステータス<br>
falseを指定した時は申請中（in_progress）で経費申請を作成します。<br>
trueを指定した時は下書き（draft）で経費申請を作成します。<br>
未指定の時は下書きとみなして経費申請を作成します。
 例: `true`
- **parent_id** (任意): integer(int64) - 親申請ID(法人アドバンスプラン（および旧法人プロフェッショナルプラン）, 法人エンタープライズプラン)<br>
<ul>
  <li>承認済みの既存各種申請IDのみ指定可能です。</li>
  <li>各種申請一覧APIを利用して取得してください。</li>
</ul>
 例: `2` (最小: 1)
- **segment_1_tag_id** (任意): integer(int64) - セグメント１タグID<br>
セグメントタグ一覧の取得APIを利用して取得してください。<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定</a><br>
 例: `1` (最小: 1)
- **segment_2_tag_id** (任意): integer(int64) - セグメント２タグID<br>
セグメントタグ一覧の取得APIを利用して取得してください。<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定</a><br>
 例: `2` (最小: 1)
- **segment_3_tag_id** (任意): integer(int64) - セグメント３タグID<br>
セグメントタグ一覧の取得APIを利用して取得してください。<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定</a><br>
 例: `3` (最小: 1)

### レスポンス (201)

- **expense_application** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 経費申請ID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **title** **(必須)**: string - 申請タイトル 例: `大阪出張`
  - **issue_date** **(必須)**: string - 申請日 (yyyy-mm-dd) 例: `2019-12-17`
  - **description** (任意): string - 備考 例: `◯◯連携先ID: cx12345`
  - **total_amount** (任意): integer(int64) - 合計金額 例: `30000`
  - **status** **(必須)**: string - 申請ステータス(draft:下書き, in_progress:申請中, approved:承認済, rejected:却下, feedback:差戻し) (選択肢: draft, in_progress, approved, rejected, feedback) 例: `draft`
  - **section_id** (任意): integer(int64) - 部門ID 例: `101` (最小: 1)
  - **tag_ids** (任意): array[integer] - メモタグID
  - **purchase_lines** (任意): array[object] - 経費申請の申請行一覧（配列）
  - **deal_id** **(必須)**: integer(int64) - 取引ID (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_idが表示されます) 例: `1` (最小: 1)
  - **deal_status** **(必須)**: string - 取引ステータス (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_statusが表示されます settled:精算済み, unsettled:清算待ち) (選択肢: settled, unsettled) 例: `settled`
  - **applicant_id** **(必須)**: integer(int64) - 申請者のユーザーID 例: `1` (最小: 1)
  - **approvers** **(必須)**: array[object] - 承認者（配列）
  承認ステップのresource_typeがunspecified (指定なし)の場合はapproversはレスポンスに含まれません。
  しかし、resource_typeがunspecifiedの承認ステップにおいて誰かが承認・却下・差し戻しのいずれかのアクションを取った後は、
  approversはレスポンスに含まれるようになります。
  その場合approversにはアクションを行ったステップのIDとアクションを行ったユーザーのIDが含まれます。
  - **application_number** **(必須)**: string - 申請No. 例: `2`
  - **approval_flow_route_id** **(必須)**: integer(int64) - 申請経路ID 例: `1` (最小: 1)
  - **comments** **(必須)**: array[object] - 経費申請のコメント一覧（配列）
  - **approval_flow_logs** **(必須)**: array[object] - 経費申請の承認履歴（配列）
  - **current_step_id** **(必須)**: integer(int64) - 現在承認ステップID 例: `1` (最小: 1)
  - **current_round** **(必須)**: integer(int64) - 現在のround。差し戻し等により申請がstepの最初からやり直しになるとroundの値が増えます。 例: `1` (最小: 0, 最大: 2147483647)
  - **parent_id** (任意): integer(int64) - 親申請ID。各種申請が使用可能なプランの時のみレスポンスに含まれます。 例: `2` (最小: 1)
  - **segment_1_tag_id** (任意): integer(int64) - セグメント１タグID 例: `1` (最小: 1)
  - **segment_2_tag_id** (任意): integer(int64) - セグメント２タグID 例: `2` (最小: 1)
  - **segment_3_tag_id** (任意): integer(int64) - セグメント３タグID 例: `3` (最小: 1)

### GET /api/1/expense_applications/{id}

**操作**: 経費申請詳細の取得

**説明**: 概要 指定した事業所の経費申請を取得する 経費精算APIの使い方については、freee会計経費精算APIの使い方をご参照ください 注意点 申請経路、承認者の指定として部門役職データ連携を活用し、以下のいずれかを利用している経費申請と申請経路はAPI経由で参照は可能ですが、作成と更新、承認ステータスの変更ができません。 役職指定（申請者の所属部門） 役職指定（申請時に部門指定） 部門および役職指定 本APIは駅すぱあと連携 (出発駅と到着駅から金額を自動入力する機能)には非対応です。駅すぱあと連携を使用した経費申請は取得できません。 本APIは外貨には非対応です。外貨を利用する経費申請は取得できません。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 経費申請ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (200)

- **expense_application** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 経費申請ID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **title** **(必須)**: string - 申請タイトル 例: `大阪出張`
  - **issue_date** **(必須)**: string - 申請日 (yyyy-mm-dd) 例: `2019-12-17`
  - **description** (任意): string - 備考 例: `◯◯連携先ID: cx12345`
  - **total_amount** (任意): integer(int64) - 合計金額 例: `30000`
  - **status** **(必須)**: string - 申請ステータス(draft:下書き, in_progress:申請中, approved:承認済, rejected:却下, feedback:差戻し) (選択肢: draft, in_progress, approved, rejected, feedback) 例: `draft`
  - **section_id** (任意): integer(int64) - 部門ID 例: `101` (最小: 1)
  - **tag_ids** (任意): array[integer] - メモタグID
  - **purchase_lines** (任意): array[object] - 経費申請の申請行一覧（配列）
  - **deal_id** **(必須)**: integer(int64) - 取引ID (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_idが表示されます) 例: `1` (最小: 1)
  - **deal_status** **(必須)**: string - 取引ステータス (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_statusが表示されます settled:精算済み, unsettled:清算待ち) (選択肢: settled, unsettled) 例: `settled`
  - **applicant_id** **(必須)**: integer(int64) - 申請者のユーザーID 例: `1` (最小: 1)
  - **approvers** **(必須)**: array[object] - 承認者（配列）
  承認ステップのresource_typeがunspecified (指定なし)の場合はapproversはレスポンスに含まれません。
  しかし、resource_typeがunspecifiedの承認ステップにおいて誰かが承認・却下・差し戻しのいずれかのアクションを取った後は、
  approversはレスポンスに含まれるようになります。
  その場合approversにはアクションを行ったステップのIDとアクションを行ったユーザーのIDが含まれます。
  - **application_number** **(必須)**: string - 申請No. 例: `2`
  - **approval_flow_route_id** **(必須)**: integer(int64) - 申請経路ID 例: `1` (最小: 1)
  - **comments** **(必須)**: array[object] - 経費申請のコメント一覧（配列）
  - **approval_flow_logs** **(必須)**: array[object] - 経費申請の承認履歴（配列）
  - **current_step_id** **(必須)**: integer(int64) - 現在承認ステップID 例: `1` (最小: 1)
  - **current_round** **(必須)**: integer(int64) - 現在のround。差し戻し等により申請がstepの最初からやり直しになるとroundの値が増えます。 例: `1` (最小: 0, 最大: 2147483647)
  - **parent_id** (任意): integer(int64) - 親申請ID。各種申請が使用可能なプランの時のみレスポンスに含まれます。 例: `2` (最小: 1)
  - **segment_1_tag_id** (任意): integer(int64) - セグメント１タグID 例: `1` (最小: 1)
  - **segment_2_tag_id** (任意): integer(int64) - セグメント２タグID 例: `2` (最小: 1)
  - **segment_3_tag_id** (任意): integer(int64) - セグメント３タグID 例: `3` (最小: 1)

### PUT /api/1/expense_applications/{id}

**操作**: 経費申請の更新

**説明**: 概要 指定した事業所の経費申請を更新する 経費精算APIの使い方については、freee会計経費精算APIの使い方をご参照ください 注意点 本APIでは、経費申請を更新することができます。 本APIでは、status(申請ステータス): draft:下書き, feedback:差戻しのみ更新可能です。 申請ステータス(下書き、申請中)の指定と変更、及び承認操作（承認する、却下する、申請者へ差し戻す、特権承認する、承認済み・却下済みを取り消す）は以下を参考にして行ってください。 承認操作は申請ステータスが申請中、承認済み、却下のものだけが対象です。 初回申請の場合 申請の作成（POST） 作成済みの申請の申請ステータス変更・更新する場合 申請の更新（PUT） 申請中、承認済み、却下の申請の承認操作を行う場合 承認操作の実行（POST） 申請の削除（DELETE）が可能なのは申請ステータスが下書き、差戻しの場合のみです 申請経路、承認者の指定として部門役職データ連携を活用し、以下のいずれかを利用している経費申請は本API経由で更新ができません。 役職指定（申請者の所属部門） 役職指定（申請時...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 経費申請ID |

### リクエストボディ

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **title** **(必須)**: string - 申請タイトル (250文字以内) 例: `大阪出張`
- **issue_date** (任意): string - 申請日 (yyyy-mm-dd)<br>
指定しない場合は当日の日付が登録されます。
 例: `2019-12-17`
- **description** (任意): string - 備考 (10000文字以内) 例: `◯◯連携先ID: cx12345`
- **section_id** (任意): integer(int64) - 部門ID 例: `101` (最小: 1)
- **tag_ids** (任意): array[integer] - メモタグID
- **purchase_lines** (任意): array[object] - 経費申請の申請行一覧（配列）
  配列の要素:
    - **id** (任意): integer(int64) - 経費申請の申請行ID: 既存申請行を更新する場合に指定します。IDを指定しない申請行は、新規行として扱われ追加されます。また、purchase_linesに含まれない既存の申請行は削除されます。更新後も残したい行は、必ず経費申請の申請行IDを指定してpurchase_linesに含めてください。 例: `1` (最小: 1)
    - **transaction_date** **(必須)**: string - 発生日(yyyy-mm-dd) 例: `2019-12-17`
    - **receipt_id** (任意): integer(int64) - ファイルボックス（証憑ファイル）ID 例: `606` (最小: 1)
    - **sub_receipt_ids** (任意): array[integer] - 補足資料（配列）
  receipt_id（証憑ファイル）を指定してください。
  receipt_id（証憑ファイル）は5個まで指定できます
    - **expense_application_lines** (任意): array[object] - 明細行一覧（配列）
- **approval_flow_route_id** (任意): integer(int64) - 申請経路ID<br>
<ul>
    <li>経費申請のステータスを申請中として作成する場合は、必ず指定してください。</li>
    <li>指定する申請経路IDは、申請経路APIを利用して取得してください。</li>
    <li>
        未指定の場合は、基本経路を設定している事業所では基本経路が、基本経路を設定していない事業所では利用可能な申請経路の中から最初の申請経路が自動的に使用されます。
        <ul>
          <li>意図しない申請経路を持った経費申請の作成を防ぐために、使用する申請経路IDを指定することを推奨します。</li>
        </ul>
    </li>
    <li>
        法人スタータープラン、法人スタンダードプラン（および旧法人ベーシックプラン）の事業所では以下のデフォルトで用意された申請経路のみ指定できます
        <ul>
        <li>指定なし</li>
        <li>承認者を指定</li>
        </ul>
    </li>
</ul>
 例: `1` (最小: 1)
- **approver_id** (任意): integer(int64) - 承認者のユーザーID<br>
指定する承認者のユーザーIDは、申請経路APIを利用して取得してください。
 例: `1` (最小: 1)
- **draft** (任意): boolean - 経費申請のステータス<br>
falseを指定した時は申請中（in_progress）で経費申請を更新します。<br>
trueを指定した時は下書き（draft）で経費申請を更新します。<br>
未指定の時は下書きとみなして経費申請を更新します。
 例: `true`
- **parent_id** (任意): integer(int64) - 親申請ID(法人アドバンスプラン（および旧法人プロフェッショナルプラン）, 法人エンタープライズプラン)<br>
<ul>
  <li>承認済みの既存各種申請IDのみ指定可能です。</li>
  <li>各種申請一覧APIを利用して取得してください。</li>
</ul>
 例: `2` (最小: 1)
- **segment_1_tag_id** (任意): integer(int64) - セグメント１タグID<br>
セグメントタグ一覧の取得APIを利用して取得してください。<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定</a><br>
 例: `1` (最小: 1)
- **segment_2_tag_id** (任意): integer(int64) - セグメント２タグID<br>
セグメントタグ一覧の取得APIを利用して取得してください。<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定</a><br>
 例: `2` (最小: 1)
- **segment_3_tag_id** (任意): integer(int64) - セグメント３タグID<br>
セグメントタグ一覧の取得APIを利用して取得してください。<br>
<a href="https://support.freee.co.jp/hc/ja/articles/360020679611" target="_blank">セグメント（分析用タグ）の設定</a><br>
 例: `3` (最小: 1)

### レスポンス (200)

- **expense_application** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 経費申請ID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **title** **(必須)**: string - 申請タイトル 例: `大阪出張`
  - **issue_date** **(必須)**: string - 申請日 (yyyy-mm-dd) 例: `2019-12-17`
  - **description** (任意): string - 備考 例: `◯◯連携先ID: cx12345`
  - **total_amount** (任意): integer(int64) - 合計金額 例: `30000`
  - **status** **(必須)**: string - 申請ステータス(draft:下書き, in_progress:申請中, approved:承認済, rejected:却下, feedback:差戻し) (選択肢: draft, in_progress, approved, rejected, feedback) 例: `draft`
  - **section_id** (任意): integer(int64) - 部門ID 例: `101` (最小: 1)
  - **tag_ids** (任意): array[integer] - メモタグID
  - **purchase_lines** (任意): array[object] - 経費申請の申請行一覧（配列）
  - **deal_id** **(必須)**: integer(int64) - 取引ID (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_idが表示されます) 例: `1` (最小: 1)
  - **deal_status** **(必須)**: string - 取引ステータス (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_statusが表示されます settled:精算済み, unsettled:清算待ち) (選択肢: settled, unsettled) 例: `settled`
  - **applicant_id** **(必須)**: integer(int64) - 申請者のユーザーID 例: `1` (最小: 1)
  - **approvers** **(必須)**: array[object] - 承認者（配列）
  承認ステップのresource_typeがunspecified (指定なし)の場合はapproversはレスポンスに含まれません。
  しかし、resource_typeがunspecifiedの承認ステップにおいて誰かが承認・却下・差し戻しのいずれかのアクションを取った後は、
  approversはレスポンスに含まれるようになります。
  その場合approversにはアクションを行ったステップのIDとアクションを行ったユーザーのIDが含まれます。
  - **application_number** **(必須)**: string - 申請No. 例: `2`
  - **approval_flow_route_id** **(必須)**: integer(int64) - 申請経路ID 例: `1` (最小: 1)
  - **comments** **(必須)**: array[object] - 経費申請のコメント一覧（配列）
  - **approval_flow_logs** **(必須)**: array[object] - 経費申請の承認履歴（配列）
  - **current_step_id** **(必須)**: integer(int64) - 現在承認ステップID 例: `1` (最小: 1)
  - **current_round** **(必須)**: integer(int64) - 現在のround。差し戻し等により申請がstepの最初からやり直しになるとroundの値が増えます。 例: `1` (最小: 0, 最大: 2147483647)
  - **parent_id** (任意): integer(int64) - 親申請ID。各種申請が使用可能なプランの時のみレスポンスに含まれます。 例: `2` (最小: 1)
  - **segment_1_tag_id** (任意): integer(int64) - セグメント１タグID 例: `1` (最小: 1)
  - **segment_2_tag_id** (任意): integer(int64) - セグメント２タグID 例: `2` (最小: 1)
  - **segment_3_tag_id** (任意): integer(int64) - セグメント３タグID 例: `3` (最小: 1)

### DELETE /api/1/expense_applications/{id}

**操作**: 経費申請の削除

**説明**: 概要 指定した事業所の経費申請を削除する 経費精算APIの使い方については、freee会計経費精算APIの使い方をご参照ください 注意点 申請ステータス(下書き、申請中)の指定と変更、及び承認操作（承認する、却下する、申請者へ差し戻す、特権承認する、承認済み・却下済みを取り消す）は以下を参考にして行ってください。 承認操作は申請ステータスが申請中、承認済み、却下のものだけが対象です。 初回申請の場合 申請の作成（POST） 作成済みの申請の申請ステータス変更・更新する場合 申請の更新（PUT） 申請中、承認済み、却下の申請の承認操作を行う場合 承認操作の実行（POST） 申請の削除（DELETE）が可能なのは申請ステータスが下書き、差戻しの場合のみです 自分が申請者でない申請の削除が可能なのはユーザーの権限が管理者権限、且つ申請ステータスが差し戻しの場合のみです 本APIは駅すぱあと連携 (出発駅と到着駅から金額を自動入力する機能)には非対応です。駅すぱあと連携を使用した経費申請は削除できません。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 経費申請ID |
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (204)

### POST /api/1/expense_applications/{id}/actions

**操作**: 経費申請の承認操作

**説明**: 概要 指定した事業所の経費申請の承認操作を行う 経費精算APIの使い方については、freee会計経費精算APIの使い方をご参照ください 注意点 本APIでは、経費申請の承認操作（承認する、却下する、申請者へ差し戻す、特権承認する、承認済み・却下済みを取り消す）を行うことができます。 申請ステータス(下書き、申請中)の指定と変更、及び承認操作（承認する、却下する、申請者へ差し戻す、特権承認する、承認済み・却下済みを取り消す）は以下を参考にして行ってください。 承認操作は申請ステータスが申請中、承認済み、却下のものだけが対象です。 初回申請の場合 申請の作成（POST） 作成済みの申請の申請ステータス変更・更新する場合 申請の更新（PUT） 申請中、承認済み、却下の申請の承認操作を行う場合 承認操作の実行（POST） 申請の削除（DELETE）が可能なのは申請ステータスが下書き、差戻しの場合のみです 申請経路、承認者の指定として部門役職データ連携を活用し、以下のいずれかを利用している経費申請はAPI経由で承認ステータスの変更ができません。 役職指定（申請者の所属部門） 役職指定（申請時に部...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 経費申請ID |

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **approval_action** **(必須)**: string - 操作(approve: 承認する、force_approve: 特権承認する、cancel: 申請を取り消す、reject: 却下する、feedback: 申請者へ差し戻す、force_feedback: 承認済み・却下済みを取り消す) (選択肢: approve, force_approve, cancel, reject, feedback, force_feedback) 例: `approve`
- **target_step_id** **(必須)**: integer(int64) - 対象承認ステップID 経費申請の取得APIレスポンス.current_step_idを送信してください。 例: `1` (最小: 1)
- **target_round** **(必須)**: integer(int64) - 対象round。差し戻し等により申請がstepの最初からやり直しになるとroundの値が増えます。経費申請の取得APIレスポンス.current_roundを送信してください。 例: `1` (最小: 0, 最大: 2147483647)
- **next_approver_id** (任意): integer(int64) - 次ステップの承認者のユーザーID 例: `1` (最小: 1)

### レスポンス (201)

- **expense_application** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 経費申請ID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **title** **(必須)**: string - 申請タイトル 例: `大阪出張`
  - **issue_date** **(必須)**: string - 申請日 (yyyy-mm-dd) 例: `2019-12-17`
  - **description** (任意): string - 備考 例: `◯◯連携先ID: cx12345`
  - **total_amount** (任意): integer(int64) - 合計金額 例: `30000`
  - **status** **(必須)**: string - 申請ステータス(draft:下書き, in_progress:申請中, approved:承認済, rejected:却下, feedback:差戻し) (選択肢: draft, in_progress, approved, rejected, feedback) 例: `draft`
  - **section_id** (任意): integer(int64) - 部門ID 例: `101` (最小: 1)
  - **tag_ids** (任意): array[integer] - メモタグID
  - **purchase_lines** (任意): array[object] - 経費申請の申請行一覧（配列）
  - **deal_id** **(必須)**: integer(int64) - 取引ID (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_idが表示されます) 例: `1` (最小: 1)
  - **deal_status** **(必須)**: string - 取引ステータス (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_statusが表示されます settled:精算済み, unsettled:清算待ち) (選択肢: settled, unsettled) 例: `settled`
  - **applicant_id** **(必須)**: integer(int64) - 申請者のユーザーID 例: `1` (最小: 1)
  - **approvers** **(必須)**: array[object] - 承認者（配列）
  承認ステップのresource_typeがunspecified (指定なし)の場合はapproversはレスポンスに含まれません。
  しかし、resource_typeがunspecifiedの承認ステップにおいて誰かが承認・却下・差し戻しのいずれかのアクションを取った後は、
  approversはレスポンスに含まれるようになります。
  その場合approversにはアクションを行ったステップのIDとアクションを行ったユーザーのIDが含まれます。
  - **application_number** **(必須)**: string - 申請No. 例: `2`
  - **approval_flow_route_id** **(必須)**: integer(int64) - 申請経路ID 例: `1` (最小: 1)
  - **comments** **(必須)**: array[object] - 経費申請のコメント一覧（配列）
  - **approval_flow_logs** **(必須)**: array[object] - 経費申請の承認履歴（配列）
  - **current_step_id** **(必須)**: integer(int64) - 現在承認ステップID 例: `1` (最小: 1)
  - **current_round** **(必須)**: integer(int64) - 現在のround。差し戻し等により申請がstepの最初からやり直しになるとroundの値が増えます。 例: `1` (最小: 0, 最大: 2147483647)
  - **parent_id** (任意): integer(int64) - 親申請ID。各種申請が使用可能なプランの時のみレスポンスに含まれます。 例: `2` (最小: 1)
  - **segment_1_tag_id** (任意): integer(int64) - セグメント１タグID 例: `1` (最小: 1)
  - **segment_2_tag_id** (任意): integer(int64) - セグメント２タグID 例: `2` (最小: 1)
  - **segment_3_tag_id** (任意): integer(int64) - セグメント３タグID 例: `3` (最小: 1)

### PUT /api/1/expense_applications/{id}/parent_approvable_requests

**操作**: 経費申請に関連付ける各種申請の更新

**説明**: 概要 指定した事業所の経費申請に関連付ける各種申請の更新を行う 経費精算APIの使い方については、freee会計経費精算APIの使い方をご参照ください 注意点 本APIでは、経費申請に関連付ける各種申請を更新することができます。 本APIでは、status(申請ステータス): in_progress:申請中, approved:承認済みのみ更新可能です。 parent_idにnullを指定すると、現在設定されている各種申請との関連付けを解除できます。 申請ステータスが申請中の経費申請に対して関連付ける各種申請を更新するためには、以下の全てに当てはまる必要があります。 現在の承認ステップで承認者として指定されている、または特権承認ができる 申請フォームの設定で、承認者による経費申請に関連付ける各種申請の更新が許可されている 申請ステータスが承認済みの経費申請に対して関連付ける各種申請を更新するためには、以下の全てに当てはまる必要があります。 経費精算に対する閲覧および編集の権限を持ち、自分の経費申請のみに限定する制限がかかっていない 申請フォームの設定で、管理者による経費申請に関連付ける...

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer(int64) | 経費申請ID |

### リクエストボディ

**(必須)**

- **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
- **parent_id** **(必須)**: integer(int64) - 各種申請ID
- 経費申請に関連付ける各種申請IDを指定します
- 閲覧権限のある承認済みの既存各種申請IDのみ指定ができます
- 既に経費申請に紐付いている各種申請との関連は解除されます
- 経費申請に紐付く各種申請を解除する場合はnullを指定してください
 例: `1` (最小: 1)

### レスポンス (200)

- **expense_application** **(必須)**: object
  - **id** **(必須)**: integer(int64) - 経費申請ID 例: `1` (最小: 1)
  - **company_id** **(必須)**: integer(int64) - 事業所ID 例: `1` (最小: 1)
  - **title** **(必須)**: string - 申請タイトル 例: `大阪出張`
  - **issue_date** **(必須)**: string - 申請日 (yyyy-mm-dd) 例: `2019-12-17`
  - **description** (任意): string - 備考 例: `◯◯連携先ID: cx12345`
  - **total_amount** (任意): integer(int64) - 合計金額 例: `30000`
  - **status** **(必須)**: string - 申請ステータス(draft:下書き, in_progress:申請中, approved:承認済, rejected:却下, feedback:差戻し) (選択肢: draft, in_progress, approved, rejected, feedback) 例: `draft`
  - **section_id** (任意): integer(int64) - 部門ID 例: `101` (最小: 1)
  - **tag_ids** (任意): array[integer] - メモタグID
  - **purchase_lines** (任意): array[object] - 経費申請の申請行一覧（配列）
  - **deal_id** **(必須)**: integer(int64) - 取引ID (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_idが表示されます) 例: `1` (最小: 1)
  - **deal_status** **(必須)**: string - 取引ステータス (申請ステータス:statusがapprovedで、取引が存在する時のみdeal_statusが表示されます settled:精算済み, unsettled:清算待ち) (選択肢: settled, unsettled) 例: `settled`
  - **applicant_id** **(必須)**: integer(int64) - 申請者のユーザーID 例: `1` (最小: 1)
  - **approvers** **(必須)**: array[object] - 承認者（配列）
  承認ステップのresource_typeがunspecified (指定なし)の場合はapproversはレスポンスに含まれません。
  しかし、resource_typeがunspecifiedの承認ステップにおいて誰かが承認・却下・差し戻しのいずれかのアクションを取った後は、
  approversはレスポンスに含まれるようになります。
  その場合approversにはアクションを行ったステップのIDとアクションを行ったユーザーのIDが含まれます。
  - **application_number** **(必須)**: string - 申請No. 例: `2`
  - **approval_flow_route_id** **(必須)**: integer(int64) - 申請経路ID 例: `1` (最小: 1)
  - **comments** **(必須)**: array[object] - 経費申請のコメント一覧（配列）
  - **approval_flow_logs** **(必須)**: array[object] - 経費申請の承認履歴（配列）
  - **current_step_id** **(必須)**: integer(int64) - 現在承認ステップID 例: `1` (最小: 1)
  - **current_round** **(必須)**: integer(int64) - 現在のround。差し戻し等により申請がstepの最初からやり直しになるとroundの値が増えます。 例: `1` (最小: 0, 最大: 2147483647)
  - **parent_id** (任意): integer(int64) - 親申請ID。各種申請が使用可能なプランの時のみレスポンスに含まれます。 例: `2` (最小: 1)
  - **segment_1_tag_id** (任意): integer(int64) - セグメント１タグID 例: `1` (最小: 1)
  - **segment_2_tag_id** (任意): integer(int64) - セグメント２タグID 例: `2` (最小: 1)
  - **segment_3_tag_id** (任意): integer(int64) - セグメント３タグID 例: `3` (最小: 1)



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
