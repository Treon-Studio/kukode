import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { featureFlags } from '@/db/schema';

// We also need a simple hash function since we can't use node crypto in all Astro envs easily without polyfills
// Using a simple djb2 hash for deterministic percentage rollout
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i); /* hash * 33 + c */
  }
  return Math.abs(hash);
}

/**
 * Checks if a feature flag is enabled for a given context.
 *
 * Evaluation priority:
 * 1. Environment Variable Override (e.g. FLAG_NEW_UI=true/false)
 * 2. Whitelist (User ID or Email matches)
 * 3. Rollout Percentage (Deterministic hash based on User ID)
 * 4. Global Enable/Disable flag from database
 */
export async function isEnabled(
  flagName: string,
  context?: { userId?: string; email?: string }
): Promise<boolean> {
  // 1. Environment Override (Highest Priority)
  const envKey = `FLAG_${flagName.toUpperCase()}`;
  if (import.meta.env[envKey] !== undefined) {
    return import.meta.env[envKey] === 'true';
  }

  // Fetch flag config from Turso DB
  try {
    const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.name, flagName));

    if (!flag) return false;

    // If env_override is enabled in DB, we already checked the env variable above.
    // If it wasn't set, we continue to the next checks.

    // 2. Whitelist
    if (context && flag.whitelist && flag.whitelist.length > 0) {
      if (
        (context.userId && flag.whitelist.includes(context.userId)) ||
        (context.email && flag.whitelist.includes(context.email))
      ) {
        return true;
      }
    }

    // 3. Rollout Percentage (Deterministic)
    if (flag.rollout_percentage > 0 && flag.rollout_percentage < 100) {
      if (context?.userId) {
        // Create a consistent hash based on user ID and flag name
        const hash = djb2Hash(`${flagName}-${context.userId}`);
        const bucket = hash % 100; // 0 to 99
        if (bucket < flag.rollout_percentage) {
          return true;
        }
      }
      // If no user ID is provided, we can't do percentage rollout deterministically,
      // so we fall back to the global flag.
    }

    // 4. Global Flag
    if (flag.rollout_percentage === 100) return true;

    return flag.is_enabled;
  } catch (error) {
    console.error(`Failed to fetch flag ${flagName}:`, error);
    return false; // Fail safe
  }
}
