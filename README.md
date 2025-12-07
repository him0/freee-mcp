# @him0/freee-mcp

freee API を Claude から使えるようにする MCP サーバー & Claude Plugin です。

[![npm version](https://badge.fury.io/js/@him0%2Ffreee-mcp.svg)](https://www.npmjs.com/package/@him0/freee-mcp)

## 特徴

- **MCP サーバー**: freee API を Claude Desktop / Claude Code から直接呼び出し
- **Claude Plugin**: 62個の API リファレンスドキュメント付きスキルを提供
- **複数 API 対応**: 会計・人事労務・請求書・工数管理の4つの freee API をサポート
- **OAuth 2.0 + PKCE**: セキュアな認証フロー、トークン自動更新
- **複数事業所対応**: 事業所の動的切り替えが可能

## クイックスタート

### 1. freee アプリケーションの登録

[freee アプリストア](https://app.secure.freee.co.jp/developers) で新しいアプリを作成:
- **リダイレクトURI**: `http://127.0.0.1:54321/callback`
- **Client ID** と **Client Secret** を取得
- 必要な権限にチェック

### 2. セットアップ

```bash
npx @him0/freee-mcp configure
```

対話式ウィザードが認証情報の設定、OAuth認証、事業所選択を行います。

### 3. Claude Desktop に追加

`configure` が出力する設定を Claude Desktop の設定ファイルに追加:

| OS | 設定ファイルパス |
|----|-----------------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "freee": {
      "command": "npx",
      "args": ["@him0/freee-mcp"]
    }
  }
}
```

## Claude Plugin として使う

Claude Code でプラグインとしてインストールすると、API リファレンス付きのスキルが利用できます:

```bash
claude plugin add him0/freee-mcp
```

### 含まれるリファレンス

| API | 内容 | ファイル数 |
|-----|------|-----------|
| 会計 | 取引、勘定科目、取引先、請求書、経費申請など | 31 |
| 人事労務 | 従業員、勤怠、給与明細、年末調整など | 27 |
| 請求書 | 請求書、見積書、納品書 | 3 |
| 工数管理 | ユーザー情報 | 1 |

Claude との会話中に API の使い方を質問すると、これらのリファレンスを参照して正確な情報を提供します。

## 利用可能なツール

### 管理ツール

| ツール | 説明 |
|--------|------|
| `freee_authenticate` | OAuth 認証を実行 |
| `freee_auth_status` | 認証状態を確認 |
| `freee_set_company` | 事業所を切り替え |
| `freee_list_companies` | 事業所一覧を取得 |
| `freee_help` | 使い方ガイド |
| `freee_status` | 現在の状態と推奨アクション |

### API ツール（クライアントモード）

HTTPメソッドごとのシンプルなツール構成:

| ツール | 説明 | 例 |
|--------|------|-----|
| `freee_api_get` | データ取得 | `/api/1/deals` |
| `freee_api_post` | 新規作成 | `/api/1/deals` |
| `freee_api_put` | 更新 | `/api/1/deals/123` |
| `freee_api_delete` | 削除 | `/api/1/deals/123` |
| `freee_api_patch` | 部分更新 | `/api/1/deals/123` |
| `freee_api_list_paths` | エンドポイント一覧 | - |

パスは OpenAPI スキーマに対して自動検証されます。

## 開発者向け

```bash
git clone https://github.com/him0/freee-mcp.git
cd freee-mcp
pnpm install

pnpm dev           # 開発サーバー（ウォッチモード）
pnpm build         # ビルド
pnpm type-check    # 型チェック
pnpm lint          # リント
pnpm test:run      # テスト

# API リファレンスの再生成
pnpm generate:references
```

### 技術スタック

TypeScript / Model Context Protocol SDK / OAuth 2.0 + PKCE / Zod / esbuild

## ライセンス

ISC

## 関連リンク

- [freee API ドキュメント](https://developer.freee.co.jp/docs)
- [Model Context Protocol](https://modelcontextprotocol.io)
