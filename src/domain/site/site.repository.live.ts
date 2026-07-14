import { Layer, Effect } from "effect";
import { and, eq, sql } from "drizzle-orm";
import { ISiteRepository } from "./site.repository";
import { IDrizzleClient } from "@/infra/db/drizzle.client";
import { submittedSites, profiles, votes, comments } from "@/db/schema";
import { DatabaseError } from "@/shared/errors/infrastructure.errors";

export const SiteRepositoryLive = Layer.effect(
  ISiteRepository,
  Effect.gen(function* () {
    const { db } = yield* IDrizzleClient;

    return {
      existsByUrl: (url) => Effect.tryPromise({
        try: async () => {
          const [existing] = await db.select({ id: submittedSites.id }).from(submittedSites).where(eq(submittedSites.live_url, url)).limit(1);
          return !!existing;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error check exist" })
      }),
      saveSite: (p) => Effect.tryPromise({
        try: async () => {
          const [insertedRow] = await db.insert(submittedSites).values({
            maker_id: p.makerId,
            title: p.title,
            tagline: p.tagline,
            description: p.description,
            live_url: p.liveUrl,
            thumbnail_url: p.thumbnailUrl,
            tags: p.tags,
            status: p.status,
            approved_at: p.approvedAt,
          }).returning({ id: submittedSites.id });
          return insertedRow;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error save site" })
      }),
      saveSiteWithUpgrade: (p, userId) => Effect.tryPromise({
        try: async () => {
          return await db.transaction(async (tx) => {
            const [insertedRow] = await tx.insert(submittedSites).values({
              maker_id: p.makerId,
              title: p.title,
              tagline: p.tagline,
              description: p.description,
              live_url: p.liveUrl,
              thumbnail_url: p.thumbnailUrl,
              tags: p.tags,
              status: p.status,
              approved_at: p.approvedAt,
            }).returning({ id: submittedSites.id });
            await tx.update(profiles).set({ role: 'maker' }).where(eq(profiles.id, userId));
            return insertedRow;
          });
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error save site with upgrade" })
      }),
      upgradeUserRoleToMaker: (userId) => Effect.tryPromise({
        try: async () => {
          await db.update(profiles).set({ role: 'maker' }).where(eq(profiles.id, userId));
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error update role" })
      }),
      findSiteForVote: (siteId) => Effect.tryPromise({
        try: async () => {
          const [site] = await db.select({ maker_id: submittedSites.maker_id }).from(submittedSites).where(eq(submittedSites.id, siteId));
          return site;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error find site for vote" })
      }),
      findVote: (userId, siteId) => Effect.tryPromise({
        try: async () => {
          const [vote] = await db.select().from(votes).where(and(eq(votes.site_id, siteId), eq(votes.user_id, userId)));
          return vote;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error find vote" })
      }),
      saveVote: (userId, siteId) => Effect.tryPromise({
        try: async () => {
          await db.insert(votes).values({ site_id: siteId, user_id: userId });
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error save vote" })
      }),
      deleteVote: (voteId) => Effect.tryPromise({
        try: async () => {
          await db.delete(votes).where(eq(votes.id, voteId));
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error delete vote" })
      }),
      countVotes: (siteId) => Effect.tryPromise({
        try: async () => {
          const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(votes).where(eq(votes.site_id, siteId));
          return countResult.count;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error count vote" })
      }),
      toggleVote: (userId, siteId) => Effect.tryPromise({
        try: async () => {
          return await db.transaction(async (tx) => {
            const [existingVote] = await tx.select().from(votes).where(and(eq(votes.site_id, siteId), eq(votes.user_id, userId)));
            if (existingVote) {
              await tx.delete(votes).where(eq(votes.id, existingVote.id));
            } else {
              await tx.insert(votes).values({ site_id: siteId, user_id: userId });
            }
            const [countResult] = await tx.select({ count: sql<number>`count(*)` }).from(votes).where(eq(votes.site_id, siteId));
            return { voted: !existingVote, voteCount: countResult.count };
          });
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error toggle vote" })
      }),
      saveComment: (siteId, userId, content) => Effect.tryPromise({
        try: async () => {
          await db.insert(comments).values({ site_id: siteId, user_id: userId, content });
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error save comment" })
      }),
      getMakerInfoBySiteId: (siteId) => Effect.tryPromise({
        try: async () => {
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
          return siteInfo;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get maker info" })
      }),
      getApprovedSitesWithVotes: (userId?: string) => Effect.tryPromise({
        try: async () => {
          const dbSites = await db
            .select({
              id: submittedSites.id,
              title: submittedSites.title,
              live_url: submittedSites.live_url,
              thumbnail_url: submittedSites.thumbnail_url,
              tags: submittedSites.tags,
              created_at: submittedSites.created_at,
            })
            .from(submittedSites)
            .where(eq(submittedSites.status, 'approved'));

          const allDbVotes = await db.select().from(votes);

          return dbSites.map((site) => {
            const siteVotes = allDbVotes.filter((v) => v.site_id === site.id);
            return {
              id: site.id,
              isDynamic: true,
              data: {
                live: site.live_url,
                title: site.title,
                thumbnail: { url: site.thumbnail_url || '', alt: site.title },
                tags: site.tags ? (typeof site.tags === 'string' ? JSON.parse(site.tags) : site.tags) : [],
              },
              voteCount: siteVotes.length,
              voted: userId ? siteVotes.some((v) => v.user_id === userId) : false,
              createdAt: site.created_at ? new Date(site.created_at).getTime() : 0,
            };
          });
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get approved sites" })
      }),
      getApprovedSitesForSearch: () => Effect.tryPromise({
        try: async () => {
          return await db
            .select({
              id: submittedSites.id,
              title: submittedSites.title,
              tagline: submittedSites.tagline,
            })
            .from(submittedSites)
            .where(eq(submittedSites.status, 'approved'));
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get approved sites for search" })
      }),
      getSiteDetailsWithVotes: (siteId, userId?: string) => Effect.tryPromise({
        try: async () => {
          const [dbSite] = await db
            .select({
              id: submittedSites.id,
              title: submittedSites.title,
              description: submittedSites.description,
              live_url: submittedSites.live_url,
              thumbnail_url: submittedSites.thumbnail_url,
              tagline: submittedSites.tagline,
              views_count: submittedSites.views_count,
              created_at: submittedSites.created_at,
              maker_username: profiles.username,
            })
            .from(submittedSites)
            .leftJoin(profiles, eq(submittedSites.maker_id, profiles.id))
            .where(eq(submittedSites.id, siteId))
            .limit(1);

          if (!dbSite) return null;

          const siteVotes = await db.select().from(votes).where(eq(votes.site_id, dbSite.id));
          const voteCount = siteVotes.length;
          const voted = userId ? siteVotes.some((v) => v.user_id === userId) : false;

          return {
            ...dbSite,
            voteCount,
            voted
          };
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get site details" })
      }),
      incrementSiteViews: (siteId) => Effect.tryPromise({
        try: async () => {
          await db.update(submittedSites)
            .set({ views_count: sql`${submittedSites.views_count} + 1` })
            .where(eq(submittedSites.id, siteId));
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error increment site views" })
      }),
      getCreatorDashboardStats: (userId) => Effect.tryPromise({
        try: async () => {
          const [submittedCountResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(submittedSites)
            .where(eq(submittedSites.maker_id, userId));
          const submittedCount = submittedCountResult.count;

          const [approvedCountResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(submittedSites)
            .where(and(eq(submittedSites.maker_id, userId), eq(submittedSites.status, 'approved')));
          const approvedCount = approvedCountResult.count;

          const sites = await db
            .select({ views_count: submittedSites.views_count, id: submittedSites.id })
            .from(submittedSites)
            .where(eq(submittedSites.maker_id, userId));

          let totalViews = 0;
          let totalVotes = 0;

          if (sites && sites.length > 0) {
            totalViews = sites.reduce((sum: number, site: any) => sum + (site.views_count || 0), 0);
            const siteIds = sites.map((s: any) => s.id);
            if (siteIds.length > 0) {
              const { inArray } = await import("drizzle-orm");
              const [voteCountResult] = await db
                .select({ count: sql<number>`count(*)` })
                .from(votes)
                .where(inArray(votes.site_id, siteIds));
              totalVotes = voteCountResult.count || 0;
            }
          }

          return {
            submittedCount,
            approvedCount,
            totalViews,
            totalVotes
          };
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get creator stats" })
      }),
      getCreatorSites: (userId) => Effect.tryPromise({
        try: async () => {
          const { desc } = await import("drizzle-orm");
          return await db
            .select({
              id: submittedSites.id,
              title: submittedSites.title,
              tagline: submittedSites.tagline,
              live_url: submittedSites.live_url,
              thumbnail_url: submittedSites.thumbnail_url,
              tags: submittedSites.tags,
              status: submittedSites.status,
              rejection_reason: submittedSites.rejection_reason,
              created_at: submittedSites.created_at,
            })
            .from(submittedSites)
            .where(eq(submittedSites.maker_id, userId))
            .orderBy(desc(submittedSites.created_at));
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get creator sites" })
      }),
      getLeaderboard: (filter: string) => Effect.tryPromise({
        try: async () => {
          const { eq, gt, sql } = await import("drizzle-orm");
          
          let dateThreshold: Date | null = null;
          if (filter === 'weekly') {
            dateThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          } else if (filter === 'monthly') {
            dateThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          }

          const approvedSites = await db
            .select({
              id: submittedSites.id,
              title: submittedSites.title,
              tagline: submittedSites.tagline,
              live_url: submittedSites.live_url,
              thumbnail_url: submittedSites.thumbnail_url,
              maker_username: profiles.username,
            })
            .from(submittedSites)
            .leftJoin(profiles, eq(submittedSites.maker_id, profiles.id))
            .where(eq(submittedSites.status, 'approved'));

          let votesQuery = db
            .select({
              site_id: votes.site_id,
              count: sql<number>`count(*)`.as('vote_count'),
            })
            .from(votes);

          if (dateThreshold) {
            votesQuery = votesQuery.where(gt(votes.created_at, dateThreshold)) as any;
          }

          const voteCounts = await votesQuery.groupBy(votes.site_id);

          return approvedSites
            .map((site) => {
              const voteInfo = voteCounts.find((v) => v.site_id === site.id);
              return {
                ...site,
                voteCount: voteInfo ? voteInfo.count : 0,
              };
            })
            .sort((a, b) => b.voteCount - a.voteCount);
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get leaderboard" })
      }),
      checkSponsoredSlotsFull: () => Effect.tryPromise({
        try: async () => {
          const sponsoredSites = await db
            .select()
            .from(submittedSites)
            .where(eq(submittedSites.is_sponsored, true));
          return sponsoredSites.length >= 3;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error check sponsored slots" })
      })
    };
  })
);
