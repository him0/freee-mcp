# Selectables

## 概要

フォーム用選択項目情報

## エンドポイント一覧

### GET /api/1/forms/selectables

**操作**: フォーム用選択項目情報の取得

**説明**: 概要 指定した事業所のフォーム用選択項目情報を取得する

### パラメータ

| 名前 | 位置 | 必須 | 型 | 説明 |
|------|------|------|-----|------|
| company_id | query | はい | integer(int64) | 事業所ID |
| includes | query | いいえ | string | 取得する項目(項目: account_item) (選択肢: account_item) |

### レスポンス (200)

- **account_categories** (任意): array[object]
  配列の要素:
    - **balance** **(必須)**: string - 収支 (選択肢: expense, income) 例: `expense`
    - **org_code** **(必須)**: string - 事業形態（個人事業主: personal、法人: corporate） (選択肢: personal, corporate) 例: `personal`
    - **role** **(必須)**: string - カテゴリーコード 例: `ex_food`
    - **title** **(必須)**: string - カテゴリー名 例: `飲食費`
    - **desc** (任意): string - カテゴリーの説明 例: `飲食に使用した経費`
    - **account_items** **(必須)**: array[object] - 勘定科目の一覧
- **account_groups** (任意): array[object] - 決算書表示名（小カテゴリー）
  配列の要素:
    - **id** **(必須)**: integer(int64) - 決算書表示名（小カテゴリー）ID 例: `1` (最小: 1)
    - **name** **(必須)**: string - 決算書表示名 例: `預託金`
    - **account_structure_id** **(必須)**: integer(int64) - 年度ID 例: `1` (最小: 1)
    - **account_category_id** **(必須)**: integer(int64) - 勘定科目カテゴリーID 例: `1` (最小: 1)
    - **detail_type** (任意): integer(int64) - 詳細パラメータの種類 例: `1` (最小: 0, 最大: 4)
    - **index** **(必須)**: integer(int64) - 並び順 例: `1`
    - **created_at** (任意): string - 作成日時 例: `2019-12-17T13:47:24+09:00`
    - **updated_at** (任意): string - 更新日時 例: `2019-12-17T13:47:24+09:00`



## 参考情報

- freee API公式ドキュメント: https://developer.freee.co.jp/docs
- OpenAPIスキーマ: [accounting-api-schema.json](../../openapi/accounting-api-schema.json)
