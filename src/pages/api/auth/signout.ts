import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { signoutProgram } from '@/domain/auth';
import { createAppRuntime } from '@/infra/runtime/app.runtime';
import { AUTH_CONFIG } from '@/lib/constants';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, locals, redirect }) => {
  const sessionId = cookies.get(AUTH_CONFIG.COOKIE_SESSION_NAME)?.value;

  if (sessionId) {
    const appRuntime = createAppRuntime(locals);
    const runnable = signoutProgram(sessionId);
    await createAppRuntime(locals).runPromise(runnable);
  }

  // Delete cookies
  cookies.delete(AUTH_CONFIG.COOKIE_SESSION_NAME, { path: '/' });

  return redirect('/', 302);
};
export const GET = POST; // Support GET signout as fallback

