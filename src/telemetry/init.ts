import { SpanKind, SpanStatusCode, context, metrics, propagation, trace } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  ParentBasedSampler,
} from '@opentelemetry/sdk-trace-base';
import { resolveRootSampler } from './sampler.js';

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

  const deploymentEnv =
    process.env.OTEL_DEPLOYMENT_ENVIRONMENT ?? process.env.NODE_ENV ?? 'unknown';

  const resource = resourceFromAttributes({
    'service.name': serviceName,
    'service.version': serviceVersion,
    'deployment.environment': deploymentEnv,
  });

  const exporter = new OTLPTraceExporter({
    url: `${endpoint}/v1/traces`,
  });

  // ParentBasedSampler wrap preserves downstream W3C traceparent propagation —
  // when there's an incoming parent span, its decision wins regardless of how
  // the root sampler would have judged the new span.
  const sampler = new ParentBasedSampler({
    root: resolveRootSampler(
      process.env.OTEL_TRACES_SAMPLER_RULES,
      process.env.OTEL_TRACES_SAMPLER_ARG,
    ),
  });

  const provider = new BasicTracerProvider({
    resource,
    sampler,
    spanProcessors: [new BatchSpanProcessor(exporter)],
  });

  // Register global context manager, propagator, and tracer provider.
  // CompositePropagator wraps W3C Trace Context (parent linkage) + W3C Baggage
  // (cross-cutting attributes) so future propagators can be added without
  // changing call sites.
  const contextManager = new AsyncLocalStorageContextManager();
  context.setGlobalContextManager(contextManager);
  propagation.setGlobalPropagator(
    new CompositePropagator({
      propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
    }),
  );
  trace.setGlobalTracerProvider(provider);

  // Initialize MeterProvider for metrics export
  const metricsExporter = process.env.OTEL_METRICS_EXPORTER === 'none'
    ? undefined
    : new OTLPMetricExporter({ url: `${endpoint}/v1/metrics` });

  let meterProvider: MeterProvider | undefined;
  if (metricsExporter) {
    meterProvider = new MeterProvider({
      resource,
      readers: [new PeriodicExportingMetricReader({ exporter: metricsExporter })],
    });
    metrics.setGlobalMeterProvider(meterProvider);
  }

  // Patch globalThis.fetch to auto-instrument outgoing HTTP requests
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
    instrumentedFetch(originalFetch, input, init);

  _enabled = true;

  return {
    shutdown: async () => {
      await provider.shutdown();
      if (meterProvider) {
        await meterProvider.shutdown();
      }
    },
  };
}
