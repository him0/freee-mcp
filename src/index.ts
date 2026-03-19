import { createAndStartServer } from './mcp/handlers.js';
import { configure } from './cli.js';

const main = async (): Promise<void> => {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const remote = args.includes('--remote');
  const subcommand = args.find((arg) => !arg.startsWith('--'));

  // Handle configure subcommand
  if (subcommand === 'configure') {
    const force = args.includes('--force');
    await configure({ force });
    return;
  }

  // Handle unknown subcommands
  if (subcommand && subcommand !== 'client') {
    console.error(`Unknown subcommand: ${subcommand}`);
    console.error('Usage: freee-mcp [configure] [--force] [--remote]');
    console.error('  configure  - Interactive configuration setup');
    console.error('  --force    - 保存済みのログイン情報をリセットして再設定');
    console.error('  --remote   - remote MCP サーバーとして動作（ファイルアップロード機能を無効化）');
    process.exit(1);
  }

  console.error('Starting freee MCP server');
  await createAndStartServer({ remote });
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});