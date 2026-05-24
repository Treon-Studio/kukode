import type { APIRoute } from 'astro';
import { Effect, Layer } from 'effect';
import { submitSiteProgram, SiteRepositoryLive } from '@/domain/site';
import { createAppRuntime } from '@/infra/runtime/app.runtime';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const user = (locals as any).user;
  const profile = (locals as any).profile;

  if (!user) {
    return redirect('/signin?redirect=/submit', 302);
  }

  try {
    const formData = await request.formData();
    const title = formData.get('title')?.toString()?.trim() || '';
    const tagline = formData.get('tagline')?.toString()?.trim() || '';
    const liveUrl = formData.get('live_url')?.toString()?.trim() || '';
    const description = formData.get('description')?.toString()?.trim() || '';
    const tagsRaw = formData.get('tags')?.toString()?.trim() || '';
    const thumbnailUrl = formData.get('thumbnail_url')?.toString()?.trim() || '';
    const thumbnailFile = formData.get('thumbnail_file') as File | null;

    const appRuntime = createAppRuntime(locals);
    
    // Provide Domain dependencies
    const runnable = Effect.provide(
      submitSiteProgram(
        { title, tagline, liveUrl, description, tagsRaw, thumbnailUrl, thumbnailFile },
        user,
        profile,
        locals
      ),
      SiteRepositoryLive
    );

    await appRuntime.runPromise(runnable);

    return redirect('/dashboard?message=Produk+berhasil+disubmit!', 302);
  } catch (err: any) {
    return redirect(`/submit?error=${encodeURIComponent(err?.message || 'Terjadi kesalahan')}`, 302);
  }
};
