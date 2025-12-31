import { createAndStartServer } from './mcp/handlers.js';
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

  // Handle unknown subcommands
  if (subcommand && subcommand !== 'client') {
    console.error(`Unknown subcommand: ${subcommand}`);
    console.error('Usage: freee-mcp [configure]');
    console.error('  configure - Interactive configuration setup');
    process.exit(1);
  }

  console.error('Starting freee MCP server');
  await createAndStartServer();
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});