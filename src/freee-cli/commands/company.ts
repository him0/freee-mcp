import type { ParsedArgs } from '../arg-parser.js';
import { makeApiRequest } from '../../api/client.js';
import { FileTokenStore } from '../../storage/file-token-store.js';
import { handleApiResult, writeStderr } from '../output.js';

function getTokenContext() {
  const tokenStore = new FileTokenStore();
  return { tokenStore, userId: 'local' };
}

export async function handleCurrentUser(args: ParsedArgs): Promise<void> {
  const ctx = getTokenContext();
  const companyId = await ctx.tokenStore.getCurrentCompanyId(ctx.userId);

  if (!companyId) {
    throw new Error('事業所IDが設定されていません。`freee-cli set-current-company` で設定してください。');
  }

  const [companyInfo, userInfo] = await Promise.all([
    ctx.tokenStore.getCompanyInfo(ctx.userId, companyId),
    makeApiRequest('GET', '/api/1/users/me', undefined, undefined, undefined, ctx),
  ]);

  writeStderr(`事業所: ${companyInfo?.name || companyId}`);
  await handleApiResult(userInfo, { pretty: args.flags.pretty });
}

export async function handleListCompanies(args: ParsedArgs): Promise<void> {
  const ctx = getTokenContext();
  const result = await makeApiRequest('GET', '/api/1/companies', undefined, undefined, undefined, ctx);
  await handleApiResult(result, { pretty: args.flags.pretty });
}

export async function handleGetCurrentCompany(): Promise<void> {
  const ctx = getTokenContext();
  const companyId = await ctx.tokenStore.getCurrentCompanyId(ctx.userId);
  const companyInfo = await ctx.tokenStore.getCompanyInfo(ctx.userId, companyId);

  if (companyInfo) {
    writeStderr(`事業所: ${companyInfo.name} (ID: ${companyInfo.id})`);
  } else {
    writeStderr(`事業所ID: ${companyId} (詳細情報なし)`);
  }
}

export async function handleSetCurrentCompany(args: ParsedArgs): Promise<void> {
  const companyId = args.flags.companyId;
  if (!companyId) {
    throw new Error('Usage: freee-cli set-current-company --company-id <id> [--name <name>] [--description <desc>]');
  }

  const ctx = getTokenContext();
  await ctx.tokenStore.setCurrentCompany(ctx.userId, companyId, args.flags.name, args.flags.description);

  const companyInfo = await ctx.tokenStore.getCompanyInfo(ctx.userId, companyId);
  writeStderr(`事業所を設定: ${companyInfo?.name || companyId}`);
}
