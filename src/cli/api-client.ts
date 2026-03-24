import { FREEE_API_URL } from '../constants.js';
import { formatResponseErrorInfo } from '../utils/error.js';
import { type Company, CompaniesResponseSchema, HrUsersMeResponseSchema } from './types.js';

export async function fetchCompanies(accessToken: string): Promise<Company[]> {
  let companies: Company[] = [];
  try {
    companies = await fetchAccountingCompanies(accessToken);
  } catch {
    // Accounting API failed - will fall back to HR API below
  }
  if (companies.length === 0) {
    // Fall back to HR API when accounting API fails or returns no companies (e.g., HR-only users)
    try {
      companies = await fetchHrCompanies(accessToken);
    } catch {
      // HR API also failed - return empty array
    }
  }
  return companies;
}

async function fetchAccountingCompanies(accessToken: string): Promise<Company[]> {
  const response = await fetch(`${FREEE_API_URL}/api/1/companies`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorInfo = await formatResponseErrorInfo(response);
    throw new Error(`事業所一覧の取得に失敗しました: ${response.status} ${errorInfo}`);
  }

  const jsonData: unknown = await response.json();
  const parseResult = CompaniesResponseSchema.safeParse(jsonData);
  if (!parseResult.success) {
    throw new Error(`Invalid companies response format: ${parseResult.error.message}`);
  }
  return parseResult.data.companies || [];
}

async function fetchHrCompanies(accessToken: string): Promise<Company[]> {
  const response = await fetch(`${FREEE_API_URL}/hr/api/v1/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorInfo = await formatResponseErrorInfo(response);
    throw new Error(`事業所一覧の取得に失敗しました（HR API）: ${response.status} ${errorInfo}`);
  }

  const jsonData: unknown = await response.json();
  const parseResult = HrUsersMeResponseSchema.safeParse(jsonData);
  if (!parseResult.success) {
    throw new Error(`Invalid HR users/me response format: ${parseResult.error.message}`);
  }

  const hrCompanies = parseResult.data.companies || [];
  return hrCompanies.map((c) => ({
    id: c.id,
    name: c.name,
    name_kana: c.name_kana ?? null,
    // HR API's display_name is the employee's name, not the company's.
    // Use company name instead to match what accounting API returns.
    display_name: c.name || `事業所 ${c.id}`,
    role: c.role,
  }));
}
