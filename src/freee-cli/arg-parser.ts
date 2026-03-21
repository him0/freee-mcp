export interface ParsedArgs {
  subcommand: string | null;
  positional: string[];
  flags: {
    service?: string;
    data?: string;
    query: string[];
    output?: string;
    pretty?: boolean;
    help?: boolean;
    companyId?: string;
    name?: string;
    description?: string;
    partnerName?: string;
    issueDate?: string;
    amount?: string;
    qualifiedInvoice?: string;
    documentType?: string;
  };
}

const SHORT_FLAGS: Record<string, string> = {
  '-s': 'service',
  '-d': 'data',
  '-q': 'query',
  '-o': 'output',
  '-h': 'help',
};

const LONG_FLAGS: Record<string, string> = {
  '--service': 'service',
  '--data': 'data',
  '--query': 'query',
  '--output': 'output',
  '--help': 'help',
  '--pretty': 'pretty',
  '--no-pretty': 'no-pretty',
  '--company-id': 'companyId',
  '--name': 'name',
  '--description': 'description',
  '--partner-name': 'partnerName',
  '--issue-date': 'issueDate',
  '--amount': 'amount',
  '--qualified-invoice': 'qualifiedInvoice',
  '--document-type': 'documentType',
};

const BOOLEAN_FLAGS = new Set(['help', 'pretty', 'no-pretty']);
const REPEATABLE_FLAGS = new Set(['query']);

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    subcommand: null,
    positional: [],
    flags: { query: [] },
  };

  let i = 0;

  // First non-flag arg is subcommand
  while (i < argv.length) {
    const arg = argv[i];
    if (!arg.startsWith('-')) {
      result.subcommand = arg;
      i++;
      break;
    }
    // Handle flags before subcommand
    i = processFlag(arg, argv, i, result);
  }

  // Remaining args
  while (i < argv.length) {
    const arg = argv[i];
    if (arg.startsWith('-')) {
      i = processFlag(arg, argv, i, result);
    } else {
      result.positional.push(arg);
      i++;
    }
  }

  return result;
}

function processFlag(arg: string, argv: string[], i: number, result: ParsedArgs): number {
  const shortKey = SHORT_FLAGS[arg];
  const longKey = LONG_FLAGS[arg];
  const key = shortKey || longKey;

  if (!key) {
    // Unknown flag, skip
    return i + 1;
  }

  if (key === 'no-pretty') {
    result.flags.pretty = false;
    return i + 1;
  }

  if (BOOLEAN_FLAGS.has(key)) {
    (result.flags as Record<string, unknown>)[key] = true;
    return i + 1;
  }

  // Value flag
  const value = argv[i + 1];
  if (value === undefined) {
    return i + 1;
  }

  if (REPEATABLE_FLAGS.has(key)) {
    result.flags.query.push(value);
  } else {
    (result.flags as Record<string, unknown>)[key] = value;
  }

  return i + 2;
}
