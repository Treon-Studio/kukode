import { db } from '@/db';
import { siteEvents } from '@/db/schema';
import { getRedis } from '@/lib/ratelimit';

export interface RecordEventParams {
  siteId?: string;
  eventType: 'view' | 'click';
  referrer?: string;
  ip?: string;
  userId?: string;
  country?: string;
  city?: string;
  env: any;
}

/**
 * Records a visitor event in both SQLite (site_events) for granular analytics
 * and Upstash Redis HyperLogLog for platform-wide unique DAU/MAU counts.
 */
export async function recordEvent(params: RecordEventParams) {
  // 1. Record event in Turso Database
  try {
    await db.insert(siteEvents).values({
      site_id: params.siteId || null,
      event_type: params.eventType,
      referrer: params.referrer || null,
      country: params.country || null,
      city: params.city || null,
    });
  } catch (err) {
    console.error('[Analytics] Failed to write event to DB:', err);
  }

  // 2. Record unique user tracking via HyperLogLog in Redis
  const redis = getRedis(params.env);
  if (!redis) return;

  try {
    const identifier = params.userId || params.ip || 'anonymous';
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const monthStr = todayStr.substring(0, 7); // YYYY-MM

    const dauKey = `dau:${todayStr}`;
    const mauKey = `mau:${monthStr}`;

    // Add unique identifier to HLL structures (PFADD)
    await Promise.all([redis.pfadd(dauKey, identifier), redis.pfadd(mauKey, identifier)]);
  } catch (err) {
    console.error('[Analytics] Failed to update HyperLogLog in Redis:', err);
  }
}

/**
 * Returns platform-wide unique visitor metrics.
 */
export async function getPlatformStats(env: any) {
  const redis = getRedis(env);
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const monthStr = todayStr.substring(0, 7); // YYYY-MM

  let dau = 0;
  let mau = 0;

  if (redis) {
    try {
      dau = await redis.pfcount(`dau:${todayStr}`);
      mau = await redis.pfcount(`mau:${monthStr}`);
    } catch (err) {
      console.error('[Analytics] Failed to count HyperLogLog uniques:', err);
    }
  }

  return { dau, mau };
}
