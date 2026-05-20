import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { profiles, sessions } from '@/db/schema';
import { verifyPassword } from '@/lib/auth-crypto';
import { AUTH_CONFIG } from '@/lib/constants';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const referer = request.headers.get('referer');
  const redirectPath = referer
    ? new URL(referer).searchParams.get('redirect') || '/dashboard'
    : '/dashboard';

  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString()?.trim()?.toLowerCase();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
      return redirect(
        `/signin?error=Email+dan+password+harus+diisi&redirect=${encodeURIComponent(redirectPath)}`,
        302
      );
    }

    // Look up user in profiles
    const [user] = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);

    if (!user) {
      return redirect(
        `/signin?error=Email+atau+password+salah&redirect=${encodeURIComponent(redirectPath)}`,
        302
      );
    }

    // Verify PBKDF2 hash
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return redirect(
        `/signin?error=Email+atau+password+salah&redirect=${encodeURIComponent(redirectPath)}`,
        302
      );
    }

    // Create session (expires in 30 days)
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

    // Sync preferred_lang cookie with profile preference
    cookies.set('preferred_lang', user.preferred_lang || 'en', {
      path: '/',
      httpOnly: false,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    return redirect(redirectPath, 302);
  } catch (err: any) {
    return redirect(
      `/signin?error=${encodeURIComponent(err.message || 'Terjadi kesalahan')}&redirect=${encodeURIComponent(redirectPath)}`,
      302
    );
  }
};
