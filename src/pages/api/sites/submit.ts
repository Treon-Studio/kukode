import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { profiles as profilesTable, submittedSites } from '@/db/schema';
import { APP_CONFIG, NOTIFICATION_CONFIG } from '@/lib/constants';
import { notifyProjectSubmission } from '@/lib/discord';
import { isEnabled } from '@/lib/flags';

export const prerender = false;

/**
 * POST /api/sites/submit
 * FormData: title, tagline, live_url, description, tags (comma-separated), thumbnail_url (text input)
 */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const user = (locals as any).user;
  const profile = (locals as any).profile;

  if (!user) {
    return redirect('/signin?redirect=/submit', 302);
  }

  try {
    const formData = await request.formData();
    const title = formData.get('title')?.toString()?.trim();
    const tagline = formData.get('tagline')?.toString()?.trim();
    const liveUrl = formData.get('live_url')?.toString()?.trim();
    const description = formData.get('description')?.toString()?.trim();
    const tagsRaw = formData.get('tags')?.toString()?.trim();
    const thumbnailUrl = formData.get('thumbnail_url')?.toString()?.trim();

    // Validation
    if (!title || !tagline || !liveUrl || !description) {
      return redirect('/submit?error=Semua+field+wajib+diisi', 302);
    }

    if (tagline.length > 60) {
      return redirect('/submit?error=Tagline+maksimal+60+karakter', 302);
    }

    // Parse tags
    const tags = tagsRaw
      ? tagsRaw
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // Duplicate check in Turso
    const [existing] = await db
      .select({ id: submittedSites.id })
      .from(submittedSites)
      .where(eq(submittedSites.live_url, liveUrl))
      .limit(1);

    if (existing) {
      return redirect(
        `/submit?error=${encodeURIComponent('Produk ini sudah pernah disubmit.')}`,
        302
      );
    }

    // Auto-approve logic (controlled by feature flag)
    let status = 'pending_review';
    let approvedAt: string | null = null;
    const autoApproveEnabled = await isEnabled('auto_approve', { userId: user.id });

    if (autoApproveEnabled && thumbnailUrl) {
      // Validate live URL returns HTTP 200
      try {
        const liveCheck = await fetch(liveUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });
        if (liveCheck.ok) {
          status = 'approved';
          approvedAt = new Date().toISOString();
        }
      } catch {
        // URL check failed — keep as pending_review
      }
    }

    // Insert into database using Drizzle
    const [insertedRow] = await db
      .insert(submittedSites)
      .values({
        maker_id: user.id,
        title,
        tagline,
        description,
        live_url: liveUrl,
        thumbnail_url: thumbnailUrl || null,
        tags,
        status,
        approved_at: approvedAt,
      })
      .returning({ id: submittedSites.id });

    // Upgrade user role to 'maker' if currently 'user'
    if (profile?.role === 'user') {
      await db.update(profilesTable).set({ role: 'maker' }).where(eq(profilesTable.id, user.id));
    }

    // Send email notification to Admin
    import('@/lib/email').then(({ sendEmail }) => {
      sendEmail({
        to: NOTIFICATION_CONFIG.ADMIN_EMAIL,
        subject: `New Product Submitted: ${title}`,
        html: `
          <h3>New Product Submission</h3>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Tagline:</strong> ${tagline}</p>
          <p><strong>Live URL:</strong> <a href="${liveUrl}">${liveUrl}</a></p>
          <p><strong>Maker:</strong> ${profile?.username || user.email}</p>
          <p>Please review it in the <a href="${APP_CONFIG.BASE_URL}/admin/products">Admin Panel</a>.</p>
        `,
      }).catch(console.error);
    });

    // Send Discord push notification asynchronously
    notifyProjectSubmission({
      title,
      tagline,
      liveUrl,
      thumbnailUrl,
      tags,
      makerUsername: profile?.username || user.email || 'anonymous',
    }).catch(console.error);

    return redirect('/dashboard?message=Produk+berhasil+disubmit!', 302);
  } catch (err: any) {
    return redirect(`/submit?error=${encodeURIComponent(err.message || 'Terjadi kesalahan')}`, 302);
  }
};
