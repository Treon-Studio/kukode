import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { profiles, sessions } from '@/db/schema';
import { AUTH_CONFIG } from '@/lib/constants';
import { notifyUserRegistration } from '@/lib/discord';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  // 1. Verify code and state parameters
  if (!code || !state) {
    return redirect('/signin?error=Invalid+request+parameters', 302);
  }

  // 2. Verify state token against state cookie
  const savedState = cookies.get('google_oauth_state')?.value;
  cookies.delete('google_oauth_state', { path: '/' });

  if (!savedState || savedState !== state) {
    return redirect('/signin?error=OAuth+state+mismatch.+Please+try+again.', 302);
  }

  const googleClientId = locals.runtime?.env?.GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = locals.runtime?.env?.GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET;

  if (!googleClientId || !googleClientSecret) {
    return redirect('/signin?error=Google+auth+is+not+configured+properly', 302);
  }

  const redirectUri = `${url.origin}/api/auth/google/callback`;

  try {
    // 3. Exchange authorization code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('Google token exchange error:', errText);
      return redirect('/signin?error=Failed+to+exchange+authorization+code', 302);
    }

    const tokens = (await tokenResponse.json()) as { access_token: string };

    // 4. Fetch user profile from Google UserInfo endpoint
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userinfoResponse.ok) {
      return redirect('/signin?error=Failed+to+fetch+user+profile+from+Google', 302);
    }

    const userInfo = (await userinfoResponse.json()) as {
      email: string;
      name?: string;
      picture?: string;
    };

    const email = userInfo.email?.trim()?.toLowerCase();
    if (!email) {
      return redirect('/signin?error=No+email+associated+with+Google+account', 302);
    }

    // 5. Look up user by email in database
    let [user] = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
    let isNewUser = false;

    // 6. If user does not exist, automatically sign them up
    if (!user) {
      isNewUser = true;

      // Generate a unique username
      let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (baseUsername.length < 3) {
        baseUsername = 'user';
      }
      let username = baseUsername;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        const [existingUsername] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.username, username))
          .limit(1);

        if (!existingUsername) {
          isUnique = true;
        } else {
          const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
          username = `${baseUsername}${randomSuffix}`;
          attempts++;
        }
      }

      // Create a secure dummy password hash for the profile
      const dummyPasswordHash = `oauth_google_${crypto.randomUUID()}`;
      const preferredLang = cookies.get('preferred_lang')?.value || 'en';

      [user] = await db
        .insert(profiles)
        .values({
          email,
          password_hash: dummyPasswordHash,
          username,
          full_name: userInfo.name || null,
          avatar_url: userInfo.picture || null,
          role: 'user',
          preferred_lang: preferredLang,
        })
        .returning();

      // Send Discord signup notification asynchronously
      notifyUserRegistration(
        {
          username: user.username || '',
          email: user.email,
          fullName: user.full_name,
        },
        locals.runtime?.env?.DISCORD_WEBHOOK_URL
      ).catch(console.error);
    }

    // 7. Create user session (expires in 30 days)
    const expiresAt = Math.floor(Date.now() / 1000) + AUTH_CONFIG.SESSION_DURATION_SECONDS;
    const [newSession] = await db
      .insert(sessions)
      .values({
        user_id: user.id,
        expires_at: expiresAt,
      })
      .returning();

    // 8. Set session cookie
    cookies.set(AUTH_CONFIG.COOKIE_SESSION_NAME, newSession.id, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      expires: new Date(expiresAt * 1000),
    });

    // 9. Sync preferred_lang cookie
    cookies.set('preferred_lang', user.preferred_lang || 'en', {
      path: '/',
      httpOnly: false,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    return redirect('/dashboard', 302);
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return redirect(`/signin?error=${encodeURIComponent(err.message || 'OAuth authentication failed')}`, 302);
  }
};
