import { context, propagation, trace } from '@opentelemetry/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function createMockResponse(status = 200): Response {
  return new Response(null, { status });
}

describe('fetch patching', () => {
  const mockFetch = vi.fn();
  let savedFetch: typeof fetch;

  beforeEach(() => {
    savedFetch = globalThis.fetch;
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(createMockResponse());
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = savedFetch;
    trace.disable();
    context.disable();
    propagation.disable();
    vi.resetModules();
    delete process.env.OTEL_ENABLED;
  });

  it('does not patch globalThis.fetch when OTel is disabled', async () => {
    const { initTelemetry } = await import('./init.js');
    initTelemetry('1.0.0');
    expect(globalThis.fetch).toBe(mockFetch);
  });

  it('patches globalThis.fetch when OTel is enabled', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    initTelemetry('1.0.0');
    expect(globalThis.fetch).not.toBe(mockFetch);
  });

  it('injects traceparent header', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    initTelemetry('1.0.0');

    await globalThis.fetch('https://api.example.com/test');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, callInit] = mockFetch.mock.calls[0];
    const headers = callInit?.headers as Record<string, string>;
    expect(headers.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/);
  });

  it('preserves existing headers', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    initTelemetry('1.0.0');

    await globalThis.fetch('https://api.example.com/test', {
      headers: { Authorization: 'Bearer token123' },
    });

    const [, callInit] = mockFetch.mock.calls[0];
    const headers = callInit?.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer token123');
    expect(headers.traceparent).toBeDefined();
  });

  it('returns the response correctly', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    initTelemetry('1.0.0');

    const expectedResponse = createMockResponse(201);
    mockFetch.mockResolvedValue(expectedResponse);

    const response = await globalThis.fetch('https://api.example.com/test');
    expect(response).toBe(expectedResponse);
    expect(response.status).toBe(201);
  });

  it('propagates errors from fetch', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    initTelemetry('1.0.0');

    const error = new Error('Network failure');
    mockFetch.mockRejectedValue(error);

    await expect(globalThis.fetch('https://api.example.com/test')).rejects.toThrow(
      'Network failure',
    );
  });

  it('handles non-200 status without throwing', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    initTelemetry('1.0.0');

    mockFetch.mockResolvedValue(createMockResponse(404));

    const response = await globalThis.fetch('https://api.example.com/test');
    expect(response.status).toBe(404);
  });

  it('preserves Headers instance headers', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    initTelemetry('1.0.0');

    const headers = new Headers();
    headers.set('X-Custom', 'value');
    await globalThis.fetch('https://api.example.com/test', { headers });

    const [, callInit] = mockFetch.mock.calls[0];
    const callHeaders = callInit?.headers as Record<string, string>;
    expect(callHeaders['x-custom']).toBe('value');
  });

  it('preserves tuple array headers', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    initTelemetry('1.0.0');

    await globalThis.fetch('https://api.example.com/test', {
      headers: [['X-Tuple', 'tuple-value']],
    });

    const [, callInit] = mockFetch.mock.calls[0];
    const callHeaders = callInit?.headers as Record<string, string>;
    expect(callHeaders['x-tuple']).toBe('tuple-value');
  });

  it('preserves Request headers', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    initTelemetry('1.0.0');

    const request = new Request('https://api.example.com/test', {
      headers: { 'X-Request-Header': 'req-value' },
    });
    await globalThis.fetch(request);

    const [, callInit] = mockFetch.mock.calls[0];
    const callHeaders = callInit?.headers as Record<string, string>;
    expect(callHeaders['x-request-header']).toBe('req-value');
  });

  it('records correct HTTP method from Request object', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    initTelemetry('1.0.0');

    const request = new Request('https://api.example.com/test', {
      method: 'POST',
    });
    await globalThis.fetch(request);

    expect(mockFetch).toHaveBeenCalledOnce();
  });
});
