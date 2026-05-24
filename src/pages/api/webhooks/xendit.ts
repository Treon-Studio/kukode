import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { processXenditCallbackProgram } from '@/domain/webhook';
import { createAppRuntime } from '@/infra/runtime/app.runtime';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const callbackToken =
    locals.runtime?.env?.XENDIT_CALLBACK_TOKEN || import.meta.env.XENDIT_CALLBACK_TOKEN;
  const requestToken = request.headers.get('x-callback-token');

  try {
    const payload = await request.json();

    const appRuntime = createAppRuntime(locals);
    const runnable = processXenditCallbackProgram(payload, requestToken, callbackToken);
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
    if (err._tag === 'ValidationError') {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

