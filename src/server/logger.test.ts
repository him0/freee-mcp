import { Writable } from 'node:stream';
import pino from 'pino';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('logger', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('should create a logger with default level', async () => {
    const { initLogger } = await import('./logger.js');
    const logger = initLogger();
    expect(logger).toBeDefined();
    expect(logger.level).toBe('info');
  });

  it('should create a logger with custom level (string)', async () => {
    const { initLogger } = await import('./logger.js');
    const logger = initLogger('debug');
    expect(logger).toBeDefined();
    expect(logger.level).toBe('debug');
  });

  it('should create a logger with LoggerOptions', async () => {
    const { initLogger } = await import('./logger.js');
    const logger = initLogger({ level: 'warn', transportMode: 'remote' });
    expect(logger).toBeDefined();
    expect(logger.level).toBe('warn');
  });

  it('getLogger returns singleton', async () => {
    const { initLogger, getLogger } = await import('./logger.js');
    const logger1 = initLogger('warn');
    const logger2 = getLogger();
    expect(logger1).toBe(logger2);
  });

  it('getLogger creates logger lazily if not initialized', async () => {
    const { getLogger } = await import('./logger.js');
    const logger = getLogger();
    expect(logger).toBeDefined();
    expect(logger.level).toBe('info');
  });
});

/**
 * Verify the pino output shape end-to-end by intercepting `pino.destination`
 * with a captured-in-memory Writable. We test the actual emitted JSON
 * because that is the contract Datadog ingests, not internal helpers.
 */
describe('logger pino output', () => {
  let lines: string[];
  let destSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    lines = [];
    const stream = new Writable({
      write(chunk, _enc, cb) {
        lines.push(chunk.toString());
        cb();
      },
    });
    // pino.destination(2) returns a SonicBoom; substituting a Writable
    // works because pino accepts any Node stream as its destination.
    destSpy = vi
      .spyOn(pino, 'destination')
      .mockReturnValue(stream as unknown as ReturnType<typeof pino.destination>);
    vi.resetModules();
  });

  afterEach(() => {
    destSpy.mockRestore();
  });

  it('emits level as string label, not numeric (Datadog Status Remapper compat)', async () => {
    const { initLogger } = await import('./logger.js');
    const logger = initLogger();
    logger.info({ x: 1 }, 'hello');

    expect(lines.length).toBeGreaterThan(0);
    const parsed = JSON.parse(lines[lines.length - 1]);
    expect(parsed.level).toBe('info');
    expect(typeof parsed.level).toBe('string');
  });

  it('emits warn and error as their string labels', async () => {
    const { initLogger } = await import('./logger.js');
    const logger = initLogger();
    logger.warn('w');
    logger.error('e');

    const parsed = lines.map((l) => JSON.parse(l));
    expect(parsed.find((p) => p.msg === 'w')?.level).toBe('warn');
    expect(parsed.find((p) => p.msg === 'e')?.level).toBe('error');
  });

  it('emits trace_sampled:false when no active OpenTelemetry span is set', async () => {
    // Without an active span, otelMixin must still publish trace_sampled
    // (as `false`) so Datadog facets work uniformly across requests with
    // and without traces. Absence of the field would force consumers to
    // distinguish "missing" from "false" everywhere.
    const { initLogger } = await import('./logger.js');
    const logger = initLogger();
    logger.info('hi');

    const parsed = JSON.parse(lines[lines.length - 1]);
    expect(parsed.trace_sampled).toBe(false);
    expect(parsed.trace_id).toBeUndefined();
    expect(parsed.span_id).toBeUndefined();
  });

  it('serialises freee-mcp service base fields alongside the level', async () => {
    // Smoke test: verify base fields (service, version, transport_mode)
    // still flow through with the new formatter wiring in place.
    const { initLogger } = await import('./logger.js');
    const logger = initLogger({ level: 'info', transportMode: 'remote' });
    logger.info('boot');

    const parsed = JSON.parse(lines[lines.length - 1]);
    expect(parsed.service).toBeDefined();
    expect(parsed.transport_mode).toBe('remote');
    expect(parsed.level).toBe('info');
  });
});

describe('sanitizePath', () => {
  it('should strip query string', async () => {
    const { sanitizePath } = await import('./logger.js');
    expect(sanitizePath('/api/1/deals?limit=5&offset=0')).toBe('/api/:id/deals');
  });

  it('should replace numeric segments with :id', async () => {
    const { sanitizePath } = await import('./logger.js');
    expect(sanitizePath('/api/1/deals/12345')).toBe('/api/:id/deals/:id');
  });

  it('should preserve non-numeric segments', async () => {
    const { sanitizePath } = await import('./logger.js');
    expect(sanitizePath('/api/1/companies')).toBe('/api/:id/companies');
  });

  it('should handle HR API paths', async () => {
    const { sanitizePath } = await import('./logger.js');
    // v1 is a version identifier, not a numeric ID - only standalone numeric segments are replaced
    expect(sanitizePath('/hr/api/v1/employees/99')).toBe('/hr/api/v1/employees/:id');
  });

  it('should handle path without numeric segments', async () => {
    const { sanitizePath } = await import('./logger.js');
    expect(sanitizePath('/health')).toBe('/health');
  });

  it('should handle path with query string and numeric ID', async () => {
    const { sanitizePath } = await import('./logger.js');
    expect(sanitizePath('/api/1/deals/999?company_id=123')).toBe('/api/:id/deals/:id');
  });
});
