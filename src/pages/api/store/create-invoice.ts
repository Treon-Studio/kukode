import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { createStoreInvoiceProgram } from '@/domain/store';
import { createAppRuntime } from '@/infra/runtime/app.runtime';

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

  const secretKey = locals.runtime?.env?.XENDIT_SECRET_KEY || import.meta.env.XENDIT_SECRET_KEY;
  const appRuntime = createAppRuntime(locals);

  try {
    const runnable = createStoreInvoiceProgram({ slug }, user, url.origin, secretKey);
    const invoiceUrl = await appRuntime.runPromise(runnable);
    
    return redirect(invoiceUrl);
  } catch (err: any) {
    const status = err._tag === 'ProductNotFoundError' ? 404 : err._tag === 'ValidationError' ? 400 : 500;
    return new Response(err?.message || 'Failed to initialize payment', { status });
  }
};

