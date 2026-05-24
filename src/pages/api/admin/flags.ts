import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { manageFlagProgram } from '@/domain/admin';
import { createAppRuntime } from '@/infra/runtime/app.runtime';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  const profile = (locals as any).profile;

  try {
    const payload = await request.json();

    const appRuntime = createAppRuntime(locals);
    const runnable = manageFlagProgram(payload, user, profile);
    const result = await appRuntime.runPromise(runnable);

    return new Response(JSON.stringify(payload.action === 'delete' ? { success: true } : { data: result }), { status: 200 });
  } catch (err: any) {
    if (err._tag === 'UnauthorizedError') {
      return new Response(JSON.stringify({ error: err.message }), { status: 401 });
    }
    if (err._tag === 'NotFoundError') {
      return new Response(JSON.stringify({ error: err.message }), { status: 404 });
    }
    if (err._tag === 'InvalidActionError') {
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500 });
  }
};

