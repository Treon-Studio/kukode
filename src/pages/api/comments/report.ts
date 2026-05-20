import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { comments, reports } from '@/db/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Anda harus login untuk melaporkan komentar' }),
      { status: 401 }
    );
  }

  try {
    const { comment_id, reason } = await request.json();

    if (!comment_id || !reason?.trim()) {
      return new Response(
        JSON.stringify({ error: 'ID komentar dan alasan pelaporan wajib diisi' }),
        { status: 400 }
      );
    }

    // Check if the target comment exists
    const [existingComment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, comment_id))
      .limit(1);

    if (!existingComment) {
      return new Response(JSON.stringify({ error: 'Komentar tidak ditemukan' }), { status: 404 });
    }

    // Prevent self-reporting
    if (existingComment.user_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Anda tidak dapat melaporkan komentar Anda sendiri' }),
        { status: 400 }
      );
    }

    // Insert pending report to DB
    await db.insert(reports).values({
      comment_id,
      reporter_id: user.id,
      reason: reason.trim(),
      status: 'pending',
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Komentar berhasil dilaporkan' }),
      { status: 200 }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
    });
  }
};
