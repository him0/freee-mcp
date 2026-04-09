# 試算表・総勘定元帳の操作

freee会計APIを使った試算表・総勘定元帳の取得ガイド。

## 概要

試算表API・総勘定元帳APIを使って財務レポートを取得します。

## 重要: 未承認仕訳の取り扱いについて（必ず確認）

試算表・総勘定元帳APIを呼び出す前に、必ずユーザーに以下を確認すること:

> 未承認の仕訳（承認待ちの仕訳）を含めた数値を取得しますか？
> デフォルトでは未承認の仕訳は除外されます。未承認仕訳を含めたい場合は `approval_flow_status: "all"` を指定します。
> ※ この設定はプレミアムプラン以上、かつ仕訳承認フローが有効な事業所でのみ利用可能です。

- ユーザーが「含める」と回答した場合: クエリパラメータに `"approval_flow_status": "all"` を追加
- ユーザーが「除外する」（デフォルト）と回答した場合: パラメータ指定不要（デフォルトの `without_in_progress` が適用される）
- ユーザーが判断できない場合: 安全側として `"approval_flow_status": "all"` を指定し、結果に「未承認仕訳を含む数値です」と注記する

この確認はAPI呼び出しの前に毎回行うこと。確認を省略してはならない。

## 利用可能なパス

### 試算表（貸借対照表 / BS）

| パス | 説明 |
|------|------|
| `/api/1/reports/trial_bs` | 貸借対照表 |
| `/api/1/reports/trial_bs_two_years` | 貸借対照表（前年比較） |
| `/api/1/reports/trial_bs_three_years` | 貸借対照表（3期間比較） |

### 試算表（損益計算書 / PL）

| パス | 説明 |
|------|------|
| `/api/1/reports/trial_pl` | 損益計算書 |
| `/api/1/reports/trial_pl_two_years` | 損益計算書（前年比較） |
| `/api/1/reports/trial_pl_three_years` | 損益計算書（3期間比較） |
| `/api/1/reports/trial_pl_sections` | 損益計算書（部門比較） |
| `/api/1/reports/trial_pl_segment_1_tags` | 損益計算書（セグメント1比較） |
| `/api/1/reports/trial_pl_segment_2_tags` | 損益計算書（セグメント2比較） |
| `/api/1/reports/trial_pl_segment_3_tags` | 損益計算書（セグメント3比較） |

### 試算表（製造原価報告書 / CR）

| パス | 説明 |
|------|------|
| `/api/1/reports/trial_cr` | 製造原価報告書 |
| `/api/1/reports/trial_cr_two_years` | 製造原価報告書（前年比較） |
| `/api/1/reports/trial_cr_three_years` | 製造原価報告書（3期間比較） |
| `/api/1/reports/trial_cr_sections` | 製造原価報告書（部門比較） |
| `/api/1/reports/trial_cr_segment_1_tags` | 製造原価報告書（セグメント1比較） |
| `/api/1/reports/trial_cr_segment_2_tags` | 製造原価報告書（セグメント2比較） |
| `/api/1/reports/trial_cr_segment_3_tags` | 製造原価報告書（セグメント3比較） |

### 総勘定元帳

| パス | 説明 |
|------|------|
| `/api/1/reports/general_ledgers` | 総勘定元帳一覧（β版） |

## 使用例

### 損益計算書を取得（未承認仕訳を含む）

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/reports/trial_pl",
  "query": {
    "fiscal_year": 2025,
    "approval_flow_status": "all"
  }
}
```

### 貸借対照表を月指定で取得

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/reports/trial_bs",
  "query": {
    "fiscal_year": 2025,
    "start_month": 1,
    "end_month": 3
  }
}
```

### 損益計算書（前年比較）を取得

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/reports/trial_pl_two_years",
  "query": {
    "fiscal_year": 2025,
    "approval_flow_status": "all"
  }
}
```

### 総勘定元帳を取得

```
freee_api_get {
  "service": "accounting",
  "path": "/api/1/reports/general_ledgers",
  "query": {
    "start_date": "2025-01-01",
    "end_date": "2025-03-31",
    "approval_flow_status": "all"
  }
}
```

## Tips

### up_to_date フラグの確認

レスポンスの `up_to_date` が `false` の場合、集計が完了していない。時間を空けて再取得すること。

### 期間指定の制約

- `start_date` / `end_date` と `fiscal_year` / `start_month` / `end_month` は同時に指定できない
- `partner_code` と `partner_id` は同時に指定できない

### 総勘定元帳の制限

- β版として提供（提供プラン・コール数が予告なく変更される可能性あり）
- 法人アドバンスプラン（および旧法人プロフェッショナルプラン）・法人エンタープライズプラン限定
- `start_date` と `end_date` は必須パラメータ
- 取引数が多い場合はタイムアウトの可能性あり（Web画面のPDF/CSV出力を案内）

### 内訳表示の制限

`breakdown_display_type` で内訳を指定する場合、対象のマスタ（取引先、品目、部門、セグメント）の登録数が5,000以上あるとエラーになる。

## リファレンス

詳細なAPIパラメータは以下を参照:

- `references/accounting-trial-balance.md` - 試算表（BS/PL/CR）全17エンドポイント
- `references/accounting-general-ledgers.md` - 総勘定元帳
