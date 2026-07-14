import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { createSubscriptionProgram } from '@/domain/store';
import { createAppRuntime } from '@/infra/runtime/app.runtime';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals, redirect }) => {
  const user = (locals as any).user;
  if (!user) {
    return redirect('/signin?redirect=/pricing');
  }

  const url = new URL(request.url);
  const plan = url.searchParams.get('plan') || 'team';

  const secretKey = locals.runtime?.env?.XENDIT_SECRET_KEY || import.meta.env.XENDIT_SECRET_KEY;
  const appRuntime = createAppRuntime(locals);

  try {
    const runnable = createSubscriptionProgram({ plan }, user, url.origin, secretKey);
    const invoiceUrl = await appRuntime.runPromise(runnable);

    return redirect(invoiceUrl);
  } catch (err: any) {
    const status = err._tag === 'ValidationError' ? 400 : 500;
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to create subscription invoice' }),
      { status, headers: { 'Content-Type': 'application/json' } },
    );
  }
};