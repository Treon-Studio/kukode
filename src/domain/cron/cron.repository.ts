import { Context, Effect } from "effect";
import type { DatabaseError } from "@/shared/errors/infrastructure.errors";
import type { TSiteInfo } from "./cron.types";

export class ICronRepository extends Context.Tag("ICronRepository")<
  ICronRepository,
  {
    readonly getTopVotedToday: () => Effect.Effect<{ site_id: string; vote_count: number } | null, DatabaseError>;
    readonly getFallbackWinner: () => Effect.Effect<{ site_id: string; vote_count: number } | null, DatabaseError>;
    readonly savePotdWinner: (siteId: string, date: string, voteCount: number) => Effect.Effect<void, DatabaseError>;
    readonly getSiteInfo: (siteId: string) => Effect.Effect<TSiteInfo | null, DatabaseError>;
    readonly getLatestPOTDDetails: (userId?: string) => Effect.Effect<{ site: any; voteCount: number; voted: boolean; date: string } | null, DatabaseError>;
  }
>() {}
