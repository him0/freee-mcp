import { metrics } from '@opentelemetry/api';
import {
  AggregationTemporality,
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getHttpRequestDuration,
  getHttpRequestErrorCount,
  getToolErrorCount,
  getToolInvocationDuration,
} from './metrics.js';

function setupTestMetrics(): { exporter: InMemoryMetricExporter; provider: MeterProvider; reader: PeriodicExportingMetricReader } {
  const exporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
  const reader = new PeriodicExportingMetricReader({
    exporter,
    exportIntervalMillis: 100,
  });
  const provider = new MeterProvider({ readers: [reader] });
  metrics.setGlobalMeterProvider(provider);
  return { exporter, provider, reader };
}

describe('HTTP metrics', () => {
  afterEach(() => {
    metrics.disable();
  });

  it('records http.server.request.duration', async () => {
    const { reader, provider } = setupTestMetrics();

    getHttpRequestDuration().record(0.15, { method: 'POST', path: '/mcp', status: '200' });

    const result = await reader.collect();
    const metric = result.resourceMetrics.scopeMetrics[0]?.metrics.find(
      (m) => m.descriptor.name === 'http.server.request.duration',
    );
    expect(metric).toBeDefined();
    expect(metric?.descriptor.unit).toBe('s');

    await provider.shutdown();
  });

  it('records http.server.error.count', async () => {
    const { reader, provider } = setupTestMetrics();

    getHttpRequestErrorCount().add(1, { method: 'POST', path: '/mcp', status: '500' });

    const result = await reader.collect();
    const metric = result.resourceMetrics.scopeMetrics[0]?.metrics.find(
      (m) => m.descriptor.name === 'http.server.error.count',
    );
    expect(metric).toBeDefined();

    await provider.shutdown();
  });
});

describe('MCP tool metrics', () => {
  afterEach(() => {
    metrics.disable();
  });

  it('records mcp.tool.invocation.duration', async () => {
    const { reader, provider } = setupTestMetrics();

    getToolInvocationDuration().record(0.35, { tool_name: 'freee_api_get' });

    const result = await reader.collect();
    const metric = result.resourceMetrics.scopeMetrics[0]?.metrics.find(
      (m) => m.descriptor.name === 'mcp.tool.invocation.duration',
    );
    expect(metric).toBeDefined();
    expect(metric?.descriptor.unit).toBe('s');

    await provider.shutdown();
  });

  it('records mcp.tool.error.count', async () => {
    const { reader, provider } = setupTestMetrics();

    getToolErrorCount().add(1, { tool_name: 'freee_api_get' });

    const result = await reader.collect();
    const metric = result.resourceMetrics.scopeMetrics[0]?.metrics.find(
      (m) => m.descriptor.name === 'mcp.tool.error.count',
    );
    expect(metric).toBeDefined();

    await provider.shutdown();
  });
});
