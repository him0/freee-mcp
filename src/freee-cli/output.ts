import { isBinaryFileResponse, type BinaryFileResponse } from '../api/client.js';
import fs from 'node:fs/promises';

export function formatJson(data: unknown, pretty?: boolean): string {
  const shouldPretty = pretty ?? process.stdout.isTTY;
  return JSON.stringify(data, null, shouldPretty ? 2 : undefined);
}

export function writeStdout(text: string): void {
  process.stdout.write(`${text}\n`);
}

export function writeStderr(text: string): void {
  process.stderr.write(`${text}\n`);
}

export async function handleApiResult(result: unknown, options: { output?: string; pretty?: boolean }): Promise<void> {
  if (isBinaryFileResponse(result)) {
    const binary = result as BinaryFileResponse;
    if (options.output) {
      await fs.copyFile(binary.filePath, options.output);
      writeStderr(`Saved to ${options.output}`);
    } else {
      writeStderr(`Downloaded: ${binary.filePath} (${(binary.size / 1024).toFixed(2)} KB, ${binary.mimeType})`);
    }
    return;
  }

  if (result === null) {
    writeStderr('No content (204)');
    return;
  }

  writeStdout(formatJson(result, options.pretty));
}
