#!/usr/bin/env node

/**
 * MCP Server 動作確認スクリプト
 * freee MCP serverのツールをテストするためのスクリプト
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

// MCP メッセージを送信するヘルパー関数
function sendMcpMessage(process, message) {
  const jsonMessage = JSON.stringify(message);
  console.log(`\n📤 送信: ${jsonMessage}`);
  process.stdin.write(jsonMessage + '\n');
}

// MCP リクエストIDを生成
let requestId = 1;
function getNextRequestId() {
  return requestId++;
}

async function testMcpTools() {
  console.log('🚀 freee MCP Server 動作確認を開始します...\n');

  // MCP serverプロセスを起動
  const mcpProcess = spawn('pnpm', ['tsx', 'src/index.ts'], {
    stdio: 'pipe',
    cwd: process.cwd()
  });

  // 標準出力の監視
  mcpProcess.stdout.on('data', (data) => {
    console.log(`📥 受信: ${data.toString().trim()}`);
  });

  // 標準エラー出力の監視（ログ用）
  mcpProcess.stderr.on('data', (data) => {
    console.log(`📋 ログ: ${data.toString().trim()}`);
  });

  // プロセス終了時の処理
  mcpProcess.on('exit', (code) => {
    console.log(`\n🏁 MCP Server プロセスが終了しました (コード: ${code})`);
  });

  // 少し待ってからテスト開始
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n=== MCP 初期化テスト ===');

  // 1. Initialize request
  sendMcpMessage(mcpProcess, {
    jsonrpc: '2.0',
    id: getNextRequestId(),
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'freee-mcp-test-client',
        version: '1.0.0'
      }
    }
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. List tools
  console.log('\n=== 利用可能ツール一覧取得 ===');
  sendMcpMessage(mcpProcess, {
    jsonrpc: '2.0',
    id: getNextRequestId(),
    method: 'tools/list',
    params: {}
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 3. Test freee_status tool
  console.log('\n=== freee_status ツールテスト ===');
  sendMcpMessage(mcpProcess, {
    jsonrpc: '2.0',
    id: getNextRequestId(),
    method: 'tools/call',
    params: {
      name: 'freee_status',
      arguments: {}
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. Test freee_list_companies tool
  console.log('\n=== freee_list_companies ツールテスト ===');
  sendMcpMessage(mcpProcess, {
    jsonrpc: '2.0',
    id: getNextRequestId(),
    method: 'tools/call',
    params: {
      name: 'freee_list_companies',
      arguments: {}
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 5. Test freee_auth_status tool
  console.log('\n=== freee_auth_status ツールテスト ===');
  sendMcpMessage(mcpProcess, {
    jsonrpc: '2.0',
    id: getNextRequestId(),
    method: 'tools/call',
    params: {
      name: 'freee_auth_status',
      arguments: {}
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 6. Test freee_help tool
  console.log('\n=== freee_help ツールテスト ===');
  sendMcpMessage(mcpProcess, {
    jsonrpc: '2.0',
    id: getNextRequestId(),
    method: 'tools/call',
    params: {
      name: 'freee_help',
      arguments: {}
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // インタラクティブモード
  console.log('\n=== インタラクティブモード ===');
  console.log('ツール名を入力してテストしてください（例: freee_current_user）');
  console.log('終了するには "exit" と入力してください\n');

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askForTool = () => {
    rl.question('ツール名を入力 > ', (toolName) => {
      if (toolName.toLowerCase() === 'exit') {
        console.log('\n👋 テスト終了');
        mcpProcess.kill();
        rl.close();
        process.exit(0);
      }

      if (toolName.trim()) {
        console.log(`\n=== ${toolName} ツールテスト ===`);
        sendMcpMessage(mcpProcess, {
          jsonrpc: '2.0',
          id: getNextRequestId(),
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: {}
          }
        });
        
        setTimeout(() => {
          askForTool();
        }, 2000);
      } else {
        askForTool();
      }
    });
  };

  askForTool();
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error('❌ 未処理の例外:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未処理のPromise拒否:', reason);
});

// テスト開始
testMcpTools().catch(console.error);