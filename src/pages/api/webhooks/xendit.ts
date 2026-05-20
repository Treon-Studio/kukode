import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { purchases, submittedSites } from '@/db/schema';

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
        // If it contains a siteId, mark the product as sponsored
        if (parts.length >= 5) {
          const siteId = parts[3];
          await db
            .update(submittedSites)
            .set({ is_sponsored: true })
            .where(eq(submittedSites.id, siteId));
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
