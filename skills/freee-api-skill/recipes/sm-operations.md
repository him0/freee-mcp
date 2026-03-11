# 販売管理の操作

freee販売APIを使った案件・受注の管理ガイド。

## 重要: company_id の指定方法

データ作成時に `company_id` が必須です。

- POSTリクエスト: `body` に `company_id` を含める

## 利用可能なパス

| パス | 説明 |
|------|------|
| `/businesses` | 案件一覧・作成 |
| `/businesses/{id}` | 案件詳細・更新 |
| `/sales_orders` | 受注一覧・作成 |
| `/sales_orders/{id}` | 受注詳細・更新 |

## 使用例

### 案件一覧を取得

```
freee_api_get {
  "service": "sm",
  "path": "/businesses"
}
```

### 案件詳細を取得

```
freee_api_get {
  "service": "sm",
  "path": "/businesses/1"
}
```

### 案件を作成

```
freee_api_post {
  "service": "sm",
  "path": "/businesses",
  "body": {
    "company_id": 123456,
    "name": "新規案件"
  }
}
```

### 案件を更新

```
freee_api_patch {
  "service": "sm",
  "path": "/businesses/1",
  "body": {
    "name": "案件名変更",
    "internal_memo": "メモ更新"
  }
}
```

### 受注一覧を取得

```
freee_api_get {
  "service": "sm",
  "path": "/sales_orders"
}
```

### 受注詳細を取得

```
freee_api_get {
  "service": "sm",
  "path": "/sales_orders/1"
}
```

### 受注を作成

```
freee_api_post {
  "service": "sm",
  "path": "/sales_orders",
  "body": {
    "company_id": 123456,
    "sales_order_date": "2025-03-10",
    "customer_id": 1,
    "billing_partner_id": 1,
    "collecting_partner_id": 1,
    "lines": [
      {
        "name": "商品A",
        "unit_price": 10000,
        "quantity": 1
      }
    ]
  }
}
```

## Tips

### 案件の更新可能項目

| 項目 | 説明 |
|------|------|
| `name` | 案件名称 |
| `code` | 案件コード |
| `business_date` | 案件登録日 |
| `charge_employee_id` | 社内担当者の従業員ID |
| `customer_id` | 顧客の取引先ID |
| `prospect_sales_order` | 受注見込 |
| `sales_progression_id` | 受注確度ID |
| `scheduled_completion_date` | 完了予定日 |
| `completion_date` | 完了日 |
| `business_phase_id` | 案件フェーズID |
| `reporting_section_id` | 担当部門ID |
| `internal_memo` | 社内メモ |

### 受注の必須項目

| 項目 | 説明 |
|------|------|
| `sales_order_date` | 受注日 |
| `customer_id` | 顧客の取引先ID |
| `billing_partner_id` | 請求先の取引先ID |
| `collecting_partner_id` | 入金元の取引先ID |
| `lines` | 明細リスト |

## 関連API

マスタ情報の取得:

- `references/sm-master.md` - マスタ情報（テンプレート等）

## リファレンス

詳細なAPIパラメータは以下を参照:

- `references/sm-businesses.md` - 案件
- `references/sm-sales-orders.md` - 受注
- `references/sm-master.md` - マスタ
