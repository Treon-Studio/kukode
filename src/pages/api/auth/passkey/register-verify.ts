import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { APIRoute } from 'astro';
import { createAppRuntime } from '@/infra/runtime/app.runtime';
import { Effect } from 'effect';
import { IAuthRepository } from '@/domain/auth';

export const prerender = false;

function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

function base64urlToBase64(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
}

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const user = (locals as any).user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const expectedChallenge = cookies.get('passkey_registration_challenge')?.value;

  if (!expectedChallenge) {
    return new Response(JSON.stringify({ error: 'Challenge expired or missing' }), { status: 400 });
  }

  try {
    const body = await request.json();
    const url = new URL(request.url);
    const origin = url.origin;
    const rpID = url.hostname;

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      const { id, publicKey, counter } = credential;

      const base64PublicKey = arrayBufferToBase64(publicKey);
      const base64CredentialID = base64urlToBase64(id);
      const transports = body.response.transports ? body.response.transports.join(',') : null;

      // Save credential via VSA Effect
      const program = Effect.gen(function* () {
        const repo = yield* IAuthRepository;
        yield* repo.createPasskey({
          userId: user.id,
          credentialId: base64CredentialID,
          publicKey: base64PublicKey,
          counter,
          transports,
        });
      });
      
      await createAppRuntime(locals).runPromise(program);

      // Clear the challenge cookie
      cookies.delete('passkey_registration_challenge', { path: '/' });

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
