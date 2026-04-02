import { afterEach, describe, expect, it, vi } from 'vitest';

// Create shared mock functions that persist across module resets
const mockInstances: Array<{
  quit: ReturnType<typeof vi.fn>;
  ping: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}> = [];

vi.mock('ioredis', () => {
  return {
    Redis: vi.fn().mockImplementation(() => {
      const instance = {
        quit: vi.fn().mockResolvedValue('OK'),
        ping: vi.fn().mockResolvedValue('PONG'),
        disconnect: vi.fn(),
        on: vi.fn().mockReturnThis(),
      };
      mockInstances.push(instance);
      return instance;
    }),
  };
});

describe('redis-client', () => {
  afterEach(() => {
    mockInstances.length = 0;
    delete process.env.REDIS_URL;
    vi.resetModules();
  });

  it('should create a Redis client with default URL', async () => {
    const { getRedisClient } = await import('./redis-client.js');
    const { Redis } = await import('ioredis');

    const client = getRedisClient();

    expect(Redis).toHaveBeenCalledWith(
      'redis://localhost:6379',
      expect.objectContaining({
        maxRetriesPerRequest: 3,
      }),
    );
    expect(client).toBeDefined();
  });

  it('should create a Redis client with custom URL', async () => {
    const { getRedisClient } = await import('./redis-client.js');
    const { Redis } = await import('ioredis');

    getRedisClient('redis://custom:6380');

    expect(Redis).toHaveBeenCalledWith('redis://custom:6380', expect.any(Object));
  });

  it('should return the same singleton instance', async () => {
    const { getRedisClient } = await import('./redis-client.js');

    const client1 = getRedisClient();
    const client2 = getRedisClient();

    expect(client1).toBe(client2);
    expect(mockInstances).toHaveLength(1);
  });

  it('should use REDIS_URL env var when no URL provided', async () => {
    process.env.REDIS_URL = 'redis://env-host:6381';
    const { getRedisClient } = await import('./redis-client.js');
    const { Redis } = await import('ioredis');

    getRedisClient();

    expect(Redis).toHaveBeenCalledWith('redis://env-host:6381', expect.any(Object));
  });

  it('should close the client and allow new creation', async () => {
    const { getRedisClient, closeRedisClient } = await import('./redis-client.js');

    const client1 = getRedisClient();
    await closeRedisClient();
    expect(mockInstances[0].quit).toHaveBeenCalledOnce();

    const client2 = getRedisClient();
    expect(client1).not.toBe(client2);
    expect(mockInstances).toHaveLength(2);
  });

  it('should handle closeRedisClient when no client exists', async () => {
    const { closeRedisClient } = await import('./redis-client.js');
    await expect(closeRedisClient()).resolves.toBeUndefined();
    expect(mockInstances).toHaveLength(0);
  });

  it('should fall back to disconnect when quit throws', async () => {
    const { getRedisClient, closeRedisClient } = await import('./redis-client.js');

    getRedisClient();
    mockInstances[0].quit.mockRejectedValueOnce(new Error('Connection is closed.'));

    await closeRedisClient();
    expect(mockInstances[0].quit).toHaveBeenCalledOnce();
    expect(mockInstances[0].disconnect).toHaveBeenCalledOnce();
  });
});
