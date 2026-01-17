/**
 * Result type for JSON parsing operations.
 * Allows callers to distinguish between success and failure while preserving error context.
 */
export type JsonParseResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: string };

/**
 * Parses JSON from a Response object with Result type pattern.
 * Preserves error context on failure instead of silently returning empty object.
 *
 * @param response - The fetch Response object to parse
 * @returns Result object with parsed data or error message
 */
export async function parseJsonResponse(response: Response): Promise<JsonParseResult> {
  try {
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
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
