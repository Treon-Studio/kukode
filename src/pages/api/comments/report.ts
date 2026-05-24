import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { reportCommentProgram } from '@/domain/comments';
import { createAppRuntime } from '@/infra/runtime/app.runtime';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;

  try {
    const payload = await request.json();

    const appRuntime = createAppRuntime(locals);
    const runnable = reportCommentProgram(payload, user);
    const result = await appRuntime.runPromise(runnable);

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (err: any) {
    if (err._tag === 'UnauthorizedError') {
      return new Response(JSON.stringify({ error: err.message }), { status: 401 });
    }
    if (err._tag === 'ValidationError') {
      return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
    if (err._tag === 'NotFoundError') {
      return new Response(JSON.stringify({ error: err.message }), { status: 404 });
    }
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500 });
  }
};

