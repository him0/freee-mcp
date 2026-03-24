import { startHttpServer } from './server/http-server.js';

startHttpServer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
