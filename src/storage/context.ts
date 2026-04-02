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

// SECURITY: This fallback is only safe for stdio (single-user, local process) mode.
// In multi-tenant / remote (HTTP) mode, callers MUST inject a proper TokenStore
// via extra.authInfo.extra to ensure tenant isolation. The HTTP transport layer
// (added in PR 2) is responsible for populating AuthExtra on every request.
export function extractTokenContext(extra?: AuthExtra): TokenContext {
  const authExtra = extra?.authInfo?.extra;
  if (authExtra?.tokenStore && typeof authExtra.userId === 'string') {
    return {
      tokenStore: authExtra.tokenStore as TokenStore,
      userId: authExtra.userId,
    };
  }

  // Fallback: stdio mode — single user, local file storage only.
  return {
    tokenStore: getDefaultFileTokenStore(),
    userId: 'local',
  };
}
