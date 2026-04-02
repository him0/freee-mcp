import { trace } from '@opentelemetry/api';
import pino from 'pino';
import { APP_NAME, PACKAGE_VERSION } from '../constants.js';

export type Logger = pino.Logger;

export interface LoggerOptions {
  level?: string;
  transportMode?: 'stdio' | 'remote';
}

let _logger: pino.Logger | null = null;
let _stderrDest: pino.DestinationStream | null = null;

function getStderrDest(): pino.DestinationStream {
  if (!_stderrDest) {
    _stderrDest = pino.destination(2);
  }
  return _stderrDest;
}

/**
 * Inject trace_id / span_id from the active OpenTelemetry span.
 * Returns an empty object when no span is active (OTel disabled).
 */
function otelMixin(): Record<string, string> {
  const span = trace.getActiveSpan();
  if (!span) return {};
  const ctx = span.spanContext();
  return {
    trace_id: ctx.traceId,
    span_id: ctx.spanId,
  };
}

function resolveOptions(levelOrOptions?: string | LoggerOptions): LoggerOptions {
  if (typeof levelOrOptions === 'string') {
    return { level: levelOrOptions };
  }
  return levelOrOptions ?? {};
}

export function initLogger(levelOrOptions?: string | LoggerOptions): pino.Logger {
  const options = resolveOptions(levelOrOptions);
  const level = options.level || process.env.LOG_LEVEL || 'info';
  const transportMode = options.transportMode ?? 'stdio';

  const baseOptions: pino.LoggerOptions = {
    level,
    mixin: otelMixin,
    base: {
      service: APP_NAME,
      version: PACKAGE_VERSION,
      transport_mode: transportMode,
    },
  };

  _logger = pino(baseOptions, getStderrDest());

  return _logger;
}

export function getLogger(): pino.Logger {
  if (!_logger) {
    _logger = pino(
      {
        level: process.env.LOG_LEVEL || 'info',
        mixin: otelMixin,
        base: {
          service: APP_NAME,
          version: PACKAGE_VERSION,
          transport_mode: 'stdio',
        },
      },
      getStderrDest(),
    );
  }
  return _logger;
}

/**
 * Create a lazily-initialized child logger.
 * The child is created on first call and reused thereafter,
 * avoiding repeated .child() allocations on every invocation.
 */
export function createChildLogger(bindings: Record<string, unknown>): () => pino.Logger {
  let child: pino.Logger | null = null;
  return () => {
    if (!child) {
      child = getLogger().child(bindings);
    }
    return child;
  };
}

/**
 * Sanitize API path for safe logging.
 * Strips query strings and replaces numeric ID segments with :id.
 */
export function sanitizePath(rawPath: string): string {
  const pathOnly = rawPath.split('?')[0];
  return pathOnly.replace(/\/\d+(?=\/|$)/g, '/:id');
}
