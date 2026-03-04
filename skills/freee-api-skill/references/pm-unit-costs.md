# UnitCosts

## 概要



## エンドポイント一覧

### GET /unit_costs

操作: 単価マスタの取得

説明: 従業員の単価マスタを返します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| limit | query | いいえ | integer | 取得レコードの件数（デフォルト：50, 最小：1, 最大100） |
| offset | query | いいえ | integer | 取得レコードのオフセット（デフォルト：0） |

### レスポンス (200)

成功時

- unit_costs (必須): array[object]
  配列の要素:
    - id (任意): integer - 単価マスタID 例: `1`
    - name (任意): string - 単価マスタ名 例: `サンプル単価`
    - current_cost (任意): integer - 取得時点での適用金額 例: `2000`
    - rules (任意): array[object] - 期間ごとの適用金額の配列
- meta (必須): object



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [pm-api-schema.json](../../openapi/pm-api-schema.json)
