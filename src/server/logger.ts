import { TraceFlags, trace } from '@opentelemetry/api';
import pino from 'pino';
import { APP_NAME, PACKAGE_VERSION } from '../constants.js';
import { serializeErrorChain } from './error-serializer.js';

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
 * Inject trace_id / span_id / trace_sampled from the active OpenTelemetry span.
 *
 * When no span is active (OTel disabled, or code path outside a traced
 * context) the function still returns `trace_sampled: false` so Datadog
 * queries can select "logs whose trace was actually exported" without
 * joining on trace_id presence.
 */
function otelMixin(): Record<string, unknown> {
  const span = trace.getActiveSpan();
  if (!span) {
    return { trace_sampled: false };
  }
  const ctx = span.spanContext();
  return {
    trace_id: ctx.traceId,
    span_id: ctx.spanId,
    trace_sampled: (ctx.traceFlags & TraceFlags.SAMPLED) === TraceFlags.SAMPLED,
  };
}

function resolveOptions(levelOrOptions?: string | LoggerOptions): LoggerOptions {
  if (typeof levelOrOptions === 'string') {
    return { level: levelOrOptions };
  }
  return levelOrOptions ?? {};
}

/**
 * Custom pino err serializer built on `serializeErrorChain`.
 *
 * Produces a shape compatible with pino-std-serializers (`name`/`message`/`stack`)
 * so existing log viewers keep working, while also exposing the full cause
 * chain under `chain` when an error was wrapped via `new Error(msg, { cause })`.
 *
 * All string values are scrubbed of numeric IDs and email addresses before
 * leaving the process.
 */
function errSerializer(value: unknown): Record<string, unknown> {
  const chain = serializeErrorChain(value);
  const top = chain[0] ?? { name: 'Error', message: '' };
  return {
    name: top.name,
    message: top.message,
    stack: top.stack,
    code: top.code,
    chain: chain.length > 1 ? chain : undefined,
  };
}

/**
 * Defense-in-depth redaction paths.
 *
 * The primary privacy defense is the RequestRecorder type system (user-input
 * fields are not even representable). These redact paths catch the handful of
 * remaining stray log calls (lifecycle, error handlers) that might otherwise
 * include secret-bearing fields.
 */
const REDACT_PATHS: string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  '*.password',
  '*.access_token',
  '*.refresh_token',
  '*.token',
  '*.body',
  'req.body',
  '*.args.body',
  '*.args.query',
];

const REDACT_OPTIONS: pino.redactOptions = {
  paths: REDACT_PATHS,
  censor: '[REDACTED]',
  remove: false,
};

/**
 * Emit `level` as a lowercase string label so Datadog's default Status
 * Remapper works without custom pipeline config. Pino's threshold filtering
 * still uses the numeric level internally.
 */
const LEVEL_FORMATTER: NonNullable<pino.LoggerOptions['formatters']>['level'] = (label) => ({
  level: label,
});

function buildBaseOptions(level: string, transportMode: 'stdio' | 'remote'): pino.LoggerOptions {
  return {
    level,
    mixin: otelMixin,
    formatters: { level: LEVEL_FORMATTER },
    serializers: { err: errSerializer },
    redact: REDACT_OPTIONS,
    base: {
      service: APP_NAME,
      version: PACKAGE_VERSION,
      transport_mode: transportMode,
    },
  };
}

export function initLogger(levelOrOptions?: string | LoggerOptions): pino.Logger {
  const options = resolveOptions(levelOrOptions);
  const level = options.level || process.env.LOG_LEVEL || 'info';
  const transportMode = options.transportMode ?? 'stdio';

  _logger = pino(buildBaseOptions(level, transportMode), getStderrDest());

  return _logger;
}

export function getLogger(): pino.Logger {
  if (!_logger) {
    _logger = pino(
      buildBaseOptions(process.env.LOG_LEVEL || 'info', 'stdio'),
      getStderrDest(),
    );
  }
  return _logger;
}

/**
 * Sanitize API path for safe logging.
 * Strips query strings and replaces numeric ID segments with :id.
 */
export function sanitizePath(rawPath: string): string {
  const pathOnly = rawPath.split('?')[0];
  return pathOnly.replace(/\/\d+(?=\/|$)/g, '/:id');
}
