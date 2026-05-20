import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { passkeys, profiles, sessions } from '@/db/schema';
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

export const POST: APIRoute = async ({ request, cookies }) => {
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

    const [passkey] = await db
      .select()
      .from(passkeys)
      .where(eq(passkeys.credential_id, standardID))
      .limit(1);

    if (!passkey) {
      return new Response(JSON.stringify({ error: 'Passkey not found' }), {
        status: 404,
      });
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: base64ToArrayBuffer(passkey.credential_id),
        credentialPublicKey: base64ToArrayBuffer(passkey.public_key),
        counter: passkey.counter,
        transports: passkey.transports ? (passkey.transports.split(',') as any[]) : undefined,
      },
    });

    if (verification.verified && verification.authenticationInfo) {
      // Update counter
      await db
        .update(passkeys)
        .set({ counter: verification.authenticationInfo.newCounter })
        .where(eq(passkeys.id, passkey.id));

      // Get user profile
      const [user] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, passkey.user_id))
        .limit(1);

      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
        });
      }

      // Create session
      const expiresAt = Math.floor(Date.now() / 1000) + AUTH_CONFIG.SESSION_DURATION_SECONDS;
      const [newSession] = await db
        .insert(sessions)
        .values({
          user_id: user.id,
          expires_at: expiresAt,
        })
        .returning();

      // Set cookie
      cookies.set(AUTH_CONFIG.COOKIE_SESSION_NAME, newSession.id, {
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
