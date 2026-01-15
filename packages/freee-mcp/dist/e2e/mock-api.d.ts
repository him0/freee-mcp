/**
 * Mock API helper for E2E testing
 * Provides URL-based response mapping for simulating freee APIs
 */
import { type MockInstance } from 'vitest';
export interface MockApiConfig {
    /** Override responses for specific paths */
    overrides?: Record<string, {
        status: number;
        body: unknown;
    }>;
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
 * Sets up global fetch mock for E2E testing
 */
export declare function setupMockApi(config?: MockApiConfig): MockFetchFn;
/**
 * Clears the global fetch mock
 */
export declare function clearMockApi(): void;
export {};
