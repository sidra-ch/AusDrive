import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (redisClient && redisClient.status === 'ready') {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 5) {
        console.error('[Redis] Max retries reached. Falling back to in-memory.');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redisClient.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected successfully');
  });

  redisClient.on('ready', () => {
    console.log('[Redis] Client ready');
  });

  return redisClient;
}

export async function getRedisOrFallback(): Promise<Redis | null> {
  try {
    const client = getRedisClient();
    if (client.status === 'ready') {
      return client;
    }
    await client.connect();
    return client;
  } catch {
    console.warn('[Redis] Not available, falling back to in-memory operations');
    return null;
  }
}

export { Redis };
