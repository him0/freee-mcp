# 文書

## 概要

文書の操作

## エンドポイント一覧

### POST /v1/documents

操作: 文書作成

説明: 文書をクイック作成する。

### リクエストボディ

- document (必須): object
  - title (必須): string - 作成する文書のタイトル 例: `文書 忍者太郎様`
  - items (任意): array[object] - 入力項目
- template_id (必須): object - 使用する文書テンプレートのID
- creator_id (任意): object - 文書の作成者となるユーザーのID (APIクライアントを利用する場合は必須)
- folder_id (必須): object - 作成した文書の保存先フォルダのID

### レスポンス (201)

作成成功

- id (必須): integer(int64) - 文書ID 例: `1` (最小: 1)
- title (必須): string - 文書のタイトル 例: `文書 忍者太郎様`
- owner_id (必須): object - 文書作成者ユーザーID
- status (必須): string - 文書のステータス
* draft - 作成中
* in_progress - 確認待ち
* awaiting_receipt - 受け取り待ち
* approved - 要確認
* concluded - 完了
* rejected - 却下
* expired - 有効期限切れ
* trashed - 削除済み (選択肢: draft, in_progress, awaiting_receipt, approved, concluded, rejected, expired, trashed)
- folder_id (必須): object - 文書が保存されているフォルダのID
- folder_name (必須): string - 文書が保存されているフォルダの名前
- items (任意): array[object] - 入力項目 設定されていない場合は無し。
  配列の要素:
    - name (必須): string - 項目名
    - role (必須): string - どちら側の入力項目か
* owner 送信者側
* signer 承認側 (選択肢: owner, signer)
    - order (必須): integer(int64) - 署名の順番。以下の順で表示
* ownerのアイテム群
* signer1のアイテム群
* signer2のアイテム群
…
    - required (必須): boolean - 必須項目かどうか
    - value (任意): string - 入力された値
未入力の場合は無し。
    - user_id (任意): object - 文書入力項目入力ユーザーID
未入力の場合は無し。
    - seal_image_id (任意): integer(int64) - マイ印鑑画像のID
入力項目が印鑑でなかった場合またはマイ印鑑機能を使用していない場合は無し。
    - item_id (任意): integer(int64) - 入力項目のID
- meta_items (任意): array[object] - 検索項目 設定されていない場合は無し。
  配列の要素:
    - item_id (必須): integer(int64) - 検索項目の項目ID
    - type (必須): string - 検索項目の種類 (選択肢: string, date, number, select, stamp, acceptance)
    - name (必須): string - 検索項目の名前
    - value (必須): string - 検索項目の値
- signers (任意): array[object] - 文書に設定されている署名者
送信前は無し。
  配列の要素:
    - signer_id (必須): object - 文書の署名者となるユーザーのID
- signer_url (任意): object - 署名者用URLを受け取った相手は、そのURLから署名依頼の手続きを進めることができます
  - id (任意): integer(int64) - ID 例: `1` (最小: 1)
  - url (任意): string - 短縮URL
  - expires_at (任意): string(date-time) - 有効期限日時
- created_at (必須): string(date-time) - 作成日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-01-01T00:00:00+09:00
- updated_at (必須): string(date-time) - 更新日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-02-01T00:00:00+09:00
- timestamped (必須): boolean - タイムスタンプが付与されているかどうか
- expires_at (任意): string(date-time) - 有効期限日時
- sent_at (任意): string(date-time) - 送信日時
- concluded_at (任意): string(date-time) - 締結完了日時
- skip_approval (必須): boolean - trueの場合、配布文書（署名合意をスキップする文書）。
falseの場合、署名・合意文書。
- signer_document_confirmation (必須): boolean - 配布文書の受領者が文書を確認済みかどうか。
配布文書でない場合は常にfalse。

### GET /v1/documents

操作: 文書一覧の取得

説明: 文書一覧を取得する。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| page | query | いいえ | object |  |
| per_page | query | いいえ | object |  |
| folder_id | query | いいえ | object | フォルダID。IDで指定したフォルダに格納されている文書一覧を取得できる。 |
| title | query | いいえ | string | 文書名に一致する一覧を取得できる（部分一致も可）。送信相手のメールアドレスに一致する一覧を取得できる（完全一致）。 |
| ids[] | query | いいえ | array[integer] | 配列で文書IDを指定して、文書一覧を取得できる |
| status | query | いいえ | string | ステータス毎に文書一覧を取得できる。
  * draft - 作成中
  * in_progress - 確認待ち
  * awaiting_receipt - 受け取り待ち
  * approved - 要確認
  * concluded - 完了
  * rejected - 却下
  * expired - 有効期限切れ
 (選択肢: draft, in_progress, awaiting_receipt, approved, concluded, rejected, expired) |
| created_at_from | query | いいえ | object | 作成日時が指定した作成日時以降である文書を取得できます。<br>
開始は区切りを含みますが、終了は区切りを含みません。(左閉右開区間) |
| created_at_to | query | いいえ | object | 作成日時が指定した作成日時より過去である文書を取得できます。<br>
開始は区切りを含みますが、終了は区切りを含みません。(左閉右開区間) |
| updated_at_from | query | いいえ | object | 更新日時が指定した更新日時以降である文書を取得できます。<br>
開始は区切りを含みますが、終了は区切りを含みません。(左閉右開区間) |
| updated_at_to | query | いいえ | object | 更新日時が指定した更新日時より過去である文書を取得できます。<br>
開始は区切りを含みますが、終了は区切りを含みません。(左閉右開区間) |

### レスポンス (200)

取得成功


### POST /v1/documents/uploads

操作: ファイルをアップロードして、作成中ステータスの文書を作成

説明: PDF/Word/Excel/PowerPointから文書を作成する。作成された文書のステータスは「作成中」になる

### リクエストボディ

- file (必須): object
  - name (必須): string - アップロードファイル名（拡張子込み）

- ファイルのタイトルは255文字以内にしてください。
  - content (必須): string - アップロードファイルの内容

- アップロードファイルのバイナリをBase64エンコードした文字列を指定してください。
- ファイル形式はPDF/Word/Excel/PowerPointのみ有効です。
- ファイルのサイズは10MB以下にしてください。
- uploader_id (必須): integer(int64) - アップロードするユーザーのID
- folder_id (必須): integer(int64) - アップロードした文書の保存先フォルダのID
- title (任意): string - 作成する文書のタイトル（設定しない場合はアップロードファイルのタイトルになります） 例: `文書 忍者太郎様`
- signers_count (任意): integer(int64) - 相手方の人数 (最小: 1, 最大: 20)
- skip_approval (任意): boolean - 文書の種別

