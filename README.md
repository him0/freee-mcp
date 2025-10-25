# @him0/freee-mcp

freee APIをModel Context Protocol (MCP)サーバーとして提供する実装です。OpenAPI定義を使用して、freee APIのエンドポイントを自動的にMCPツールとして公開します。

⚠️ **注意**: このプロジェクトは開発中であり、予期せぬ不具合が発生する可能性があります。問題を発見された場合は、Issueとして報告していただけると幸いです。また、改善のためのプルリクエストも歓迎しています。

## 概要

このプロジェクトは以下の機能を提供します:

- freee APIのエンドポイントをMCPツールとして自動公開
- OAuth 2.0 + PKCE認証による安全なAPI接続
- 永続コールバックサーバーによる認証フロー
- **複数事業所対応**: 同一ユーザーでの複数事業所への動的切り替え
- 自動トークン管理（保存・更新・有効期限チェック）
- APIリクエストの自動バリデーション（Zod使用）
- エラーハンドリングとレスポンス整形

## 必要要件

- Node.js v22+

## インストール

```bash
npx @him0/freee-mcp
```

または、プロジェクトに追加する場合：

```bash
npm install @him0/freee-mcp
# または
pnpm add @him0/freee-mcp
```

## 環境設定

### OAuth 2.0 認証

OAuth 2.0 + PKCE フローを使用した認証が必要です。以下の手順で設定してください:

