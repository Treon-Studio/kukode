import { getEntry } from 'astro:content';
import type { APIRoute } from 'astro';
import { db } from '@/db';
import { purchases } from '@/db/schema';
import { createXenditInvoice } from '@/lib/xendit';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, redirect }) => {
  const user = (locals as any).user;
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return new Response('Slug is required', { status: 400 });
  }

  if (!user) {
    return redirect(`/signin?redirect=/store/${slug}`);
  }

  // Get the store item to verify it exists and retrieve price
  const page = await getEntry('store', slug);
  if (!page) {
    return new Response('Store product not found', { status: 404 });
  }

  const price = parseInt(page.data.price || '0', 10);
  if (isNaN(price) || price <= 0) {
    return new Response('Invalid product price configuration', { status: 400 });
  }

  const secretKey = locals.runtime?.env?.XENDIT_SECRET_KEY || import.meta.env.XENDIT_SECRET_KEY;
  if (!secretKey) {
    return new Response('Payment gateway key is not configured', { status: 500 });
  }

  try {
    const timestamp = Date.now();
    const externalId = `store_${slug}_${user.id}_${timestamp}`;

    // Get origin for absolute redirect URLs
    const origin = url.origin;

    const invoice = await createXenditInvoice({
      externalId,
      amount: price,
      payerEmail: user.email,
      description: `Purchase: ${page.data.title}`,
      successRedirectUrl: `${origin}/store/${slug}?payment=success`,
      failureRedirectUrl: `${origin}/store/${slug}?payment=failed`,
      secretKey,
      currency: 'USD',
    });

    // Record the purchase as pending
    await db.insert(purchases).values({
      user_id: user.id,
      store_slug: slug,
      xendit_invoice_id: invoice.id,
      amount: price,
      status: 'pending',
    });

    return redirect(invoice.invoice_url);
  } catch (err: any) {
    return new Response(err.message || 'Failed to initialize payment', { status: 500 });
  }
};
