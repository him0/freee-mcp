# Workloads

## 概要



## エンドポイント一覧

### POST /workloads

操作: 工数登録

説明: 工数を登録することが出来ます。

### リクエストボディ

- company_id (必須): integer(int32) - 事業所ID 例: `1`
- person_id (任意): integer(int32) - 
対象従業員ID
このパラメータは管理者かチームリーダーでログインしているときのみ指定可能。
指定しない場合はログインユーザに登録 例: `10`
- project_id (必須): integer(int32) - 対象プロジェクトID 例: `100`
- date (必須): string(date) - 対象日 例: `2020-12-15`
- minutes (必須): integer(int32) - 記録時間（分） 例: `120` (最小: 1)
- memo (任意): string - 業務内容 例: `コーディング`
- workload_tags (任意): array[object]
  配列の要素:
    - tag_group_id (必須): integer(int32) - 工数タググループID 例: `11`
    - tag_id (必須): integer(int32) - 工数タグID 例: `12`

### レスポンス (200)

成功時

- workload (必須): object - 工数実績詳細
  - id (任意): integer - 工数実績ID 例: `1`
  - person_id (必須): integer - 対象従業員のユーザーID 例: `1`
  - person_name (必須): string - 対象従業員氏名 例: `テスト太郎`
  - date (必須): string(date) - 工数登録日 例: `2021-01-01`
  - project_id (必須): integer(int32) - 対象プロジェクトID 例: `100`
  - project_name (必須): string - プロジェクト名 例: `プロジェクトA`
  - project_code (必須): string - プロジェクトコード 例: `PRJ-A`
  - memo (任意): string - 業務内容 例: `会議`
  - minutes (必須): integer - 工数実績（分） 例: `9600`
  - workload_tags (任意): array[object] - 工数タグ

### GET /workloads

操作: 工数詳細の取得

説明: 取得対象の従業員の工数実績の詳細を返します。 取得対象従業員と年月の取得範囲で絞り込みできます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| employees_scope | query | いいえ | string | 取得対象従業員の検索スコープです。 <ul> <li> allを指定した場合は全従業員が対象です。 絞り込みを行わない場合にご使用ください。 person_ids, team_idsでの絞り込みはできません。 </li> <li> teamを指定した場合はチーム単位で絞り込みが可能です。 team_idsでの絞り込みができます。 person_idsでの絞り込みはできません。 </li> <li> employeeを指定した場合はperson_idsによる絞り込みができます。 team_idsでの絞り込みは行なえません。 </li> <li> scopeを指定しない場合はログインユーザの情報のみの取得です。 </li> </ul> (選択肢: all, team, employee) |
| person_ids[] | query | いいえ | array[integer] | 取得対象従業員のユーザID |
| team_ids[] | query | いいえ | array[integer] | 取得対象のチームID |
| year_month | query | はい | string | 取得対象範囲（YYYY-MM） |
| limit | query | いいえ | integer | 取得レコードの件数（デフォルト：50, 最小：1, 最大100） |
| offset | query | いいえ | integer | 取得レコードのオフセット（デフォルト：0） |

### レスポンス (200)

成功時

- workloads (必須): array[object]
- meta (必須): object

### GET /workload_summaries

操作: 工数実績の取得

説明: 取得対象の従業員の工数実績のサマリを返します。 取得対象従業員と年月の取得範囲で絞り込みできます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| employees_scope | query | いいえ | string | 取得対象従業員の検索スコープです。 <ul> <li> allを指定した場合は全従業員が対象です。 絞り込みを行わない場合にご使用ください。 person_ids, team_idsでの絞り込みはできません。 </li> <li> teamを指定した場合はチーム単位で絞り込みが可能です。 team_idsでの絞り込みができます。 person_idsでの絞り込みはできません。 </li> <li> employeeを指定した場合はperson_idsによる絞り込みができます。 team_idsでの絞り込みは行なえません。 </li> <li> scopeを指定しない場合はログインユーザの情報のみの取得です。 </li> </ul> (選択肢: all, team, employee) |
| person_ids[] | query | いいえ | array[integer] | 取得対象従業員のユーザID |
| team_ids[] | query | いいえ | array[integer] | 取得対象のチームID |
| year_month | query | はい | string | 取得対象範囲（YYYY-MM） |
| limit | query | いいえ | integer | 取得レコードの件数（デフォルト：50, 最小：1, 最大100） |
| offset | query | いいえ | integer | 取得レコードのオフセット（デフォルト：0） |

### レスポンス (200)

成功時

- workload_summaries (必須): array[object]
  配列の要素:
    - person_id (任意): integer - 対象従業員のユーザーid 例: `1`
    - person_name (任意): string - 対象従業員氏名 例: `テスト太郎`
    - from_date (任意): string - 工数登録期間from 例: `2021-01-01`
    - thru_date (任意): string - 工数登録期間to 例: `2021-12-31`
    - minutes (任意): integer - 工数実績（分） 例: `9600`
    - productive_minutes (任意): integer - 生産時間実績（分） 例: `6000`
- meta (必須): object



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [pm-api-schema.json](../../openapi/pm-api-schema.json)
