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
    - **リダイレクトURI**: `http://127.0.0.1:8080/callback` （デフォルトポート、環境変数で変更可能）
    - アプリケーションの **Client ID** と **Client Secret** を取得
    - **権限設定**: 必要な機能の 参照・更新 にチェックを入れる


2. **環境変数の設定**:
   ```bash
   FREEE_CLIENT_ID=your_client_id          # 必須: freeeアプリの Client ID
   FREEE_CLIENT_SECRET=your_client_secret  # 必須: freeeアプリの Client Secret
   FREEE_COMPANY_ID=your_company_id        # 必須: デフォルト事業所ID
   FREEE_CALLBACK_PORT=8080                # オプション: OAuthコールバックポート、デフォルトは 8080
   ```

   **注意**: `FREEE_COMPANY_ID` はデフォルト事業所として使用されます。実行時に `freee_set_company` ツールで他の事業所に切り替えることができます。

3. **認証方法**:
   初回API使用時またはトークンの有効期限切れ時に、`freee_authenticate` ツールを使用して認証を行います。一度認証すると、同じトークンで複数の事業所にアクセスできます。

### 認証の仕組み

1. **永続コールバックサーバー**: MCPサーバー起動時に指定ポート（デフォルト8080）でOAuthコールバック受付サーバーが起動します
2. **認証フロー**: `freee_authenticate` ツール実行時にブラウザで認証ページが開き、認証後にコールバックを受信します
3. **トークン保存**: 認証後、トークンは `~/.config/freee-mcp/tokens.json` にユーザーベースで安全に保存されます（ファイル権限600）
4. **自動更新**: アクセストークンの有効期限が切れた場合、リフレッシュトークンを使用して自動的に更新されます
5. **タイムアウト**: 認証リクエストは5分でタイムアウトします

### ツールフィルタリング (オプション)

デフォルトではすべてのツールが有効化されますが、環境変数を使用して特定のツールのみを有効化・無効化できます。セキュリティ上の理由で書き込み系操作を制限したい場合などに便利です。

#### 操作タイプによるフィルタリング

```bash
FREEE_ENABLE_READ=true         # GET系ツール (デフォルト: true)
FREEE_ENABLE_WRITE=true        # POST/PUT系ツール (デフォルト: true)
FREEE_ENABLE_DELETE=false      # DELETE系ツール (デフォルト: false)
```

**例: 読み取り専用モード**
```json
{
  "mcpServers": {
    "freee": {
      "env": {
        "FREEE_CLIENT_ID": "your_client_id",
        "FREEE_CLIENT_SECRET": "your_client_secret",
        "FREEE_COMPANY_ID": "your_company_id",
        "FREEE_ENABLE_WRITE": "false",
        "FREEE_ENABLE_DELETE": "false"
      }
    }
  }
}
```

#### リソースカテゴリによるフィルタリング

特定のリソース（deals, companies など）のみを有効化:

```bash
FREEE_ENABLED_RESOURCES="deals,companies,users"
```

**例: 取引と事業所のみ**
```json
{
  "env": {
    "FREEE_ENABLED_RESOURCES": "deals,companies"
  }
}
```

#### 個別ツール制御

##### ホワイトリスト（指定したツールのみ有効化）

```bash
FREEE_ENABLED_TOOLS="get_deals,post_deals,get_companies"
```

##### ブラックリスト（指定したツールを無効化）

ワイルドカード `*` もサポート:

```bash
FREEE_DISABLED_TOOLS="delete_*,put_*_by_id"
```

**例: 削除系を全て無効化**
```json
{
  "env": {
    "FREEE_DISABLED_TOOLS": "delete_*"
  }
}
```

#### フィルタの優先順位

設定の優先順位は以下の通りです（上ほど優先度が高い）:

1. `FREEE_ENABLED_TOOLS` (ホワイトリスト) - 最優先
2. `FREEE_DISABLED_TOOLS` (ブラックリスト)
3. `FREEE_ENABLE_READ/WRITE/DELETE` (操作タイプフィルタ)
4. `FREEE_ENABLED_RESOURCES` (リソースフィルタ)

**複合例:**
```json
{
  "env": {
    "FREEE_ENABLE_WRITE": "true",
    "FREEE_ENABLE_DELETE": "false",
    "FREEE_ENABLED_RESOURCES": "deals,companies",
    "FREEE_DISABLED_TOOLS": "post_deals"
  }
}
```

この設定では:
- deals と companies のみ有効
- 書き込み操作は許可
- 削除操作は禁止
- ただし post_deals は明示的に無効化

## 使用方法

### 単体実行

```bash
npx @him0/freee-mcp
```

### インストール後の実行

```bash
# グローバルインストール
npm install -g @him0/freee-mcp
freee-mcp

# または
npx freee-mcp
```

### MCPサーバーとしての登録

Claude デスクトップアプリケーションで使用するには、以下の設定を `~/Library/Application Support/Claude/claude_desktop_config.json` に追加してください:

```json
{
  "mcpServers": {
    "freee": {
      "command": "npx",
      "args": ["@him0/freee-mcp"],
      "env": {
        "FREEE_CLIENT_ID": "your_client_id",
        "FREEE_CLIENT_SECRET": "your_client_secret",
        "FREEE_COMPANY_ID": "your_company_id",
        "FREEE_CALLBACK_PORT": "8080"
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

freee APIのすべてのエンドポイントがMCPツールとして自動的に公開されます。各ツールは以下の命名規則に従います:

- GET: `get_[resource_name]`
- POST: `post_[resource_name]`
- PUT: `put_[resource_name]_by_id`
- DELETE: `delete_[resource_name]_by_id`

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
