import { describe, it, expect } from 'vitest';
import { RedisUnavailableError } from './errors.js';

describe('RedisUnavailableError', () => {
  it('should include operation name in message', () => {
    const err = new RedisUnavailableError('saveTokens');
    expect(err.message).toBe('Redis unavailable during saveTokens');
    expect(err.name).toBe('RedisUnavailableError');
  });

  it('should preserve cause error', () => {
    const cause = new Error('Connection refused');
    const err = new RedisUnavailableError('loadTokens', cause);
    expect(err.cause).toBe(cause);
  });

  it('should be instanceof Error', () => {
    const err = new RedisUnavailableError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(RedisUnavailableError);
  });
});
