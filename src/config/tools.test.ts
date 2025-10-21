import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  matchesPattern,
  extractResourceName,
  shouldEnableTool,
  toolConfig,
} from './tools.js';

describe('Tool Filtering', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('matchesPattern', () => {
    it('should match exact patterns', () => {
      expect(matchesPattern('get_deals', ['get_deals'])).toBe(true);
      expect(matchesPattern('get_deals', ['post_deals'])).toBe(false);
    });

    it('should match wildcard patterns', () => {
      expect(matchesPattern('get_deals', ['get_*'])).toBe(true);
      expect(matchesPattern('post_deals', ['get_*'])).toBe(false);
      expect(matchesPattern('delete_deals_by_id', ['delete_*'])).toBe(true);
    });

    it('should match any pattern in array', () => {
      expect(matchesPattern('get_deals', ['post_*', 'get_*'])).toBe(true);
      expect(matchesPattern('put_deals', ['get_*', 'delete_*'])).toBe(false);
    });

    it('should handle empty patterns array', () => {
      expect(matchesPattern('get_deals', [])).toBe(false);
    });

    it('should match complex wildcard patterns', () => {
      expect(matchesPattern('delete_deals_by_id', ['*_by_id'])).toBe(true);
      expect(matchesPattern('get_deals', ['*_by_id'])).toBe(false);
    });
  });

  describe('extractResourceName', () => {
    it('should extract resource name from simple paths', () => {
      expect(extractResourceName('/api/1/deals')).toBe('deals');
      expect(extractResourceName('/api/1/companies')).toBe('companies');
      expect(extractResourceName('/api/1/users')).toBe('users');
    });

    it('should extract resource name from paths with parameters', () => {
      expect(extractResourceName('/api/1/deals/{id}')).toBe('deals');
      expect(extractResourceName('/api/1/companies/{id}/users')).toBe('companies');
    });

    it('should handle paths starting with parameters', () => {
      expect(extractResourceName('/api/1/{company_id}/deals')).toBe('deals');
    });

    it('should handle empty or invalid paths', () => {
      expect(extractResourceName('')).toBe('');
      expect(extractResourceName('/api/1')).toBe('');
    });
  });

  describe('shouldEnableTool', () => {
    beforeEach(() => {
      // Clear all filter environment variables for each test
      delete process.env.FREEE_ENABLE_READ;
      delete process.env.FREEE_ENABLE_WRITE;
      delete process.env.FREEE_ENABLE_DELETE;
      delete process.env.FREEE_ENABLED_RESOURCES;
      delete process.env.FREEE_ENABLED_TOOLS;
      delete process.env.FREEE_DISABLED_TOOLS;

      // Reset toolConfig
      toolConfig.enableRead = true;
      toolConfig.enableWrite = true;
      toolConfig.enableDelete = false;
      toolConfig.enabledResources = [];
      toolConfig.enabledTools = [];
      toolConfig.disabledTools = [];
    });

    it('should enable all tools by default', () => {
      expect(shouldEnableTool('get_deals', 'get', 'deals')).toBe(true);
      expect(shouldEnableTool('post_deals', 'post', 'deals')).toBe(true);
      expect(shouldEnableTool('put_deals_by_id', 'put', 'deals')).toBe(true);
    });

    it('should disable DELETE operations by default', () => {
      expect(shouldEnableTool('delete_deals_by_id', 'delete', 'deals')).toBe(false);
    });

    it('should respect enableRead flag', () => {
      toolConfig.enableRead = false;
      expect(shouldEnableTool('get_deals', 'get', 'deals')).toBe(false);
      expect(shouldEnableTool('post_deals', 'post', 'deals')).toBe(true);
    });

    it('should respect enableWrite flag', () => {
      toolConfig.enableWrite = false;
      expect(shouldEnableTool('post_deals', 'post', 'deals')).toBe(false);
      expect(shouldEnableTool('put_deals_by_id', 'put', 'deals')).toBe(false);
      expect(shouldEnableTool('get_deals', 'get', 'deals')).toBe(true);
    });

    it('should respect enableDelete flag', () => {
      toolConfig.enableDelete = true;
      expect(shouldEnableTool('delete_deals_by_id', 'delete', 'deals')).toBe(true);
    });

    it('should filter by enabled resources', () => {
      toolConfig.enabledResources = ['deals', 'companies'];
      expect(shouldEnableTool('get_deals', 'get', 'deals')).toBe(true);
      expect(shouldEnableTool('get_companies', 'get', 'companies')).toBe(true);
      expect(shouldEnableTool('get_users', 'get', 'users')).toBe(false);
    });

    it('should respect enabled tools whitelist', () => {
      toolConfig.enabledTools = ['get_deals', 'post_deals'];
      expect(shouldEnableTool('get_deals', 'get', 'deals')).toBe(true);
      expect(shouldEnableTool('post_deals', 'post', 'deals')).toBe(true);
      expect(shouldEnableTool('get_companies', 'get', 'companies')).toBe(false);
    });

    it('should respect disabled tools blacklist', () => {
      toolConfig.disabledTools = ['delete_*', 'put_*_by_id'];
      expect(shouldEnableTool('delete_deals_by_id', 'delete', 'deals')).toBe(false);
      expect(shouldEnableTool('put_deals_by_id', 'put', 'deals')).toBe(false);
      expect(shouldEnableTool('get_deals', 'get', 'deals')).toBe(true);
    });

    it('should prioritize whitelist over other filters', () => {
      toolConfig.enabledTools = ['delete_deals_by_id'];
      toolConfig.enableDelete = false;
      toolConfig.disabledTools = ['delete_*'];

      // Whitelist should take priority
      expect(shouldEnableTool('delete_deals_by_id', 'delete', 'deals')).toBe(true);
    });

    it('should prioritize blacklist over operation type filters', () => {
      toolConfig.disabledTools = ['get_deals'];
      toolConfig.enableRead = true;

      // Blacklist should take priority over enableRead
      expect(shouldEnableTool('get_deals', 'get', 'deals')).toBe(false);
    });

    it('should handle case-insensitive method names', () => {
      expect(shouldEnableTool('get_deals', 'GET', 'deals')).toBe(true);
      expect(shouldEnableTool('post_deals', 'POST', 'deals')).toBe(true);

      toolConfig.enableWrite = false;
      expect(shouldEnableTool('post_deals', 'POST', 'deals')).toBe(false);
    });
  });
});
