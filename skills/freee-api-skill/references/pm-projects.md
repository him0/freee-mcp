# Projects

## 概要



## エンドポイント一覧

### POST /projects

操作: プロジェクトの登録

説明: プロジェクトを登録することができます。

### リクエストボディ

- company_id (必須): integer(int32) - 事業所ID 例: `1`
- name (必須): string - プロジェクト名
- code (必須): string - プロジェクトコード
- description (任意): string - プロジェクト概要
- from_date (必須): string - プロジェクト開始日
- thru_date (必須): string - プロジェクト終了日
- publish_to_employee (任意): boolean - 従業員への公開設定
公開するとプロジェクト一覧に表示され、従業員がアサインリクエストを送れるようになります。（詳細画面は閲覧不可）
- assignment_url_enabled (任意): boolean - プロジェクトの招待リンク機能設定
プロジェクトの招待リンクを発行できるようにするかどうかを設定します。
- sales_order_status_id (任意): integer(int32) - 受注ステータスID 例: `2`
- manager_person_id (任意): integer(int32) - プロジェクトマネージャーの従業員ID
このパラメータはシステム管理者かプロジェクトマネージャーでログインしているときのみ指定可能。
（デフォルト：指定しない場合はログインユーザ） 例: `10`
- pm_budgets_cost (必須): integer(int32) - プロジェクトマネージャーのコスト(円) 例: `4000`
- color_id (任意): integer(int32) - プロジェクトの色を指定可能（デフォルト：orange）
{ orange: 1, blue_green: 2, green: 3, blue: 4, purple: 5, red: 6, yellow: 7 } 例: `3`
- members (任意): array[object] - アサインするユーザの配列
  配列の要素:
    - person_id (必須): integer(int32) - 従業員ID 例: `11`
    - unit_cost_id (必須): integer(int32) - このプロジェクトでの実績単価ID 例: `3`
    - budgets_cost (必須): integer(int32) - 予算計算用の単価(円) 例: `2000`
    - use_standard_unit_cost (任意): boolean - 標準従業員単価の利用（デフォルト：false） 例: `true`
- orderer_ids (任意): array[integer] - 発注元として指定する取引先IDの配列
- contractor_ids (任意): array[integer] - 発注先として指定する取引先IDの配列

### レスポンス (200)

成功時

- project (必須): object - プロジェクト
  - id (任意): integer - プロジェクトID 例: `1`
  - name (任意): string - プロジェクト名 例: `PJ-AAA`
  - code (任意): string - プロジェクトコード 例: `PJ-AAA`
  - description (任意): string - プロジェクト概要 例: `プロジェクトの概要`
  - manager (任意): object - プロジェクトマネージャー
  - color (任意): string - カラー 例: `#c8790f`
  - from_date (任意): string - 期間from 例: `2021-01-01`
  - thru_date (任意): string - 期間to 例: `2021-12-31`
  - publish_to_employee (任意): boolean - 従業員への公開設定 例: `true`
  - assignment_url_enabled (任意): boolean - 招待リンク 例: `false`
  - operational_status (任意): string - 運用ステータス 例: `in_progress`
  - sales_order_status (任意): string - 受注ステータス 例: `受注済み`
  - members (任意): array[object] - プロジェクトメンバー
  - orderers (任意): array[object] - 発注元
  - contractors (任意): array[object] - 発注先
  - balance (任意): object - 収支管理詳細

### GET /projects

操作: プロジェクト一覧の取得

説明: この事業所のプロジェクトの一覧情報を返します。 運用ステータス、マネージャー、発注先、発注元で絞り込みできます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| operational_status | query | いいえ | string | 運用ステータス (選択肢: planning, awaiting_approval, in_progress, rejected, done) |
| manager_ids[] | query | いいえ | array[integer] | マネージャのユーザID |
| orderer_ids[] | query | いいえ | array[integer] | 発注元の取引先ID |
| contractor_ids[] | query | いいえ | array[integer] | 発注先の取引先ID |
| limit | query | いいえ | integer | 取得レコードの件数（デフォルト：50, 最小：1, 最大100） |
| offset | query | いいえ | integer | 取得レコードのオフセット（デフォルト：0） |

### レスポンス (200)

成功時

- meta (必須): object - ページネーションのメタ情報
  - current_offset (任意): integer - リクエストのオフセット件数 例: `50`
  - next_offset (任意): integer - 次ページのオフセット件数 例: `100`
  - prev_offset (任意): integer - 前ページのオフセット件数 例: `0`
  - total_count (任意): integer - 全レコード件数 例: `200`
- projects_counts (必須): object
  - total (任意): integer - 取得件数合計 例: `10`
  - by_status (任意): object
- projects (必須): array[object]
  配列の要素:
    - id (任意): integer - プロジェクトID 例: `1`
    - name (任意): string - プロジェクト名 例: `PJ-AAA`
    - code (任意): string - プロジェクトコード 例: `PJ-AAA`
    - description (任意): string - プロジェクト概要 例: `プロジェクトの概要`
    - manager (任意): object - プロジェクトマネージャー
    - color (任意): string - カラー 例: `#c8790f`
    - from_date (任意): string - 期間from 例: `2021-01-01`
    - thru_date (任意): string - 期間to 例: `2021-12-31`
    - publish_to_employee (任意): boolean - 従業員への公開設定 例: `true`
    - assignment_url_enabled (任意): boolean - 招待リンク 例: `false`
    - operational_status (任意): string - 運用ステータス 例: `in_progress`
    - sales_order_status (任意): string - 受注ステータス 例: `受注済み`
    - members (任意): array[object] - プロジェクトメンバー
    - orderers (任意): array[object] - 発注元
    - contractors (任意): array[object] - 発注先
    - project_tags (任意): array[object] - プロジェクトタグ
    - workload_tag_groups (任意): array[object] - プロジェクトで使える工数タグのグループ

### GET /projects/{id}

操作: プロジェクト詳細の取得

説明: IDに該当するプロジェクトの詳細情報を返します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| id | path | はい | integer | プロジェクトID |

### レスポンス (200)

成功時

- project (必須): object



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [pm-api-schema.json](../../openapi/pm-api-schema.json)
