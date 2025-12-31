import { createAndStartServer } from './mcp/handlers.js';
import { setMode } from './config.js';
import { configure } from './cli.js';

const main = async (): Promise<void> => {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const subcommand = args[0];

  // Handle configure subcommand
  if (subcommand === 'configure') {
    await configure();
    return;
  }

  // Set mode based on subcommand
  if (subcommand === 'client') {
    setMode(true);
    console.error('Starting freee MCP server in client mode (HTTP method sub-commands)');
  } else if (subcommand === 'api' || !subcommand) {
    setMode(false);
    console.error('Starting freee MCP server in API mode (individual tools per endpoint)');
  } else {
    console.error(`Unknown subcommand: ${subcommand}`);
    console.error('Usage: freee-mcp [configure|client|api]');
    console.error('  configure - Interactive configuration setup');
    console.error('  client    - Use HTTP method sub-commands (freee_api_get, freee_api_post, etc.)');
    console.error('  api       - Use individual tools per endpoint (get_deals, post_deals, etc.) [default]');
    process.exit(1);
  }

  await createAndStartServer();
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});