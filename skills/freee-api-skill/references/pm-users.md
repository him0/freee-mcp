# Users

## 概要

ログインユーザー

## エンドポイント一覧

### GET /users/me

**操作**: ログインユーザー情報の取得

**説明**: このリクエストの認可セッションにおけるログインユーザーの情報を返します。 freee工数管理では一人のログインユーザーを複数の事業所に関連付けられるため、このユーザーと関連のあるすべての事業所の情報をリストで返します。 他のAPIのパラメータとして company_id が求められる場合は、このAPIで取得した company_id を使用します。

### レスポンス (200)

成功時

- **id** (任意): integer - ユーザーID 例: `1`
- **companies** (任意): array[object] - ユーザーが属する事業所の一覧
  配列の要素:
    - **id** (任意): integer - 事業所ID 例: `1`
    - **name** (任意): string - 事業所名 例: `フリー株式会社`
    - **display_name** (任意): string - 事業所に所属する従業員の表示名 例: `フリー株式会社`
    - **role** (任意): string - 事業所におけるロール 例: `company_admin`
    - **external_cid** (任意): string - 事業所番号(半角英数字10桁) 例: `1234567890`
    - **person_me** (任意): object - ログインユーザー情報



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [pm-api-schema.json](../../openapi/pm-api-schema.json)
