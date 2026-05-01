import { getRedisClient, getRedisOrFallback } from './redis';
import { v4 as uuidv4 } from 'uuid';

const LOCK_PREFIX = 'lock:';
const DEFAULT_LOCK_TTL = 10000; // 10 seconds
const LOCK_RETRY_INTERVAL = 200; // 200ms
const LOCK_MAX_RETRIES = 25; // ~5 seconds total

export async function acquireLock(
  resource: string,
  ttl: number = DEFAULT_LOCK_TTL,
  maxRetries: number = LOCK_MAX_RETRIES
): Promise<string | null> {
  const redis = await getRedisOrFallback();
  if (!redis) {
    // Fallback: return a dummy lock (no actual locking)
    return uuidv4();
  }

  const lockKey = `${LOCK_PREFIX}${resource}`;
  const lockValue = uuidv4();
  let retries = 0;

  while (retries < maxRetries) {
    const result = await redis.set(lockKey, lockValue, 'PX', ttl, 'NX');
    if (result === 'OK') {
      return lockValue;
    }

    retries++;
    await sleep(LOCK_RETRY_INTERVAL + Math.random() * 100);
  }

  return null; // Failed to acquire lock
}

export async function releaseLock(resource: string, lockValue: string): Promise<boolean> {
  const redis = await getRedisOrFallback();
  if (!redis) return true;

  const lockKey = `${LOCK_PREFIX}${resource}`;

  // Use Lua script for atomic check-and-delete
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  const result = await redis.eval(script, 1, lockKey, lockValue);
  return result === 1;
}

export async function extendLock(
  resource: string,
  lockValue: string,
  ttl: number = DEFAULT_LOCK_TTL
): Promise<boolean> {
  const redis = await getRedisOrFallback();
  if (!redis) return true;

  const lockKey = `${LOCK_PREFIX}${resource}`;

  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("pexpire", KEYS[1], ARGV[2])
    else
      return 0
    end
  `;

  const result = await redis.eval(script, 1, lockKey, lockValue, String(ttl));
  return result === 1;
}

export async function withLock<T>(
  resource: string,
  fn: () => Promise<T>,
  ttl: number = DEFAULT_LOCK_TTL
): Promise<T> {
  const lockValue = await acquireLock(resource, ttl);
  if (!lockValue) {
    throw new Error(`Failed to acquire lock for resource: ${resource}`);
  }

  try {
    return await fn();
  } finally {
    await releaseLock(resource, lockValue);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
