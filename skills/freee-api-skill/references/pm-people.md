# People

## 概要



## エンドポイント一覧

### GET /people

操作: 従業員一覧の取得

説明: このリクエストで指定したIDの事業所の従業員一覧を返します。 権限・ステータス・従業員IDで取得する情報を絞り込むことができます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| role | query | いいえ | string | 役割 |
| status | query | いいえ | string | ステータス（招待中・利用中・無効） (選択肢: sent, accepted, inactive) |
| person_ids[] | query | いいえ | array[integer] | 従業員ID |
| limit | query | いいえ | integer | 取得レコードの件数（デフォルト：50, 最小：1, 最大100） |
| offset | query | いいえ | integer | 取得レコードのオフセット（デフォルト：0） |

### レスポンス (200)

成功時

- meta (必須): object
- people_counts (必須): object
  - total (任意): integer - 取得件数合計 例: `10`
  - by_status (任意): object
- people (必須): array[object]
  配列の要素:
    - id (任意): integer - 従業員ID 例: `1`
    - status (任意): string - ステータス 例: `accepted`
    - name (任意): string - 氏名 例: `田中太郎`
    - role (任意): string - 事業所におけるロール 例: `company_admin`
    - role_display_name (任意): string - 事業所におけるロールの表示名 例: `システム管理者`
    - unit_cost (任意): object - 標準単価
    - email (任意): string - メールアドレス 例: `test@example.com`
    - payroll_employee_id (任意): integer - 人事労務側従業員ID 例: `1`



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [pm-api-schema.json](../../openapi/pm-api-schema.json)
