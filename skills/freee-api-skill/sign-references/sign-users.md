# ユーザー

## 概要

ユーザーの操作

## エンドポイント一覧

### GET /v1/users

操作: ユーザー一覧の取得

説明: ユーザー一覧を取得する。 ここで取得できるユーザーには、チーム内のユーザー、文書の作成者、文書の受領者が含まれます。 そのため、複数のチームのユーザーが含まれる場合があります。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| page | query | いいえ | object |  |
| per_page | query | いいえ | object |  |
| ids[] | query | いいえ | array[object] | 配列でユーザーIDを指定して、ユーザー一覧を取得できる |
| team_id | query | いいえ | object | チームIDを指定して、指定したチームのユーザー一覧を取得できる |
| email | query | いいえ | string(email) | メールアドレスを指定してユーザー情報を取得できる（完全一致） |
| status | query | いいえ | string | ユーザーのステータス
* receiving_only - 文書を受領した未登録ユーザー
* active - 登録済ユーザー
* unconfirmed - 登録途中ユーザー
* canceled - 退会済ユーザー (選択肢: receiving_only, active, unconfirmed, canceled) |

### レスポンス (200)

条件に一致したユーザー一覧（ユーザーID昇順）


### POST /v1/users/invitations

操作: ユーザーを招待する

説明: ユーザーを招待する。

### リクエストボディ

- inviter_id (任意): object - 招待を実行するユーザーID
- email (必須): string(email) - 被招待者のメールアドレス
- role (任意): string - 被招待者の権限
* admin - 全権管理
* chief_document_manager - 締結・文書管理
* document_manager - 文書管理
* document_sender - 作成・送信
* document_creator - 作成
* member - メンバー
ご利用プランのアクセス制御が無効な場合, admin と member 以外は指定できません (選択肢: admin, chief_document_manager, document_manager, document_sender, document_creator, member) 例: `member`
- lastname (任意): string - 被招待者の姓
- firstname (任意): string - 被招待者の名
- affiliation (任意): string - 被招待者の部署・役職

### レスポンス (201)

ユーザーへ招待メール送付完了

- id (必須): integer - ユーザー招待ID
- team_id (必須): object - 招待先のチームID
- inviter_id (必須): object - 招待を実行するユーザーID
- email (必須): string(email) - 被招待者のメールアドレス
- status (必須): string - 招待の状態
* waiting - 被招待者の確認待ち
* registered - 被招待者のユーザー登録が完了 (選択肢: waiting, registered)
- expires_at (任意): string(date-time) - 招待された側が招待を承認する期限
- invitation_user_profile (必須): object - 被招待ユーザーのプロフィール
  - id (必須): integer - 被招待ユーザーのプロフィールID
  - role (必須): string - 権限
* admin - 全権管理
* chief_document_manager - 締結・文書管理
* document_manager - 文書管理
* document_sender - 作成・送信
* document_creator - 作成
* member - メンバー (選択肢: admin, chief_document_manager, document_manager, document_sender, document_creator, member) 例: `member`
  - firstname (任意): string - 名 例: `太郎`
  - lastname (任意): string - 姓 例: `フリー`
  - affiliation (任意): string - 部署・役職 例: `法務部`

### GET /v1/users/invitations

操作: ユーザーの参加待ちの招待一覧

説明: ユーザーの参加待ちの招待一覧

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| page | query | いいえ | object |  |
| per_page | query | いいえ | object |  |

### レスポンス (200)

取得成功


### POST /v1/users/invitations/{invitation_id}/re_invitations

操作: ユーザーを再招待する

説明: ユーザーを再招待する。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| invitation_id | path | はい | integer(int64) | 再招待する招待のID |

### リクエストボディ

- inviter_id (任意): object - 招待を実行するユーザーID

### レスポンス (201)

ユーザーへの再招待メール送付完了

- id (必須): integer - ユーザー招待ID
- team_id (必須): object - 招待先のチームID
- inviter_id (必須): object - 招待を実行するユーザーID
- email (必須): string(email) - 被招待者のメールアドレス
- status (必須): string - 招待の状態
* waiting - 被招待者の確認待ち
* registered - 被招待者のユーザー登録が完了 (選択肢: waiting, registered)
- expires_at (任意): string(date-time) - 招待された側が招待を承認する期限
- invitation_user_profile (必須): object - 被招待ユーザーのプロフィール
  - id (必須): integer - 被招待ユーザーのプロフィールID
  - role (必須): string - 権限
* admin - 全権管理
* chief_document_manager - 締結・文書管理
* document_manager - 文書管理
* document_sender - 作成・送信
* document_creator - 作成
* member - メンバー (選択肢: admin, chief_document_manager, document_manager, document_sender, document_creator, member) 例: `member`
  - firstname (任意): string - 名 例: `太郎`
  - lastname (任意): string - 姓 例: `フリー`
  - affiliation (任意): string - 部署・役職 例: `法務部`

### DELETE /v1/users/{user_id}/activenesses

操作: ユーザーの退会

説明: 特定のユーザーを退会させる。

### リクエストボディ

- executor_id (任意): object - 退会処理を実行するユーザーのID (APIクライアントを利用する場合は必須)

### レスポンス (200)

退会処理が成功

- id (必須): object - ユーザーID
- team_id (任意): object - チームID。本登録していないユーザーはチームに所属していない。
- status (必須): string - ユーザーのステータス
* receiving_only - 文書を受領した未登録ユーザー
* active - 登録済ユーザー
* unconfirmed - 登録途中ユーザー
* canceled - 退会済ユーザー (選択肢: receiving_only, active, unconfirmed, canceled)
- email (任意): string(email) - メールアドレス

メールアドレスの登録がない場合は無し。
- sms_telephone_number (任意): string - SMS用の電話番号

E.164形式。登録されていない場合は無し。
ex. +8190xxxxxxxx
- full_name (任意): string - フルネーム。本登録していないユーザーは無い。



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
