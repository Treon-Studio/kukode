import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { calculatePotdProgram } from '@/domain/cron';
import { createAppRuntime } from '@/infra/runtime/app.runtime';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const authHeader = request.headers.get('authorization');
  const cronSecret = locals.runtime?.env?.CRON_SECRET || import.meta.env.CRON_SECRET;

  try {
    const appRuntime = createAppRuntime(locals);
    const runnable = calculatePotdProgram(authHeader, cronSecret);
    const result = await appRuntime.runPromise(runnable);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    if (err._tag === 'UnauthorizedError') {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

