import type { APIRoute } from 'astro';
import { db } from '@/db';
import { newsletterSubscriptions } from '@/db/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const referer = request.headers.get('referer') || '/';

  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString()?.trim();

    if (!email || !email.includes('@')) {
      return redirect(`${referer}?newsletter_error=Format+email+tidak+valid`, 302);
    }

    // Insert subscriber record to DB, ignoring duplicates gracefully
    await db
      .insert(newsletterSubscriptions)
      .values({ email })
      .onConflictDoNothing();

    // Send a welcome newsletter subscription email via Resend
    try {
      const { sendEmail } = await import('@/lib/email');
      await sendEmail({
        to: email,
        subject: 'Selamat Datang di Newsletter Kukode! 📬',
        html: `
          <h3>Halo!</h3>
          <p>Terima kasih telah berlangganan newsletter mingguan Kukode.</p>
          <p>Anda akan menerima kurasi berkala berisi produk digital terbaik, tren desain modern, dan inspirasi software engineering langsung di kotak masuk Anda.</p>
        `,
      });
    } catch (emailErr) {
      console.error('[Newsletter] Error sending welcome email:', emailErr);
    }

    return redirect(`${referer}?newsletter_success=Berhasil+berlangganan+newsletter!`, 302);
  } catch (err: any) {
    return redirect(
      `${referer}?newsletter_error=${encodeURIComponent(err.message || 'Terjadi kesalahan')}`,
      302
    );
  }
};
