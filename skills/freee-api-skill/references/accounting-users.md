# Users

## 概要

ユーザー

## エンドポイント一覧

### GET /api/1/users

**操作**: 事業所に所属するユーザー一覧の取得

**説明**: 概要 事業所に所属するユーザー一覧を取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| limit | query | いいえ | integer(int64) | 取得レコードの件数 (デフォルト: 50, 最小: 1, 最大: 3000) |

### レスポンス (200)

- **users** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer(int64) - ユーザーID 例: `1` (最小: 1)
    - **email** **(必須)**: string - メールアドレス 例: `example@freee.co.jp`
    - **display_name** (任意): string - 表示名 例: `山田太郎`
    - **first_name** (任意): string - 氏名（名） 例: `太郎`
    - **last_name** (任意): string - 氏名（姓） 例: `山田`
    - **first_name_kana** (任意): string - 氏名（カナ・名） 例: `タロウ`
    - **last_name_kana** (任意): string - 氏名（カナ・姓） 例: `ヤマダ`

### GET /api/1/users/me

**操作**: ログインユーザーの取得

**説明**: 概要 ログインユーザーを取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| companies | query | いいえ | boolean | 取得情報にユーザーが所属する事業所一覧を含める (選択肢: true, false) |
| advisor | query | いいえ | boolean | 取得情報に事業がアドバイザー事象所の場合は事業所毎の一意なプロフィールIDを含める (選択肢: true, false) |

### レスポンス (200)

- **user** **(必須)**: object
  - **id** **(必須)**: integer(int64) - ユーザーID 例: `1` (最小: 1)
  - **email** **(必須)**: string - メールアドレス 例: `contaxt@example.com`
  - **display_name** (任意): string - 表示ユーザー名 例: `フリー太郎`
  - **first_name** (任意): string - 名 例: `太郎`
  - **last_name** (任意): string - 姓 例: `フリー`
  - **first_name_kana** (任意): string - 名（カナ） 例: `タロウ`
  - **last_name_kana** (任意): string - 姓（カナ） 例: `フリー`
  - **companies** (任意): array[object]

### PUT /api/1/users/me

**操作**: ログインユーザーの更新

**説明**: 概要 ログインユーザーを更新する

### リクエストボディ

- **display_name** (任意): string - 表示名 (20文字以内) 例: `山田太郎`
- **first_name** (任意): string - 氏名（名） (20文字以内) 例: `太郎`
- **last_name** (任意): string - 氏名（姓） (20文字以内) 例: `山田`
- **first_name_kana** (任意): string - 氏名（カナ・名） (20文字以内) 例: `タロウ`
- **last_name_kana** (任意): string - 氏名（カナ・姓） (20文字以内) 例: `ヤマダ`

### レスポンス (200)

- **user** (任意): object
  - **id** **(必須)**: integer(int64) - ユーザーID 例: `1` (最小: 1)
  - **email** **(必須)**: string - メールアドレス 例: `example@freee.co.jp`
  - **display_name** (任意): string - 表示名 例: `山田太郎`
  - **first_name** (任意): string - 氏名（名） 例: `太郎`
  - **last_name** (任意): string - 氏名（姓） 例: `山田`
  - **first_name_kana** (任意): string - 氏名（カナ・名） 例: `タロウ`
  - **last_name_kana** (任意): string - 氏名（カナ・姓） 例: `ヤマダ`

### GET /api/1/users/capabilities

**操作**: ログインユーザーの権限の取得

**説明**: 概要 ログインユーザーの権限を取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |

### レスポンス (200)

