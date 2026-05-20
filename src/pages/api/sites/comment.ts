import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { comments, profiles, submittedSites } from '@/db/schema';
import { APP_CONFIG } from '@/lib/constants';

export const prerender = false;

/**
 * POST /api/sites/comment
 * Body (FormData): site_id, content
 */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const user = (locals as any).user;
  const redirectUrl = request.headers.get('referer') || '/';

  if (!user) {
    return redirect(`/signin?redirect=${encodeURIComponent(new URL(redirectUrl).pathname)}`, 302);
  }

  try {
    const formData = await request.formData();
    const site_id = formData.get('site_id')?.toString()?.trim();
    const content = formData.get('content')?.toString()?.trim();

    if (!site_id || !content) {
      return redirect(`${redirectUrl}?error=Komentar+tidak+boleh+kosong`, 302);
    }

    // 1. Save comment to DB
    await db.insert(comments).values({
      site_id,
      user_id: user.id,
      content,
    });

    // 2. Fetch the site and its maker to send email notification
    const [siteInfo] = await db
      .select({
        title: submittedSites.title,
        maker_id: submittedSites.maker_id,
        maker_email: profiles.email,
        maker_name: profiles.full_name,
        maker_username: profiles.username,
      })
      .from(submittedSites)
      .leftJoin(profiles, eq(submittedSites.maker_id, profiles.id))
      .where(eq(submittedSites.id, site_id))
      .limit(1);

    if (siteInfo?.maker_email) {
      import('@/lib/email').then(({ sendEmail }) => {
        sendEmail({
          to: siteInfo.maker_email,
          subject: `Komentar baru pada produk Anda: ${siteInfo.title} 💬`,
          html: `
            <h3>Halo, ${siteInfo.maker_name || siteInfo.maker_username}!</h3>
            <p>Seseorang telah menulis komentar baru pada produk Anda <strong>${siteInfo.title}</strong>:</p>
            <blockquote style="border-left: 4px solid #3b82f6; padding-left: 1rem; color: #4b5563; font-style: italic; margin: 1.5rem 0;">
              "${content}"
            </blockquote>
            <p><a href="${APP_CONFIG.BASE_URL}/sites/site/${site_id}#comments" style="display: inline-block; padding: 0.5rem 1rem; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 0.375rem; font-weight: 500;">Lihat komentar di Kukode</a></p>
          `,
        }).catch((err) => console.error('[Notification] Error sending comment email:', err));
      });
    }

    return redirect(`${redirectUrl}?message=Komentar+berhasil+kirim#comments`, 302);
  } catch (err: any) {
    return redirect(`${redirectUrl}?error=${encodeURIComponent('Terjadi kesalahan')}`, 302);
  }
};
