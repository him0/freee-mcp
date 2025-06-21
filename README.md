# freee-mcp

freee APIをModel Context Protocol (MCP)サーバーとして提供する実装です。OpenAPI定義を使用して、freee APIのエンドポイントを自動的にMCPツールとして公開します。

⚠️ **注意**: このプロジェクトは開発中であり、予期せぬ不具合が発生する可能性があります。問題を発見された場合は、Issueとして報告していただけると幸いです。また、改善のためのプルリクエストも歓迎しています。

## 概要

このプロジェクトは以下の機能を提供します:

- freee APIのエンドポイントをMCPツールとして自動公開
- OAuth 2.0 + PKCE認証による安全なAPI接続
- 永続コールバックサーバーによる認証フロー
- 自動トークン管理（保存・更新・有効期限チェック）
- APIリクエストの自動バリデーション（Zod使用）
- エラーハンドリングとレスポンス整形

## 必要要件

- Node.js v22
- pnpm

## インストール

```bash
git clone [repository-url]
cd freee-mcp
pnpm install
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
   FREEE_COMPANY_ID=your_company_id        # 必須: 会社ID
   FREEE_CALLBACK_PORT=8080                # オプション: OAuthコールバックポート、デフォルトは 8080
   ```

3. **認証方法**:
   初回API使用時またはトークンの有効期限切れ時に、`freee_authenticate` ツールを使用して認証を行います。

### 認証の仕組み

1. **永続コールバックサーバー**: MCPサーバー起動時に指定ポート（デフォルト8080）でOAuthコールバック受付サーバーが起動します
2. **認証フロー**: `freee_authenticate` ツール実行時にブラウザで認証ページが開き、認証後にコールバックを受信します
3. **トークン保存**: 認証後、トークンは `~/.config/freee-mcp/tokens.json` に安全に保存されます（ファイル権限600）
4. **自動更新**: アクセストークンの有効期限が切れた場合、リフレッシュトークンを使用して自動的に更新されます
5. **タイムアウト**: 認証リクエストは5分でタイムアウトします

## 開発

```bash
# 開発サーバーの起動(ウォッチモード)
pnpm dev

# ビルド
pnpm build

# 型チェック
pnpm type-check

# リント
pnpm lint

# フォーマット
pnpm format
```

## 使用方法

ビルド後、以下のコマンドでサーバーを起動できます:

```bash
pnpm start
```

### MCPサーバーとしての登録

Claude デスクトップアプリケーションで使用するには、以下の設定を `~/Library/Application Support/Claude/claude_desktop_config.json` に追加してください:

```json
{
  "mcpServers": {
    "freee": {
      "command": "/usr/local/bin/node",
      "args": ["/path/to/freee-mcp/dist/index.cjs"],
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

## 利用可能なツール

### 認証管理ツール

- **`freee_current_user`**: 現在のユーザー情報を取得します。認証状態、設定されている会社ID、ユーザー詳細が含まれます
- **`freee_authenticate`**: OAuth認証を開始します。永続コールバックサーバーを利用してブラウザで認証を行います
- **`freee_auth_status`**: 認証状態を確認します。保存されているトークンの有効期限やスコープ情報を表示します
- **`freee_clear_auth`**: 認証情報をクリアします。次回API使用時に再認証が必要になります

### freee APIツール

freee APIのすべてのエンドポイントがMCPツールとして自動的に公開されます

各ツールは以下の命名規則に従います:

- GET: `get_[resource_name]`
- POST: `post_[resource_name]`
- PUT: `put_[resource_name]_by_id`
- DELETE: `delete_[resource_name]_by_id`

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
