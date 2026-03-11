# 工数管理の操作

freee工数管理APIを使ったプロジェクト・工数の管理ガイド。

## 重要: company_id の指定方法

すべてのエンドポイントで `company_id` が必須です。

- GETリクエスト: `query` に `company_id` を含める
- POSTリクエスト: `body` に `company_id` を含める

## 利用可能なパス

| パス | メソッド | 説明 |
|------|---------|------|
| `/projects` | GET, POST | プロジェクト一覧・作成 |
| `/projects/{id}` | GET, PUT, DELETE, PATCH | プロジェクト詳細・更新・削除 |
| `/workloads` | GET, POST | 工数実績一覧・登録 |
| `/workload_summaries` | GET | 工数サマリ取得 |
| `/people` | GET | 従業員一覧（payroll_employee_id でHR連携可） |
| `/teams` | GET | チーム一覧 |
| `/partners` | GET | 取引先一覧 |
| `/unit_costs` | GET | 単価マスタ |
| `/users/me` | GET | ログインユーザー情報 |

## 使用例

### プロジェクト一覧を取得

```
freee_api_get {
  "service": "pm",
  "path": "/projects",
  "query": {
    "company_id": 123456
  }
}
```

### プロジェクトを作成

```
freee_api_post {
  "service": "pm",
  "path": "/projects",
  "body": {
    "company_id": 123456,
    "name": "新規プロジェクト",
    "code": "PJ-001",
    "from_date": "2025-04-01",
    "thru_date": "2025-12-31",
    "pm_budgets_cost": 5000
  }
}
```

### 工数を登録

```
freee_api_post {
  "service": "pm",
  "path": "/workloads",
  "body": {
    "company_id": 123456,
    "project_id": 1,
    "date": "2025-03-10",
    "minutes": 120,
    "memo": "設計作業"
  }
}
```

### 工数実績を取得

```
freee_api_get {
  "service": "pm",
  "path": "/workloads",
  "query": {
    "company_id": 123456,
    "year_month": "2025-03"
  }
}
```

### 工数サマリを取得

```
freee_api_get {
  "service": "pm",
  "path": "/workload_summaries",
  "query": {
    "company_id": 123456,
    "year_month": "2025-03"
  }
}
```

## Tips

### 運用ステータス

| 値 | 説明 |
|----|------|
| `planning` | 計画中 |
| `awaiting_approval` | 承認待ち |
| `in_progress` | 進行中 |
| `rejected` | 却下 |
| `done` | 完了 |

### 従業員スコープ（workloads/workload_summaries）

| 値 | 説明 |
|----|------|
| `all` | 全従業員 |
| `team` | チーム単位（team_ids で絞り込み） |
| `employee` | 従業員単位（person_ids で絞り込み） |
| 未指定 | ログインユーザーのみ |

### 人事労務APIとの連携

`/people` レスポンスの `payroll_employee_id` が人事労務側の `employee_id` に対応します。
安全な工数登録ワークフロー（勤怠チェック・重複確認・承認フロー）については `recipes/pm-workload-registration.md` を参照してください。

## リファレンス

詳細なAPIパラメータは以下を参照:

- `references/pm-projects.md` - プロジェクト
- `references/pm-workloads.md` - 工数実績
- `references/pm-people.md` - 従業員
- `references/pm-teams.md` - チーム
- `references/pm-partners.md` - 取引先
- `references/pm-unit-costs.md` - 単価
- `references/pm-users.md` - ログインユーザー
