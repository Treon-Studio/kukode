import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { APIRoute } from 'astro';
import { db } from '@/db';
import { passkeys } from '@/db/schema';

export const prerender = false;

function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
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
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

      const base64PublicKey = arrayBufferToBase64(credentialPublicKey);
      const base64CredentialID = arrayBufferToBase64(credentialID);

      // Save credential
      await db.insert(passkeys).values({
        user_id: user.id,
        credential_id: base64CredentialID,
        public_key: base64PublicKey,
        counter,
        transports: body.response.transports ? body.response.transports.join(',') : undefined,
      });

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
