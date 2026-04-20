import { createRequire } from 'node:module';
import { initTelemetry } from '../telemetry/init.js';

const require = createRequire(import.meta.url);
// ビルド後は bin/freee-sign-remote-mcp.js に配置されるため、package.json は ../package.json
const { version } = require('../package.json') as { version: string };
const otel = initTelemetry(version);

const { getLogger } = await import('../server/logger.js');
const { startSignHttpServer } = await import('./server/sign-http-server.js');

startSignHttpServer({ otelShutdown: otel?.shutdown }).catch((error) => {
  getLogger().fatal({ err: error }, 'Fatal error');
  process.exit(1);
});
