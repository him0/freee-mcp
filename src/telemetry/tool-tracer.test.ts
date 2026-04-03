import { SpanKind, SpanStatusCode, context, propagation, trace } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerTracedTool, setToolAttributes } from './tool-tracer.js';

function setupInMemoryOtel(): { exporter: InMemorySpanExporter; provider: BasicTracerProvider } {
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    resource: resourceFromAttributes({ 'service.name': 'test' }),
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });

  const contextManager = new AsyncLocalStorageContextManager();
  context.setGlobalContextManager(contextManager);
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  trace.setGlobalTracerProvider(provider);

  return { exporter, provider };
}

describe('registerTracedTool', () => {
  afterEach(() => {
    trace.disable();
    context.disable();
    propagation.disable();
  });

  it('passes name and config through to server.registerTool', () => {
    const mockServer = { registerTool: vi.fn() };
    const handler = vi.fn();
    const config = { title: 'Test', description: 'Test tool' };

    // biome-ignore lint/suspicious/noExplicitAny: mock server for testing
    registerTracedTool(mockServer as any, 'test_tool', config, handler);

    expect(mockServer.registerTool).toHaveBeenCalledOnce();
    expect(mockServer.registerTool.mock.calls[0][0]).toBe('test_tool');
    expect(mockServer.registerTool.mock.calls[0][1]).toBe(config);
  });

  it('creates span with correct name and kind', async () => {
    const { exporter, provider } = setupInMemoryOtel();
    const mockServer = { registerTool: vi.fn() };
    const handler = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });

    // biome-ignore lint/suspicious/noExplicitAny: mock server for testing
    registerTracedTool(mockServer as any, 'freee_api_get', {}, handler);
    const wrappedHandler = mockServer.registerTool.mock.calls[0][2];

    await wrappedHandler({ service: 'accounting', path: '/api/1/deals' }, {});

    const spans = exporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0].name).toBe('mcp.tool freee_api_get');
    expect(spans[0].kind).toBe(SpanKind.INTERNAL);

    await provider.shutdown();
  });

  it('sets mcp.tool.name attribute', async () => {
    const { exporter, provider } = setupInMemoryOtel();
    const mockServer = { registerTool: vi.fn() };
    const handler = vi.fn().mockResolvedValue({ content: [] });

    // biome-ignore lint/suspicious/noExplicitAny: mock server for testing
    registerTracedTool(mockServer as any, 'freee_auth_status', {}, handler);
    const wrappedHandler = mockServer.registerTool.mock.calls[0][2];

    await wrappedHandler({});

    const spans = exporter.getFinishedSpans();
    expect(spans[0].attributes['mcp.tool.name']).toBe('freee_auth_status');

    await provider.shutdown();
  });

  it('passes args to original handler', async () => {
    const { provider } = setupInMemoryOtel();
    const mockServer = { registerTool: vi.fn() };
    const handler = vi.fn().mockResolvedValue({ content: [] });

    // biome-ignore lint/suspicious/noExplicitAny: mock server for testing
    registerTracedTool(mockServer as any, 'test_tool', {}, handler);
    const wrappedHandler = mockServer.registerTool.mock.calls[0][2];

    const args = { service: 'accounting', path: '/api/1/deals' };
    const extra = { authInfo: { extra: { userId: 'user1' } } };
    await wrappedHandler(args, extra);

    expect(handler).toHaveBeenCalledWith(args, extra);

    await provider.shutdown();
  });

  it('returns handler result', async () => {
    const { provider } = setupInMemoryOtel();
    const mockServer = { registerTool: vi.fn() };
    const expected = { content: [{ type: 'text', text: 'result' }] };
    const handler = vi.fn().mockResolvedValue(expected);

    // biome-ignore lint/suspicious/noExplicitAny: mock server for testing
    registerTracedTool(mockServer as any, 'test_tool', {}, handler);
    const wrappedHandler = mockServer.registerTool.mock.calls[0][2];

    const result = await wrappedHandler({});
    expect(result).toBe(expected);

    await provider.shutdown();
  });

  it('records exception and ERROR status on handler throw', async () => {
    const { exporter, provider } = setupInMemoryOtel();
    const mockServer = { registerTool: vi.fn() };
    const error = new Error('test error');
    const handler = vi.fn().mockRejectedValue(error);

    // biome-ignore lint/suspicious/noExplicitAny: mock server for testing
    registerTracedTool(mockServer as any, 'test_tool', {}, handler);
    const wrappedHandler = mockServer.registerTool.mock.calls[0][2];

    await expect(wrappedHandler({})).rejects.toThrow('test error');

    const spans = exporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
    expect(spans[0].events).toHaveLength(1);
    expect(spans[0].events[0].name).toBe('exception');

    await provider.shutdown();
  });

  it('works with no-op tracer when OTel is not initialized', async () => {
    // No setupInMemoryOtel() — uses default no-op tracer
    const mockServer = { registerTool: vi.fn() };
    const expected = { content: [{ type: 'text', text: 'ok' }] };
    const handler = vi.fn().mockResolvedValue(expected);

    // biome-ignore lint/suspicious/noExplicitAny: mock server for testing
    registerTracedTool(mockServer as any, 'test_tool', {}, handler);
    const wrappedHandler = mockServer.registerTool.mock.calls[0][2];

    const result = await wrappedHandler({ key: 'value' });
    expect(result).toBe(expected);
    expect(handler).toHaveBeenCalledWith({ key: 'value' });
  });
});

describe('setToolAttributes', () => {
  afterEach(() => {
    trace.disable();
    context.disable();
    propagation.disable();
  });

  it('sets attributes on active span', async () => {
    const { exporter, provider } = setupInMemoryOtel();
    const mockServer = { registerTool: vi.fn() };
    const handler = vi.fn().mockImplementation(async () => {
      setToolAttributes({
        'mcp.tool.service': 'accounting',
        'mcp.tool.path': '/api/1/deals',
        'mcp.tool.method': 'GET',
      });
      return { content: [] };
    });

    // biome-ignore lint/suspicious/noExplicitAny: mock server for testing
    registerTracedTool(mockServer as any, 'freee_api_get', {}, handler);
    const wrappedHandler = mockServer.registerTool.mock.calls[0][2];

    await wrappedHandler({});

    const spans = exporter.getFinishedSpans();
    expect(spans[0].attributes['mcp.tool.service']).toBe('accounting');
    expect(spans[0].attributes['mcp.tool.path']).toBe('/api/1/deals');
    expect(spans[0].attributes['mcp.tool.method']).toBe('GET');

    await provider.shutdown();
  });

  it('no-ops when no active span exists', () => {
    // Should not throw when called outside span context
    expect(() => {
      setToolAttributes({ 'mcp.tool.service': 'accounting' });
    }).not.toThrow();
  });
});
