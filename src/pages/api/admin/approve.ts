import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { profiles, submittedSites } from '@/db/schema';
import { APP_CONFIG } from '@/lib/constants';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  const profile = (locals as any).profile;

  if (!user || profile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { site_id } = await request.json();

    if (!site_id) {
      return new Response(JSON.stringify({ error: 'site_id required' }), { status: 400 });
    }

    const [site] = await db
      .update(submittedSites)
      .set({
        status: 'approved',
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .where(and(eq(submittedSites.id, site_id), eq(submittedSites.status, 'pending_review')))
      .returning({
        title: submittedSites.title,
        live_url: submittedSites.live_url,
        maker_id: submittedSites.maker_id,
      });

    if (!site) {
      return new Response(JSON.stringify({ error: 'Site not found or already processed' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch user profile and email directly from Turso (No Supabase!)
    const [makerProfile] = await db
      .select({
        email: profiles.email,
        full_name: profiles.full_name,
        username: profiles.username,
      })
      .from(profiles)
      .where(eq(profiles.id, site.maker_id))
      .limit(1);

    if (makerProfile?.email) {
      import('@/lib/email').then(({ sendEmail }) => {
        sendEmail({
          to: makerProfile.email,
          subject: `Produk Kamu Telah Di-Approve! 🎉`,
          html: `
            <h3>Selamat, ${makerProfile.full_name || makerProfile.username}!</h3>
            <p>Produk kamu <strong>${site.title}</strong> telah di-approve dan sekarang live di Kukode.</p>
            <p><a href="${APP_CONFIG.BASE_URL}/sites/site/${site_id}">Lihat produk kamu di sini</a></p>
          `,
        }).catch(console.error);
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
