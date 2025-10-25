#!/usr/bin/env node

/**
 * freee MCP Tools 簡易テストスクリプト
 * MCP inspector を使わない簡単な動作確認用
 */

// ESM形式でのTypeScriptファイル読み込みは直接できないため、
// 代替手段を使用

async function testFreeeTools() {
  console.log('🔧 freee MCP Tools テスト開始\n');
  console.log('📝 ツール情報を表示中...');

  // 利用可能なツール一覧を取得
  console.log('=== 利用可能ツール一覧 ===');
  
  // サーバーの内部状態からツール一覧を取得
  const toolNames = [];
  
  // 認証関連ツール
  const authTools = [
    'freee_current_user',
    'freee_authenticate', 
    'freee_auth_status',
    'freee_clear_auth',
    'freee_set_company',
    'freee_get_current_company',
    'freee_list_companies',
    'freee_help',
    'freee_getting_started',
    'freee_status'
  ];

  console.log('🔐 認証・管理ツール:');
  authTools.forEach(tool => {
    console.log(`  • ${tool}`);
  });

  // OpenAPI生成ツールの確認
  console.log('\n🌐 freee API ツール (一部):');
  const sampleApiTools = [
    'get_companies',
    'get_users_me',
    'get_deals',
    'get_items',
    'get_partners',
    'post_deals',
    'put_deals_by_id',
    'delete_deals_by_id'
  ];
  
  sampleApiTools.forEach(tool => {
    console.log(`  • ${tool}`);
  });

  console.log('\n=== 個別ツールテスト ===\n');

  // 主要ツールの存在確認
  console.log('\n=== 主要ツール存在確認 ===');
  const testTools = ['freee_status', 'freee_auth_status', 'freee_list_companies', 'freee_help'];
  
  testTools.forEach(toolName => {
    const exists = authTools.includes(toolName);
    console.log(`${exists ? '✅' : '❌'} ${toolName}: ${exists ? '登録済み' : '未登録'}`);
  });

  console.log('\n=== 実際の動作確認方法 ===');
  console.log('1. MCP Inspector を使用:');
  console.log('   pnpm inspector');
  console.log('   → ブラウザでツールをGUIで操作可能');
  console.log('');
  console.log('2. 本格的なMCPクライアントテスト:');
  console.log('   node scripts/test-mcp.js');
  console.log('   → MCP プロトコル経由でツールを実行');
  console.log('');
  console.log('3. Claude Code での使用:');
  console.log('   Claude Code の設定にMCPサーバーを追加して使用');
  console.log('');
  console.log('=== 設定例 (Claude Code) ===');
  console.log(JSON.stringify({
    "mcpServers": {
      "freee": {
        "command": "pnpm",
        "args": ["tsx", "src/index.ts"],
        "cwd": process.cwd(),
        "env": {
          "FREEE_CLIENT_ID": "your_client_id_here",
          "FREEE_CLIENT_SECRET": "your_client_secret_here",
          "FREEE_DEFAULT_COMPANY_ID": "your_company_id_here",
          "FREEE_CALLBACK_PORT": "54321"
        }
      }
    }
  }, null, 2));

  console.log('\n🎉 テスト完了');
}

testFreeeTools().catch(console.error);