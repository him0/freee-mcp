import { InvalidTokenError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
import { getTransportMode } from '../server/user-agent.js';
import { FileTokenStore } from './file-token-store.js';
import type { TokenStore } from './token-store.js';

export type AuthExtra = { authInfo?: { extra?: Record<string, unknown> } };

export interface TokenContext {
  tokenStore: TokenStore;
  userId: string;
  companyId?: string;
}

let singletonFileTokenStore: FileTokenStore | null = null;

function getDefaultFileTokenStore(): FileTokenStore {
  if (!singletonFileTokenStore) {
    singletonFileTokenStore = new FileTokenStore();
  }
  return singletonFileTokenStore;
}

/**
 * Resolves the companyId for the given TokenContext, caching the result
 * so that subsequent calls within the same request lifecycle avoid
 * redundant Redis lookups.
 */
export async function resolveCompanyId(ctx: TokenContext): Promise<string> {
  if (ctx.companyId !== undefined) {
    return ctx.companyId;
  }
  const companyId = await ctx.tokenStore.getCurrentCompanyId(ctx.userId);
  ctx.companyId = companyId;
  return companyId;
}

/**
 * Resolve the active TokenContext for an MCP tool invocation.
 *
 * SECURITY: in remote (HTTP) mode this MUST be fail-closed. The HTTP
 * transport layer is responsible for populating `extra.authInfo.extra`
 * with the per-request `tokenStore` and `userId` derived from the bearer
 * token. If that injection is missing for any reason, falling back to the
 * process-global single-tenant `FileTokenStore` would let one tenant's
 * tool call read another tenant's locally cached tokens — a cross-tenant
 * leak. We therefore branch on transport mode:
 *
 * - remote: missing / malformed `AuthExtra` → throw `InvalidTokenError`,
 *   which the MCP SDK auth middleware translates into a spec-compliant
 *   401 + WWW-Authenticate response.
 * - stdio: keep the historical fallback to the local `FileTokenStore`,
 *   because stdio is single-user by definition (one OS process, one
 *   user's `~/.config/freee-mcp/`) so there is no cross-tenant boundary
 *   to protect.
 */
export function extractTokenContext(extra?: AuthExtra): TokenContext {
  const authExtra = extra?.authInfo?.extra;
  if (authExtra?.tokenStore && typeof authExtra.userId === 'string') {
    return {
      tokenStore: authExtra.tokenStore as TokenStore,
      userId: authExtra.userId,
    };
  }

  if (getTransportMode() === 'remote') {
    // Fail closed: never silently fall back to the single-tenant local
    // store on the multi-tenant HTTP path.
    throw new InvalidTokenError('Missing or invalid request authentication context');
  }

  // stdio mode: single user, single local file storage.
  return {
    tokenStore: getDefaultFileTokenStore(),
    userId: 'local',
  };
}
