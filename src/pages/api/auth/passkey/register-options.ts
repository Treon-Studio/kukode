import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { APIRoute } from 'astro';
import { createAppRuntime } from '@/infra/runtime/app.runtime';
import { Effect } from 'effect';
import { IAuthRepository } from '@/domain/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, cookies }) => {
  const user = (locals as any).user;
  const profile = (locals as any).profile;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const rpID = url.hostname;

    // Get user's existing passkeys to exclude them
    const program = Effect.gen(function* () {
      const repo = yield* IAuthRepository;
      return yield* repo.getPasskeysByUserId(user.id);
    });
    
    const existing = await createAppRuntime(locals).runPromise(program);

    const options = await generateRegistrationOptions({
      rpName: 'Kukode',
      rpID,
      userID: new TextEncoder().encode(user.id),
      userName: profile?.username || user.email,
      userDisplayName: profile?.full_name || profile?.username || user.email,
      excludeCredentials: existing.map((p) => ({
        id: p.credential_id,
        type: 'public-key' as const,
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    // Save challenge in secure HTTP-only cookie for 5 minutes
    cookies.set('passkey_registration_challenge', options.challenge, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
    });

    return new Response(JSON.stringify(options), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
