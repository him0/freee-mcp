# Partners

## 概要



## エンドポイント一覧

### GET /partners

操作: 取引先の一覧取得

説明: 登録されている取引先の一覧を返します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| limit | query | いいえ | integer | 取得レコードの件数（デフォルト：50, 最小：1, 最大100） |
| offset | query | いいえ | integer | 取得レコードのオフセット（デフォルト：0） |

### レスポンス (200)

成功時

- partners (必須): array[object]
  配列の要素:
    - id (任意): integer - 取引先ID 例: `1`
    - name (任意): string - 取引先名前 例: `〇〇株式会社`
    - code (任意): string - 取引先code 例: `001-〇〇株式会社-B`
    - projects_as_orderer (任意): array[object] - 発注元として登録されているプロジェクト一覧
    - projects_as_contractor (任意): array[object] - 発注先として登録されているプロジェクト一覧
- meta (必須): object



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [pm-api-schema.json](../../openapi/pm-api-schema.json)