- false の場合、署名・合意文書
- true の場合、配付文書


### レスポンス (201)

成功時

- document (任意): object - 文書
  - id (必須): integer(int64) - 文書ID 例: `1` (最小: 1)
  - title (必須): string - 文書のタイトル 例: `文書 忍者太郎様`
  - owner_id (必須): object - 文書作成者ユーザーID
  - status (必須): string - 文書のステータス
* draft - 作成中
* in_progress - 確認待ち
* awaiting_receipt - 受け取り待ち
* approved - 要確認
* concluded - 完了
* rejected - 却下
* expired - 有効期限切れ
* trashed - 削除済み (選択肢: draft, in_progress, awaiting_receipt, approved, concluded, rejected, expired, trashed)
  - folder_id (必須): object - 文書が保存されているフォルダのID
  - folder_name (必須): string - 文書が保存されているフォルダの名前
  - items (任意): array[object] - 入力項目 設定されていない場合は無し。
  - meta_items (任意): array[object] - 検索項目 設定されていない場合は無し。
  - signers (任意): array[object] - 文書に設定されている署名者
送信前は無し。
  - signer_url (任意): object - 署名者用URLを受け取った相手は、そのURLから署名依頼の手続きを進めることができます
  - created_at (必須): string(date-time) - 作成日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-01-01T00:00:00+09:00
  - updated_at (必須): string(date-time) - 更新日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-02-01T00:00:00+09:00
  - timestamped (必須): boolean - タイムスタンプが付与されているかどうか
  - expires_at (任意): string(date-time) - 有効期限日時
  - sent_at (任意): string(date-time) - 送信日時
  - concluded_at (任意): string(date-time) - 締結完了日時
  - skip_approval (必須): boolean - trueの場合、配布文書（署名合意をスキップする文書）。
falseの場合、署名・合意文書。
  - signer_document_confirmation (必須): boolean - 配布文書の受領者が文書を確認済みかどうか。
配布文書でない場合は常にfalse。

### GET /v1/documents/{document_id}

操作: 文書取得

説明: 文書を取得する。 PDF を取得したい場合は、Media Type を application/pdf にしてください。 PDF作成処理中はエラーとなる為、時間を置いてAPIを再実行してください。 締結済ファイル取得の際、Acceptヘッダーで`application/json`を指定し、`timestamped=true`を確認後にPDFファイルを取得してください。

### レスポンス (200)

取得成功


### PATCH /v1/documents/{document_id}

操作: 文書更新

説明: 文書を更新する。

### リクエストボディ

- document (必須): object
  - title (必須): string - 文書のタイトル 例: `文書 忍者太郎様`
- user_id (任意): object - 実行するユーザーのID (APIクライアントを利用する場合は必須)

### レスポンス (200)

成功時

- id (必須): integer(int64) - 文書ID 例: `1` (最小: 1)
- title (必須): string - 文書のタイトル 例: `文書 忍者太郎様`
- owner_id (必須): object - 文書作成者ユーザーID
- status (必須): string - 文書のステータス
* draft - 作成中
* in_progress - 確認待ち
* awaiting_receipt - 受け取り待ち
* approved - 要確認
* concluded - 完了
* rejected - 却下
* expired - 有効期限切れ
* trashed - 削除済み (選択肢: draft, in_progress, awaiting_receipt, approved, concluded, rejected, expired, trashed)
- folder_id (必須): object - 文書が保存されているフォルダのID
- folder_name (必須): string - 文書が保存されているフォルダの名前
- items (任意): array[object] - 入力項目 設定されていない場合は無し。
  配列の要素:
    - name (必須): string - 項目名
    - role (必須): string - どちら側の入力項目か
* owner 送信者側
* signer 承認側 (選択肢: owner, signer)
    - order (必須): integer(int64) - 署名の順番。以下の順で表示
* ownerのアイテム群
* signer1のアイテム群
* signer2のアイテム群
…
    - required (必須): boolean - 必須項目かどうか
    - value (任意): string - 入力された値
未入力の場合は無し。
    - user_id (任意): object - 文書入力項目入力ユーザーID
未入力の場合は無し。
    - seal_image_id (任意): integer(int64) - マイ印鑑画像のID
入力項目が印鑑でなかった場合またはマイ印鑑機能を使用していない場合は無し。
    - item_id (任意): integer(int64) - 入力項目のID
- meta_items (任意): array[object] - 検索項目 設定されていない場合は無し。
  配列の要素:
    - item_id (必須): integer(int64) - 検索項目の項目ID
    - type (必須): string - 検索項目の種類 (選択肢: string, date, number, select, stamp, acceptance)
    - name (必須): string - 検索項目の名前
    - value (必須): string - 検索項目の値
- signers (任意): array[object] - 文書に設定されている署名者
送信前は無し。
  配列の要素:
    - signer_id (必須): object - 文書の署名者となるユーザーのID
- signer_url (任意): object - 署名者用URLを受け取った相手は、そのURLから署名依頼の手続きを進めることができます
  - id (任意): integer(int64) - ID 例: `1` (最小: 1)
  - url (任意): string - 短縮URL
  - expires_at (任意): string(date-time) - 有効期限日時
- created_at (必須): string(date-time) - 作成日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-01-01T00:00:00+09:00
- updated_at (必須): string(date-time) - 更新日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-02-01T00:00:00+09:00
- timestamped (必須): boolean - タイムスタンプが付与されているかどうか
- expires_at (任意): string(date-time) - 有効期限日時
- sent_at (任意): string(date-time) - 送信日時
- concluded_at (任意): string(date-time) - 締結完了日時
- skip_approval (必須): boolean - trueの場合、配布文書（署名合意をスキップする文書）。
falseの場合、署名・合意文書。
- signer_document_confirmation (必須): boolean - 配布文書の受領者が文書を確認済みかどうか。
配布文書でない場合は常にfalse。

### DELETE /v1/documents/{document_id}

操作: 文書削除

説明: 文書を削除する。

### リクエストボディ

- user_id (任意): object - 文書を削除するユーザーのユーザーID (APIクライアントを利用する場合は必須)

### レスポンス (200)

削除成功