<p>レスポンスの各キーは以下の項目と対応しています。</p>
<p>詳細は <a href="https://support.freee.co.jp/hc/ja/articles/210265673">https://support.freee.co.jp/hc/ja/articles/210265673</a> を参照してください。</p>
<table>
  <thead>
    <tr>
      <th style="padding: 5px">キー</th>
      <th style="padding: 5px">対応する項目</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 5px">wallet_txns</td>
      <td style="padding: 5px">自動で経理 / 取得した明細</td>
    </tr>
    <tr>
      <td style="padding: 5px">deals</td>
      <td style="padding: 5px">取引</td>
    </tr>
    <tr>
      <td style="padding: 5px">transfers</td>
      <td style="padding: 5px">口座振替</td>
    </tr>
    <tr>
      <td style="padding: 5px">docs</td>
      <td style="padding: 5px">見積書・納品書・請求書・領収書・発注書</td>
    </tr>
    <tr>
      <td style="padding: 5px">doc_postings</td>
      <td style="padding: 5px">(請求書の)郵送</td>
    </tr>
    <tr>
      <td style="padding: 5px">receipts</td>
      <td style="padding: 5px">ファイルボックス</td>
    </tr>
    <tr>
      <td style="padding: 5px">receipt_stream_editor</td>
      <td style="padding: 5px">連続取引登録</td>
    </tr>
    <tr>
      <td style="padding: 5px">spreadsheets</td>
      <td style="padding: 5px">エクセルインポート</td>
    </tr>
    <tr>
      <td style="padding: 5px">expense_applications</td>
      <td style="padding: 5px">経費精算</td>
    </tr>
    <tr>
      <td style="padding: 5px">expense_application_sync_payroll</td>
      <td style="padding: 5px">経費精算の給与連携</td>
    </tr>
    <tr>
      <td style="padding: 5px">payment_requests</td>
      <td style="padding: 5px">支払依頼</td>
    </tr>
    <tr>
      <td style="padding: 5px">approval_requests</td>
      <td style="padding: 5px">各種申請</td>
    </tr>
    <tr>
      <td style="padding: 5px">reports</td>
      <td style="padding: 5px">収益 / 費用レポート</td>
    </tr>
    <tr>
      <td style="padding: 5px">reports_income_expense</td>
      <td style="padding: 5px">損益レポート</td>
    </tr>
    <tr>
      <td style="padding: 5px">reports_receivables</td>
      <td style="padding: 5px">入金管理レポート</td>
    </tr>
    <tr>
      <td style="padding: 5px">reports_payables</td>
      <td style="padding: 5px">支払管理レポート(一括振込ファイルを含む)</td>
    </tr>
    <tr>
      <td style="padding: 5px">reports_cash_balance</td>
      <td style="padding: 5px">現預金レポート/資金繰りレポート</td>
    </tr>
    <tr>
      <td style="padding: 5px">reports_managements_planning</td>
      <td style="padding: 5px">経営プランニング</td>
    </tr>
    <tr>
      <td style="padding: 5px">reports_managements_navigation</td>
      <td style="padding: 5px">経営ナビゲーション</td>
    </tr>
    <tr>
      <td style="padding: 5px">reports_custom_reports_aggregate</td>
      <td style="padding: 5px">カスタムレポート</td>
    </tr>
    <tr>
      <td style="padding: 5px">reports_pl</td>
      <td style="padding: 5px">損益計算書(月次推移/試算表)</td>
    </tr>
    <tr>
      <td style="padding: 5px">reports_bs</td>
      <td style="padding: 5px">貸借対照表(月次推移/試算表)</td>
    </tr>
    <tr>
      <td style="padding: 5px">reports_general_ledgers</td>
      <td style="padding: 5px">総勘定元帳</td>
    </tr>
    <tr>
      <td style="padding: 5px">reports_journals</td>
      <td style="padding: 5px">仕訳帳</td>
    </tr>
    <tr>
      <td style="padding: 5px">manual_journals</td>
      <td style="padding: 5px">振替伝票</td>
    </tr>
    <tr>
      <td style="padding: 5px">fixed_assets</td>
      <td style="padding: 5px">固定資産台帳</td>
    </tr>
    <tr>
      <td style="padding: 5px">inventory_refreshes</td>
      <td style="padding: 5px">在庫棚卸</td>
    </tr>
    <tr>
      <td style="padding: 5px">biz_allocations</td>
      <td style="padding: 5px">家事按分</td>
    </tr>
    <tr>
      <td style="padding: 5px">payment_records</td>
      <td style="padding: 5px">支払調書</td>
    </tr>
    <tr>
      <td style="padding: 5px">annual_reports</td>
      <td style="padding: 5px">決算書、確定申告書類</td>
    </tr>
    <tr>
      <td style="padding: 5px">tax_reports</td>
      <td style="padding: 5px">消費税区分別表・消費税集計表</td>
    </tr>
    <tr>
      <td style="padding: 5px">consumption_entries</td>
      <td style="padding: 5px">消費税申告書</td>
    </tr>
    <tr>
      <td style="padding: 5px">tax_return</td>
      <td style="padding: 5px">連携用データ</td>
    </tr>
    <tr>
      <td style="padding: 5px">account_item_statements</td>
      <td style="padding: 5px">勘定科目内訳明細書</td>
    </tr>
    <tr>
      <td style="padding: 5px">month_end</td>
      <td style="padding: 5px">月締め</td>
    </tr>
    <tr>
      <td style="padding: 5px">year_end</td>
      <td style="padding: 5px">年度締め</td>
    </tr>
    <tr>
      <td style="padding: 5px">walletables</td>
      <td style="padding: 5px">口座 / 口座の同期</td>
    </tr>
    <tr>
      <td style="padding: 5px">companies</td>
      <td style="padding: 5px">事業所の設定</td>
    </tr>
    <tr>
      <td style="padding: 5px">invitations</td>
      <td style="padding: 5px">メンバー招待</td>
    </tr>
    <tr>
      <td style="padding: 5px">access_controls</td>
      <td style="padding: 5px">権限管理</td>
    </tr>
    <tr>
      <td style="padding: 5px">sign_in_logs</td>
      <td style="padding: 5px">ログイン履歴</td>
    </tr>
    <tr>
      <td style="padding: 5px">user_attribute_logs</td>
      <td style="padding: 5px">ユーザー更新履歴</td>
    </tr>
    <tr>
      <td style="padding: 5px">app_role_logs</td>
      <td style="padding: 5px">権限変更履歴</td>
    </tr>
    <tr>
      <td style="padding: 5px">txn_relationship_logs</td>
      <td style="padding: 5px">仕訳関連履歴</td>
    </tr>
    <tr>
      <td style="padding: 5px">backups</td>
      <td style="padding: 5px">バックアップ</td>
    </tr>
    <tr>
      <td style="padding: 5px">opening_balances</td>
      <td style="padding: 5px">開始残高の設定</td>
    </tr>
    <tr>
      <td style="padding: 5px">system_conversion</td>
      <td style="padding: 5px">乗り換え設定</td>
    </tr>
    <tr>
      <td style="padding: 5px">resets</td>
      <td style="padding: 5px">リセット</td>
    </tr>
    <tr>
      <td style="padding: 5px">partners</td>
      <td style="padding: 5px">取引先</td>
    </tr>
    <tr>
      <td style="padding: 5px">items</td>
      <td style="padding: 5px">品目</td>
    </tr>
    <tr>
      <td style="padding: 5px">sections</td>
      <td style="padding: 5px">部門</td>
    </tr>
    <tr>
      <td style="padding: 5px">tags</td>
      <td style="padding: 5px">メモタグ</td>
    </tr>
    <tr>
      <td style="padding: 5px">account_items</td>
      <td style="padding: 5px">勘定科目</td>
    </tr>
    <tr>
      <td style="padding: 5px">taxes</td>
      <td style="padding: 5px">税区分</td>
    </tr>
    <tr>
      <td style="padding: 5px">payroll_item_sets</td>
      <td style="padding: 5px">給与連携の設定</td>
    </tr>
    <tr>
      <td style="padding: 5px">user_matchers</td>
      <td style="padding: 5px">自動登録ルール</td>
    </tr>
    <tr>
      <td style="padding: 5px">deal_templates</td>
      <td style="padding: 5px">取引テンプレート</td>
    </tr>
    <tr>
      <td style="padding: 5px">manual_journal_templates</td>
      <td style="padding: 5px">振替伝票テンプレート</td>
    </tr>
    <tr>
      <td style="padding: 5px">cost_allocations</td>
      <td style="padding: 5px">部門配賦</td>
    </tr>
    <tr>
      <td style="padding: 5px">approval_flow_routes</td>
      <td style="padding: 5px">承認経路</td>
    </tr>
    <tr>
      <td style="padding: 5px">expense_application_templates</td>
      <td style="padding: 5px">経費科目</td>
    </tr>
    <tr>
      <td style="padding: 5px">request_forms</td>
      <td style="padding: 5px">申請フォーム</td>
    </tr>
    <tr>
      <td style="padding: 5px">system_messages_for_admin</td>
      <td style="padding: 5px">管理者向けお知らせ</td>
    </tr>
    <tr>
      <td style="padding: 5px">company_internal_announcements</td>
      <td style="padding: 5px"><a href="https://support.freee.co.jp/hc/ja/articles/900002322383#:~:text=%E7%A4%BE%E5%86%85%E5%90%91%E3%81%91%E3%81%AE%E3%82%A2%E3%83%8A%E3%82%A6%E3%83%B3%E3%82%B9%E3%82%92%E6%8E%B2%E7%A4%BA%E3%81%A7%E3%81%8D%E3%82%8B%E6%A9%9F%E8%83%BD%E3%81%A7%E3%81%99%E3%80%82" target="_blank">アナウンス</a></td>
    </tr>
    <tr>
      <td style="padding: 5px">doc_change_logs</td>
      <td style="padding: 5px">受発注書類変更履歴</td>
    </tr>
    <tr>
      <td style="padding: 5px">workflows</td>
      <td style="padding: 5px">仕訳承認</td>
    </tr>
    <tr>
      <td style="padding: 5px">oauth_applications</td>
      <td style="padding: 5px">アプリ利用</td>
    </tr>
    <tr>
      <td style="padding: 5px">oauth_authorizations</td>
      <td style="padding: 5px">アプリ認可</td>
    </tr>
    <tr>
      <td style="padding: 5px">bank_accountant_staff_users</td>
      <td style="padding: 5px">アドバイザー事業所内でのメンバー管理</td>
    </tr>
  </tbody>
