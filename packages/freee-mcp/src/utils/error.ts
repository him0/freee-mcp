/**
 * Safely parses JSON from a Response object.
 * Returns an empty object if parsing fails.
 *
 * @param response - The fetch Response object to parse
 * @returns Parsed JSON data or empty object on failure
 */
export async function safeParseJson(response: Response): Promise<Record<string, unknown>> {
  return response.json().catch(() => ({}));
}

/**
 * MCP text response type
 */
export interface TextResponse {
  content: {
    type: 'text';
    text: string;
  }[];
}

/**
 * Creates a standardized MCP text response.
 *
 * @param text - The text content for the response
 * @returns MCP-formatted text response object
 */
export function createTextResponse(text: string): TextResponse {
  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}

/**
 * Formats an error into a string message.
 * Handles both Error instances and other thrown values.
 *
 * @param error - The error to format
 * @returns Formatted error message string
 */
export function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
