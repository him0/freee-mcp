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

/**
 * Formats error info from an HTTP response for error messages.
 * Parses JSON body and returns a human-readable string.
 *
 * @param response - The fetch Response object
 * @returns Formatted error info string
 */
export async function formatResponseErrorInfo(response: Response): Promise<string> {
  const result = await parseJsonResponse(response);
  return result.success
    ? JSON.stringify(result.data)
    : `(JSON parse failed: ${result.error})`;
}

/**
 * Extracts structured error messages from freee API error responses.
 * Handles the common { errors: [{ messages: [...] }] } pattern.
 *
 * @param response - The fetch Response object
 * @param statusCode - The HTTP status code
 * @returns Formatted error message string
 */
export async function formatApiErrorMessage(response: Response, statusCode: number): Promise<string> {
  const result = await parseJsonResponse(response);

  let errorMessage = `API request failed: ${statusCode}`;

  if (result.success) {
    const errorData = result.data;
    if (errorData?.errors && Array.isArray(errorData.errors)) {
      const allMessages: string[] = [];
      for (const error of errorData.errors) {
        if (
          error &&
          typeof error === 'object' &&
          'messages' in error &&
          Array.isArray((error as { messages: string[] }).messages)
        ) {
          allMessages.push(...(error as { messages: string[] }).messages);
        }
      }
      if (allMessages.length > 0) {
        errorMessage += `\n\nエラー詳細:\n${allMessages.join('\n')}`;

        if (statusCode === 400) {
          errorMessage += `\n\nヒント: 不正なリクエストエラーが発生しました。`;
          errorMessage += `\n既存のデータを取得して正しい構造を確認することをお勧めします。`;
          errorMessage += `\n例: freee_api_get で既存データを取得し、正しい構造を確認してください。`;
        }
      }
    }

    if (!errorData?.errors) {
      errorMessage += `\n\n詳細: ${JSON.stringify(errorData)}`;
    }
  } else {
    errorMessage += `\n\n詳細: (JSON parse failed: ${result.error})`;
  }

  return errorMessage;
}