</table>


- **wallet_txns** **(必須)**: object
  - **confirm** (任意): boolean - 「自動で経理」の操作 例: `true`
  - **read** (任意): boolean - 「取得した明細」の閲覧 例: `true`
  - **create** (任意): boolean - 「取得した明細」の作成 例: `true`
  - **update** (任意): boolean - 「取得した明細」の更新 例: `true`
  - **destroy** (任意): boolean - 「取得した明細」の削除 例: `true`
- **deals** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
  - **allowed_target** (任意): string - 「自分のみ」がonになっている場合はself_only、offになっている場合はallになります。 (選択肢: self_only, all)
- **transfers** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
  - **allowed_target** (任意): string - 「自分のみ」がonになっている場合はself_only、offになっている場合はallになります。 (選択肢: self_only, all)
- **docs** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
  - **allowed_target** (任意): string - 「自分のみ」がonになっている場合はself_only、offになっている場合はallになります。 (選択肢: self_only, all)
- **doc_postings** **(必須)**: object
  - **create** (任意): boolean - 作成 例: `true`
- **receipts** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
  - **allowed_target** (任意): string - 「自分のみ」がonになっている場合はself_only、offになっている場合はallになります。 (選択肢: self_only, all)
- **receipt_stream_editor** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **spreadsheets** **(必須)**: object
  - **create** (任意): boolean - 作成 例: `true`
  - **read** (任意): boolean - 閲覧 例: `true`
