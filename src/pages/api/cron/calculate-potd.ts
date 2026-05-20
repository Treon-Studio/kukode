import type { APIRoute } from 'astro';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { potdHistory, submittedSites, votes } from '@/db/schema';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  // Validate cron secret if configured
  const authHeader = request.headers.get('authorization');
  const cronSecret = locals.runtime?.env?.CRON_SECRET || import.meta.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Fetch the product with the most votes in the last 24 hours
    const topVotedToday = await db
      .select({
        site_id: votes.site_id,
        count: sql<number>`count(*)`.as('vote_count'),
      })
      .from(votes)
      .where(gt(votes.created_at, oneDayAgo))
      .groupBy(votes.site_id)
      .orderBy(desc(sql`vote_count`))
      .limit(1);

    let winningSiteId: string | null = null;
    let winningVotes = 0;

    if (topVotedToday.length > 0) {
      winningSiteId = topVotedToday[0].site_id;
      winningVotes = topVotedToday[0].count;
    } else {
      // 2. Fallback: Find top approved product that has NEVER won POTD yet
      const potdWinners = await db.select({ site_id: potdHistory.site_id }).from(potdHistory);
      const winnerIds = potdWinners.map((w) => w.site_id);

      // Get all approved sites
      const approvedSites = await db
        .select({ id: submittedSites.id })
        .from(submittedSites)
        .where(eq(submittedSites.status, 'approved'));

      // Filter out previous winners
      const candidates = approvedSites.filter((s) => !winnerIds.includes(s.id));

      if (candidates.length > 0) {
        // Find the candidate with the most overall votes
        const candidateIds = candidates.map((c) => c.id);
        const votesCount = await db
          .select({
            site_id: votes.site_id,
            count: sql<number>`count(*)`.as('total_votes'),
          })
          .from(votes)
          .where(sql`${votes.site_id} IN ${candidateIds}`)
          .groupBy(votes.site_id)
          .orderBy(desc(sql`total_votes`))
          .limit(1);

        if (votesCount.length > 0) {
          winningSiteId = votesCount[0].site_id;
          winningVotes = votesCount[0].count;
        } else {
          // Absolute fallback: pick the oldest candidate
          winningSiteId = candidates[0].id;
          winningVotes = 0;
        }
      } else if (approvedSites.length > 0) {
        // If all approved sites have won already, pick the one with most overall votes
        const votesCount = await db
          .select({
            site_id: votes.site_id,
            count: sql<number>`count(*)`.as('total_votes'),
          })
          .from(votes)
          .groupBy(votes.site_id)
          .orderBy(desc(sql`total_votes`))
          .limit(1);

        if (votesCount.length > 0) {
          winningSiteId = votesCount[0].site_id;
          winningVotes = votesCount[0].count;
        } else {
          winningSiteId = approvedSites[0].id;
          winningVotes = 0;
        }
      }
    }

    if (!winningSiteId) {
      return new Response(
        JSON.stringify({ message: 'No approved sites available to designate as POTD' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Prevent duplicate POTD for the same date
    await db.delete(potdHistory).where(eq(potdHistory.date, todayStr));

    // Save the new POTD winner
    const [newWinner] = await db
      .insert(potdHistory)
      .values({
        site_id: winningSiteId,
        date: todayStr,
        vote_count: winningVotes,
      })
      .returning();

    // Fetch site title for response
    const [siteInfo] = await db
      .select({ title: submittedSites.title })
      .from(submittedSites)
      .where(eq(submittedSites.id, winningSiteId))
      .limit(1);

    return new Response(
      JSON.stringify({
        success: true,
        date: todayStr,
        site_id: winningSiteId,
        site_title: siteInfo?.title || 'Unknown',
        vote_count: winningVotes,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
