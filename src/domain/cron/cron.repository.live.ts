import { Layer, Effect } from "effect";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { ICronRepository } from "./cron.repository";
import { IDrizzleClient } from "@/infra/db/drizzle.client";
import { potdHistory, profiles, submittedSites, votes } from "@/db/schema";
import { DatabaseError } from "@/shared/errors/infrastructure.errors";
import type { TSiteInfo } from "./cron.types";

export const CronRepositoryLive = Layer.effect(
  ICronRepository,
  Effect.gen(function* () {
    const { db } = yield* IDrizzleClient;

    return {
      getTopVotedToday: () => Effect.tryPromise({
        try: async () => {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
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
          
          return topVotedToday.length > 0 ? { site_id: topVotedToday[0].site_id, vote_count: topVotedToday[0].count } : null;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get top voted" })
      }),

      getFallbackWinner: () => Effect.tryPromise({
        try: async () => {
          const potdWinners = await db.select({ site_id: potdHistory.site_id }).from(potdHistory);
          const winnerIds = potdWinners.map((w) => w.site_id);
    
          const approvedSites = await db
            .select({ id: submittedSites.id })
            .from(submittedSites)
            .where(eq(submittedSites.status, 'approved'));
    
          const candidates = approvedSites.filter((s) => !winnerIds.includes(s.id));
    
          if (candidates.length > 0) {
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
              return { site_id: votesCount[0].site_id, vote_count: votesCount[0].count };
            } else {
              return { site_id: candidates[0].id, vote_count: 0 };
            }
          } else if (approvedSites.length > 0) {
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
              return { site_id: votesCount[0].site_id, vote_count: votesCount[0].count };
            } else {
              return { site_id: approvedSites[0].id, vote_count: 0 };
            }
          }

          return null;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get fallback winner" })
      }),

      savePotdWinner: (siteId, date, voteCount) => Effect.tryPromise({
        try: async () => {
          await db.delete(potdHistory).where(eq(potdHistory.date, date));
          await db.insert(potdHistory).values({
            site_id: siteId,
            date,
            vote_count: voteCount,
          });
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error save potd winner" })
      }),

      getSiteInfo: (siteId) => Effect.tryPromise({
        try: async (): Promise<TSiteInfo | null> => {
          const [siteInfo] = await db
            .select({
              title: submittedSites.title,
              maker_id: submittedSites.maker_id,
              maker_email: profiles.email,
              maker_name: profiles.full_name,
              maker_username: profiles.username,
            })
            .from(submittedSites)
            .leftJoin(profiles, eq(submittedSites.maker_id, profiles.id))
            .where(eq(submittedSites.id, siteId))
            .limit(1);
          
          return siteInfo || null;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get site info" })
      }),

      getLatestPOTDDetails: (userId?: string) => Effect.tryPromise({
        try: async () => {
          const [latestPOTD] = await db.select().from(potdHistory).orderBy(desc(potdHistory.date)).limit(1);

          if (!latestPOTD) return null;

          const [dbSite] = await db
            .select({
              id: submittedSites.id,
              title: submittedSites.title,
              tagline: submittedSites.tagline,
              description: submittedSites.description,
              live_url: submittedSites.live_url,
              thumbnail_url: submittedSites.thumbnail_url,
              maker_username: profiles.username,
            })
            .from(submittedSites)
            .leftJoin(profiles, eq(submittedSites.maker_id, profiles.id))
            .where(eq(submittedSites.id, latestPOTD.site_id))
            .limit(1);

          if (!dbSite) return null;

          const siteVotes = await db.select().from(votes).where(eq(votes.site_id, dbSite.id));
          const voteCount = siteVotes.length;
          const voted = userId ? siteVotes.some((v) => v.user_id === userId) : false;

          return { site: dbSite, voteCount, voted, date: latestPOTD.date };
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get POTD details" })
      }),
    };
  })
);
