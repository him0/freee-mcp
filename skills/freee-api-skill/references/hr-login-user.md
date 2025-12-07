# ログインユーザー

## 概要

ログインユーザーの取得

## エンドポイント一覧

### GET /api/v1/users/me

**操作**: ログインユーザーの取得

**説明**: 概要 このリクエストの認可セッションにおけるログインユーザーの情報を返します。 freee人事労務では一人のログインユーザーを複数の事業所に関連付けられるため、このユーザーと関連のあるすべての事業所の情報をリストで返します。 注意点 他のAPIのパラメータとしてcompany_idが求められる場合は、このAPIで取得したcompany_idを使用します。 給与計算対象外の従業員のemployee_idとdisplay_nameは取得できません。

### レスポンス (200)

successful operation

- **id** (任意): integer(int32) - ユーザーID
- **companies** (任意): array[object] - ユーザーが属する事業所の一覧
  配列の要素:
    - **id** (任意): integer(int32) - 事業所ID
    - **name** (任意): string - 事業所名
    - **role** (任意): string - 事業所におけるロール。

- `company_admin`: 管理者
- `self_only`: 一般
- `attendance_manager`: 勤怠管理者
- `physician`: 産業医
- `shift_admin`: AIシフト担当者
- `time_clock_device_setter`: 打刻機設定者

[各権限でできることは各アカウントの権限についてのヘルプページを参照してください。](https://support.freee.co.jp/hc/ja/articles/204087410#3)
    - **external_cid** (任意): string - 事業所番号(半角英数字10桁)
    - **employee_id** (任意): integer(int32) - 事業所に所属する従業員としての従業員ID、従業員情報が未登録の場合はnullになります。
    - **display_name** (任意): string - 事業所に所属する従業員の表示名



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
