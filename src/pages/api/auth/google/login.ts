import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const googleClientId = locals.runtime?.env?.GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return new Response(
      'Google Client ID is not configured. Please define GOOGLE_CLIENT_ID in your environment variables.',
      { status: 500 }
    );
  }

  // Generate a secure random state
  const state = crypto.randomUUID();

  // Save the state in a cookie to verify during callback (expires in 10 minutes)
  cookies.set('google_oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 600,
  });

  // Dynamic redirect URI matching current origin
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/google/callback`;

  // Redirect to Google Consent Screen
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', googleClientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);

  return redirect(authUrl.toString(), 302);
};
