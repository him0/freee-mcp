# 工数管理の操作

freee工数管理APIを使ったプロジェクト・工数の管理ガイド。

## 概要

工数管理APIを使ってプロジェクトの作成・管理、工数実績の登録・取得を行います。

## 重要: company_id は必須

freee工数管理APIでは、すべてのエンドポイントで `company_id` が必須です。

- GETリクエスト: `query` に `company_id` を含める
- POSTリクエスト: `body` に `company_id` を含める

`company_id` を省略すると 500 エラーが発生します。事前に `freee_get_current_company` で事業所IDを取得してください。

## 利用可能なパス

| パス | 説明 |
|------|------|
| `/projects` | プロジェクト一覧・作成 |
| `/projects/{id}` | プロジェクト詳細 |
| `/workloads` | 工数実績一覧・登録 |
| `/workload_summaries` | 工数サマリ取得 |

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

### プロジェクト詳細を取得

```
freee_api_get {
  "service": "pm",
  "path": "/projects/1",
  "query": {
    "company_id": 123456
  }
}
```

### 運用ステータスで絞り込み

```
freee_api_get {
  "service": "pm",
  "path": "/projects",
  "query": {
    "company_id": 123456,
    "operational_status": "in_progress"
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

## リファレンス

詳細なAPIパラメータは以下を参照:

- `references/pm-projects.md` - プロジェクト
- `references/pm-workloads.md` - 工数実績
- `references/pm-people.md` - 従業員
- `references/pm-teams.md` - チーム
- `references/pm-partners.md` - 取引先
- `references/pm-unit-costs.md` - 単価
