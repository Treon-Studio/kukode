import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { createAdInvoiceProgram } from '@/domain/store';
import { createAppRuntime } from '@/infra/runtime/app.runtime';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, redirect }) => {
  const user = (locals as any).user;
  if (!user) {
    return redirect('/signin?redirect=/advertise');
  }

  const url = new URL(request.url);
  const pkg = url.searchParams.get('pkg');
  const siteId = url.searchParams.get('siteId') || 'none';

  if (!pkg) {
    return new Response('Invalid package selection', { status: 400 });
  }

  const secretKey = locals.runtime?.env?.XENDIT_SECRET_KEY || import.meta.env.XENDIT_SECRET_KEY;
  const appRuntime = createAppRuntime(locals);

  try {
    const runnable = createAdInvoiceProgram({ pkg, siteId }, user, url.origin, secretKey);
    const invoiceUrl = await appRuntime.runPromise(runnable);
    
    return redirect(invoiceUrl);
  } catch (err: any) {
    const status = err._tag === 'SponsorLimitReachedError' || err._tag === 'ValidationError' ? 400 : 500;
    return new Response(err?.message || 'Failed to initialize payment', { status });
  }
};

