import { createRequire } from 'node:module';
import { initTelemetry } from './telemetry/init.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };
const otel = initTelemetry(version);

const { getLogger } = await import('./server/logger.js');
const { startHttpServer } = await import('./server/http-server.js');

startHttpServer({ otelShutdown: otel?.shutdown }).catch((error) => {
  getLogger().fatal({ err: error }, 'Fatal error');
  process.exit(1);
});
