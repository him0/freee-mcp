import { parseArgs } from './arg-parser.js';
import { loadConfig } from '../config.js';
import { handleApiCommand, handleListPaths } from './commands/api.js';
import { handleAuthenticate, handleAuthStatus, handleClearAuth } from './commands/auth.js';
import { handleCurrentUser, handleListCompanies, handleGetCurrentCompany, handleSetCurrentCompany } from './commands/company.js';
import { handleFileUpload } from './commands/file-upload.js';
import { configure } from '../cli/index.js';
import { writeStderr } from './output.js';
import { PACKAGE_VERSION } from '../constants.js';

const DEV_BANNER = `freee-cli v${PACKAGE_VERSION} (dev preview - インターフェースは今後変更される可能性があります)`;

const HELP = `${DEV_BANNER}

Usage: freee-cli <command> [options]

API commands (curl-like):
  get <path>      GET request     -s <service> -q key=value
  post <path>     POST request    -s <service> -d '{"json"}'
  put <path>      PUT request     -s <service> -d '{"json"}'
  delete <path>   DELETE request  -s <service>
  patch <path>    PATCH request   -s <service> -d '{"json"}'
  list-paths      List all available API endpoints

Setup:
  configure       Interactive configuration setup  [--force]

Auth commands:
  authenticate    Start OAuth authentication
  auth-status     Check authentication status
  clear-auth      Clear stored credentials

Company commands:
  current-user          Show current user info
  list-companies        List all companies
  get-current-company   Show current company
  set-current-company   Set current company  --company-id <id>

File commands:
  file-upload <path>    Upload file to freee  --description <desc>

Options:
  -s, --service <name>  Service: accounting|hr|invoice|pm|sm (auto-detected if omitted)
  -d, --data <json>     Request body as JSON string
  -q, --query <k=v>     Query parameter (repeatable)
  -o, --output <file>   Output file for binary responses
  --pretty              Force pretty JSON output
  --no-pretty           Force compact JSON output
  -h, --help            Show this help`;

type CommandHandler = (args: ReturnType<typeof parseArgs>) => Promise<void>;

const API_COMMANDS: Record<string, string> = {
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  delete: 'DELETE',
  patch: 'PATCH',
};

const COMMANDS: Record<string, CommandHandler> = {
  'list-paths': async () => handleListPaths(),
  'authenticate': async () => handleAuthenticate(),
  'auth-status': async () => handleAuthStatus(),
  'clear-auth': async () => handleClearAuth(),
  'current-user': async (args) => handleCurrentUser(args),
  'list-companies': async (args) => handleListCompanies(args),
  'get-current-company': async () => handleGetCurrentCompany(),
  'set-current-company': async (args) => handleSetCurrentCompany(args),
  'file-upload': async (args) => handleFileUpload(args),
};

// Commands that run before loadConfig (config may not exist yet)
const PRE_CONFIG_COMMANDS: Record<string, CommandHandler> = {
  'configure': async () => {
    const force = process.argv.includes('--force');
    await configure({ force });
  },
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.flags.help || !args.subcommand) {
    writeStderr(HELP);
    process.exit(args.flags.help ? 0 : 1);
  }

  const subcommand = args.subcommand;

  writeStderr(DEV_BANNER);

  // Commands that don't need config
  const preHandler = PRE_CONFIG_COMMANDS[subcommand];
  if (preHandler) {
    await preHandler(args);
    return;
  }

  // Load config before other commands
  await loadConfig();

  // API commands
  const httpMethod = API_COMMANDS[subcommand];
  if (httpMethod) {
    await handleApiCommand(httpMethod, args);
    return;
  }

  // Other commands
  const handler = COMMANDS[subcommand];
  if (handler) {
    await handler(args);
    return;
  }

  writeStderr(`Unknown command: ${subcommand}`);
  writeStderr(HELP);
  process.exit(1);
}

main().catch((error) => {
  writeStderr(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
