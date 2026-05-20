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
    // Detect preferred language from query param
    const langQuery = url.searchParams.get('lang');
    let hasExplicitLangQuery = false;
    let lang = 'en';

    if (langQuery === 'en' || langQuery === 'id') {
      hasExplicitLangQuery = true;
      lang = langQuery;
      cookies.set('preferred_lang', lang, {
        path: '/',
        httpOnly: false,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
    } else {
      lang = cookies.get('preferred_lang')?.value || 'en';
      if (lang !== 'en' && lang !== 'id') {
        lang = 'en';
      }
    }
    (locals as any).lang = lang;

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

            // Sync preferred language
            if (hasExplicitLangQuery) {
              // Update database with the explicit choice
              await db
                .update(profiles)
                .set({ preferred_lang: lang })
                .where(eq(profiles.id, sessionWithUser.user.id));
            } else {
              // Sync cookie with database preference if they differ
              const dbLang = sessionWithUser.user.preferred_lang;
              if (dbLang && dbLang !== lang && (dbLang === 'en' || dbLang === 'id')) {
                lang = dbLang;
                (locals as any).lang = lang;
                cookies.set('preferred_lang', lang, {
                  path: '/',
                  httpOnly: false,
                  secure: import.meta.env.PROD,
                  sameSite: 'lax',
                  expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                });
              }
            }
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
