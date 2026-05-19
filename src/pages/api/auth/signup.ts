import type { APIRoute } from 'astro';
import { eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { profiles, sessions } from '@/db/schema';
import { hashPassword } from '@/lib/auth-crypto';
import { AUTH_CONFIG } from '@/lib/constants';
import { notifyUserRegistration } from '@/lib/discord';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString()?.trim()?.toLowerCase();
    const password = formData.get('password')?.toString();
    const username = formData.get('username')?.toString()?.trim()?.toLowerCase();
    const fullName = formData.get('full_name')?.toString()?.trim();

    if (!email || !password || !username) {
      return redirect('/signup?error=Semua+field+wajib+diisi', 302);
    }

    // Check if email or username already exists
    const [existing] = await db
      .select()
      .from(profiles)
      .where(or(eq(profiles.email, email), eq(profiles.username, username)))
      .limit(1);

    if (existing) {
      const errorMsg =
        existing.email === email ? 'Email sudah terdaftar.' : 'Username sudah digunakan.';
      return redirect(`/signup?error=${encodeURIComponent(errorMsg)}`, 302);
    }

    // Hash password using Web Crypto PBKDF2
    const passwordHash = await hashPassword(password);

    // Insert user into profiles
    const [newUser] = await db
      .insert(profiles)
      .values({
        email,
        password_hash: passwordHash,
        username,
        full_name: fullName || null,
        role: 'user', // Default role
      })
      .returning();

    // Create session (expires in 30 days)
    const expiresAt = Math.floor(Date.now() / 1000) + AUTH_CONFIG.SESSION_DURATION_SECONDS;
    const [newSession] = await db
      .insert(sessions)
      .values({
        user_id: newUser.id,
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

    // Notify Discord asynchronously
    notifyUserRegistration({
      username: newUser.username || '',
      email: newUser.email,
      fullName: newUser.full_name,
    }).catch(console.error);

    return redirect('/dashboard', 302);
  } catch (err: any) {
    return redirect(`/signup?error=${encodeURIComponent(err.message || 'Terjadi kesalahan')}`, 302);
  }
};
