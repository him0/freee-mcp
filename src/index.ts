import { configure } from './cli.js';
import { setProfile } from './constants.js';
import { createAndStartServer } from './mcp/handlers.js';

function parseProfileArg(args: string[]): string | undefined {
  const idx = args.indexOf('--profile');
  if (idx === -1) return undefined;
  const value = args[idx + 1];
  if (!value || value.startsWith('--')) {
    console.error('Error: --profile にはプロファイル名を指定してください');
    process.exit(1);
  }
  return value;
}

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const subcommand = args.find((arg) => !arg.startsWith('--') && args[args.indexOf(arg) - 1] !== '--profile');

  const profile = parseProfileArg(args);
  if (profile) {
    setProfile(profile);
  }

  if (subcommand === 'configure') {
    const force = args.includes('--force');
    await configure({ force, profile });
    return;
  }

  if (subcommand && subcommand !== 'client') {
    console.error(`Unknown subcommand: ${subcommand}`);
    console.error('Usage: freee-mcp [configure] [--force] [--profile <name>]');
    console.error('  configure      - Interactive configuration setup');
    console.error('  --force        - 保存済みのログイン情報をリセットして再設定');
    console.error('  --profile name - 指定したプロファイルの設定を使用');
    process.exit(1);
  }

  if (profile) {
    console.error(`Starting freee MCP server (profile: ${profile})`);
  } else {
    console.error('Starting freee MCP server');
  }
  await createAndStartServer();
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