- **expense_applications** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
  - **allowed_target** (任意): string - 「自分のみ」がonになっている場合はself_only、offになっている場合はallになります。 (選択肢: self_only, all)
- **expense_application_sync_payroll** **(必須)**: object
  - **create** (任意): boolean - 作成 例: `true`
- **payment_requests** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
  - **allowed_target** (任意): string - 「自分のみ」がonになっている場合はself_only、offになっている場合はallになります。 (選択肢: self_only, all)
- **approval_requests** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
  - **allowed_target** (任意): string - 「自分のみ」がonになっている場合はself_only、offになっている場合はallになります。 (選択肢: self_only, all)
- **reports** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **reports_income_expense** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **reports_receivables** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **reports_payables** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **write** (任意): boolean - 操作 例: `true`
- **reports_cash_balance** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **reports_managements_planning** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **write** (任意): boolean - 操作 例: `true`
- **reports_managements_navigation** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **write** (任意): boolean - 操作 例: `true`
- **reports_custom_reports_aggregate** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **reports_pl** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **reports_bs** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **reports_general_ledgers** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **reports_journals** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **manual_journals** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
  - **allowed_target** (任意): string - 「自分のみ」がonになっている場合はself_only、offになっている場合はallになります。 (選択肢: self_only, all)
- **fixed_assets** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **inventory_refreshes** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **biz_allocations** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **payment_records** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **annual_reports** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **tax_reports** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **consumption_entries** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **tax_return** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **account_item_statements** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **month_end** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **year_end** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
- **walletables** **(必須)**: object
  - **read** (任意): boolean - 「口座」の閲覧 例: `true`
  - **create** (任意): boolean - 「口座」の作成 例: `true`
  - **update** (任意): boolean - 「口座」の更新 例: `true`
  - **destroy** (任意): boolean - 「口座」の削除 例: `true`
  - **sync** (任意): boolean - 「口座の同期」の実行（廃止予定） 例: `true`
- **companies** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
- **invitations** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **access_controls** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
  - **write** (任意): boolean - 操作 例: `true`
- **sign_in_logs** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **user_attribute_logs** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **app_role_logs** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **txn_relationship_logs** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **backups** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **opening_balances** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
- **system_conversion** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **resets** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **partners** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **items** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **sections** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **tags** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **account_items** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **taxes** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
- **payroll_item_sets** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **user_matchers** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **deal_templates** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **manual_journal_templates** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **cost_allocations** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
- **approval_flow_routes** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **expense_application_templates** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **request_forms** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **system_messages_for_admin** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **company_internal_announcements** **(必須)**: object
  - **update** (任意): boolean - 更新 例: `true`
- **doc_change_logs** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
- **workflows** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **oauth_applications** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **oauth_authorizations** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`
- **bank_accountant_staff_users** **(必須)**: object
  - **read** (任意): boolean - 閲覧 例: `true`
  - **create** (任意): boolean - 作成 例: `true`
  - **update** (任意): boolean - 更新 例: `true`
  - **destroy** (任意): boolean - 削除 例: `true`



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
