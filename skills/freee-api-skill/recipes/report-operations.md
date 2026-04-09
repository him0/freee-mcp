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

この確認は初回のAPI呼び出し前に必ず行うこと。セッション内でユーザーの方針が決まったら、以降は同じ方針に従う。

## 利用可能なパス

- 試算表（BS/PL/CR）: `references/accounting-trial-balance.md` 参照
- 総勘定元帳: `references/accounting-general-ledgers.md` 参照

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

## リファレンス

詳細なパス一覧・パラメータ・レスポンス仕様は以下を参照:

- `references/accounting-trial-balance.md` - 試算表（BS/PL/CR）全17エンドポイント
- `references/accounting-general-ledgers.md` - 総勘定元帳
