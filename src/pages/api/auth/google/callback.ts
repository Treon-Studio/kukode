import type { APIRoute } from 'astro';
import { AUTH_CONFIG } from '@/lib/constants';
import { createAppRuntime } from '@/infra/runtime/app.runtime';
import { oauthGoogleProgram } from '@/domain/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // 1. Verify code and state parameters
  if (!code || !state) {
    return redirect('/signin?error=Invalid+request+parameters', 302);
  }

  // 2. Verify state token against state cookie
  const savedState = cookies.get('google_oauth_state')?.value;
  cookies.delete('google_oauth_state', { path: '/' });

  if (!savedState || savedState !== state) {
    return redirect('/signin?error=OAuth+state+mismatch.+Please+try+again.', 302);
  }

  const googleClientId = locals.runtime?.env?.GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
  const googleClientSecret =
    locals.runtime?.env?.GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET;

  if (!googleClientId || !googleClientSecret) {
    return redirect('/signin?error=Google+auth+is+not+configured+properly', 302);
  }

  const redirectUri = `${url.origin}/api/auth/google/callback`;

  try {
    // 3. Exchange authorization code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('Google token exchange error:', errText);
      return redirect('/signin?error=Failed+to+exchange+authorization+code', 302);
    }

    const tokens = (await tokenResponse.json()) as { access_token: string };

    // 4. Fetch user profile from Google UserInfo endpoint
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userinfoResponse.ok) {
      return redirect('/signin?error=Failed+to+fetch+user+profile+from+Google', 302);
    }

    const userInfo = (await userinfoResponse.json()) as {
      email: string;
      name?: string;
      picture?: string;
    };

    const email = userInfo.email?.trim()?.toLowerCase();
    if (!email) {
      return redirect('/signin?error=No+email+associated+with+Google+account', 302);
    }

    const preferredLang = cookies.get('preferred_lang')?.value || 'en';
    const webhookUrl = locals.runtime?.env?.DISCORD_WEBHOOK_URL;

    // 5. Run the VSA Effect Program
    const sessionResult = await createAppRuntime(locals).runPromise(
      oauthGoogleProgram({
        email,
        name: userInfo.name,
        picture: userInfo.picture,
        preferredLang,
        webhookUrl
      })
    );

    // 6. Set session cookie
    cookies.set(AUTH_CONFIG.COOKIE_SESSION_NAME, sessionResult.sessionId, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      expires: new Date(sessionResult.expiresAt * 1000),
    });
    // 7. Sync preferred_lang cookie
    cookies.set('preferred_lang', sessionResult.preferredLang, {
      path: '/',
      httpOnly: false,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    return redirect('/dashboard', 302);
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return redirect(
      `/signin?error=${encodeURIComponent(err.message || 'OAuth authentication failed')}`,
      302
    );
  }
};
