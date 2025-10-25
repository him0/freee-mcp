import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { createAndStartServer } from './mcp/handlers.js';
import * as os from 'node:os';

interface ConfigValues {
  clientId: string;
  clientSecret: string;
  companyId: string;
  callbackPort: string;
}

async function configure(): Promise<void> {
  const rl = createInterface({ input, output });

  console.log('\n=== freee-mcp Configuration Setup ===\n');
  console.log('This wizard will help you configure freee-mcp for use with Claude.');
  console.log('You will need your freee OAuth credentials.\n');

  try {
    const clientId = await rl.question('FREEE_CLIENT_ID: ');
    const clientSecret = await rl.question('FREEE_CLIENT_SECRET: ');
    const companyId = await rl.question('FREEE_COMPANY_ID: ');
    const callbackPort =
      (await rl.question('FREEE_CALLBACK_PORT (default: 54321): ')) || '54321';

    const config: ConfigValues = {
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      companyId: companyId.trim(),
      callbackPort: callbackPort.trim(),
    };

    // Validation
    if (!config.clientId || !config.clientSecret || !config.companyId) {
      console.error(
        '\n❌ Error: CLIENT_ID, CLIENT_SECRET, and COMPANY_ID are required.'
      );
      process.exit(1);
    }

    console.log('\n✓ Configuration values collected.\n');
    console.log('=== MCP Configuration ===\n');
    console.log('Add the following to your Claude desktop config file:\n');

    const platform = os.platform();
    let configPath = '';
    if (platform === 'darwin') {
      configPath =
        '~/Library/Application Support/Claude/claude_desktop_config.json';
    } else if (platform === 'win32') {
      configPath = '%APPDATA%\\Claude\\claude_desktop_config.json';
    } else {
      configPath = '~/.config/Claude/claude_desktop_config.json';
    }

    console.log(`Config file location: ${configPath}\n`);

    const mcpConfig = {
      mcpServers: {
        freee: {
          command: 'npx',
          args: ['@him0/freee-mcp'],
          env: {
            FREEE_CLIENT_ID: config.clientId,
            FREEE_CLIENT_SECRET: config.clientSecret,
            FREEE_COMPANY_ID: config.companyId,
            FREEE_CALLBACK_PORT: config.callbackPort,
          },
        },
      },
    };

    console.log(JSON.stringify(mcpConfig, null, 2));
    console.log('\n✓ Setup complete!\n');
  } finally {
    rl.close();
  }
}

function showHelp(): void {
  console.log(`
Usage: freee-mcp [command]

Commands:
  configure    Interactive configuration setup for freee-mcp
  help         Show this help message
  (no command) Start the MCP server

Examples:
  freee-mcp              # Start MCP server
  freee-mcp configure    # Run configuration wizard
  freee-mcp help         # Show help
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'configure':
      await configure();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    case undefined:
      // No command provided, start MCP server
      await createAndStartServer();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
