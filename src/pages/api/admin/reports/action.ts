import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { comments, reports } from '@/db/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;
  const profile = (locals as any).profile;

  if (!user || profile?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { report_id, action } = await request.json();

    if (!report_id || !action) {
      return new Response(JSON.stringify({ error: 'Report ID and action are required' }), {
        status: 400,
      });
    }

    // 1. Fetch the report
    const [report] = await db.select().from(reports).where(eq(reports.id, report_id)).limit(1);

    if (!report) {
      return new Response(JSON.stringify({ error: 'Report not found' }), { status: 404 });
    }

    if (action === 'delete') {
      // Delete the comment itself, cascading to any related reports (or we do it manually to be safe)
      await db.delete(comments).where(eq(comments.id, report.comment_id));
      return new Response(
        JSON.stringify({ success: true, message: 'Comment deleted successfully' })
      );
    }

    if (action === 'dismiss') {
      // Just mark report as dismissed
      await db.update(reports).set({ status: 'dismissed' }).where(eq(reports.id, report_id));
      return new Response(
        JSON.stringify({ success: true, message: 'Report dismissed successfully' })
      );
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
    });
  }
};
