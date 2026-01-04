# 人事労務の操作

freee人事労務APIを使った従業員・勤怠管理ガイド。

## 概要

人事労務APIを使って従業員情報の取得、勤怠データの管理を行います。

## 利用可能なパス

### 従業員関連

| パス | 説明 |
|------|------|
| `/api/v1/employees` | 従業員一覧（対象年月指定） |
| `/api/v1/companies/{company_id}/employees` | 全期間の従業員一覧 |
| `/api/v1/employees/{id}` | 従業員詳細 |

### 勤怠関連

| パス | 説明 |
|------|------|
| `/api/v1/employees/{id}/work_records/{date}` | 勤怠記録 |
| `/api/v1/employees/{id}/time_clocks` | 打刻 |
| `/api/v1/employees/{id}/work_record_summaries/{year}/{month}` | 勤怠サマリ |

### 給与関連

| パス | 説明 |
|------|------|
| `/api/v1/payroll_statements` | 給与明細一覧 |
| `/api/v1/bonus_statements` | 賞与明細一覧 |

## 使用例

### 従業員一覧を取得

対象年月を指定して取得:

```
freee_api_get {
  "service": "hr",
  "path": "/api/v1/employees",
  "query": {
    "year": 2025,
    "month": 1
  }
}
```

### 全期間の従業員一覧を取得

退職者も含めて取得:

```
freee_api_get {
  "service": "hr",
  "path": "/api/v1/companies/123456/employees"
}
```

### 従業員の勤怠記録を取得

```
freee_api_get {
  "service": "hr",
  "path": "/api/v1/employees/1/work_records/2025-01-15"
}
```

### 打刻を登録

```
freee_api_post {
  "service": "hr",
  "path": "/api/v1/employees/1/time_clocks",
  "body": {
    "company_id": 123456,
    "type": "clock_in",
    "datetime": "2025-01-15T09:00:00+09:00"
  }
}
```

### 給与明細一覧を取得

```
freee_api_get {
  "service": "hr",
  "path": "/api/v1/payroll_statements",
  "query": {
    "year": 2025,
    "month": 1
  }
}
```

## Tips

### 作成後のWeb確認URL

人事労務の各画面は以下のURLで確認できます:

| 種類 | URL形式 |
|------|---------|
| 従業員詳細 | `https://p.secure.freee.co.jp/employees/{id}` |

### 打刻タイプ

| type | 説明 |
|------|------|
| `clock_in` | 出勤 |
| `clock_out` | 退勤 |
| `break_begin` | 休憩開始 |
| `break_end` | 休憩終了 |

### 翌月払いの従業員情報取得

締め日支払い日設定が翌月払いの場合、指定month + 1の従業員情報が返されます。

例: 2025年1月の情報を取得する場合

```
freee_api_get {
  "service": "hr",
  "path": "/api/v1/employees",
  "query": {
    "year": 2024,
    "month": 12
  }
}
```

## 注意点

- 管理者権限を持ったユーザーのみ実行可能なAPIが多い
- 指定年月に退職済みのユーザーは `/api/v1/employees` では取得できない
- 全期間取得が必要な場合は `/api/v1/companies/{company_id}/employees` を使用

## リファレンス

詳細なAPIパラメータは以下を参照:

- `references/hr-employees.md` - 従業員
- `references/hr-attendances.md` - 勤怠
- `references/hr-time-clocks.md` - 打刻
- `references/hr-payroll-statements.md` - 給与明細
