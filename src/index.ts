import { createAndStartServer } from './mcp/handlers.js';

const main = async (): Promise<void> => {
  await createAndStartServer();
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});