- id (必須): integer(int64) - 文書ID 例: `1` (最小: 1)
- title (必須): string - 文書のタイトル 例: `文書 忍者太郎様`
- owner_id (必須): object - 文書作成者ユーザーID
- status (必須): string - 文書のステータス
* draft - 作成中
* in_progress - 確認待ち
* awaiting_receipt - 受け取り待ち
* approved - 要確認
* concluded - 完了
* rejected - 却下
* expired - 有効期限切れ
* trashed - 削除済み (選択肢: draft, in_progress, awaiting_receipt, approved, concluded, rejected, expired, trashed)
- folder_id (必須): object - 文書が保存されているフォルダのID
- folder_name (必須): string - 文書が保存されているフォルダの名前
- items (任意): array[object] - 入力項目 設定されていない場合は無し。
  配列の要素:
    - name (必須): string - 項目名
    - role (必須): string - どちら側の入力項目か
* owner 送信者側
* signer 承認側 (選択肢: owner, signer)
    - order (必須): integer(int64) - 署名の順番。以下の順で表示
* ownerのアイテム群
* signer1のアイテム群
* signer2のアイテム群
…
    - required (必須): boolean - 必須項目かどうか
    - value (任意): string - 入力された値
未入力の場合は無し。
    - user_id (任意): object - 文書入力項目入力ユーザーID
未入力の場合は無し。
    - seal_image_id (任意): integer(int64) - マイ印鑑画像のID
入力項目が印鑑でなかった場合またはマイ印鑑機能を使用していない場合は無し。
    - item_id (任意): integer(int64) - 入力項目のID
- meta_items (任意): array[object] - 検索項目 設定されていない場合は無し。
  配列の要素:
    - item_id (必須): integer(int64) - 検索項目の項目ID
    - type (必須): string - 検索項目の種類 (選択肢: string, date, number, select, stamp, acceptance)
    - name (必須): string - 検索項目の名前
    - value (必須): string - 検索項目の値
- signers (任意): array[object] - 文書に設定されている署名者
送信前は無し。
  配列の要素:
    - signer_id (必須): object - 文書の署名者となるユーザーのID
- signer_url (任意): object - 署名者用URLを受け取った相手は、そのURLから署名依頼の手続きを進めることができます
  - id (任意): integer(int64) - ID 例: `1` (最小: 1)
  - url (任意): string - 短縮URL
  - expires_at (任意): string(date-time) - 有効期限日時
- created_at (必須): string(date-time) - 作成日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-01-01T00:00:00+09:00
- updated_at (必須): string(date-time) - 更新日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-02-01T00:00:00+09:00
- timestamped (必須): boolean - タイムスタンプが付与されているかどうか
- expires_at (任意): string(date-time) - 有効期限日時
- sent_at (任意): string(date-time) - 送信日時
- concluded_at (任意): string(date-time) - 締結完了日時
- skip_approval (必須): boolean - trueの場合、配布文書（署名合意をスキップする文書）。
falseの場合、署名・合意文書。
- signer_document_confirmation (必須): boolean - 配布文書の受領者が文書を確認済みかどうか。
配布文書でない場合は常にfalse。

### GET /v1/documents/{document_id}/activities

操作: 文書の操作履歴の一覧取得

説明: 文書の操作履歴の一覧を取得する。

### レスポンス (200)

取得成功


### GET /v1/documents/{document_id}/attachment_files

操作: 添付ファイルの一覧取得

説明: 添付ファイルの一覧を取得する。 このエンドポイントはセキュリティ保護のため、`APIクライアント` でのご利用を制限しております。`OAuth 2.0 APIクライアント` をご利用ください。

### レスポンス (200)

取得成功


### GET /v1/documents/{document_id}/attachment_files/{attachment_file_id}

操作: 指定した添付ファイルの取得

説明: 指定した添付ファイルを取得する。 このエンドポイントはセキュリティ保護のため、`APIクライアント` でのご利用を制限しております。`OAuth 2.0 APIクライアント` をご利用ください。

### レスポンス (200)

取得成功

- id (必須): integer(int64) - ファイルID 例: `1` (最小: 1)
- name (必須): string - ファイルの名前 例: `文書 忍者太郎様 の添付ファイル`
- content_type (必須): string - ContentType 例: `application/pdf`
- extension (必須): string - 拡張子 例: `pdf`
- creator_id (必須): integer(int64) - ユーザーID 例: `1` (最小: 1)

### POST /v1/documents/{document_id}/conclusion

操作: 文書締結

説明: 要確認となった文書を締結する。

### リクエストボディ

- signer_id (任意): object - 締結するユーザーのID (APIクライアントを利用する場合は必須)
- message (任意): string - メッセージ
メッセージを送らない場合は無し。

### レスポンス (200)

成功時

- id (必須): integer(int64) - 文書ID 例: `1` (最小: 1)
- title (必須): string - 文書のタイトル 例: `文書 忍者太郎様`
- owner_id (必須): object - 文書作成者ユーザーID
- status (必須): string - 文書のステータス
* draft - 作成中
* in_progress - 確認待ち
* awaiting_receipt - 受け取り待ち
* approved - 要確認
* concluded - 完了
* rejected - 却下
* expired - 有効期限切れ
* trashed - 削除済み (選択肢: draft, in_progress, awaiting_receipt, approved, concluded, rejected, expired, trashed)
- folder_id (必須): object - 文書が保存されているフォルダのID
- folder_name (必須): string - 文書が保存されているフォルダの名前
- items (任意): array[object] - 入力項目 設定されていない場合は無し。
  配列の要素:
    - name (必須): string - 項目名
    - role (必須): string - どちら側の入力項目か
* owner 送信者側
* signer 承認側 (選択肢: owner, signer)
    - order (必須): integer(int64) - 署名の順番。以下の順で表示
* ownerのアイテム群
* signer1のアイテム群
* signer2のアイテム群
…
    - required (必須): boolean - 必須項目かどうか
    - value (任意): string - 入力された値
未入力の場合は無し。
    - user_id (任意): object - 文書入力項目入力ユーザーID
未入力の場合は無し。
    - seal_image_id (任意): integer(int64) - マイ印鑑画像のID
入力項目が印鑑でなかった場合またはマイ印鑑機能を使用していない場合は無し。
    - item_id (任意): integer(int64) - 入力項目のID
- meta_items (任意): array[object] - 検索項目 設定されていない場合は無し。
  配列の要素:
    - item_id (必須): integer(int64) - 検索項目の項目ID
    - type (必須): string - 検索項目の種類 (選択肢: string, date, number, select, stamp, acceptance)
    - name (必須): string - 検索項目の名前
    - value (必須): string - 検索項目の値
- signers (任意): array[object] - 文書に設定されている署名者
送信前は無し。
  配列の要素:
    - signer_id (必須): object - 文書の署名者となるユーザーのID
