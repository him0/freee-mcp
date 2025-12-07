# 申請経路

## 概要

申請経路の操作

## エンドポイント一覧

### GET /api/v1/approval_flow_routes

**操作**: 申請経路一覧の取得

**説明**: 概要 指定した事業所の申請経路一覧を取得する。 注意点 指定した事業所の従業員に紐づくユーザーのみ実行可能です。 申請経路、承認者の指定として部門役職データ連携を活用し、以下のいずれかを利用している申請と申請経路はAPI経由で参照は可能ですが、作成と更新、承認ステータスの変更ができません。 役職指定（申請者の所属部門） 役職指定（申請時に部門指定） 部門および役職指定

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer | 事業所ID |
| included_user_id | query | いいえ | integer | 経路に含まれるユーザーのユーザーID |
| usage | query | いいえ | string | 申請種別（申請経路を使用できる申請種別を示します。例えば、AttendanceWorkflow の場合は、勤怠申請で使用できる申請経路です。）
- `AttendanceWorkflow` - 勤怠申請
- `PersonalDataWorkflow` - 身上変更申請 (選択肢: AttendanceWorkflow, PersonalDataWorkflow) |

### レスポンス (200)

successful operation

- **approval_flow_routes** **(必須)**: array[object]
  配列の要素:
    - **id** **(必須)**: integer - 申請経路ID 例: `1` (最小: 1, 最大: 2147483647)
    - **name** (任意): string - 申請経路名 例: `申請経路`
    - **description** (任意): string - 申請経路の説明 例: `申請経路の説明`
    - **user_id** (任意): integer - 更新したユーザーのユーザーID 例: `1` (最小: 1, 最大: 2147483647)
    - **definition_system** (任意): boolean - システム作成の申請経路かどうか 例: `true`
    - **first_step_id** (任意): integer - 最初の承認ステップのID 例: `1` (最小: 1, 最大: 2147483647)
    - **usages** (任意): array[string] - 申請種別（申請経路を使用できる申請種別を示します。例えば、AttendanceWorkflow の場合は、勤怠申請で使用できる申請経路です。）
- AttendanceWorkflow - 勤怠申請
- PersonalDataWorkflow - 身上変更申請

### GET /api/v1/approval_flow_routes/{id}

**操作**: 申請経路の取得

**説明**: 概要 指定した事業所の申請経路を取得する。 注意点 指定した事業所の従業員に紐づくユーザーのみ実行可能です。 申請経路、承認者の指定として部門役職データ連携を活用し、以下のいずれかを利用している申請と申請経路はAPI経由で参照は可能ですが、作成と更新、承認ステータスの変更ができません。 役職指定（申請者の所属部門） 役職指定（申請時に部門指定） 部門および役職指定

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| id | path | はい | integer | 申請経路ID |
| company_id | query | はい | integer | 事業所ID |

### レスポンス (200)

successful operation

- **approval_flow_route** **(必須)**: object
  - **id** **(必須)**: integer - 申請経路ID 例: `1` (最小: 1, 最大: 2147483647)
  - **name** (任意): string - 申請経路名 例: `申請経路`
  - **description** (任意): string - 申請経路の説明 例: `申請経路の説明`
  - **user_id** (任意): integer - 更新したユーザーのユーザーID 例: `1` (最小: 1, 最大: 2147483647)
  - **definition_system** (任意): boolean - システム作成の申請経路かどうか 例: `true`
  - **first_step_id** (任意): integer - 最初の承認ステップのID 例: `1` (最小: 1, 最大: 2147483647)
  - **usages** (任意): array[string] - 申請種別（申請経路を使用できる申請種別を示します。例えば、AttendanceWorkflow の場合は、勤怠申請で使用できる申請経路です。）
- AttendanceWorkflow - 勤怠申請
- PersonalDataWorkflow - 身上変更申請
  - **steps** (任意): array[object] - 承認ステップ（配列）



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [hr-api-schema.json](../../openapi/hr-api-schema.json)
