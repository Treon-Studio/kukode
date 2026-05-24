import { Context, Effect } from "effect";
import { DatabaseError } from "@/shared/errors/infrastructure.errors";
import type { TAnalyticsEventProps } from "./analytics.types";

export class IAnalyticsRepository extends Context.Tag("IAnalyticsRepository")<
  IAnalyticsRepository,
  {
    readonly saveEvent: (event: TAnalyticsEventProps) => Effect.Effect<void, DatabaseError>;
    
    readonly getAnalyticsDashboardData: (siteId: string, userId: string) => Effect.Effect<{
      site: any;
      upvotesCount: number;
      totalViews: number;
      totalClicks: number;
      ctr: string;
      referrers: any[];
      countries: any[];
      dailyTrendsRaw: any[];
    } | null, DatabaseError>;
  }
>() {}
