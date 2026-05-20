import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { db } from '@/db';
import { profiles as profilesTable, submittedSites } from '@/db/schema';
import { APP_CONFIG, NOTIFICATION_CONFIG } from '@/lib/constants';
import { notifyProjectSubmission } from '@/lib/discord';
import { isEnabled } from '@/lib/flags';
import { StorageAdapter, runStorageEffect } from '@/lib/storage';

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
    const thumbnailFile = formData.get('thumbnail_file') as File | null;

    // Validation
    if (!title || !tagline || !liveUrl || !description) {
      return redirect('/submit?error=Semua+field+wajib+diisi', 302);
    }

    if ((!thumbnailUrl || thumbnailUrl === '') && (!thumbnailFile || thumbnailFile.size === 0)) {
      return redirect('/submit?error=Thumbnail+produk+wajib+diisi', 302);
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

    // Process file upload if provided
    let finalThumbnailUrl = thumbnailUrl || null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const uploadEffect = StorageAdapter.pipe(
        Effect.flatMap((storage) => storage.uploadFile(thumbnailFile, 'sites'))
      );
      const result = await runStorageEffect(uploadEffect, locals);
      finalThumbnailUrl = result.url;
    }

    // Auto-approve logic (controlled by feature flag)
    let status = 'pending_review';
    let approvedAt: string | null = null;
    const autoApproveEnabled = await isEnabled('auto_approve', { userId: user.id });

    if (autoApproveEnabled && finalThumbnailUrl) {
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
        thumbnail_url: finalThumbnailUrl,
        tags,
        status,
        approved_at: approvedAt,
      })
      .returning({ id: submittedSites.id });

    // Upgrade user role to 'maker' if currently 'user'
    if (profile?.role === 'user') {
      await db.update(profilesTable).set({ role: 'maker' }).where(eq(profilesTable.id, user.id));
    }

    // Send email notification to Admin & Maker
    import('@/lib/email').then(({ sendEmail }) => {
      // Admin notification
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

      // Maker notification
      if (user.email) {
        sendEmail({
          to: user.email,
          subject: `Submission Berhasil: ${title} 🚀`,
          html: `
            <h3>Halo, ${profile?.full_name || profile?.username || 'Maker'}!</h3>
            <p>Terima kasih telah mensubmit produk <strong>${title}</strong> ke Kukode.</p>
            <p>Status submission Anda saat ini adalah <strong>${status === 'approved' ? 'Disetujui (Auto-Approved)' : 'Menunggu Review'}</strong>.</p>
            <p>Kami akan meninjau produk Anda secepatnya dan mengirimkan email konfirmasi lanjutan setelah status diperbarui.</p>
          `,
        }).catch(console.error);
      }
    });

    // Send Discord push notification asynchronously
    notifyProjectSubmission(
      {
        title,
        tagline,
        liveUrl,
        thumbnailUrl: finalThumbnailUrl,
        tags,
        makerUsername: profile?.username || user.email || 'anonymous',
      },
      locals.runtime?.env?.DISCORD_WEBHOOK_URL
    ).catch(console.error);

    return redirect('/dashboard?message=Produk+berhasil+disubmit!', 302);
  } catch (err: any) {
    return redirect(`/submit?error=${encodeURIComponent(err.message || 'Terjadi kesalahan')}`, 302);
  }
};
