import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { profiles, purchases, submittedSites } from '@/db/schema';
import { APP_CONFIG } from '@/lib/constants';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // Validate callback token from header
  const callbackToken =
    locals.runtime?.env?.XENDIT_CALLBACK_TOKEN || import.meta.env.XENDIT_CALLBACK_TOKEN;
  const requestToken = request.headers.get('x-callback-token');

  if (callbackToken && requestToken !== callbackToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await request.json();
    const { id, external_id, status } = payload;

    if (!id || !external_id || !status) {
      return new Response(JSON.stringify({ error: 'Missing required payload fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (status === 'PAID') {
      // 1. Update purchase status in database
      await db
        .update(purchases)
        .set({ status: 'completed' })
        .where(eq(purchases.xendit_invoice_id, id));

      // 2. Determine purchase type from external_id
      // Format 1: adv_[pkg]_[userId]_[siteId]_[timestamp]
      // Format 2: store_[slug]_[userId]_[timestamp]
      const parts = external_id.split('_');

      if (parts[0] === 'adv') {
        const pkg = parts[1] || 'sponsored';
        const userId = parts[2];
        const siteId = parts[3];

        if (siteId) {
          await db
            .update(submittedSites)
            .set({ is_sponsored: true })
            .where(eq(submittedSites.id, siteId));
        }

        // Fetch user and product details for notification
        if (userId) {
          const [userProfile] = await db
            .select({
              email: profiles.email,
              full_name: profiles.full_name,
              username: profiles.username,
            })
            .from(profiles)
            .where(eq(profiles.id, userId))
            .limit(1);

          let siteTitle = 'Produk Anda';
          if (siteId) {
            const [site] = await db
              .select({ title: submittedSites.title })
              .from(submittedSites)
              .where(eq(submittedSites.id, siteId))
              .limit(1);
            if (site) siteTitle = site.title;
          }

          if (userProfile?.email) {
            import('@/lib/email').then(({ sendEmail }) => {
              sendEmail({
                to: userProfile.email,
                subject: `Pembayaran Sponsor Aktif: ${siteTitle} 🚀`,
                html: `
                  <h3>Halo, ${userProfile.full_name || userProfile.username}!</h3>
                  <p>Terima kasih! Pembayaran Anda untuk paket promosi <strong>${pkg}</strong> telah berhasil kami terima.</p>
                  <p>Status promosi produk Anda <strong>${siteTitle}</strong> kini telah aktif dan ditampilkan sebagai Sponsored Listing di halaman depan Kukode.</p>
                `,
              }).catch((err) => console.error('[Notification] Error sending sponsor payment email:', err));
            });
          }
        }
      } else if (parts[0] === 'store') {
        const storeSlug = parts[1];
        const userId = parts[2];

        if (userId && storeSlug) {
          const [userProfile] = await db
            .select({
              email: profiles.email,
              full_name: profiles.full_name,
              username: profiles.username,
            })
            .from(profiles)
            .where(eq(profiles.id, userId))
            .limit(1);

          if (userProfile?.email) {
            import('@/lib/email').then(({ sendEmail }) => {
              sendEmail({
                to: userProfile.email,
                subject: `Pembelian Sukses: Template ${storeSlug} 🛒`,
                html: `
                  <h3>Halo, ${userProfile.full_name || userProfile.username}!</h3>
                  <p>Terima kasih atas pembelian Anda! Pembayaran Anda untuk template digital <strong>${storeSlug}</strong> telah berhasil kami terima.</p>
                  <p>Anda dapat mengakses berkas unduhan/akses produk digital Anda langsung melalui tautan berikut:</p>
                  <p><a href="${APP_CONFIG.BASE_URL}/store" style="display: inline-block; padding: 0.5rem 1rem; background-color: #10b981; color: white; text-decoration: none; border-radius: 0.375rem; font-weight: 500;">Akses Halaman Toko</a></p>
                `,
              }).catch((err) => console.error('[Notification] Error sending store purchase email:', err));
            });
          }
        }
      }
    } else if (status === 'EXPIRED' || status === 'FAILED') {
      // Update purchase status to failed
      await db
        .update(purchases)
        .set({ status: 'failed' })
        .where(eq(purchases.xendit_invoice_id, id));
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
