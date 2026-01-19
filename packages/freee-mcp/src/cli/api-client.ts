import { FREEE_API_URL } from '../constants.js';
import { parseJsonResponse } from '../utils/error.js';
import { Company, CompaniesResponseSchema } from './types.js';

export async function fetchCompanies(accessToken: string): Promise<Company[]> {
  const response = await fetch(`${FREEE_API_URL}/api/1/companies`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const result = await parseJsonResponse(response);
    const errorInfo = result.success
      ? JSON.stringify(result.data)
      : `(JSON parse failed: ${result.error})`;
    throw new Error(
      `事業所一覧の取得に失敗しました: ${response.status} ${errorInfo}`,
    );
  }

  const jsonData: unknown = await response.json();
  const parseResult = CompaniesResponseSchema.safeParse(jsonData);
  if (!parseResult.success) {
    throw new Error(`Invalid companies response format: ${parseResult.error.message}`);
  }
  return parseResult.data.companies || [];
}
