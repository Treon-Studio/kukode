import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { createAppRuntime } from '@/infra/runtime/app.runtime';
import { IAuthRepository } from '@/domain/auth';

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

    const program = Effect.gen(function* () {
      const repo = yield* IAuthRepository;
      yield* repo.deletePasskey(passkey_id, user.id);
    });

    await createAppRuntime(locals).runPromise(program);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
