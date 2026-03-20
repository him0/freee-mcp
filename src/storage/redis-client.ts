import { Redis } from 'ioredis';

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
        console.error('[error] Redis: max reconnection attempts reached, giving up');
        return null;
      }
      return Math.min(times * 500, 3000);
    },
  });

  client.on('error', (err) => {
    console.error('[error] Redis connection error:', err.message);
  });

  return client;
}

export async function closeRedisClient(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
