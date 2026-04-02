import { SpanKind, SpanStatusCode, context, propagation, trace } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  AlwaysOnSampler,
  BasicTracerProvider,
  BatchSpanProcessor,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';

let _enabled = false;

/**
 * Check whether OpenTelemetry tracing is currently active.
 */
export function isOtelEnabled(): boolean {
  return _enabled;
}

const SENSITIVE_PARAMS = new Set([
  'code',
  'code_verifier',
  'token',
  'access_token',
  'refresh_token',
]);

/**
 * Strip sensitive query parameters from a URL string for safe logging/tracing.
 */
export function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (SENSITIVE_PARAMS.has(key)) {
        parsed.searchParams.set(key, '[REDACTED]');
      }
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Wrap a fetch call with an HTTP client span and W3C traceparent propagation.
 */
export function instrumentedFetch(
  originalFetch: typeof fetch,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const tracer = trace.getTracer('freee-mcp');

  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const method =
    init?.method ?? (input instanceof Request ? input.method : 'GET');

  return tracer.startActiveSpan(
    `HTTP ${method}`,
    { kind: SpanKind.CLIENT, attributes: { 'http.request.method': method, 'url.full': redactUrl(url) } },
    (span) => {
      // Inject W3C traceparent into headers
      const headers: Record<string, string> = {};
      propagation.inject(context.active(), headers);

      // Merge headers from input (Request), init, and propagation
      const baseHeaders =
        input instanceof Request ? Object.fromEntries(input.headers.entries()) : {};
      const initHeaders = Object.fromEntries(new Headers(init?.headers).entries());
      const mergedInit: RequestInit = {
        ...init,
        headers: { ...baseHeaders, ...initHeaders, ...headers },
      };

      return originalFetch(input, mergedInit)
        .then((response) => {
          span.setAttribute('http.response.status_code', response.status);
          if (response.status >= 400) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${response.status}` });
          }
          span.end();
          return response;
        })
        .catch((error) => {
          span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
          span.recordException(error as Error);
          span.end();
          throw error;
        });
    },
  );
}

interface OtelHandle {
  shutdown: () => Promise<void>;
}

/**
 * Initialize OpenTelemetry SDK with OTLP trace export.
 * Returns a shutdown handle, or null when tracing is disabled.
 *
 * Enable by setting OTEL_ENABLED=true.
 */
export function initTelemetry(serviceVersion: string): OtelHandle | null {
  if (process.env.OTEL_ENABLED !== 'true') {
    return null;
  }

  const serviceName = process.env.OTEL_SERVICE_NAME || 'freee-mcp';
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
  const sampleRate = Number.parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG || '1.0');

  const resource = resourceFromAttributes({
    'service.name': serviceName,
    'service.version': serviceVersion,
  });

  const exporter = new OTLPTraceExporter({
    url: `${endpoint}/v1/traces`,
  });

  const sampler = new ParentBasedSampler({
    root: Number.isNaN(sampleRate) || sampleRate >= 1.0
      ? new AlwaysOnSampler()
      : new TraceIdRatioBasedSampler(sampleRate),
  });

  const provider = new BasicTracerProvider({
    resource,
    sampler,
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  // Register global context manager, propagator, and tracer provider
  const contextManager = new AsyncLocalStorageContextManager();
  context.setGlobalContextManager(contextManager);
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  trace.setGlobalTracerProvider(provider);

  // Patch globalThis.fetch to auto-instrument outgoing HTTP requests
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
    instrumentedFetch(originalFetch, input, init);

  _enabled = true;

  return {
    shutdown: async () => {
      await provider.shutdown();
    },
  };
}
