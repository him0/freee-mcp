import { Redis } from 'ioredis';
import { getLogger } from '../server/logger.js';

let client: Redis | null = null;

export type { Redis };

export function getRedisClient(url?: string): Redis {
  if (client) {
    return client;
  }

  const redisUrl = url || process.env.REDIS_URL || 'redis://localhost:6379';
  client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) {
        getLogger().error('Redis: max reconnection attempts reached, giving up');
        return null;
      }
      return Math.min(times * 500, 3000);
    },
  });

  client.on('error', (err) => {
    getLogger().error({ err: err.message }, 'Redis connection error');
  });

  return client;
}

export async function closeRedisClient(): Promise<void> {
  if (client) {
    const c = client;
    client = null;
    try {
      await c.quit();
    } catch {
      // Ignore errors during shutdown (e.g. connection already closing)
      c.disconnect();
    }
  }
}
