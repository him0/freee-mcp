import { PACKAGE_VERSION } from '../constants.js';

/**
 * Transport mode that freee-mcp is currently running as.
 *
 * - `stdio`: CLI mode, invoked over stdin/stdout by an MCP client process
 * - `remote`: HTTP mode, serving `/mcp` behind Express (mcp.freee.co.jp)
 */
export type TransportMode = 'stdio' | 'remote';

/**
 * Internal mutable state. Node.js is single-threaded, so reading and writing
 * a module-level variable is safe. We default to `stdio` because CLI usage
 * does not need to explicitly initialize anything — only the remote entry
 * point has to switch it via `initUserAgentTransportMode('remote')`.
 */
let currentMode: TransportMode = 'stdio';

/**
 * Initialize the transport label embedded in the outbound `User-Agent` header.
 *
 * Intended to be called exactly once at process startup from the relevant
 * entry point, mirroring the `initLogger` pattern used elsewhere in the
 * codebase:
 *
 * - `src/server/http-server.ts` for the remote entry (must set `'remote'`)
 * - `src/index.ts` and `src/sign/index.ts` for stdio entries (can be omitted
 *   because `'stdio'` is the module default, but calling it explicitly makes
 *   the transport mode self-documenting at the entry point)
 *
 * The setting is global. Calling it again at runtime would silently
 * repartition every subsequent outbound request into a different bucket,
 * making Datadog analytics inconsistent — the `init`-prefixed name is a
 * signal to the reader that late reassignment is outside the intended
 * contract.
 */
export function initUserAgentTransportMode(mode: TransportMode): void {
  currentMode = mode;
}

/**
 * Build the User-Agent header string used for every outbound freee API call.
 *
 * Format follows RFC 7231 §5.5.3 (product with comment):
 *
 *   freee-mcp/<version> (MCP Server; <mode>; +<url>)
 *
 * The `<mode>` segment lets freee-side log analysis distinguish calls made by
 * the local CLI from calls made by the deployed remote server, so patterns
 * that only show up in one transport can be isolated.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7231#section-5.5.3
 */
export function getUserAgent(): string {
  return `freee-mcp/${PACKAGE_VERSION} (MCP Server; ${currentMode}; +https://github.com/freee/freee-mcp)`;
}
