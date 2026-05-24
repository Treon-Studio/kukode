import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { approveSiteProgram } from '@/domain/admin';
import { createAppRuntime } from '@/infra/runtime/app.runtime';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  const profile = (locals as any).profile;

  try {
    const { site_id } = await request.json();

    const appRuntime = createAppRuntime(locals);
    const runnable = approveSiteProgram({ site_id }, user, profile);
    await appRuntime.runPromise(runnable);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    if (err._tag === 'UnauthorizedError') {
      return new Response(JSON.stringify({ error: err.message }), { status: 401 });
    }
    if (err._tag === 'NotFoundError') {
      return new Response(JSON.stringify({ error: err.message }), { status: 404 });
    }
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500 });
  }
};

