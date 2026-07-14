import { Layer, Effect } from "effect";
import { and, eq } from "drizzle-orm";
import { IAdminRepository } from "./admin.repository";
import { IDrizzleClient } from "@/infra/db/drizzle.client";
import { profiles, submittedSites, featureFlags, comments, reports } from "@/db/schema";
import { DatabaseError } from "@/shared/errors/infrastructure.errors";
import type { TApprovedSite, TRejectedSite } from "./admin.types";

export const AdminRepositoryLive = Layer.effect(
  IAdminRepository,
  Effect.gen(function* () {
    const { db } = yield* IDrizzleClient;

    return {
      approveSite: (siteId) => Effect.tryPromise({
        try: async (): Promise<TApprovedSite | null> => {
          const [site] = await db
            .update(submittedSites)
            .set({
              status: 'approved',
              approved_at: new Date().toISOString(),
              rejection_reason: null,
            })
            .where(and(eq(submittedSites.id, siteId), eq(submittedSites.status, 'pending_review')))
            .returning({
              title: submittedSites.title,
              live_url: submittedSites.live_url,
              maker_id: submittedSites.maker_id,
            });

          if (!site) return null;

          const [makerProfile] = await db
            .select({
              email: profiles.email,
              full_name: profiles.full_name,
              username: profiles.username,
            })
            .from(profiles)
            .where(eq(profiles.id, site.maker_id))
            .limit(1);

          return {
            ...site,
            maker: makerProfile || null,
          };
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error approve site" })
      }),

      rejectSite: (siteId, reason) => Effect.tryPromise({
        try: async (): Promise<TRejectedSite | null> => {
          const [site] = await db
            .update(submittedSites)
            .set({
              status: 'rejected',
              rejection_reason: reason.trim(),
            })
            .where(and(eq(submittedSites.id, siteId), eq(submittedSites.status, 'pending_review')))
            .returning({ title: submittedSites.title, maker_id: submittedSites.maker_id });

          if (!site) return null;

          const [makerProfile] = await db
            .select({
              email: profiles.email,
              full_name: profiles.full_name,
              username: profiles.username,
            })
            .from(profiles)
            .where(eq(profiles.id, site.maker_id))
            .limit(1);

          return {
            ...site,
            maker: makerProfile || null,
          };
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error reject site" })
      }),

      manageFlag: (props) => Effect.tryPromise({
        try: async () => {
          if (props.action === 'toggle') {
            const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.id, props.id));
            if (!flag) return null;
      
            const [updated] = await db
              .update(featureFlags)
              .set({ is_enabled: !flag.is_enabled })
              .where(eq(featureFlags.id, props.id))
              .returning();
            return updated;
          }
      
          if (props.action === 'create') {
            const [newFlag] = await db
              .insert(featureFlags)
              .values({
                name: props.name!,
                description: props.description,
                is_enabled: props.is_enabled || false,
                env_override: props.env_override || false,
                whitelist: props.whitelist ? props.whitelist.split(',').map((s: string) => s.trim()) : [],
                rollout_percentage: props.rollout_percentage || 0,
              })
              .returning();
            return newFlag;
          }
      
          if (props.action === 'update') {
            const [updated] = await db
              .update(featureFlags)
              .set({
                name: props.name,
                description: props.description,
                is_enabled: props.is_enabled || false,
                env_override: props.env_override || false,
                whitelist: props.whitelist ? props.whitelist.split(',').map((s: string) => s.trim()) : [],
                rollout_percentage: props.rollout_percentage || 0,
              })
              .where(eq(featureFlags.id, props.id))
              .returning();
            return updated;
          }
      
          if (props.action === 'delete') {
            await db.delete(featureFlags).where(eq(featureFlags.id, props.id));
            return { success: true };
          }
          return null;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error manage flag" })
      }),

      fetchReport: (reportId) => Effect.tryPromise({
        try: async () => {
          const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
          return report || null;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error fetch report" })
      }),

      deleteComment: (commentId) => Effect.tryPromise({
        try: async () => {
          await db.delete(comments).where(eq(comments.id, commentId));
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error delete comment" })
      }),

      dismissReport: (reportId) => Effect.tryPromise({
        try: async () => {
          await db.update(reports).set({ status: 'dismissed' }).where(eq(reports.id, reportId));
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error dismiss report" })
      }),

      getPendingSites: () => Effect.tryPromise({
        try: async () => {
          const { desc } = await import("drizzle-orm");
          return await db
            .select({
              id: submittedSites.id,
              title: submittedSites.title,
              description: submittedSites.description,
              tagline: submittedSites.tagline,
              live_url: submittedSites.live_url,
              thumbnail_url: submittedSites.thumbnail_url,
              tags: submittedSites.tags,
              created_at: submittedSites.created_at,
              views_count: submittedSites.views_count,
              profiles: {
                username: profiles.username,
                full_name: profiles.full_name,
              },
            })
            .from(submittedSites)
            .leftJoin(profiles, eq(submittedSites.maker_id, profiles.id))
            .where(eq(submittedSites.status, 'pending_review'))
            .orderBy(desc(submittedSites.created_at));
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get pending sites" })
      }),

      getRecentModeratedSites: () => Effect.tryPromise({
        try: async () => {
          const { desc, inArray } = await import("drizzle-orm");
          return await db
            .select({
              id: submittedSites.id,
              title: submittedSites.title,
              status: submittedSites.status,
              rejection_reason: submittedSites.rejection_reason,
              created_at: submittedSites.created_at,
            })
            .from(submittedSites)
            .where(inArray(submittedSites.status, ['approved', 'rejected']))
            .orderBy(desc(submittedSites.created_at))
            .limit(20);
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get recent moderated sites" })
      }),
      getAnalyticsOverview: (opts) => Effect.tryPromise({
        try: async () => {
          const { sql, desc, and, gte, lte } = await import("drizzle-orm");
          const { purchases, votes } = await import("@/db/schema");

          const startDate = opts?.startDate;
          const endDate = opts?.endDate;
          const rangeFilter = startDate || endDate
            ? and(
                startDate ? gte(votes.created_at, startDate) : undefined,
                endDate ? lte(votes.created_at, endDate) : undefined,
              )
            : undefined;

          const [usersCountResult] = await db.select({ count: sql<number>`count(*)` }).from(profiles);
          const [sitesCountResult] = await db.select({ count: sql<number>`count(*)` }).from(submittedSites);
          const [approvedSitesCountResult] = await db
            .select({ count: sql<number>`count(*)` })
            .from(submittedSites)
            .where(eq(submittedSites.status, 'approved'));
          const votesQuery = rangeFilter ? db.select({ count: sql<number>`count(*)` }).from(votes).where(rangeFilter) : db.select({ count: sql<number>`count(*)` }).from(votes);
          const [votesCountResult] = await votesQuery;
          const [commentsCountResult] = await db.select({ count: sql<number>`count(*)` }).from(comments);

          const purchaseRange = startDate || endDate
            ? and(
                startDate ? gte(purchases.created_at, startDate) : undefined,
                endDate ? lte(purchases.created_at, endDate) : undefined,
              )
            : undefined;
          const [revenueResult] = await db
            .select({ total: sql<number>`sum(amount)` })
            .from(purchases)
            .where(
              purchaseRange
                ? and(eq(purchases.status, 'completed'), purchaseRange)
                : eq(purchases.status, 'completed')
            );

          const recentTransactions = await db
            .select({
              id: purchases.id,
              amount: purchases.amount,
              store_slug: purchases.store_slug,
              status: purchases.status,
              created_at: purchases.created_at,
              username: profiles.username,
            })
            .from(purchases)
            .leftJoin(profiles, eq(purchases.user_id, profiles.id))
            .where(purchaseRange)
            .orderBy(desc(purchases.created_at))
            .limit(5);

          return {
            usersCount: usersCountResult?.count || 0,
            sitesCount: sitesCountResult?.count || 0,
            approvedSitesCount: approvedSitesCountResult?.count || 0,
            votesCount: votesCountResult?.count || 0,
            commentsCount: commentsCountResult?.count || 0,
            totalRevenue: revenueResult?.total || 0,
            recentTransactions
          };
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get analytics overview" })
      }),
      getPendingReports: () => Effect.tryPromise({
        try: async () => {
          const { eq, desc, aliasedTable } = await import("drizzle-orm");
          
          const authors = aliasedTable(profiles, 'authors');
          const reporters = aliasedTable(profiles, 'reporters');

          return await db
            .select({
              id: reports.id,
              reason: reports.reason,
              created_at: reports.created_at,
              comment: {
                id: comments.id,
                content: comments.content,
              },
              site: {
                id: submittedSites.id,
                title: submittedSites.title,
              },
              author: {
                username: authors.username,
                full_name: authors.full_name,
              },
              reporter: {
                username: reporters.username,
                full_name: reporters.full_name,
              },
            })
            .from(reports)
            .innerJoin(comments, eq(reports.comment_id, comments.id))
            .innerJoin(submittedSites, eq(comments.site_id, submittedSites.id))
            .innerJoin(authors, eq(comments.user_id, authors.id))
            .innerJoin(reporters, eq(reports.reporter_id, reporters.id))
            .where(eq(reports.status, 'pending'))
            .orderBy(desc(reports.created_at));
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get pending reports" })
      }),
      getFeatureFlags: () => Effect.tryPromise({
        try: async () => {
          const { desc } = await import("drizzle-orm");
          return await db.select().from(featureFlags).orderBy(desc(featureFlags.created_at));
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error get feature flags" })
      })
    };
  })
);
