import type { NextRequest, NextResponse } from 'next/server';
import { getRedisOrFallback } from './redis';

const RATE_LIMIT_PREFIX = 'ratelimit:';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5, keyPrefix: 'login:' },
  otp: { windowMs: 5 * 60 * 1000, maxRequests: 3, keyPrefix: 'otp:' },
  passwordReset: { windowMs: 60 * 60 * 1000, maxRequests: 3, keyPrefix: 'reset:' },
  api: { windowMs: 60 * 1000, maxRequests: 100, keyPrefix: 'api:' },
  booking: { windowMs: 60 * 1000, maxRequests: 10, keyPrefix: 'booking:' },
  upload: { windowMs: 60 * 1000, maxRequests: 5, keyPrefix: 'upload:' },
};

export async function checkRateLimitRedis(
  identifier: string,
  configName: keyof typeof DEFAULT_CONFIGS | RateLimitConfig = 'api'
): Promise<{ success: boolean; remaining: number; resetAt: Date; limit: number }> {
  const config = typeof configName === 'string' ? DEFAULT_CONFIGS[configName] : configName;
  const { windowMs, maxRequests, keyPrefix = '' } = config;

  const redis = await getRedisOrFallback();

  if (!redis) {
    return { success: true, remaining: maxRequests, resetAt: new Date(Date.now() + windowMs), limit: maxRequests };
  }

  const key = `${RATE_LIMIT_PREFIX}${keyPrefix}${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zcard(key);
  pipeline.zadd(key, now, `${now}-${Math.random()}`);
  pipeline.expire(key, Math.ceil(windowMs / 1000));

  const results = await pipeline.exec();

  const requestCount = (results?.[1]?.[1] as number) || 0;
  const remaining = Math.max(0, maxRequests - requestCount - 1);
  const success = requestCount < maxRequests;
  const resetAt = new Date(now + windowMs);

  return {
    success,
    remaining,
    resetAt,
    limit: maxRequests,
  };
}

export async function incrementLoginAttempts(userId: string): Promise<number> {
  const redis = await getRedisOrFallback();
  if (!redis) return 0;

  const key = `login_attempts:${userId}`;
  const count = await redis.incr(key);
  await redis.expire(key, 15 * 60);
  return count;
}

export async function resetLoginAttempts(userId: string): Promise<void> {
  const redis = await getRedisOrFallback();
  if (!redis) return;

  await redis.del(`login_attempts:${userId}`);
  await redis.del(`locked:${userId}`);
}

export async function lockAccount(userId: string, durationMs: number = 30 * 60 * 1000): Promise<void> {
  const redis = await getRedisOrFallback();
  if (!redis) return;

  await redis.set(`locked:${userId}`, 'true', 'PX', durationMs);
}

export async function isAccountLocked(userId: string): Promise<boolean> {
  const redis = await getRedisOrFallback();
  if (!redis) return false;

  const locked = await redis.get(`locked:${userId}`);
  return locked === 'true';
}
