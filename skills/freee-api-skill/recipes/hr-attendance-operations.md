# 勤怠の操作

freee人事労務APIを使った勤怠管理ガイド。

## 利用可能なパス

| パス | 説明 |
|------|------|
| `/api/v1/employees/{id}/work_records/{date}` | 勤怠記録（GET/PUT/DELETE） |
| `/api/v1/employees/{id}/time_clocks` | 打刻（POST） |
| `/api/v1/employees/{id}/work_record_summaries/{year}/{month}` | 勤怠サマリ（GET） |

## 使用例

### 勤怠記録を取得

```
freee_api_get {
  "service": "hr",
  "path": "/api/v1/employees/{employee_id}/work_records/2025-01-15",
  "query": { "company_id": 123456 }
}
```

`is_editable: true` であれば更新可能です。

### 打刻を登録

```
freee_api_post {
  "service": "hr",
  "path": "/api/v1/employees/{employee_id}/time_clocks",
  "body": {
    "company_id": 123456,
    "type": "clock_in",
    "datetime": "2025-01-15T09:00:00+09:00"
  }
}
```

### 出退勤時刻と休憩時間を登録・更新

`work_record_segments` で出退勤時刻、`break_records` で休憩時間を指定します。

```
freee_api_put {
  "service": "hr",
  "path": "/api/v1/employees/{employee_id}/work_records/2025-01-15",
  "body": {
    "company_id": 123456,
    "work_record_segments": [
      {
        "clock_in_at": "2025-01-15 10:40:00",
        "clock_out_at": "2025-01-15 20:15:00"
      }
    ],
    "break_records": [
      {
        "clock_in_at": "2025-01-15 12:00:00",
        "clock_out_at": "2025-01-15 13:00:00"
      }
    ]
  }
}
```

- 時刻はJST（`+09:00`）として扱われる（タイムゾーン省略可）
- `break_records` を空配列にすると休憩なしになる
- 複数回の出退勤がある場合は `work_record_segments` に複数要素を指定する
- 既に登録済みの勤怠も同じAPIで上書き更新できる

## Tips

### self_only 権限について

`/api/v1/employees` は管理者権限が必要ですが、`/api/v1/users/me` で自分の `employee_id` を取得すれば、自分の勤怠は操作可能です。

```
freee_api_get {
  "service": "hr",
  "path": "/api/v1/users/me",
  "query": { "company_id": 123456 }
}
```

レスポンスの `companies[].employee_id` が自分の従業員IDです。

## リファレンス

- `references/hr-attendances.md` - 勤怠API詳細
- `references/hr-time-clocks.md` - 打刻API詳細