1. **freee側でのアプリケーション登録**:
  - [freee アプリストア](https://app.secure.freee.co.jp/developers) にアクセス
  - 新しいアプリケーションを作成
  - 以下の設定を行う:
    - **リダイレクトURI**: `http://127.0.0.1:54321/callback` （デフォルトポート、環境変数で変更可能）
    - アプリケーションの **Client ID** と **Client Secret** を取得
    - **権限設定**: 必要な機能の 参照・更新 にチェックを入れる


2. **環境変数の設定**:
   ```bash
   FREEE_CLIENT_ID=your_client_id          # 必須: freeeアプリの Client ID
   FREEE_CLIENT_SECRET=your_client_secret  # 必須: freeeアプリの Client Secret
   FREEE_COMPANY_ID=your_company_id        # 必須: デフォルト事業所ID
   FREEE_CALLBACK_PORT=54321               # オプション: OAuthコールバックポート、デフォルトは 54321
   ```

   **注意**: `FREEE_COMPANY_ID` はデフォルト事業所として使用されます。実行時に `freee_set_company` ツールで他の事業所に切り替えることができます。

3. **認証方法**:
   初回API使用時またはトークンの有効期限切れ時に、`freee_authenticate` ツールを使用して認証を行います。一度認証すると、同じトークンで複数の事業所にアクセスできます。

### 認証の仕組み

1. **永続コールバックサーバー**: MCPサーバー起動時に指定ポート（デフォルト54321）でOAuthコールバック受付サーバーが起動します
2. **認証フロー**: `freee_authenticate` ツール実行時にブラウザで認証ページが開き、認証後にコールバックを受信します
3. **トークン保存**: 認証後、トークンは `~/.config/freee-mcp/tokens.json` にユーザーベースで安全に保存されます（ファイル権限600）
4. **自動更新**: アクセストークンの有効期限が切れた場合、リフレッシュトークンを使用して自動的に更新されます
5. **タイムアウト**: 認証リクエストは5分でタイムアウトします

## 使用方法

### 起動モードの選択

freee-mcp は2つのモードで起動できます：

```bash
# クライアントモード（推奨）：HTTPメソッド別の6ツール
npx @him0/freee-mcp client

# APIモード（デフォルト）：エンドポイントごとの個別ツール
npx @him0/freee-mcp api
# または
npx @him0/freee-mcp
```

### インストール後の実行

```bash
# グローバルインストール
npm install -g @him0/freee-mcp

# クライアントモードで起動
freee-mcp client

# APIモードで起動
freee-mcp api
```

### MCPサーバーとしての登録

Claude デスクトップアプリケーションで使用するには、以下の設定を `~/Library/Application Support/Claude/claude_desktop_config.json` に追加してください:

**クライアントモード（推奨）**:
```json
{
  "mcpServers": {
    "freee": {
      "command": "npx",
      "args": ["@him0/freee-mcp", "client"],
      "env": {
        "FREEE_CLIENT_ID": "your_client_id",
        "FREEE_CLIENT_SECRET": "your_client_secret",
        "FREEE_COMPANY_ID": "your_company_id",
        "FREEE_CALLBACK_PORT": "54321"
      }
    }
  }
}
```

**APIモード（個別ツール）**:
```json
{
  "mcpServers": {
    "freee": {
      "command": "npx",
      "args": ["@him0/freee-mcp", "api"],
      "env": {
        "FREEE_CLIENT_ID": "your_client_id",
        "FREEE_CLIENT_SECRET": "your_client_secret",
        "FREEE_COMPANY_ID": "your_company_id",
        "FREEE_CALLBACK_PORT": "54321"
      }
    }
  }
}
```

VSCode拡張機能で使用する場合は、同様の設定を `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` に追加してください。

## 開発者向け

開発に参加する場合は、以下のようにソースからビルドできます：

```bash
git clone https://github.com/him0/freee-mcp.git
cd freee-mcp
pnpm install

# 開発サーバーの起動(ウォッチモード)
pnpm dev

# ビルド
pnpm build

# 型チェック
pnpm type-check

# リント
pnpm lint
```

## 利用可能なツール

### 主要なMCPツール

- **認証管理**: `freee_authenticate`, `freee_auth_status`, `freee_clear_auth`, `freee_current_user`
- **事業所管理**: `freee_set_company`, `freee_get_current_company`, `freee_list_companies`
- **ガイダンス**: `freee_help`, `freee_getting_started`, `freee_status`

### freee APIツール

#### APIクライアントモード（推奨）

`freee-mcp client` で起動すると、HTTPメソッドごとのサブコマンドツールでAPIにアクセスできます。この方式はコンテキストウィンドウを節約し、大規模言語モデルとの親和性が高いです。

APIクライアントモードでは、以下の6つのツールが利用可能です：

- **`freee_api_get`**: GETリクエスト（データ取得）
  - パラメータ:
    - `path`: APIパス（例: `/api/1/deals`, `/api/1/deals/123`）
    - `query`: クエリパラメータ（オプション）

- **`freee_api_post`**: POSTリクエスト（新規作成）
  - パラメータ:
    - `path`: APIパス（例: `/api/1/deals`）
    - `body`: リクエストボディ
    - `query`: クエリパラメータ（オプション）

- **`freee_api_put`**: PUTリクエスト（更新）
  - パラメータ:
    - `path`: APIパス（例: `/api/1/deals/123`）
    - `body`: リクエストボディ
    - `query`: クエリパラメータ（オプション）

- **`freee_api_delete`**: DELETEリクエスト（削除）
  - パラメータ:
    - `path`: APIパス（例: `/api/1/deals/123`）
    - `query`: クエリパラメータ（オプション）

- **`freee_api_patch`**: PATCHリクエスト（部分更新）
  - パラメータ:
    - `path`: APIパス（例: `/api/1/deals/123`）
    - `body`: リクエストボディ
    - `query`: クエリパラメータ（オプション）

- **`freee_api_list_paths`**: 利用可能なすべてのAPIエンドポイント一覧

すべてのツールでパスはOpenAPIスキーマに対して自動検証されます。

使用例:
```json
// GETリクエスト
freee_api_get { "path": "/api/1/deals", "query": { "limit": 10 } }

// POSTリクエスト
freee_api_post {
  "path": "/api/1/deals",
  "body": { "issue_date": "2024-01-01", "type": "income", ... }
}
```

#### 個別ツールモード

`freee-mcp api`（またはデフォルト）で起動すると、freee APIのすべてのエンドポイントが個別のMCPツールとして公開されます。各ツールは以下の命名規則に従います:

- GET: `get_[resource_name]`
- POST: `post_[resource_name]`
- PUT: `put_[resource_name]_by_id`
- DELETE: `delete_[resource_name]_by_id`

**注意**: 個別ツールモードでは多数のツールが生成されるため、LLMのコンテキストウィンドウを圧迫する可能性があります。大規模なAPIを扱う場合はクライアントモードの使用を推奨します。

#### モード比較

| 項目 | クライアントモード | 個別ツールモード |
|------|-------------------|-----------------|
| ツール数 | 6個（GET/POST/PUT/DELETE/PATCH + list_paths） | 数百個（各エンドポイントごと） |
| コンテキスト使用量 | 低 | 高 |
| 柔軟性 | 高（任意のパスを指定可能） | 中（定義済みエンドポイントのみ） |
| パス検証 | あり（OpenAPIスキーマ） | あり（型定義） |
| 推奨用途 | 大規模API、探索的利用 | 特定エンドポイントの頻繁な利用 |

## 使い方

### 初回セットアップ

```bash
# 1. 使い方ガイドを確認
freee_help

# 2. 初回セットアップガイド
freee_getting_started

# 3. 現在の状態確認
freee_status
```

### 基本的なワークフロー

1. **事業所設定**: `freee_set_company [事業所ID]`
2. **認証**: `freee_authenticate`
3. **API使用**: `get_deals`, `freee_current_user` など

詳細な使用方法、事業所切り替え、トラブルシューティングについては、MCPツール内のガイダンス機能をご利用ください：

- `freee_help` - 全体的な使い方とワークフロー
- `freee_getting_started` - 初回セットアップの詳細ガイド
- `freee_status` - 現在の状態と推奨アクション

## 技術スタック

- TypeScript
- Model Context Protocol SDK
- OAuth 2.0 + PKCE認証
- Zod（バリデーション）
- esbuild（ビルド）
- Node.js HTTP server（OAuth コールバック）

## ライセンス

ISC

## 関連リンク

- [freee API ドキュメント](https://developer.freee.co.jp/docs)
- [Model Context Protocol](https://github.com/modelcontextprotocol)
