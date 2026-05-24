import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { signupProgram } from '@/domain/auth';
import { createAppRuntime } from '@/infra/runtime/app.runtime';
import { AUTH_CONFIG } from '@/lib/constants';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals, redirect }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString()?.trim()?.toLowerCase() || '';
    const password = formData.get('password')?.toString() || '';
    const username = formData.get('username')?.toString()?.trim()?.toLowerCase() || '';
    const fullName = formData.get('full_name')?.toString()?.trim() || '';

    const preferredLang = cookies.get('preferred_lang')?.value || 'en';
    const webhookUrl = locals.runtime?.env?.DISCORD_WEBHOOK_URL;

    const appRuntime = createAppRuntime(locals);

    const runnable = signupProgram(
      { email, password, username, fullName, preferredLang }, 
      webhookUrl
    );
    
    const result = await createAppRuntime(locals).runPromise(runnable);

    // Set cookie
    cookies.set(AUTH_CONFIG.COOKIE_SESSION_NAME, result.sessionId, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      expires: new Date(result.expiresAt * 1000),
    });

    const isJson = request.headers.get('Accept') === 'application/json';
    if (isJson) {
      return new Response(JSON.stringify({ success: true, redirect: '/dashboard' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return redirect('/dashboard', 302);
  } catch (err: any) {
    const errorMessage = err?.message || 'Terjadi kesalahan';
    const isJson = request.headers.get('Accept') === 'application/json';
    if (isJson) {
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return redirect(`/signup?error=${encodeURIComponent(errorMessage)}`, 302);
  }
};
