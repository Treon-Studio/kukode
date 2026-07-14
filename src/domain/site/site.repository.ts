import { Context, Effect } from "effect";
import type { DatabaseError } from "@/shared/errors/infrastructure.errors";

export interface SaveSiteParams {
  readonly makerId: string;
  readonly title: string;
  readonly tagline: string;
  readonly description: string;
  readonly liveUrl: string;
  readonly thumbnailUrl: string | null;
  readonly tags: string[];
  readonly status: string;
  readonly approvedAt: string | null;
}

export class ISiteRepository extends Context.Tag("ISiteRepository")<
  ISiteRepository,
  {
    readonly existsByUrl: (url: string) => Effect.Effect<boolean, DatabaseError>;
    readonly saveSite: (params: SaveSiteParams) => Effect.Effect<{ id: string }, DatabaseError>;
    readonly upgradeUserRoleToMaker: (userId: string) => Effect.Effect<void, DatabaseError>;
    readonly saveSiteWithUpgrade: (params: any, userId: string) => Effect.Effect<{ id: string }, DatabaseError>;

    
    readonly findSiteForVote: (siteId: string) => Effect.Effect<{ maker_id: string | null } | undefined, DatabaseError>;
    readonly findVote: (userId: string, siteId: string) => Effect.Effect<{ id: string } | undefined, DatabaseError>;
    readonly saveVote: (userId: string, siteId: string) => Effect.Effect<void, DatabaseError>;
    readonly deleteVote: (voteId: string) => Effect.Effect<void, DatabaseError>;
    readonly countVotes: (siteId: string) => Effect.Effect<number, DatabaseError>;
    readonly toggleVote: (userId: string, siteId: string) => Effect.Effect<{ voted: boolean; voteCount: number }, DatabaseError>;
    
    readonly saveComment: (siteId: string, userId: string, content: string) => Effect.Effect<void, DatabaseError>;
    readonly getMakerInfoBySiteId: (siteId: string) => Effect.Effect<{
      title: string;
      maker_id: string | null;
      maker_email: string | null;
      maker_name: string | null;
      maker_username: string | null;
    } | undefined, DatabaseError>;
    
    readonly getApprovedSitesWithVotes: (userId?: string) => Effect.Effect<Array<{
      id: string;
      isDynamic: boolean;
      data: {
        live: string;
        title: string;
        thumbnail: { url: string; alt: string };
        tags: string[];
      };
      voteCount: number;
      voted: boolean;
      createdAt: number;
    }>, DatabaseError>;
    
    readonly getApprovedSitesForSearch: () => Effect.Effect<Array<{
      id: string;
      title: string;
      tagline: string | null;
    }>, DatabaseError>;
    
    readonly getSiteDetailsWithVotes: (siteId: string, userId?: string) => Effect.Effect<{
      id: string;
      title: string;
      description: string | null;
      live_url: string;
      thumbnail_url: string | null;
      tagline: string | null;
      views_count: number | null;
      created_at: Date | null;
      maker_username: string | null;
      voteCount: number;
      voted: boolean;
    } | null, DatabaseError>;

    readonly incrementSiteViews: (siteId: string) => Effect.Effect<void, DatabaseError>;
    
    readonly getCreatorDashboardStats: (userId: string) => Effect.Effect<{
      submittedCount: number;
      approvedCount: number;
      totalViews: number;
      totalVotes: number;
    }, DatabaseError>;

    readonly getCreatorSites: (userId: string) => Effect.Effect<Array<{
      id: string;
      title: string;
      tagline: string | null;
      live_url: string;
      thumbnail_url: string | null;
      tags: string[];
      status: string;
      rejection_reason: string | null;
      created_at: Date | null;
    }>, DatabaseError>;
    
    readonly getLeaderboard: (filter: string) => Effect.Effect<Array<{
      id: string;
      title: string;
      tagline: string | null;
      live_url: string;
      thumbnail_url: string | null;
      maker_username: string | null;
      voteCount: number;
    }>, DatabaseError>;

    readonly checkSponsoredSlotsFull: () => Effect.Effect<boolean, DatabaseError>;
  }
>() {}
