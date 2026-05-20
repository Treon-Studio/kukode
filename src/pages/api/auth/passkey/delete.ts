import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { passkeys } from '@/db/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { passkey_id } = await request.json();

    if (!passkey_id) {
      return new Response(JSON.stringify({ error: 'passkey_id required' }), {
        status: 400,
      });
    }

    await db
      .delete(passkeys)
      .where(and(eq(passkeys.id, passkey_id), eq(passkeys.user_id, user.id)));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