- signer_url (任意): object - 署名者用URLを受け取った相手は、そのURLから署名依頼の手続きを進めることができます
  - id (任意): integer(int64) - ID 例: `1` (最小: 1)
  - url (任意): string - 短縮URL
  - expires_at (任意): string(date-time) - 有効期限日時
- created_at (必須): string(date-time) - 作成日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-01-01T00:00:00+09:00
- updated_at (必須): string(date-time) - 更新日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-02-01T00:00:00+09:00
- timestamped (必須): boolean - タイムスタンプが付与されているかどうか
- expires_at (任意): string(date-time) - 有効期限日時
- sent_at (任意): string(date-time) - 送信日時
- concluded_at (任意): string(date-time) - 締結完了日時
- skip_approval (必須): boolean - trueの場合、配布文書（署名合意をスキップする文書）。
falseの場合、署名・合意文書。
- signer_document_confirmation (必須): boolean - 配布文書の受領者が文書を確認済みかどうか。
配布文書でない場合は常にfalse。

### POST /v1/documents/{document_id}/confirmations

操作: 文書送信

説明: 文書を送信する。

### リクエストボディ

- notification_type (任意): string - 締結の種類
メール送信の場合は `email` 、SMS送信の場合は `sms`、署名者用URL発行の場合は `url`。 指定しない場合はメール送信として扱われます。
送り先情報はメール送信、SMS送信のいずれか選択した締結の種類のパラメータを含めてください。 文書配付の場合は、受領者に署名を求めないため、反映されない項目がありますのでご注意ください。
url を指定した場合はAPI実行時点で送信処理はされず、署名者用URLの発行が行われます。 発行されたURLを相手に伝え、署名依頼の手続きを進めてください。 (選択肢: email, sms, url)
- sender_id (任意): object - 送信するユーザーのID (APIクライアントを利用する場合は必須)
- to (必須): object
- es_type (任意): string - 署名方法

電子サインの場合は `timestamp_only` 、電子署名の場合は `esign` 。
指定しない場合は電子サインとして扱われます。

※ 電子署名は1通送信するごとに料金が発生します。

文書配付の場合は送信内容には反映されません。 (選択肢: timestamp_only, esign)
- message (任意): string - メッセージ
メッセージを送らない場合は無し。

SMSによる送信やURL発行の場合はパラメータに含めても送信内容には反映はされません。
- password (任意): string - パスワード
パスワードを使用しない場合は無し。

※チーム設定でパスワード必須になっている場合は必要です。
- cc (任意): array[string] - CCとなるメールアドレスリスト。URL発行の場合は反映されません
- files (任意): array[object] - 添付ファイルのリスト
  配列の要素:
    - name (必須): string - 添付ファイル名（拡張子込み）
    - content (必須): string - 添付ファイル内容

添付ファイルのバイナリをBase64エンコードした文字列を指定してください。
- master_document_expiry_id (任意): integer(int64) - 有効期限の設定
有効期限を設定しない場合は、1週間で設定されます。

1. 1週間
2. 2週間
3. 4週間

文書配付の場合は送信内容には反映されません。 例: `1` (最小: 1)
- remind_about_expiry (任意): boolean - 署名有効期間リマインドを行うかどうか。
true のとき署名有効期限の4日前・1日前にリマインドメールが送信されます。

文書配付の場合は送信内容には反映されません。 例: `true`
- approve_on_signing (任意): boolean - 三者間以上の契約で署名と合意を同時に行う場合は、trueとしてください。

文書配付の場合は送信内容には反映されません。

### レスポンス (200)

送信成功

- id (必須): integer(int64) - 文書ID 例: `1` (最小: 1)
- title (必須): string - 文書のタイトル 例: `文書 忍者太郎様`
- owner_id (必須): object - 文書作成者ユーザーID
- status (必須): string - 文書のステータス
* draft - 作成中
* in_progress - 確認待ち
* awaiting_receipt - 受け取り待ち
* approved - 要確認
* concluded - 完了
* rejected - 却下
* expired - 有効期限切れ
* trashed - 削除済み (選択肢: draft, in_progress, awaiting_receipt, approved, concluded, rejected, expired, trashed)
- folder_id (必須): object - 文書が保存されているフォルダのID
- folder_name (必須): string - 文書が保存されているフォルダの名前
- items (任意): array[object] - 入力項目 設定されていない場合は無し。
  配列の要素:
    - name (必須): string - 項目名
    - role (必須): string - どちら側の入力項目か
* owner 送信者側
* signer 承認側 (選択肢: owner, signer)
    - order (必須): integer(int64) - 署名の順番。以下の順で表示
* ownerのアイテム群
* signer1のアイテム群
* signer2のアイテム群
…
    - required (必須): boolean - 必須項目かどうか
    - value (任意): string - 入力された値
未入力の場合は無し。
    - user_id (任意): object - 文書入力項目入力ユーザーID
未入力の場合は無し。
    - seal_image_id (任意): integer(int64) - マイ印鑑画像のID
入力項目が印鑑でなかった場合またはマイ印鑑機能を使用していない場合は無し。
    - item_id (任意): integer(int64) - 入力項目のID
- meta_items (任意): array[object] - 検索項目 設定されていない場合は無し。
  配列の要素:
    - item_id (必須): integer(int64) - 検索項目の項目ID
    - type (必須): string - 検索項目の種類 (選択肢: string, date, number, select, stamp, acceptance)
    - name (必須): string - 検索項目の名前
    - value (必須): string - 検索項目の値
- signers (任意): array[object] - 文書に設定されている署名者
送信前は無し。
  配列の要素:
    - signer_id (必須): object - 文書の署名者となるユーザーのID
- signer_url (任意): object - 署名者用URLを受け取った相手は、そのURLから署名依頼の手続きを進めることができます
  - id (任意): integer(int64) - ID 例: `1` (最小: 1)
  - url (任意): string - 短縮URL
  - expires_at (任意): string(date-time) - 有効期限日時
- created_at (必須): string(date-time) - 作成日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-01-01T00:00:00+09:00
- updated_at (必須): string(date-time) - 更新日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-02-01T00:00:00+09:00
- timestamped (必須): boolean - タイムスタンプが付与されているかどうか
- expires_at (任意): string(date-time) - 有効期限日時
- sent_at (任意): string(date-time) - 送信日時
- concluded_at (任意): string(date-time) - 締結完了日時
- skip_approval (必須): boolean - trueの場合、配布文書（署名合意をスキップする文書）。
falseの場合、署名・合意文書。
- signer_document_confirmation (必須): boolean - 配布文書の受領者が文書を確認済みかどうか。
配布文書でない場合は常にfalse。

### GET /v1/documents/{document_id}/contract_certificate

