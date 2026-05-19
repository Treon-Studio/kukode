import { defineMiddleware } from 'astro:middleware';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { profiles, sessions } from '@/db/schema';
import { AUTH_CONFIG } from '@/lib/constants';

/**
 * Astro middleware — runs on every server-rendered request.
 * 1. Checks for a valid session cookie from Turso database.
 * 2. Invalidate expired sessions automatically.
 * 3. Protects /dashboard/* and /admin/* routes.
 * 4. Stores `user` and `profile` on `Astro.locals` for downstream pages.
 */
export const onRequest = defineMiddleware(
  async ({ request, cookies, locals, url, redirect }, next) => {
    const sessionId = cookies.get(AUTH_CONFIG.COOKIE_SESSION_NAME)?.value;

    (locals as any).user = null;
    (locals as any).profile = null;

    if (sessionId) {
      try {
        const now = Math.floor(Date.now() / 1000);

        // Look up session in Turso and join with profiles
        const [sessionWithUser] = await db
          .select({
            session: sessions,
            user: profiles,
          })
          .from(sessions)
          .innerJoin(profiles, eq(sessions.user_id, profiles.id))
          .where(eq(sessions.id, sessionId))
          .limit(1);

        if (sessionWithUser) {
          if (sessionWithUser.session.expires_at > now) {
            // Session is valid!
            (locals as any).user = {
              id: sessionWithUser.user.id,
              email: sessionWithUser.user.email,
            };
            (locals as any).profile = {
              id: sessionWithUser.user.id,
              username: sessionWithUser.user.username,
              full_name: sessionWithUser.user.full_name,
              avatar_url: sessionWithUser.user.avatar_url,
              role: sessionWithUser.user.role,
            };
          } else {
            // Session has expired, delete it from DB and cookies
            await db.delete(sessions).where(eq(sessions.id, sessionId));
            cookies.delete(AUTH_CONFIG.COOKIE_SESSION_NAME, { path: '/' });
          }
        }
      } catch (e) {
        // Fail gracefully during builds or if DB is down
        console.error('Middleware session lookup failed:', e);
      }
    }

    const user = (locals as any).user;
    const profile = (locals as any).profile;
    const pathname = url.pathname;

    // Protect /dashboard/* — requires any authenticated user
    if (pathname.startsWith('/dashboard')) {
      if (!user) {
        return redirect(`/signin?redirect=${encodeURIComponent(pathname)}`, 302);
      }
    }

    // Protect /admin/* — requires role 'admin'
    if (pathname.startsWith('/admin')) {
      if (!user) {
        return redirect(`/signin?redirect=${encodeURIComponent(pathname)}`, 302);
      }
      if (!profile || profile.role !== 'admin') {
        return redirect('/404', 302);
      }
    }

    // Redirect logged-in users away from auth pages
    if (user && (pathname === '/signin' || pathname === '/signup')) {
      return redirect('/dashboard', 302);
    }

    return next();
  }
);
