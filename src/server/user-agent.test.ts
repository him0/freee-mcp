import { afterEach, describe, expect, it } from 'vitest';
import { getUserAgent, initUserAgentTransportMode } from './user-agent.js';

/**
 * The module uses a single mutable global, so each test case restores the
 * default `stdio` mode afterwards to avoid leaking state between tests.
 */
afterEach(() => {
  initUserAgentTransportMode('stdio');
});

describe('getUserAgent', () => {
  it('defaults to stdio mode before any explicit initUserAgentTransportMode call', () => {
    // The module default is 'stdio' — no setup required.
    const ua = getUserAgent();
    expect(ua).toContain('MCP Server');
    expect(ua).toContain('; stdio;');
    expect(ua).not.toContain('; remote;');
  });

  it('switches to the remote segment after initUserAgentTransportMode("remote")', () => {
    initUserAgentTransportMode('remote');
    const ua = getUserAgent();
    expect(ua).toContain('; remote;');
    expect(ua).not.toContain('; stdio;');
  });

  it('switches back to stdio after initUserAgentTransportMode("stdio")', () => {
    initUserAgentTransportMode('remote');
    initUserAgentTransportMode('stdio');
    expect(getUserAgent()).toContain('; stdio;');
  });

  it('emits an RFC 7231 compliant product + comment format', () => {
    // Product: freee-mcp/<version>
    // Comment: (MCP Server; <mode>; +<url>)
    const pattern =
      /^freee-mcp\/[\w.\-+]+ \(MCP Server; (?:stdio|remote); \+https:\/\/github\.com\/freee\/freee-mcp\)$/;
    expect(getUserAgent()).toMatch(pattern);

    initUserAgentTransportMode('remote');
    expect(getUserAgent()).toMatch(pattern);
  });

  it('always starts with the freee-mcp product token', () => {
    // Other tests across the codebase rely on this prefix via /^freee-mcp\// —
    // if we ever break it the matrix of api-client / sign / auth tests would
    // all fail, so assert it directly here as a single cheap regression guard.
    expect(getUserAgent()).toMatch(/^freee-mcp\//);
    initUserAgentTransportMode('remote');
    expect(getUserAgent()).toMatch(/^freee-mcp\//);
  });
});
