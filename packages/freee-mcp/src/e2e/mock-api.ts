/**
 * Mock API helper for E2E testing
 * Provides URL-based response mapping for simulating freee APIs
 */

import { vi, type MockInstance } from 'vitest';
import {
  mockUserResponse,
  mockCompaniesResponse,
  mockDealsResponse,
  mockDealResponse,
  mockPartnersResponse,
  mockAccountItemsResponse,
  mockInvoicesResponse,
  mockEmployeesResponse,
  mockProjectsResponse,
  mockUnauthorizedResponse,
  mockNotFoundResponse,
} from './fixtures/api-responses.js';

export interface MockApiConfig {
  /** Override responses for specific paths */
  overrides?: Record<string, { status: number; body: unknown }>;
  /** Simulate authentication failure */
  simulateAuthFailure?: boolean;
  /** Simulate network error */
  simulateNetworkError?: boolean;
  /** Custom response delay in ms */
  delay?: number;
}

interface MockResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

type MockFetchFn = MockInstance<(url: string, options?: RequestInit) => Promise<MockResponse>>;

/**
 * Creates a mock fetch function that responds based on URL patterns
 */
function createMockFetch(config: MockApiConfig = {}): MockFetchFn {
  const mockFetch = vi.fn<(url: string, options?: RequestInit) => Promise<MockResponse>>();

  mockFetch.mockImplementation(async (url: string, options?: RequestInit): Promise<MockResponse> => {
    // Apply delay if configured
    if (config.delay) {
      await new Promise((resolve) => setTimeout(resolve, config.delay));
    }

    // Simulate network error
    if (config.simulateNetworkError) {
      throw new Error('Network error: Failed to fetch');
    }

    // Simulate auth failure
    if (config.simulateAuthFailure) {
      return createMockResponse(401, mockUnauthorizedResponse);
    }

    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const method = options?.method || 'GET';

    // Check for custom overrides first
    if (config.overrides) {
      const overrideKey = `${method} ${pathname}`;
      if (overrideKey in config.overrides) {
        const override = config.overrides[overrideKey];
        return createMockResponse(override.status, override.body);
      }
    }

    // Default response routing based on URL patterns
    return routeRequest(method, pathname, urlObj);
  });

  return mockFetch;
}

function createMockResponse(status: number, body: unknown): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

function routeRequest(method: string, pathname: string, _url: URL): MockResponse {
  // Accounting API routes
  if (pathname === '/api/1/users/me') {
    return createMockResponse(200, mockUserResponse);
  }

  if (pathname === '/api/1/companies') {
    return createMockResponse(200, mockCompaniesResponse);
  }

  if (pathname === '/api/1/deals') {
    if (method === 'GET') {
      return createMockResponse(200, mockDealsResponse);
    }
    if (method === 'POST') {
      return createMockResponse(201, mockDealResponse);
    }
  }

  if (pathname.match(/^\/api\/1\/deals\/\d+$/)) {
    if (method === 'GET') {
      return createMockResponse(200, mockDealResponse);
    }
    if (method === 'PUT') {
      return createMockResponse(200, mockDealResponse);
    }
    if (method === 'DELETE') {
      return createMockResponse(204, {});
    }
  }

  if (pathname === '/api/1/partners') {
    return createMockResponse(200, mockPartnersResponse);
  }

  if (pathname === '/api/1/account_items') {
    return createMockResponse(200, mockAccountItemsResponse);
  }

  // HR API routes (base: /hr)
  if (pathname.match(/^\/hr\/api\/v1\/employees/)) {
    return createMockResponse(200, mockEmployeesResponse);
  }

  // Invoice API routes (base: /iv)
  if (pathname.match(/^\/iv\/invoices/)) {
    return createMockResponse(200, mockInvoicesResponse);
  }

  // PM API routes (base: /pm)
  if (pathname.match(/^\/pm\/api\/v1\/projects/)) {
    return createMockResponse(200, mockProjectsResponse);
  }

  // OAuth token endpoint
  if (pathname === '/oauth/token') {
    return createMockResponse(200, {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600,
    });
  }

  // Default: 404 for unknown paths
  return createMockResponse(404, mockNotFoundResponse);
}

/**
 * Sets up global fetch mock for E2E testing
 */
export function setupMockApi(config: MockApiConfig = {}): MockFetchFn {
  const mockFetch = createMockFetch(config);
  global.fetch = mockFetch as unknown as typeof fetch;
  return mockFetch;
}

/**
 * Clears the global fetch mock
 */
export function clearMockApi(): void {
  vi.mocked(global.fetch).mockClear();
}
