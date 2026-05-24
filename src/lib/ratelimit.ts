import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Map of route paths or groups to their respective rate limit configurations
const limiters: Record<string, { limit: number; window: string }> = {
  auth: { limit: 5, window: '60s' }, // 5 requests per minute
  action: { limit: 15, window: '60s' }, // 15 requests per minute
};

// Cached instances
let redisInstance: Redis | null = null;
const ratelimitInstances = new Map<string, Ratelimit>();

export function getRedis(env: any): Redis | null {
  const url =
    env?.UPSTASH_REDIS_REST_URL ||
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.UPSTASH_REDIS_REST_URL
      : undefined) ||
    process.env.UPSTASH_REDIS_REST_URL;

  const token =
    env?.UPSTASH_REDIS_REST_TOKEN ||
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.UPSTASH_REDIS_REST_TOKEN
      : undefined) ||
    process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  if (!redisInstance) {
    redisInstance = new Redis({ url, token });
  }
  return redisInstance;
}

export function getRatelimit(type: 'auth' | 'action', env: any): Ratelimit | null {
  const redis = getRedis(env);
  if (!redis) return null;

  const key = `${type}_limiter`;
  if (!ratelimitInstances.has(key)) {
    const config = limiters[type];
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, config.window as any),
      analytics: true,
      prefix: `@ratelimit/${type}`,
    });
    ratelimitInstances.set(key, ratelimit);
  }
  return ratelimitInstances.get(key) || null;
}

export async function checkRateLimit(
  type: 'auth' | 'action',
  identifier: string,
  env: any
): Promise<{ success: boolean; limit: number; remaining: number; reset: number } | null> {
  try {
    const ratelimit = getRatelimit(type, env);
    if (!ratelimit) {
      // Graceful degradation: skip rate limiting if Upstash Redis is not configured
      return null;
    }

    const result = await ratelimit.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    // Graceful degradation: if Redis call fails, log it but don't block the request
    console.error(`[RateLimit] Error executing check for ${type}/${identifier}:`, error);
    return null;
  }
}
