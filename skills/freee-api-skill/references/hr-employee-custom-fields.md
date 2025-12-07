# 従業員のカスタム項目

## 概要

従業員のカスタム項目の操作

## エンドポイント一覧

### GET /api/v1/employees/{employee_id}/profile_custom_fields

**操作**: 従業員のカスタム項目の取得

**説明**: 概要 指定した従業員・日付のカスタム項目情報を返します。 注意点 管理者権限を持ったユーザーのみ実行可能です。 指定年月に在籍していない従業員および給与計算対象外の従業員ではデータが存在しないため、空の配列が返ります。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| year | query | はい | integer | 従業員情報を取得したい年 |
| month | query | はい | integer | 従業員情報を取得したい月<br>
締め日支払い日設定が翌月払いの従業員情報の場合は、 指定したmonth + 1の値が検索結果として返します。<br>
翌月払いの従業員の2022/01の従業員情報を取得する場合は、year=2021,month=12を指定してください。<br> |
| employee_id | path | はい | integer | 従業員ID |

### レスポンス (200)

successful operation

- **profile_custom_field_groups** (任意): array[object]
  配列の要素:
    - **id** (任意): integer(int32) - グループID 例: `1`
    - **name** (任意): string - グループ名 例: `資格取得結果`
    - **profile_custom_field_rules** (任意): array[object] - カスタム項目



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
