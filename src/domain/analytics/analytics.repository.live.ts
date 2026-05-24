import { Layer, Effect } from "effect";
import { IAnalyticsRepository } from "./analytics.repository";
import { IDrizzleClient } from "@/infra/db/drizzle.client";
import { siteEvents } from "@/db/schema";
import { DatabaseError } from "@/shared/errors/infrastructure.errors";

export const AnalyticsRepositoryLive = Layer.effect(
  IAnalyticsRepository,
  Effect.gen(function* () {
    const { db } = yield* IDrizzleClient;

    return {
      saveEvent: (event) =>
        Effect.tryPromise({
          try: () =>
            db.insert(siteEvents).values({
              site_id: event.siteId || null,
              event_type: event.eventType,
              referrer: event.referrer || null,
              country: event.country || null,
              city: event.city || null,
            }),
          catch: (e) => new DatabaseError({ cause: e, message: "Failed to save analytics event" }),
        }),
      getAnalyticsDashboardData: (siteId, userId) => Effect.tryPromise({
        try: async () => {
          const { submittedSites, votes } = await import("@/db/schema");
          const { and, eq, desc, sql, gt } = await import("drizzle-orm");

          // 1. Fetch site details and confirm ownership
          const [site] = await db
            .select()
            .from(submittedSites)
            .where(and(eq(submittedSites.id, siteId), eq(submittedSites.maker_id, userId)))
            .limit(1);

          if (!site) return null;

          // 2. Fetch total upvotes
          const siteVotes = await db.select().from(votes).where(eq(votes.site_id, siteId));
          const upvotesCount = siteVotes.length;

          // 3. Fetch analytics metrics (views, clicks)
          const [viewsResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(siteEvents)
            .where(and(eq(siteEvents.site_id, siteId), eq(siteEvents.event_type, 'view')));

          const [clicksResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(siteEvents)
            .where(and(eq(siteEvents.site_id, siteId), eq(siteEvents.event_type, 'click')));

          const totalViews = viewsResult?.count || 0;
          const totalClicks = clicksResult?.count || 0;
          const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0';

          // 4. Fetch top referrers
          const referrers = await db
            .select({
              referrer: siteEvents.referrer,
              count: sql<number>`count(*)`.as('event_count'),
            })
            .from(siteEvents)
            .where(and(eq(siteEvents.site_id, siteId), sql`referrer IS NOT NULL` as any))
            .groupBy(siteEvents.referrer)
            .orderBy(desc(sql`event_count`))
            .limit(6);

          // 5. Fetch top locations (country)
          const countries = await db
            .select({
              country: siteEvents.country,
              count: sql<number>`count(*)`.as('event_count'),
            })
            .from(siteEvents)
            .where(and(eq(siteEvents.site_id, siteId), sql`country IS NOT NULL` as any))
            .groupBy(siteEvents.country)
            .orderBy(desc(sql`event_count`))
            .limit(6);

          // 6. Fetch daily traffic trends (last 7 days)
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const dailyTrendsRaw = await db
            .select({
              day: sql<string>`date(created_at, 'unixepoch')`.as('day'),
              eventType: siteEvents.event_type,
              count: sql<number>`count(*)`,
            })
            .from(siteEvents)
            .where(and(eq(siteEvents.site_id, siteId), gt(siteEvents.created_at, sevenDaysAgo)))
            .groupBy(sql`day`, siteEvents.event_type)
            .orderBy(sql`day`);

          return {
            site,
            upvotesCount,
            totalViews,
            totalClicks,
            ctr,
            referrers,
            countries,
            dailyTrendsRaw
          };
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get analytics" })
      }),
    };
  })
);
