import { Context, Effect } from "effect";
import type { DatabaseError } from "@/shared/errors/infrastructure.errors";
import type { TApprovedSite, TRejectedSite, TManageFlagProps } from "./admin.types";

export class IAdminRepository extends Context.Tag("IAdminRepository")<
  IAdminRepository,
  {
    readonly approveSite: (siteId: string) => Effect.Effect<TApprovedSite | null, DatabaseError>;
    readonly rejectSite: (siteId: string, reason: string) => Effect.Effect<TRejectedSite | null, DatabaseError>;
    readonly manageFlag: (props: TManageFlagProps) => Effect.Effect<any, DatabaseError>;
    readonly fetchReport: (reportId: string) => Effect.Effect<any, DatabaseError>;
    readonly deleteComment: (commentId: string) => Effect.Effect<void, DatabaseError>;
    readonly dismissReport: (reportId: string) => Effect.Effect<void, DatabaseError>;
    readonly getPendingSites: () => Effect.Effect<Array<{
      id: string;
      title: string;
      tagline: string | null;
      live_url: string;
      thumbnail_url: string | null;
      tags: string[];
      created_at: Date | null;
      profiles: {
        username: string | null;
        full_name: string | null;
      } | null;
    }>, DatabaseError>;
    readonly getRecentModeratedSites: () => Effect.Effect<Array<{
      id: string;
      title: string;
      status: string;
      rejection_reason: string | null;
      created_at: Date | null;
    }>, DatabaseError>;
    readonly getAnalyticsOverview: () => Effect.Effect<{
      usersCount: number;
      sitesCount: number;
      votesCount: number;
      commentsCount: number;
      totalRevenue: number;
      recentTransactions: Array<{
        id: string;
        amount: number;
        store_slug: string | null;
        status: string;
        created_at: Date;
        username: string | null;
      }>;
    }, DatabaseError>;
    readonly getPendingReports: () => Effect.Effect<Array<{
      id: string;
      reason: string | null;
      created_at: Date | null;
      comment: {
        id: string;
        content: string;
      };
      site: {
        id: string;
        title: string;
      };
      author: {
        username: string | null;
        full_name: string | null;
      };
      reporter: {
        username: string | null;
        full_name: string | null;
      };
    }>, DatabaseError>;
    readonly getFeatureFlags: () => Effect.Effect<Array<{
      id: string;
      name: string;
      description: string | null;
      is_enabled: boolean;
      env_override: boolean | null;
      whitelist: string[] | null;
      rollout_percentage: number | null;
      created_at: Date | null;
      updated_at: Date | null;
    }>, DatabaseError>;
  }
>() {}
