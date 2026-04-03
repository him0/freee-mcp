# OAuth 2.0

## 概要



## エンドポイント一覧

### GET /oauth/authorize

操作: 認可コードを発行する

説明: リソースオーナーの許可を得て、認可コードを発行する。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| client_id | query | はい | string | `OAuth 2.0 API クライアント設定` 画面で発行した client_id |
| redirect_uri | query | はい | string(uri) | `OAuth 2.0 API クライアント設定` 画面で設定したしたリダイレクトURI |
| response_type | query | はい | string | freeeサイン は当分、認可コードフローのみ対応しているため、`code` 固定で設定してください (選択肢: code) |
| scope | query | いいえ | string | 許可するスコープ（カンマ区切り）。freeeサイン は当分 `all` スコープのみ定義しています (選択肢: all) |

### レスポンス (200)

ログインしている場合は
1. 認可画面にリダイレクトする
2. ユーザが認可画面で許可したら、`code` パラメータ付きでリダイレクトURLにリダイレクトする

ログインしていない場合は
1. ログイン画面にリダイレクトする
2. ログイン後は、認可画面にリダイレクトする
3. ユーザが認可画面で許可したら、`code` パラメータ付きでリダイレクトURLにリダイレクトする

例 `https://www.example.com?code=AbC123`


### POST /oauth/revoke

操作: アクセストークンまたはリフレッシュトークンを解除する

説明: アクセストークンまたはリフレッシュトークンを解除する。 現在はリクエストボディでの `client_id` / `client_secret` の送信のみサポートしています。 Authorizationヘッダはサポートしていません。

### リクエストボディ

- token (必須): string - [POST /oauth/token](/v1/docs#/OAuth%202.0/post-v1-oauth-token)で発行したアクセストークンまたはリフレッシュトークン
- client_id (必須): string - `OAuth 2.0 API クライアント設定` 画面で発行した client_id
- client_secret (必須): string - `OAuth 2.0 API クライアント設定` 画面で発行した client_secret

### レスポンス (200)

成功した場合

### POST /oauth/token

操作: アクセストークンを発行する

説明: アクセストークンを発行する。 現在はリクエストボディでの `client_id` / `client_secret` の送信のみサポートしています。 Authorizationヘッダはサポートしていません。

### リクエストボディ

- code (任意): string - [GET /oauth/authorize](/v1/docs#/OAuth%202.0/get-v1-oauth-authorize) で発行した認可コード。
認可コードでアクセストークン、リフレッシュトークンを発行する場合。

- refresh_token (任意): string - このエンドポイントで発行したリフレッシュトークン。
リフレッシュトークンで新規アクセストークン、リフレッシュトークンを発行する場合のみ、この引数を渡してください。

- grant_type (必須): string - * 認可コードでアクセストークン、リフレッシュトークンを発行する場合は `authorization_code` を設定してください
* リフレッシュトークンで新規アクセストークン、リフレッシュトークンを発行する場合は `refresh_token` を設定してください
 (選択肢: authorization_code, refresh_token)
- client_id (必須): string - `OAuth 2.0 API クライアント設定` 画面で発行した client_id
- client_secret (必須): string - `OAuth 2.0 API クライアント設定` 画面で発行した client_secret
- redirect_uri (任意): string(uri) - `OAuth 2.0 API クライアント設定` 画面で設定したしたリダイレクトURI

### レスポンス (200)

成功した場合

- access_token (任意): string - アクセストークン
- refresh_token (任意): string - リフレッシュトークン
- token_type (任意): string (選択肢: Bearer)
- expires_in (任意): integer - 有効期限までの秒数
- scope (任意): string (選択肢: all)
- created_at (任意): integer - トークン発行日時



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [sign-api-schema.json](../../openapi/sign-api-schema.json)
