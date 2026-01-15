/**
 * Safely parses JSON from a Response object.
 * Returns an empty object if parsing fails.
 *
 * @param response - The fetch Response object to parse
 * @returns Parsed JSON data or empty object on failure
 */
export declare function safeParseJson(response: Response): Promise<Record<string, unknown>>;
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
export declare function createTextResponse(text: string): TextResponse;
/**
 * Formats an error into a string message.
 * Handles both Error instances and other thrown values.
 *
 * @param error - The error to format
 * @returns Formatted error message string
 */
export declare function formatErrorMessage(error: unknown): string;
