import { generateAuthenticationOptions } from '@simplewebauthn/server';
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const url = new URL(request.url);
    const rpID = url.hostname;

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
    });

    // Save challenge in secure HTTP-only cookie for 5 minutes
    cookies.set('passkey_login_challenge', options.challenge, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 300,
    });

    return new Response(JSON.stringify(options), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
