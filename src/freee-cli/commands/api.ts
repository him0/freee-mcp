import type { ParsedArgs } from '../arg-parser.js';
import { makeApiRequest } from '../../api/client.js';
import { validatePathForService, listAllAvailablePaths, type ApiType } from '../../openapi/schema-loader.js';
import { handleApiResult, writeStdout } from '../output.js';
import { FileTokenStore } from '../../storage/file-token-store.js';

const VALID_SERVICES = ['accounting', 'hr', 'invoice', 'pm', 'sm'];

function parseQueryParams(queryFlags: string[]): Record<string, unknown> | undefined {
  if (queryFlags.length === 0) return undefined;
  const params: Record<string, unknown> = {};
  for (const q of queryFlags) {
    const eqIndex = q.indexOf('=');
    if (eqIndex === -1) {
      throw new Error(`Invalid query parameter format: "${q}" (expected key=value)`);
    }
    params[q.slice(0, eqIndex)] = q.slice(eqIndex + 1);
  }
  return params;
}

function parseBody(data: string | undefined): Record<string, unknown> | undefined {
  if (!data) return undefined;
  try {
    return JSON.parse(data);
  } catch {
    throw new Error(`Invalid JSON body: ${data}`);
  }
}

function getTokenContext() {
  const tokenStore = new FileTokenStore();
  return { tokenStore, userId: 'local' };
}

export async function handleApiCommand(method: string, args: ParsedArgs): Promise<void> {
  const path = args.positional[0];
  if (!path) {
    throw new Error(`Usage: freee-cli ${method.toLowerCase()} <path> [-s service] [-q key=value] [-d '{"json"}']`);
  }

  const service = args.flags.service as ApiType | undefined;
  if (service && !VALID_SERVICES.includes(service)) {
    throw new Error(`Invalid service: ${service} (expected: ${VALID_SERVICES.join(', ')})`);
  }

  const query = parseQueryParams(args.flags.query);
  const body = parseBody(args.flags.data);

  const validation = validatePathForService(method.toUpperCase(), path, service);
  if (!validation.isValid) {
    throw new Error(`${validation.message}\nRun "freee-cli list-paths" to see available endpoints.`);
  }

  const tokenContext = getTokenContext();
  // biome-ignore lint/style/noNonNullAssertion: actualPath is set when isValid is true
  const result = await makeApiRequest(method.toUpperCase(), validation.actualPath!, query, body, validation.baseUrl, tokenContext);

  await handleApiResult(result, { output: args.flags.output, pretty: args.flags.pretty });
}

export function handleListPaths(): void {
  const pathsList = listAllAvailablePaths();
  writeStdout(pathsList);
}
