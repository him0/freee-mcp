# テンプレート

## 概要

テンプレートの操作

## エンドポイント一覧

### GET /v1/templates

操作: テンプレート一覧取得

説明: テンプレート一覧を取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| title | query | いいえ | string | テンプレート名に一致する一覧を取得できる（部分一致も可） |
| page | query | いいえ | object |  |
| per_page | query | いいえ | object |  |

### レスポンス (200)

テンプレート一覧取得成功


### GET /v1/templates/{template_id}

操作: テンプレート取得

説明: テンプレートを取得する。 PDF を取得したい場合は、Media Type を application/pdf にしてください。

### レスポンス (200)

取得成功

- id (必須): integer(int64) - 文書テンプレートID 例: `1` (最小: 1)
- title (必須): string - テンプレートのタイトル
- message (任意): string - テンプレートのメッセージ。送信時にデフォルトメッセージとして相手方に表示されます
- folder_id (必須): integer(int64) - テンプレートの保存先フォルダのID
- signers_count (任意): integer - 相手方の人数
- skip_approval (必須): boolean - trueの場合、配布文書（署名合意をスキップする文書）のテンプレート。
falseの場合、署名・合意文書のテンプレート。
- items (任意): array[object] - テンプレート入力項目一覧
  配列の要素:
    - name (必須): string - 入力項目の表示名
    - role (必須): string - 入力項目が作成者のものか受領者のものか示す (選択肢: owner, signer)
    - item_id (必須): integer(int64) - 入力項目固有のID (最小: 1)
    - order (必須): integer(int64) - 署名の順番。以下の順で表示
* ownerのアイテム群
* signer1のアイテム群
* signer2のアイテム群
…
    - input_type (必須): string - 入力項目のフォーマットを示す
文書作成時の入力項目値はこのフォーマットに応じて入力する。
* stamp - 印鑑として表示する文字列。マイ印鑑の場合は入力項目値ではなく別項目(`seal_image_id`)でマイ印鑑画像のIDを指定する。
* string - 型はstring。自由入力。
* date - 型はstring。日付フォーマット（例：2000-10-10）
* select - 型はstring。選択肢に指定した文字列のみ。
* number - 型はstring。数字のみ。
* acceptance - 型はstring。真偽値のみ。
    - item_options (任意): array[object] - 入力項目のフォーマットが`select`のときの選択肢
    - required (必須): boolean - 入力項目が必須項目かどうか示す
    - signatures (任意): array[object] - 入力項目位置一覧



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
