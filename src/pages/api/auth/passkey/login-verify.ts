import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { APIRoute } from 'astro';
import { createAppRuntime } from '@/infra/runtime/app.runtime';
import { passkeyLoginVerifyProgram } from '@/domain/auth';
import { AUTH_CONFIG } from '@/lib/constants';

export const prerender = false;

function base64urlToBase64(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const expectedChallenge = cookies.get('passkey_login_challenge')?.value;

  if (!expectedChallenge) {
    return new Response(JSON.stringify({ error: 'Challenge expired or missing' }), { status: 400 });
  }

  try {
    const body = await request.json();
    const url = new URL(request.url);
    const origin = url.origin;
    const rpID = url.hostname;

    const standardID = base64urlToBase64(body.id);

    const result = await createAppRuntime(locals).runPromise(passkeyLoginVerifyProgram({ standardID }));
    const { passkey, user } = result;

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: body.id,
        publicKey: base64ToArrayBuffer(passkey.public_key) as any,
        counter: passkey.counter,
        transports: passkey.transports ? (passkey.transports.split(',') as any[]) : undefined,
      },
    });

    if (verification.verified && verification.authenticationInfo) {
      // Create session and update counter through a second program?
      // Wait, we need to update counter and create session!
      // Let's just create a new program `passkeyLoginCompleteProgram` or do it in the route.
      // Doing it in a program is better! But we already have `IAuthRepository` available via `createAppRuntime(locals).runPromise(Effect.gen(function*() {...}))`.
      
      const { Effect } = await import('effect');
      const { IAuthRepository } = await import('@/domain/auth');
      
      const completeProgram = createAppRuntime(locals).runPromise(
        Effect.gen(function* () {
          const repo = yield* IAuthRepository;
          yield* repo.updatePasskeyCounter(passkey.id, verification.authenticationInfo!.newCounter);
          const expiresAt = Math.floor(Date.now() / 1000) + AUTH_CONFIG.SESSION_DURATION_SECONDS;
          const session = yield* repo.createSession(user.id, expiresAt);
          return { session, expiresAt };
        })
      );
      
      const { session, expiresAt } = await completeProgram;

      // Set cookie
      cookies.set(AUTH_CONFIG.COOKIE_SESSION_NAME, session.id, {
        path: '/',
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        expires: new Date(expiresAt * 1000),
      });

      // Sync preferred_lang cookie
      cookies.set('preferred_lang', user.preferred_lang || 'en', {
        path: '/',
        httpOnly: false,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      // Clear challenge cookie
      cookies.delete('passkey_login_challenge', { path: '/' });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Verification failed' }), {
        status: 400,
      });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
