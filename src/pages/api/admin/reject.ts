import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { profiles, submittedSites } from '@/db/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  const profile = (locals as any).profile;

  if (!user || profile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { site_id, reason } = await request.json();

    if (!site_id || !reason) {
      return new Response(JSON.stringify({ error: 'site_id and reason required' }), {
        status: 400,
      });
    }

    const [site] = await db
      .update(submittedSites)
      .set({
        status: 'rejected',
        rejection_reason: reason.trim(),
      })
      .where(and(eq(submittedSites.id, site_id), eq(submittedSites.status, 'pending_review')))
      .returning({ title: submittedSites.title, maker_id: submittedSites.maker_id });

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
          subject: `Status Submission Produk: ${site.title}`,
          html: `
            <h3>Halo, ${makerProfile.full_name || makerProfile.username}</h3>
            <p>Terima kasih telah mensubmit produk <strong>${site.title}</strong> ke Kukode.</p>
            <p>Sayangnya, produk kamu belum dapat kami setujui saat ini. Berikut adalah alasan penolakan dari tim moderator:</p>
            <blockquote style="border-left: 4px solid #ef4444; padding-left: 1rem; color: #4b5563;">
              ${reason.trim()}
            </blockquote>
            <p>Kamu bisa memperbaiki produk kamu dan melakukan submit ulang di kemudian hari.</p>
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