操作: 電子契約締結に関する情報の取得

説明: 文書に紐づく電子契約締結に関する情報を取得する。 PDF を取得したい場合は、Media Type を application/pdf にしてください。

### レスポンス (200)

取得成功

- title (任意): string - 文書名 例: `秘密保持契約書`
- document_code (任意): string - 書類コード 例: `acd3f41ee1bc0acb339f60ef3e0b2712b05eb323616cf18c386705de4dc0e9ae`
- es_type (任意): string - 署名方法 例: `esign`
- sending (任意): object - 送信情報
  - sender (任意): string - 送信者 例: `忍者太郎`
  - email (任意): string(email) - 送信者のメールアドレス 例: `taro@ninja-sign.com`
  - sent_at (任意): string(date-time) - 送信日時
- signatures (任意): array[object] - 署名情報
  配列の要素:
    - signer (任意): string - 署名者の名前 例: `忍者一郎`
    - email (任意): string(email) - 署名者のメールアドレス 例: `ichiro@ninja-sign.com`
    - signed_at (任意): string(date-time) - 署名日時
- conclusion (任意): object - 締結情報
  - concluder (任意): string - 締結完了者 例: `忍者二郎`
  - email (任意): string(email) - 締結完了者のメールアドレス 例: `jiro@ninja-sign.com`
  - concluded_at (任意): string(date-time) - 締結完了日時
- timestamps (任意): array[object] - タイムスタンプ情報
  配列の要素:
    - action (任意): string - 付与時のアクション 例: `締結完了`
    - date (任意): string(date-time) - 付与日時

### POST /v1/documents/{document_id}/document_items

操作: 入力項目付与

説明: 文書に入力項目を付与する。

### リクエストボディ

- item_id (必須): integer(int64) - 入力項目の項目ID
チームで設定されているものの中から選んで指定する。 例: `1` (最小: 1)
- order (必須): integer(int64) - 入力項目を付与する署名者の値
* 0 - 送信者
* 1以降 - n番目の受領者 (最小: 0)
- value (任意): string - 入力項目に設定する値
入力タイプによっては値のフォーマットがあります。
以下を参照して値を設定してください。
* テキスト - 任意の文字列
* プルダウン - 選択項目名と一致した文字列
* 数値 - 任意の整数
* 日付 - YYYY-MM-DD形式
* 印鑑(文字列) - 任意の文字列
* 印鑑(マイ印鑑) - 「マイ印鑑一覧の取得」で取得したnameを設定してください
- required (任意): boolean - 必須項目かどうか
- seal_image_id (任意): integer(int64) - 入力タイプが印鑑かつマイ印鑑を設定したい場合のみ、マイ印鑑のIDを設定してください。
マイ印鑑のIDは「マイ印鑑一覧の取得」で取得可能です。

※ マイ印鑑のIDが指定された場合、マイ印鑑を有効にするためvalueに任意の文字列を指定してもマイ印鑑のnameが登録されます。 例: `1` (最小: 1)

### レスポンス (200)

成功時
入力項目を付与した文書を返す。

- name (必須): string - 項目名
- role (必須): string - どちら側の入力項目か
* owner 送信者側
* signer 承認側 (選択肢: owner, signer)
- order (必須): integer(int64) - 署名の順番。以下の順で表示
* ownerのアイテム群
* signer1のアイテム群
* signer2のアイテム群
…
- required (必須): boolean - 必須項目かどうか
- value (任意): string - 入力された値
未入力の場合は無し。
- user_id (任意): object - 文書入力項目入力ユーザーID
未入力の場合は無し。
- seal_image_id (任意): integer(int64) - マイ印鑑画像のID
入力項目が印鑑でなかった場合またはマイ印鑑機能を使用していない場合は無し。
- item_id (任意): integer(int64) - 入力項目のID

### PATCH /v1/documents/{document_id}/document_items/{document_item_id}

操作: 入力項目に値を設定

説明: 文書に付与した入力項目の値を設定する。

### リクエストボディ

- value (必須): string - 入力項目に設定する値
入力タイプによっては値のフォーマットがあります。
以下を参照して値を設定してください。

* テキスト - 任意の文字列
* プルダウン - 選択項目名と一致した文字列
* 数値 - 任意の整数
* 日付 - YYYY-MM-DD形式
* 印鑑(文字列) - 任意の文字列
* 印鑑(マイ印鑑) - 「マイ印鑑一覧の取得」で取得したnameを設定してください
- seal_image_id (任意): integer(int64) - 入力タイプが印鑑かつマイ印鑑を設定したい場合のみ、マイ印鑑のIDを設定してください。
マイ印鑑のIDは「マイ印鑑一覧の取得」で取得可能です。

※ マイ印鑑のIDが指定された場合、マイ印鑑を有効にするためvalueに任意の文字列を指定してもマイ印鑑のnameが登録されます。 例: `1` (最小: 1)

### レスポンス (200)

成功時

- name (必須): string - 項目名
- role (必須): string - どちら側の入力項目か
* owner 送信者側
* signer 承認側 (選択肢: owner, signer)
- order (必須): integer(int64) - 署名の順番。以下の順で表示
* ownerのアイテム群
* signer1のアイテム群
* signer2のアイテム群
…
- required (必須): boolean - 必須項目かどうか
- value (任意): string - 入力された値
未入力の場合は無し。
- user_id (任意): object - 文書入力項目入力ユーザーID
未入力の場合は無し。
- seal_image_id (任意): integer(int64) - マイ印鑑画像のID
入力項目が印鑑でなかった場合またはマイ印鑑機能を使用していない場合は無し。
- item_id (任意): integer(int64) - 入力項目のID

### DELETE /v1/documents/{document_id}/document_items/{document_item_id}

操作: 入力項目の削除

説明: 文書に付与した入力項目を削除する。

### レスポンス (200)

削除成功

- name (必須): string - 項目名
- role (必須): string - どちら側の入力項目か
* owner 送信者側
* signer 承認側 (選択肢: owner, signer)
- order (必須): integer(int64) - 署名の順番。以下の順で表示
* ownerのアイテム群
* signer1のアイテム群
* signer2のアイテム群
…
- required (必須): boolean - 必須項目かどうか
- value (任意): string - 入力された値
未入力の場合は無し。
- user_id (任意): object - 文書入力項目入力ユーザーID
未入力の場合は無し。
- seal_image_id (任意): integer(int64) - マイ印鑑画像のID
入力項目が印鑑でなかった場合またはマイ印鑑機能を使用していない場合は無し。
- item_id (任意): integer(int64) - 入力項目のID

