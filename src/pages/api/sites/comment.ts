import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { commentSiteProgram, SiteRepositoryLive } from '@/domain/site';
import { createAppRuntime } from '@/infra/runtime/app.runtime';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const user = (locals as any).user;
  const redirectUrl = request.headers.get('referer') || '/';

  if (!user) {
    return redirect(`/signin?redirect=${encodeURIComponent(new URL(redirectUrl).pathname)}`, 302);
  }

  try {
    const formData = await request.formData();
    const site_id = formData.get('site_id')?.toString()?.trim() || '';
    const content = formData.get('content')?.toString()?.trim() || '';

    const appRuntime = createAppRuntime(locals);

    const runnable = Effect.provide(
      commentSiteProgram({ siteId: site_id, content }, user.id),
      SiteRepositoryLive
    );

    await appRuntime.runPromise(runnable);

    return redirect(`${redirectUrl}?message=Komentar+berhasil+kirim#comments`, 302);
  } catch (err: any) {
    const errorMessage = err?.message || 'Terjadi kesalahan';
    return redirect(`${redirectUrl}?error=${encodeURIComponent(errorMessage)}`, 302);
  }
};
