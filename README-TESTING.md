# freee MCP Server 動作確認ガイド

freee MCP Serverの実装したツールの動作確認方法について説明します。

## 🚀 動作確認方法

### 1. 簡易ツール情報確認

```bash
node scripts/test-tools.js
```

- 利用可能なツール一覧を表示
- 主要ツールの存在確認
- Claude Code設定例の表示

### 2. MCP Inspector (推奨)

GUIでツールをテストできる公式ツールです：

```bash
pnpm inspector
```

これにより：
- ブラウザが自動で開きます
- 全てのツールがGUIで表示されます
- パラメータを入力してツールを実行可能
- リアルタイムでレスポンスを確認可能

### 3. 本格的なMCPプロトコルテスト

```bash
node scripts/test-mcp.js
```

- MCP JSON-RPC プロトコル経由でツールをテスト
- インタラクティブモードでツール名を入力してテスト
- 実際のMCPクライアントと同様の動作

## 🔧 主要ツール

### 認証・管理ツール
- `freee_status` - 現在の状態確認
- `freee_auth_status` - 認証状態確認
- `freee_authenticate` - OAuth認証実行
- `freee_list_companies` - 事業所一覧（**修正版・get_companies呼び出し**）
- `freee_set_company` - 事業所設定・切り替え
- `freee_help` - ヘルプ表示

### freee API ツール (自動生成)
- `get_companies` - 事業所一覧取得
- `get_users_me` - ユーザー情報取得
- `get_deals` - 取引一覧取得
- `post_deals` - 取引作成
- その他多数のAPI エンドポイント

## 📋 実際の使用例

### Claude Code での設定

`~/.config/claude-code/claude_code_config.json` に追加：

```json
{
  "mcpServers": {
    "freee": {
      "command": "pnpm",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/Users/him0/src/freee-mcp",
      "env": {
        "FREEE_CLIENT_ID": "your_client_id_here",
        "FREEE_CLIENT_SECRET": "your_client_secret_here",
        "FREEE_COMPANY_ID": "your_company_id_here",
        "FREEE_CALLBACK_PORT": "8080"
      }
    }
  }
}
```

### 基本的な使用フロー

1. **状態確認**: `freee_status`
2. **事業所設定**: `freee_set_company [事業所ID]`
3. **認証実行**: `freee_authenticate`
4. **動作確認**: `freee_current_user`
5. **API使用**: `get_companies`, `get_deals` など

## 🔍 freee_list_companies の動作

修正版では以下の動作になります：

1. **APIコール**: 内部的に `makeApiRequest('GET', '/api/1/companies')` を実行
2. **データ統合**: freee APIからの最新データとローカル設定を統合
3. **フォールバック**: API失敗時はローカル設定を表示
4. **エラーハンドリング**: 認証エラー時は適切なガイダンスを表示

## 🆘 トラブルシューティング

### 認証エラーの場合
```bash
# 現在の状態確認
freee_status

# 認証状態詳細確認
freee_auth_status

# 認証情報クリアして再認証
freee_clear_auth
freee_authenticate
```

### 環境変数が未設定の場合
```bash
export FREEE_CLIENT_ID="your_client_id"
export FREEE_CLIENT_SECRET="your_client_secret"
export FREEE_COMPANY_ID="your_company_id"
```

### MCP Inspector が起動しない場合
```bash
# パッケージの再インストール
pnpm install

# 手動でInspectorを起動
pnpx @modelcontextprotocol/inspector pnpm run start
```

## 📈 テスト結果の例

```
🔧 freee MCP Tools テスト開始

=== 利用可能ツール一覧 ===
🔐 認証・管理ツール:
  • freee_current_user
  • freee_authenticate
  • freee_auth_status
  • freee_list_companies ← 修正済み
  
=== 主要ツール存在確認 ===
✅ freee_status: 登録済み
✅ freee_auth_status: 登録済み  
✅ freee_list_companies: 登録済み
✅ freee_help: 登録済み

🎉 テスト完了
```

これで freee MCP Server のツールが正常に動作することを確認できます。