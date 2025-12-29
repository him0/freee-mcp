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
