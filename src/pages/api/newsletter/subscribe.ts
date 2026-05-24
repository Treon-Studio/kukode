import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { subscribeProgram } from '@/domain/newsletter';
import { createAppRuntime } from '@/infra/runtime/app.runtime';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const referer = request.headers.get('referer') || '/';

  try {
    const formData = await request.formData();
    const email = formData.get('email')?.toString()?.trim() || '';

    const appRuntime = createAppRuntime(locals);
    const runnable = subscribeProgram({ email });
    await appRuntime.runPromise(runnable);

    return redirect(`${referer}?newsletter_success=Berhasil+berlangganan+newsletter!`, 302);
  } catch (err: any) {
    const errorMessage = err?.message || 'Terjadi kesalahan';
    return redirect(
      `${referer}?newsletter_error=${encodeURIComponent(errorMessage)}`,
      302
    );
  }
};

