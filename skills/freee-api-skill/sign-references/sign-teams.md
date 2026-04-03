# チーム

## 概要



## エンドポイント一覧

### GET /v1/team

操作: 所属しているチームの取得

説明: 自分が所属しているチームを取得する。

### レスポンス (200)

取得成功

- id (必須): integer(int64) - チームID 例: `1` (最小: 1)
- name (必須): string - チームの名前 例: `freee株式会社`

### GET /v1/team/team_setting

操作: 所属しているチーム設定の取得

説明: 自分が所属しているチームの設定を取得する。

### レスポンス (200)

取得成功

- document_password (必須): boolean - 文書のパスワード設定が必須か否か 例: `true`
- folder_necessary (必須): boolean - フォルダ選択が必須か否か 例: `true`
- approval_workflow (必須): boolean - ワークフロー承認が必須か否か 例: `true`
- workflow_route (必須): boolean - ルートテンプレート選択が必須か否か 例: `true`
- multiple_approvals (必須): boolean - 相手方による署名依頼の転送が必須か否か 例: `true`
- verify_signer_telephone_number (必須): boolean - 相手方の電話番号確認が必須か否か 例: `true`

### GET /v1/teams

操作: チーム一覧の取得

説明: チーム一覧を取得する。 自チームも含め、文書を交わした全てのチームを取得することができます。 相手方がfreeeサイン上にアカウントを作成していない場合はチームは存在していないので取得できません。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| page | query | いいえ | object |  |
| per_page | query | いいえ | object |  |
| name | query | いいえ | string | チーム名に一致する一覧を取得できる（部分一致も可） |
| ids[] | query | いいえ | array[object] | 配列でチームIDを指定して、チーム一覧を取得できる |

### レスポンス (200)

取得成功




## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [sign-api-schema.json](../../openapi/sign-api-schema.json)
