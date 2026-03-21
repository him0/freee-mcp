import type { ParsedArgs } from '../arg-parser.js';
import { uploadReceipt } from '../../api/file-upload.js';
import { FileTokenStore } from '../../storage/file-token-store.js';
import { handleApiResult } from '../output.js';

export async function handleFileUpload(args: ParsedArgs): Promise<void> {
  const filePath = args.positional[0];
  if (!filePath) {
    throw new Error('Usage: freee-cli file-upload <file-path> [--description <desc>] [--partner-name <name>] ...');
  }

  const options: Record<string, unknown> = {};
  if (args.flags.description) options.description = args.flags.description;
  if (args.flags.partnerName) options.receipt_metadatum_partner_name = args.flags.partnerName;
  if (args.flags.issueDate) options.receipt_metadatum_issue_date = args.flags.issueDate;
  if (args.flags.amount) options.receipt_metadatum_amount = Number(args.flags.amount);
  if (args.flags.qualifiedInvoice) options.qualified_invoice = args.flags.qualifiedInvoice;
  if (args.flags.documentType) options.document_type = args.flags.documentType;

  const tokenStore = new FileTokenStore();
  const result = await uploadReceipt(filePath, options, { tokenStore, userId: 'local' });

  await handleApiResult(result, { pretty: args.flags.pretty });
}
