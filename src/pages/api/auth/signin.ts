import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { signinProgram } from '@/domain/auth';
import { createAppRuntime } from '@/infra/runtime/app.runtime';
import { AUTH_CONFIG } from '@/lib/constants';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals, redirect }) => {
  const referer = request.headers.get('referer');
  const redirectPath = referer
    ? new URL(referer).searchParams.get('redirect') || '/dashboard'
    : '/dashboard';

  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString()?.trim()?.toLowerCase() || '';
    const password = formData.get('password')?.toString() || '';

    const appRuntime = createAppRuntime(locals);

    const runnable = signinProgram({ email, password });
    
    const result = await createAppRuntime(locals).runPromise(runnable);

    // Set cookies
    cookies.set(AUTH_CONFIG.COOKIE_SESSION_NAME, result.sessionId, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      expires: new Date(result.expiresAt * 1000),
    });

    cookies.set('preferred_lang', result.preferredLang, {
      path: '/',
      httpOnly: false,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    const isJson = request.headers.get('Accept') === 'application/json';
    if (isJson) {
      return new Response(JSON.stringify({ success: true, redirect: redirectPath }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return redirect(redirectPath, 302);
  } catch (err: any) {
    const errorMessage = err?.message || 'Terjadi kesalahan';
    const isJson = request.headers.get('Accept') === 'application/json';
    if (isJson) {
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return redirect(
      `/signin?error=${encodeURIComponent(errorMessage)}&redirect=${encodeURIComponent(redirectPath)}`,
      302
    );
  }
};