### PUT /v1/documents/{document_id}/meta

操作: 検索項目付与

説明: 文書に検索項目を付与する。

### リクエストボディ

- items (必須): array[object] - 文書に付与する検索項目の配列

すべてを置き換えるため、検索項目を追加したい場合は既存項目と追加したい項目を合わせてリクエストする。
検索項目を削除する場合は既存項目から削除したい項目を除いたものをリクエストする。
  配列の要素:
    - item_id (必須): object - 検索項目の項目ID

チームで設定されているものの中から選んで指定する。
検索項目以外に、文書に入力項目として設定する項目も指定可能。
    - value (必須): string - 検索項目の値

### レスポンス (200)

OK

文書に設定されている検索項目が返る。


### GET /v1/documents/{document_id}/placeholder

操作: 入力内容未反映の文書取得

説明: 作成中の値が入っていない入力項目が配置された文書のPDFを取得する。 Media Type を application/pdf にしてください。 PDF作成処理中はエラーとなる為、時間を置いてAPIを再実行してください。

### レスポンス (200)

取得成功

### POST /v1/documents/{document_id}/re_confirmations

操作: 文書再送信

説明: 文書を再送信する。

### リクエストボディ

- sender_id (任意): object - 送信するユーザーのID (APIクライアントを利用する場合は必須)
- message (任意): string - メッセージ
メッセージを送らない場合は無し。

SMSによる再送信の場合はパラメータに含めても送信内容には反映はされません。

### レスポンス (200)

送信成功

- id (必須): integer(int64) - 文書ID 例: `1` (最小: 1)
- title (必須): string - 文書のタイトル 例: `文書 忍者太郎様`
- owner_id (必須): object - 文書作成者ユーザーID
- status (必須): string - 文書のステータス
* draft - 作成中
* in_progress - 確認待ち
* awaiting_receipt - 受け取り待ち
* approved - 要確認
* concluded - 完了
* rejected - 却下
* expired - 有効期限切れ
* trashed - 削除済み (選択肢: draft, in_progress, awaiting_receipt, approved, concluded, rejected, expired, trashed)
- folder_id (必須): object - 文書が保存されているフォルダのID
- folder_name (必須): string - 文書が保存されているフォルダの名前
- items (任意): array[object] - 入力項目 設定されていない場合は無し。
  配列の要素:
    - name (必須): string - 項目名
    - role (必須): string - どちら側の入力項目か
* owner 送信者側
* signer 承認側 (選択肢: owner, signer)
    - order (必須): integer(int64) - 署名の順番。以下の順で表示
* ownerのアイテム群
* signer1のアイテム群
* signer2のアイテム群
…
    - required (必須): boolean - 必須項目かどうか
    - value (任意): string - 入力された値
未入力の場合は無し。
    - user_id (任意): object - 文書入力項目入力ユーザーID
未入力の場合は無し。
    - seal_image_id (任意): integer(int64) - マイ印鑑画像のID
入力項目が印鑑でなかった場合またはマイ印鑑機能を使用していない場合は無し。
    - item_id (任意): integer(int64) - 入力項目のID
- meta_items (任意): array[object] - 検索項目 設定されていない場合は無し。
  配列の要素:
    - item_id (必須): integer(int64) - 検索項目の項目ID
    - type (必須): string - 検索項目の種類 (選択肢: string, date, number, select, stamp, acceptance)
    - name (必須): string - 検索項目の名前
    - value (必須): string - 検索項目の値
- signers (任意): array[object] - 文書に設定されている署名者
送信前は無し。
  配列の要素:
    - signer_id (必須): object - 文書の署名者となるユーザーのID
- signer_url (任意): object - 署名者用URLを受け取った相手は、そのURLから署名依頼の手続きを進めることができます
  - id (任意): integer(int64) - ID 例: `1` (最小: 1)
  - url (任意): string - 短縮URL
  - expires_at (任意): string(date-time) - 有効期限日時
- created_at (必須): string(date-time) - 作成日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-01-01T00:00:00+09:00
- updated_at (必須): string(date-time) - 更新日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-02-01T00:00:00+09:00
- timestamped (必須): boolean - タイムスタンプが付与されているかどうか
- expires_at (任意): string(date-time) - 有効期限日時
- sent_at (任意): string(date-time) - 送信日時
- concluded_at (任意): string(date-time) - 締結完了日時
- skip_approval (必須): boolean - trueの場合、配布文書（署名合意をスキップする文書）。
falseの場合、署名・合意文書。
- signer_document_confirmation (必須): boolean - 配布文書の受領者が文書を確認済みかどうか。
配布文書でない場合は常にfalse。

### POST /v1/documents/{document_id}/rejection

操作: 文書却下

説明: 要確認となった文書を却下する。

### リクエストボディ

- rejector_id (任意): object - 文書の送信者となるユーザーのID
- message (任意): string - メッセージ
メッセージを送らない場合は無し。

### レスポンス (200)

成功時

- id (必須): integer(int64) - 文書ID 例: `1` (最小: 1)
- title (必須): string - 文書のタイトル 例: `文書 忍者太郎様`
- owner_id (必須): object - 文書作成者ユーザーID
- status (必須): string - 文書のステータス
* draft - 作成中
* in_progress - 確認待ち
* awaiting_receipt - 受け取り待ち
* approved - 要確認
* concluded - 完了
* rejected - 却下
* expired - 有効期限切れ
* trashed - 削除済み (選択肢: draft, in_progress, awaiting_receipt, approved, concluded, rejected, expired, trashed)
- folder_id (必須): object - 文書が保存されているフォルダのID
- folder_name (必須): string - 文書が保存されているフォルダの名前
- items (任意): array[object] - 入力項目 設定されていない場合は無し。
  配列の要素:
    - name (必須): string - 項目名
    - role (必須): string - どちら側の入力項目か
* owner 送信者側
* signer 承認側 (選択肢: owner, signer)
    - order (必須): integer(int64) - 署名の順番。以下の順で表示
* ownerのアイテム群
* signer1のアイテム群
* signer2のアイテム群
…
    - required (必須): boolean - 必須項目かどうか
    - value (任意): string - 入力された値
未入力の場合は無し。
    - user_id (任意): object - 文書入力項目入力ユーザーID
未入力の場合は無し。
    - seal_image_id (任意): integer(int64) - マイ印鑑画像のID
入力項目が印鑑でなかった場合またはマイ印鑑機能を使用していない場合は無し。
    - item_id (任意): integer(int64) - 入力項目のID
