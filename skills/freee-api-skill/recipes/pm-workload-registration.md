# 工数の安全な登録（PM・HR連携ワークフロー）

freee工数管理と人事労務APIを連携した安全な工数登録ワークフロー。
勤怠チェック・重複確認・ユーザー承認を経て工数を登録します。

## 概要

工数登録を単独で行うと以下のリスクがあります:

- 休日に工数を登録してしまう
- 有給取得日に工数を登録してしまう
- 既に登録済みの工数と重複する
- 締め済みの日に登録を試みてエラーになる

このレシピでは、人事労務APIの勤怠情報を事前確認し、
ユーザーの承認を得てから登録することで、安全に工数登録を行います。

工数APIの基本操作は `recipes/pm-operations.md`、
勤怠APIの基本操作は `recipes/hr-attendance-operations.md` を参照してください。

## ワークフロー

### Step 1: ユーザーID解決

PM側の person_id と HR側の employee_id を紐付けます。

#### 1-1. PM側のログインユーザー情報を取得

```
freee_api_get {
  "service": "pm",
  "path": "/users/me"
}
```

レスポンスの `companies[].person_me.id` がPM側の person_id です。
`companies[].id` から対象の company_id も確認できます。

#### 1-2. HR側の employee_id を取得

方法A: PM `/people` の payroll_employee_id を使う

```
freee_api_get {
  "service": "pm",
  "path": "/people",
  "query": {
    "company_id": 123456,
    "person_ids[]": [1]
  }
}
```

レスポンスの `people[].payroll_employee_id` が HR の employee_id に対応します。

方法B: HR `/api/v1/users/me` から直接取得

```
freee_api_get {
  "service": "hr",
  "path": "/api/v1/users/me",
  "query": {
    "company_id": 123456
  }
}
```

レスポンスの `companies[].employee_id` が HR の employee_id です。
`payroll_employee_id` が null の場合はこちらを使ってください。

self_only 権限の詳細は `recipes/hr-attendance-operations.md` の「self_only 権限について」を参照してください。

### Step 2: 勤怠情報の事前確認

対象日の勤怠記録を取得して、工数登録が可能かチェックします。

```
freee_api_get {
  "service": "hr",
  "path": "/api/v1/employees/{employee_id}/work_records/2025-03-10",
  "query": {
    "company_id": 123456
  }
}
```

レスポンスのフィールドを「安全チェック一覧」テーブルに基づいて確認し、すべてのチェックを通過した場合のみ次のステップに進みます。
勤怠APIの詳細は `recipes/hr-attendance-operations.md` を参照してください。

### Step 3: 既存工数の重複チェック

PM `GET /workloads` で対象月の既存工数を取得し、同じ日・同じプロジェクトに登録済みでないか確認します（工数取得の例は `recipes/pm-operations.md` 参照）。

### Step 4: ユーザー承認（Human-in-the-Loop）

以下の情報をユーザーに提示し、承認を得てから登録を実行します。

提示する情報:

- 登録対象日: YYYY-MM-DD
- 勤怠状態: 所定労働日 / 出勤済み（Step 2 の結果）
- 対象プロジェクト: プロジェクト名
- 登録時間: XX分（X時間XX分）
- 業務内容: メモ
- 既存工数: なし、または既存の一覧（Step 3 の結果）

ユーザーが承認したら Step 5 へ進みます。

### Step 5: 工数登録の実行

PM `POST /workloads` で工数を登録します（登録例は `recipes/pm-operations.md` 参照）。

### Step 6: 登録結果の検証

PM `GET /workloads` で登録した工数を取得し、日・プロジェクト・時間が正しいことを確認してユーザーに報告します。

## 安全チェック一覧

| チェック項目 | API | 確認フィールド | ブロック条件 |
|---|---|---|---|
| 休日チェック | HR work_records | day_pattern | prescribed_holiday, legal_holiday |
| 欠勤チェック | HR work_records | is_absence | true |
| 有給チェック | HR work_records | paid_holidays | 配列が空でない |
| 締め済みチェック | HR work_records | is_editable | false |
| 重複チェック | PM workloads | 同日・同プロジェクト | 既存レコードあり |

## Tips

### 一括登録のパターン

複数日分の工数を一括登録する場合は、各日ごとに Step 2〜4 を繰り返します。
安全チェックでブロック条件に該当した日はスキップし、ユーザーに報告してください。

### 権限に関する注意

- 管理者権限がない場合、他の従業員の勤怠情報は取得できません（self_only 制約）
- 自分の工数登録のみであれば self_only 権限で実行可能です
- 他者の工数を登録する場合は管理者権限が必要です

## リファレンス

- `references/pm-workloads.md` - 工数実績API詳細
- `references/pm-people.md` - 従業員（payroll_employee_id）
- `references/pm-users.md` - ログインユーザー
- `references/hr-attendances.md` - 勤怠API詳細
- `recipes/pm-operations.md` - 工数管理の基本操作
- `recipes/hr-attendance-operations.md` - 勤怠の操作
