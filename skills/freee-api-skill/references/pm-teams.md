# Teams

## 概要



## エンドポイント一覧

### GET /teams

操作: チームの一覧取得

説明: 登録されているチームの一覧を返します。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| limit | query | いいえ | integer | 取得レコードの件数（デフォルト：50, 最小：1, 最大100） |
| offset | query | いいえ | integer | 取得レコードのオフセット（デフォルト：0） |

### レスポンス (200)

成功時

- teams (必須): array[object]
  配列の要素:
    - id (必須): integer - チームID 例: `1`
    - name (必須): string - チーム名 例: `プロジェクトX開発チーム`
    - memo (任意): string - memo 例: `社長室直轄`
    - member_count (必須): integer - メンバー数 例: `10`
    - members (任意): array[object] - チームに登録されているメンバーの配列
- meta (必須): object



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [pm-api-schema.json](../../openapi/pm-api-schema.json)
