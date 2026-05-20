import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { purchases, submittedSites } from '@/db/schema';
import { createXenditInvoice } from '@/lib/xendit';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, redirect }) => {
  const user = (locals as any).user;
  if (!user) {
    return redirect('/signin?redirect=/advertise');
  }

  // Enforce sponsored slot limit (max 3)
  const activeSponsors = await db
    .select()
    .from(submittedSites)
    .where(eq(submittedSites.is_sponsored, true));
  if (activeSponsors.length >= 3) {
    return new Response('All sponsored advertisement slots are currently full. Please try again later.', { status: 400 });
  }

  const url = new URL(request.url);
  const pkg = url.searchParams.get('pkg');
  const siteId = url.searchParams.get('siteId') || 'none';

  if (!pkg || (pkg !== 'article' && pkg !== 'newsletter')) {
    return new Response('Invalid package selection', { status: 400 });
  }

  const price = pkg === 'article' ? 899 : 1299;
  const description =
    pkg === 'article' ? 'Sponsored Article Listing' : 'Newsletter Advertisement Slot';

  const secretKey = locals.runtime?.env?.XENDIT_SECRET_KEY || import.meta.env.XENDIT_SECRET_KEY;
  if (!secretKey) {
    return new Response('Payment gateway key is not configured', { status: 500 });
  }

  try {
    const timestamp = Date.now();
    const externalId = `adv_${pkg}_${user.id}_${siteId}_${timestamp}`;

    // Get origin for absolute redirect URLs
    const origin = url.origin;

    const invoice = await createXenditInvoice({
      externalId,
      amount: price,
      payerEmail: user.email,
      description,
      successRedirectUrl: `${origin}/dashboard/products?payment=success`,
      failureRedirectUrl: `${origin}/advertise?payment=failed`,
      secretKey,
      currency: 'USD',
    });

    // Record the purchase as pending
    await db.insert(purchases).values({
      user_id: user.id,
      store_slug: `adv_${pkg}`,
      xendit_invoice_id: invoice.id,
      amount: price,
      status: 'pending',
    });

    return redirect(invoice.invoice_url);
  } catch (err: any) {
    return new Response(err.message || 'Failed to initialize payment', { status: 500 });
  }
};
