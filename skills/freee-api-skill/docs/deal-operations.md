# 取引（収入・支出）の操作

freee会計APIを使った取引の登録・検索ガイド。

## 概要

取引APIを使って収入・支出の記録、検索、更新を行います。

## 利用可能なパス

| パス | 説明 |
|------|------|
| `/api/1/deals` | 取引一覧・作成 |
| `/api/1/deals/{id}` | 取引詳細・更新・削除 |
| `/api/1/deals/{id}/payments` | 支払行の作成 |
| `/api/1/deals/{id}/renews` | +更新行の作成 |

## 使用例

### 取引一覧を取得

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/deals",
  "query": {
    "limit": 10
  }
}
```

### 期間で絞り込み

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/deals",
  "query": {
    "start_issue_date": "2025-01-01",
    "end_issue_date": "2025-01-31",
    "type": "expense"
  }
}
```

### 支出を作成（未決済）

```
freee_api_post {
  "service": "accounting",
  "path": "/api/1/deals",
  "body": {
    "company_id": 123456,
    "issue_date": "2025-01-15",
    "type": "expense",
    "details": [
      {
        "account_item_id": 101,
        "tax_code": 1,
        "amount": 10000,
        "description": "消耗品購入"
      }
    ]
  }
}
```

### 支出を作成（決済済み）

```
freee_api_post {
  "service": "accounting",
  "path": "/api/1/deals",
  "body": {
    "company_id": 123456,
    "issue_date": "2025-01-15",
    "type": "expense",
    "details": [
      {
        "account_item_id": 101,
        "tax_code": 1,
        "amount": 10000,
        "description": "消耗品購入"
      }
    ],
    "payments": [
      {
        "amount": 10000,
        "from_walletable_type": "wallet",
        "from_walletable_id": 1,
        "date": "2025-01-15"
      }
    ]
  }
}
```

## Tips

### 作成後のWeb確認URL

取引を作成した後、以下のURLでWeb画面から確認できます:

```
https://secure.freee.co.jp/deals/{id}
```

`{id}` は API レスポンスで返される取引ID（`deal.id`）を使用します。

### 収支区分

| type | 説明 |
|------|------|
| `income` | 収入 |
| `expense` | 支出 |

### 決済状況

| status | 説明 |
|--------|------|
| `unsettled` | 未決済 |
| `settled` | 完了 |

### 口座区分（from_walletable_type）

| 値 | 説明 |
|----|------|
| `bank_account` | 銀行口座 |
| `credit_card` | クレジットカード |
| `wallet` | 現金 |
| `private_account_item` | プライベート資金 |

## 関連API

取引作成時に必要なマスタ情報:

- `/api/1/account_items` - 勘定科目一覧
- `/api/1/taxes` - 税区分一覧
- `/api/1/walletables` - 口座一覧
- `/api/1/partners` - 取引先一覧

## リファレンス

詳細なAPIパラメータは `references/accounting-deals.md` を参照。