- meta_items (任意): array[object] - 検索項目 設定されていない場合は無し。
  配列の要素:
    - item_id (必須): integer(int64) - 検索項目の項目ID
    - type (必須): string - 検索項目の種類 (選択肢: string, date, number, select, stamp, acceptance)
    - name (必須): string - 検索項目の名前
    - value (必須): string - 検索項目の値
- signers (任意): array[object] - 文書に設定されている署名者
送信前は無し。
  配列の要素:
    - signer_id (必須): object - 文書の署名者となるユーザーのID
- signer_url (任意): object - 署名者用URLを受け取った相手は、そのURLから署名依頼の手続きを進めることができます
  - id (任意): integer(int64) - ID 例: `1` (最小: 1)
  - url (任意): string - 短縮URL
  - expires_at (任意): string(date-time) - 有効期限日時
- created_at (必須): string(date-time) - 作成日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-01-01T00:00:00+09:00
- updated_at (必須): string(date-time) - 更新日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-02-01T00:00:00+09:00
- timestamped (必須): boolean - タイムスタンプが付与されているかどうか
- expires_at (任意): string(date-time) - 有効期限日時
- sent_at (任意): string(date-time) - 送信日時
- concluded_at (任意): string(date-time) - 締結完了日時
- skip_approval (必須): boolean - trueの場合、配布文書（署名合意をスキップする文書）。
falseの場合、署名・合意文書。
- signer_document_confirmation (必須): boolean - 配布文書の受領者が文書を確認済みかどうか。
配布文書でない場合は常にfalse。

### POST /v1/documents/{document_id}/send_back

操作: 文書差し戻し

説明: 要確認となった文書を差し戻しする。

### リクエストボディ

- executor_id (任意): object - 文書の送信者となるユーザーのID
- message (任意): string - メッセージ
メッセージを送らない場合は無し。

### レスポンス (200)

成功時

- id (必須): integer(int64) - 文書ID 例: `1` (最小: 1)
- title (必須): string - 文書のタイトル 例: `文書 忍者太郎様`
- owner_id (必須): object - 文書作成者ユーザーID
- status (必須): string - 文書のステータス
* draft - 作成中
* in_progress - 確認待ち
* awaiting_receipt - 受け取り待ち
* approved - 要確認
* concluded - 完了
* rejected - 却下
* expired - 有効期限切れ
* trashed - 削除済み (選択肢: draft, in_progress, awaiting_receipt, approved, concluded, rejected, expired, trashed)
- folder_id (必須): object - 文書が保存されているフォルダのID
- folder_name (必須): string - 文書が保存されているフォルダの名前
- items (任意): array[object] - 入力項目 設定されていない場合は無し。
  配列の要素:
    - name (必須): string - 項目名
    - role (必須): string - どちら側の入力項目か
* owner 送信者側
* signer 承認側 (選択肢: owner, signer)
    - order (必須): integer(int64) - 署名の順番。以下の順で表示
* ownerのアイテム群
* signer1のアイテム群
* signer2のアイテム群
…
    - required (必須): boolean - 必須項目かどうか
    - value (任意): string - 入力された値
未入力の場合は無し。
    - user_id (任意): object - 文書入力項目入力ユーザーID
未入力の場合は無し。
    - seal_image_id (任意): integer(int64) - マイ印鑑画像のID
入力項目が印鑑でなかった場合またはマイ印鑑機能を使用していない場合は無し。
    - item_id (任意): integer(int64) - 入力項目のID
- meta_items (任意): array[object] - 検索項目 設定されていない場合は無し。
  配列の要素:
    - item_id (必須): integer(int64) - 検索項目の項目ID
    - type (必須): string - 検索項目の種類 (選択肢: string, date, number, select, stamp, acceptance)
    - name (必須): string - 検索項目の名前
    - value (必須): string - 検索項目の値
- signers (任意): array[object] - 文書に設定されている署名者
送信前は無し。
  配列の要素:
    - signer_id (必須): object - 文書の署名者となるユーザーのID
- signer_url (任意): object - 署名者用URLを受け取った相手は、そのURLから署名依頼の手続きを進めることができます
  - id (任意): integer(int64) - ID 例: `1` (最小: 1)
  - url (任意): string - 短縮URL
  - expires_at (任意): string(date-time) - 有効期限日時
- created_at (必須): string(date-time) - 作成日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-01-01T00:00:00+09:00
- updated_at (必須): string(date-time) - 更新日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-02-01T00:00:00+09:00
- timestamped (必須): boolean - タイムスタンプが付与されているかどうか
- expires_at (任意): string(date-time) - 有効期限日時
- sent_at (任意): string(date-time) - 送信日時
- concluded_at (任意): string(date-time) - 締結完了日時
- skip_approval (必須): boolean - trueの場合、配布文書（署名合意をスキップする文書）。
falseの場合、署名・合意文書。
- signer_document_confirmation (必須): boolean - 配布文書の受領者が文書を確認済みかどうか。
配布文書でない場合は常にfalse。

### PUT /v1/documents/{document_id}/signature_requests/cancel

操作: 文書承認依頼キャンセル

説明: 文書の承認依頼をキャンセルする。

### リクエストボディ

- user_id (任意): object - 承認依頼をキャンセルするユーザーのID (APIクライアントを利用する場合は必須)
- message (任意): string - メッセージ
メッセージを送らない場合は無し。

### レスポンス (200)

承認依頼キャンセル成功

- id (必須): integer(int64) - 文書ID 例: `1` (最小: 1)
- title (必須): string - 文書のタイトル 例: `文書 忍者太郎様`
- owner_id (必須): object - 文書作成者ユーザーID
- status (必須): string - 文書のステータス
* draft - 作成中
* in_progress - 確認待ち
* awaiting_receipt - 受け取り待ち
* approved - 要確認
* concluded - 完了
* rejected - 却下
* expired - 有効期限切れ
* trashed - 削除済み (選択肢: draft, in_progress, awaiting_receipt, approved, concluded, rejected, expired, trashed)
- folder_id (必須): object - 文書が保存されているフォルダのID
- folder_name (必須): string - 文書が保存されているフォルダの名前
- items (任意): array[object] - 入力項目 設定されていない場合は無し。
  配列の要素:
    - name (必須): string - 項目名
    - role (必須): string - どちら側の入力項目か
* owner 送信者側
* signer 承認側 (選択肢: owner, signer)
    - order (必須): integer(int64) - 署名の順番。以下の順で表示
* ownerのアイテム群
* signer1のアイテム群
* signer2のアイテム群
…
    - required (必須): boolean - 必須項目かどうか
    - value (任意): string - 入力された値
未入力の場合は無し。
    - user_id (任意): object - 文書入力項目入力ユーザーID
