import type { APIRoute } from 'astro';
import { db } from '@/db';
import { comments } from '@/db/schema';

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

    await db.insert(comments).values({
      site_id,
      user_id: user.id,
      content,
    });

    return redirect(`${redirectUrl}?message=Komentar+berhasil+dikirim#comments`, 302);
  } catch (err: any) {
    return redirect(`${redirectUrl}?error=${encodeURIComponent('Terjadi kesalahan')}`, 302);
  }
};
