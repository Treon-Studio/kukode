import type { APIRoute } from 'astro';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { submittedSites, votes } from '@/db/schema';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const user = (locals as any).user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { site_id } = await request.json();

    if (!site_id) {
      return new Response(JSON.stringify({ error: 'site_id required' }), { status: 400 });
    }

    // Check if maker is trying to vote for their own product
    const [site] = await db
      .select({ maker_id: submittedSites.maker_id })
      .from(submittedSites)
      .where(eq(submittedSites.id, site_id));

    if (site && site.maker_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Pembuat produk tidak dapat melakukan upvote' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check existing vote
    const [existingVote] = await db
      .select()
      .from(votes)
      .where(and(eq(votes.site_id, site_id), eq(votes.user_id, user.id)));

    let voted = false;

    if (existingVote) {
      // Unvote
      await db.delete(votes).where(eq(votes.id, existingVote.id));
      voted = false;
    } else {
      // Vote
      await db.insert(votes).values({ site_id, user_id: user.id });
      voted = true;
    }

    // Get new count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(votes)
      .where(eq(votes.site_id, site_id));

    return new Response(JSON.stringify({ voted, vote_count: countResult.count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
