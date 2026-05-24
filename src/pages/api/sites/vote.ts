import type { APIRoute } from 'astro';
import { Effect } from 'effect';
import { voteSiteProgram, SiteRepositoryLive } from '@/domain/site';
import { createAppRuntime } from '@/infra/runtime/app.runtime';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { site_id } = await request.json();

    const appRuntime = createAppRuntime(locals);

    const runnable = Effect.provide(
      voteSiteProgram({ siteId: site_id }, user.id),
      SiteRepositoryLive
    );

    const result = await appRuntime.runPromise(runnable);

    return new Response(JSON.stringify({ voted: result.voted, vote_count: result.voteCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Terjadi kesalahan' }), { 
      status: err._tag === "MakerCannotVoteError" ? 403 : err._tag === "ValidationError" ? 400 : 500 
    });
  }
};
