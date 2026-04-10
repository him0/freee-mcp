import { configure } from './cli.js';
import { createAndStartServer } from './mcp/handlers.js';
import { getLogger, initLogger } from './server/logger.js';
import { initUserAgentTransportMode } from './server/user-agent.js';

const main = async (): Promise<void> => {
  initUserAgentTransportMode('stdio');

  const args = process.argv.slice(2);
  const subcommand = args.find((arg) => !arg.startsWith('--'));

  if (subcommand === 'configure') {
    const force = args.includes('--force');
    await configure({ force });
    return;
  }

  if (subcommand && subcommand !== 'client') {
    console.error(`Unknown subcommand: ${subcommand}`);
    console.error('Usage: freee-mcp [configure] [--force]');
    console.error('  configure  - Interactive configuration setup');
    console.error('  --force    - 保存済みのログイン情報をリセットして再設定');
    process.exit(1);
  }

  initLogger({ transportMode: 'stdio' });
  getLogger().info('Starting freee MCP server');
  await createAndStartServer();
};

main().catch((error) => {
  getLogger().fatal({ err: error }, 'Fatal error');
  process.exit(1);
});
