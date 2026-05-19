import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { featureFlags } from '@/db/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const profile = (locals as any).profile;

  if (profile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const {
      action,
      id,
      name,
      description,
      is_enabled,
      env_override,
      whitelist,
      rollout_percentage,
    } = await request.json();

    if (action === 'toggle') {
      const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.id, id));
      if (!flag) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

      const [updated] = await db
        .update(featureFlags)
        .set({ is_enabled: !flag.is_enabled })
        .where(eq(featureFlags.id, id))
        .returning();

      return new Response(JSON.stringify({ data: updated }), { status: 200 });
    }

    if (action === 'create') {
      const [newFlag] = await db
        .insert(featureFlags)
        .values({
          name,
          description,
          is_enabled,
          env_override,
          whitelist: whitelist ? whitelist.split(',').map((s: string) => s.trim()) : [],
          rollout_percentage: rollout_percentage || 0,
        })
        .returning();
      return new Response(JSON.stringify({ data: newFlag }), { status: 200 });
    }

    if (action === 'update') {
      const [updated] = await db
        .update(featureFlags)
        .set({
          name,
          description,
          is_enabled,
          env_override,
          whitelist: whitelist ? whitelist.split(',').map((s: string) => s.trim()) : [],
          rollout_percentage: rollout_percentage || 0,
        })
        .where(eq(featureFlags.id, id))
        .returning();
      return new Response(JSON.stringify({ data: updated }), { status: 200 });
    }

    if (action === 'delete') {
      await db.delete(featureFlags).where(eq(featureFlags.id, id));
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