未入力の場合は無し。
    - seal_image_id (任意): integer(int64) - マイ印鑑画像のID
入力項目が印鑑でなかった場合またはマイ印鑑機能を使用していない場合は無し。
    - item_id (任意): integer(int64) - 入力項目のID
- meta_items (任意): array[object] - 検索項目 設定されていない場合は無し。
  配列の要素:
    - item_id (必須): integer(int64) - 検索項目の項目ID
    - type (必須): string - 検索項目の種類 (選択肢: string, date, number, select, stamp, acceptance)
    - name (必須): string - 検索項目の名前
    - value (必須): string - 検索項目の値
- signers (任意): array[object] - 文書に設定されている署名者
送信前は無し。
  配列の要素:
    - signer_id (必須): object - 文書の署名者となるユーザーのID
- signer_url (任意): object - 署名者用URLを受け取った相手は、そのURLから署名依頼の手続きを進めることができます
  - id (任意): integer(int64) - ID 例: `1` (最小: 1)
  - url (任意): string - 短縮URL
  - expires_at (任意): string(date-time) - 有効期限日時
- created_at (必須): string(date-time) - 作成日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-01-01T00:00:00+09:00
- updated_at (必須): string(date-time) - 更新日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-02-01T00:00:00+09:00
- timestamped (必須): boolean - タイムスタンプが付与されているかどうか
- expires_at (任意): string(date-time) - 有効期限日時
- sent_at (任意): string(date-time) - 送信日時
- concluded_at (任意): string(date-time) - 締結完了日時
- skip_approval (必須): boolean - trueの場合、配布文書（署名合意をスキップする文書）。
falseの場合、署名・合意文書。
- signer_document_confirmation (必須): boolean - 配布文書の受領者が文書を確認済みかどうか。
配布文書でない場合は常にfalse。

### POST /v1/pdf_documents

操作: 文書アップロード

説明: 任意のフォルダに文書をアップロードする。作成された文書のステータスは「完了」になる

### リクエストボディ

- pdf_file (必須): object
  - name (必須): string - アップロードファイル名（拡張子込み）

- PDFファイルのタイトルは255文字以内にしてください。
  - content (必須): string - アップロードファイルの内容

- アップロードファイルのバイナリをBase64エンコードした文字列を指定してください。
- ファイル形式はPDF（application/pdf）のみ有効です。
- PDFファイルのサイズは10MB以下にしてください。
- uploader_id (必須): integer(int64) - アップロードするユーザーのID
- folder_id (必須): integer(int64) - アップロードした文書の保存先フォルダのID

### レスポンス (201)

成功時

- document (任意): object - 文書
  - id (必須): integer(int64) - 文書ID 例: `1` (最小: 1)
  - title (必須): string - 文書のタイトル 例: `文書 忍者太郎様`
  - owner_id (必須): object - 文書作成者ユーザーID
  - status (必須): string - 文書のステータス
* draft - 作成中
* in_progress - 確認待ち
* awaiting_receipt - 受け取り待ち
* approved - 要確認
* concluded - 完了
* rejected - 却下
* expired - 有効期限切れ
* trashed - 削除済み (選択肢: draft, in_progress, awaiting_receipt, approved, concluded, rejected, expired, trashed)
  - folder_id (必須): object - 文書が保存されているフォルダのID
  - folder_name (必須): string - 文書が保存されているフォルダの名前
  - items (任意): array[object] - 入力項目 設定されていない場合は無し。
  - meta_items (任意): array[object] - 検索項目 設定されていない場合は無し。
  - signers (任意): array[object] - 文書に設定されている署名者
送信前は無し。
  - signer_url (任意): object - 署名者用URLを受け取った相手は、そのURLから署名依頼の手続きを進めることができます
  - created_at (必須): string(date-time) - 作成日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-01-01T00:00:00+09:00
  - updated_at (必須): string(date-time) - 更新日時。 ISO8601 形式を受け入れます。<br>
<br>
入力例: 2022-02-01T00:00:00+09:00
  - timestamped (必須): boolean - タイムスタンプが付与されているかどうか
  - expires_at (任意): string(date-time) - 有効期限日時
  - sent_at (任意): string(date-time) - 送信日時
  - concluded_at (任意): string(date-time) - 締結完了日時
  - skip_approval (必須): boolean - trueの場合、配布文書（署名合意をスキップする文書）。
falseの場合、署名・合意文書。
  - signer_document_confirmation (必須): boolean - 配布文書の受領者が文書を確認済みかどうか。
配布文書でない場合は常にfalse。
- message (任意): string - メッセージ

### GET /v1/users/{user_id}/documents

操作: ユーザーがアクセスできる文書一覧の取得

説明: 特定のユーザーがアクセスできる文書の一覧を取得する。 ここで取得できる文書には、作成した文書と受領した文書が含まれます。 文書は、新しく作成した順に取得されます。

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| page | query | いいえ | object |  |
| per_page | query | いいえ | object |  |
| folder_id | query | いいえ | object | フォルダID。IDで指定したフォルダに格納されている文書一覧を取得できる。 |
| title | query | いいえ | string | 文書名に一致する一覧を取得できる（部分一致も可）。送信相手のメールアドレスに一致する一覧を取得できる（完全一致）。 |
| status | query | いいえ | string | ステータス毎に文書一覧を取得できる。
  * draft - 作成中
  * in_progress - 確認待ち
  * awaiting_receipt - 受け取り待ち
  * approved - 要確認
  * concluded - 完了
  * rejected - 却下
  * expired - 有効期限切れ (選択肢: draft, in_progress, awaiting_receipt, approved, concluded, rejected, expired) |
| ids[] | query | いいえ | array[integer] | 配列で文書IDを指定して、文書一覧を取得できる |
| created_at_from | query | いいえ | object | 作成日時が指定した作成日時以降である文書を取得できます。<br>
開始は区切りを含みますが、終了は区切りを含みません。(左閉右開区間) |
| created_at_to | query | いいえ | object | 作成日時が指定した作成日時より過去である文書を取得できます。<br>
開始は区切りを含みますが、終了は区切りを含みません。(左閉右開区間) |
| updated_at_from | query | いいえ | object | 更新日時が指定した更新日時以降である文書を取得できます。<br>
開始は区切りを含みますが、終了は区切りを含みません。(左閉右開区間) |
| updated_at_to | query | いいえ | object | 更新日時が指定した更新日時より過去である文書を取得できます。<br>
開始は区切りを含みますが、終了は区切りを含みません。(左閉右開区間) |

### レスポンス (200)

取得成功




## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
