# 請求書・見積書・納品書の操作

freee請求書APIを使った帳票操作のガイド。

## 概要

請求書 API は `https://api.freee.co.jp/iv` をベースとした独立した API です。

注意: 会計 API の `/api/1/invoices` は過去の API であり、現在は請求書 API (`service: "invoice"`) を使用してください。

## 利用可能なパス

| パス | 説明 |
|------|------|
| `/invoices` | 請求書一覧 |
| `/invoices/{id}` | 請求書詳細 |
| `/quotations` | 見積書一覧 |
| `/quotations/{id}` | 見積書詳細 |
| `/delivery_slips` | 納品書一覧 |
| `/delivery_slips/{id}` | 納品書詳細 |

## 使用例

請求書一覧を取得:

```
freee_api_get {
  "service": "invoice",
  "path": "/invoices"
}
```

請求書を作成:

```
freee_api_post {
  "service": "invoice",
  "path": "/invoices",
  "body": {
    "company_id": 123456,
    "billing_date": "2025-01-15",
    "partner_id": 789,
    "partner_title": "御中",
    "tax_entry_method": "out",
    "tax_fraction": "omit",
    "withholding_tax_entry_method": "out",
    "lines": [
      {
        "description": "コンサルティング費用",
        "quantity": 1,
        "unit_price": "100000",
        "tax_rate": 10
      }
    ]
  }
}
```

## Tips

### 作成後のWeb確認URL

請求書・見積書・納品書を作成・更新した後、以下のURLでWeb画面から確認できます:

| 種類 | URL形式 |
|------|---------|
| 請求書 | `https://invoice.secure.freee.co.jp/reports/invoices/{id}` |
| 見積書 | `https://invoice.secure.freee.co.jp/reports/quotations/{id}` |
| 納品書 | `https://invoice.secure.freee.co.jp/reports/delivery_slips/{id}` |

`{id}` は API レスポンスで返されるID（`invoice.id`など）を使用します。

例: 請求書ID `49034614` の場合

```
https://invoice.secure.freee.co.jp/reports/invoices/49034614
```

作成完了時にこのURLをユーザーに提示すると、すぐにWeb画面で内容を確認できます。

## リファレンス

詳細なAPIパラメータは以下を参照:

- `references/invoice-invoices.md` - 請求書API
- `references/invoice-quotations.md` - 見積書API
- `references/invoice-delivery-slips.md` - 納品書API
