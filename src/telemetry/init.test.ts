import { context, propagation, trace } from '@opentelemetry/api';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('initTelemetry', () => {
  afterEach(() => {
    trace.disable();
    context.disable();
    propagation.disable();
    vi.resetModules();
    vi.unstubAllEnvs();
    delete process.env.OTEL_ENABLED;
    delete process.env.OTEL_SERVICE_NAME;
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    delete process.env.OTEL_TRACES_SAMPLER_ARG;
  });

  it('returns null when OTEL_ENABLED is not set', async () => {
    const { initTelemetry } = await import('./init.js');
    const result = initTelemetry('1.0.0');
    expect(result).toBeNull();
  });

  it('returns null when OTEL_ENABLED is not "true"', async () => {
    process.env.OTEL_ENABLED = 'false';
    const { initTelemetry } = await import('./init.js');
    const result = initTelemetry('1.0.0');
    expect(result).toBeNull();
  });

  it('returns shutdown function when enabled', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    const result = initTelemetry('1.0.0');
    expect(result).not.toBeNull();
    expect(typeof result?.shutdown).toBe('function');
    await result?.shutdown();
  });

  it('sets isOtelEnabled to true when initialized', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry, isOtelEnabled } = await import('./init.js');
    expect(isOtelEnabled()).toBe(false);
    initTelemetry('1.0.0');
    expect(isOtelEnabled()).toBe(true);
    // cleanup
    const result = initTelemetry('1.0.0');
    await result?.shutdown();
  });

  it('supports custom service name from env', async () => {
    process.env.OTEL_ENABLED = 'true';
    process.env.OTEL_SERVICE_NAME = 'custom-service';
    const { initTelemetry } = await import('./init.js');
    const result = initTelemetry('2.0.0');
    expect(result).not.toBeNull();
    await result?.shutdown();
  });

  it('shutdown resolves without error', async () => {
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    const result = initTelemetry('1.0.0');
    await expect(result?.shutdown()).resolves.toBeUndefined();
  });

  it('patches globalThis.fetch when enabled', async () => {
    const originalFetch = globalThis.fetch;
    process.env.OTEL_ENABLED = 'true';
    const { initTelemetry } = await import('./init.js');
    initTelemetry('1.0.0');
    expect(globalThis.fetch).not.toBe(originalFetch);
    // restore
    globalThis.fetch = originalFetch;
  });

  it('does not patch globalThis.fetch when disabled', async () => {
    const originalFetch = globalThis.fetch;
    const { initTelemetry } = await import('./init.js');
    initTelemetry('1.0.0');
    expect(globalThis.fetch).toBe(originalFetch);
  });
});

describe('redactUrl', () => {
  it('redacts sensitive query params', async () => {
    const { redactUrl } = await import('./init.js');
    const url = 'https://example.com/callback?code=secret&state=abc';
    const result = redactUrl(url);
    expect(result).toContain('code=%5BREDACTED%5D');
    expect(result).toContain('state=abc');
    expect(result).not.toContain('secret');
  });

  it('redacts access_token and refresh_token', async () => {
    const { redactUrl } = await import('./init.js');
    const url = 'https://example.com/api?access_token=abc&refresh_token=xyz';
    const result = redactUrl(url);
    expect(result).toContain('access_token=%5BREDACTED%5D');
    expect(result).toContain('refresh_token=%5BREDACTED%5D');
  });

  it('returns original string for invalid URLs', async () => {
    const { redactUrl } = await import('./init.js');
    const url = 'not-a-valid-url';
    expect(redactUrl(url)).toBe(url);
  });

  it('preserves URL without sensitive params', async () => {
    const { redactUrl } = await import('./init.js');
    const url = 'https://example.com/api?company_id=123';
    expect(redactUrl(url)).toBe(url);
  });
});
