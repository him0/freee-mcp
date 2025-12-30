/**
 * Mock API responses for E2E testing
 * These fixtures simulate freee API responses
 */

// User info response
export const mockUserResponse = {
  user: {
    id: 1,
    email: 'test@example.com',
    display_name: 'テストユーザー',
    first_name: '太郎',
    last_name: 'テスト',
    first_name_kana: 'タロウ',
    last_name_kana: 'テスト',
  },
};

// Companies list response
export const mockCompaniesResponse = {
  companies: [
    {
      id: 12345,
      name: 'テスト株式会社',
      name_kana: 'テストカブシキガイシャ',
      display_name: 'テスト株式会社',
      role: 'admin',
    },
    {
      id: 67890,
      name: 'サンプル合同会社',
      name_kana: 'サンプルゴウドウガイシャ',
      display_name: 'サンプル合同会社',
      role: 'member',
    },
  ],
};

// Deals list response
export const mockDealsResponse = {
  deals: [
    {
      id: 101,
      company_id: 12345,
      issue_date: '2024-01-15',
      due_date: '2024-02-15',
      amount: 10000,
      type: 'income',
      ref_number: 'DEAL-001',
      status: 'settled',
    },
    {
      id: 102,
      company_id: 12345,
      issue_date: '2024-01-20',
      due_date: '2024-02-20',
      amount: 25000,
      type: 'expense',
      ref_number: 'DEAL-002',
      status: 'unsettled',
    },
  ],
  meta: {
    total_count: 2,
  },
};

// Single deal response
export const mockDealResponse = {
  deal: {
    id: 101,
    company_id: 12345,
    issue_date: '2024-01-15',
    due_date: '2024-02-15',
    amount: 10000,
    type: 'income',
    ref_number: 'DEAL-001',
    status: 'settled',
    partner_id: 201,
    partner_name: '取引先A',
    details: [
      {
        id: 1001,
        account_item_id: 301,
        account_item_name: '売上高',
        tax_code: 1,
        amount: 10000,
        description: '商品販売',
      },
    ],
  },
};

// Partners list response
export const mockPartnersResponse = {
  partners: [
    {
      id: 201,
      company_id: 12345,
      name: '取引先A株式会社',
      code: 'PARTNER-001',
      shortcut1: 'A社',
    },
    {
      id: 202,
      company_id: 12345,
      name: '取引先B有限会社',
      code: 'PARTNER-002',
      shortcut1: 'B社',
    },
  ],
};

// Account items response
export const mockAccountItemsResponse = {
  account_items: [
    {
      id: 301,
      name: '売上高',
      shortcut: 'ウリアゲ',
      account_category: 'income',
      account_category_id: 10,
    },
    {
      id: 302,
      name: '仕入高',
      shortcut: 'シイレ',
      account_category: 'expense',
      account_category_id: 20,
    },
  ],
};

// Invoice list response (invoice API)
export const mockInvoicesResponse = {
  invoices: [
    {
      id: 'inv-001',
      company_id: 12345,
      invoice_number: 'INV-2024-001',
      partner_name: '取引先A株式会社',
      invoice_date: '2024-01-15',
      due_date: '2024-02-15',
      total_amount: 110000,
      invoice_status: 'sent',
    },
  ],
  meta: {
    total_count: 1,
  },
};

// HR employees response (hr API)
export const mockEmployeesResponse = {
  employees: [
    {
      id: 501,
      company_id: 12345,
      num: 'EMP-001',
      display_name: '山田 太郎',
      email: 'yamada@example.com',
      entry_date: '2020-04-01',
    },
    {
      id: 502,
      company_id: 12345,
      num: 'EMP-002',
      display_name: '鈴木 花子',
      email: 'suzuki@example.com',
      entry_date: '2021-10-01',
    },
  ],
};

// PM projects response (pm API)
export const mockProjectsResponse = {
  projects: [
    {
      id: 601,
      company_id: 12345,
      name: 'プロジェクトA',
      code: 'PROJ-001',
      status: 'active',
    },
    {
      id: 602,
      company_id: 12345,
      name: 'プロジェクトB',
      code: 'PROJ-002',
      status: 'completed',
    },
  ],
};

// Error responses
export const mockUnauthorizedResponse = {
  error: 'invalid_token',
  error_description: 'The access token is invalid or has expired.',
};

export const mockForbiddenResponse = {
  error: 'insufficient_scope',
  error_description: 'The access token does not have the required scope.',
};

export const mockBadRequestResponse = {
  status_code: 400,
  errors: [
    {
      type: 'validation',
      messages: ['issue_date is required', 'amount must be positive'],
    },
  ],
};

export const mockNotFoundResponse = {
  status_code: 404,
  errors: [
    {
      type: 'not_found',
      messages: ['The requested resource was not found.'],
    },
  ],
};

export const mockServerErrorResponse = {
  status_code: 500,
  errors: [
    {
      type: 'internal_error',
      messages: ['An internal server error occurred.'],
    },
  ],
};

// Token responses for OAuth
export const mockTokenResponse = {
  access_token: 'mock-access-token-12345',
  refresh_token: 'mock-refresh-token-67890',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'read write',
  created_at: Math.floor(Date.now() / 1000),
};

export const mockRefreshedTokenResponse = {
  access_token: 'mock-refreshed-access-token-abcde',
  refresh_token: 'mock-refreshed-refresh-token-fghij',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'read write',
  created_at: Math.floor(Date.now() / 1000),
};
