import pino from 'pino';

export type Logger = pino.Logger;

// Write to stderr (fd 2) to match previous console.error behavior
// and to avoid conflicts with MCP stdio transport on stdout.
const stderrDest = pino.destination(2);

let _logger: pino.Logger | null = null;

export function initLogger(level?: string): pino.Logger {
  _logger = pino({ level: level || process.env.LOG_LEVEL || 'info' }, stderrDest);
  return _logger;
}

export function getLogger(): pino.Logger {
  if (!_logger) {
    _logger = pino({ level: process.env.LOG_LEVEL || 'info' }, stderrDest);
  }
  return _logger;
}
