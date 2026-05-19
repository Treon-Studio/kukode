import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { AUTH_CONFIG } from '@/lib/constants';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const sessionId = cookies.get(AUTH_CONFIG.COOKIE_SESSION_NAME)?.value;

  if (sessionId) {
    try {
      // Remove session from Turso
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    } catch (e) {
      console.error('Failed to clean up session in signout:', e);
    }
  }

  // Delete cookies
  cookies.delete(AUTH_CONFIG.COOKIE_SESSION_NAME, { path: '/' });

  return redirect('/', 302);
};
export const GET = POST; // Support GET signout as fallback
