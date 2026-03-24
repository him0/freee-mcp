import pino from 'pino';

export type Logger = pino.Logger;

let _logger: pino.Logger | null = null;
let _stderrDest: pino.DestinationStream | null = null;

function getStderrDest(): pino.DestinationStream {
  if (!_stderrDest) {
    _stderrDest = pino.destination(2);
  }
  return _stderrDest;
}

export function initLogger(level?: string): pino.Logger {
  _logger = pino({ level: level || process.env.LOG_LEVEL || 'info' }, getStderrDest());
  return _logger;
}

export function getLogger(): pino.Logger {
  if (!_logger) {
    _logger = pino({ level: process.env.LOG_LEVEL || 'info' }, getStderrDest());
  }
  return _logger;
}
