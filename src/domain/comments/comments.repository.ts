import { Context, Effect } from "effect";
import type { DatabaseError } from "@/shared/errors/infrastructure.errors";
import type { TComment } from "./comments.types";

export class ICommentsRepository extends Context.Tag("ICommentsRepository")<
  ICommentsRepository,
  {
    readonly fetchComment: (commentId: string) => Effect.Effect<TComment | null, DatabaseError>;
    readonly reportComment: (commentId: string, reporterId: string, reason: string) => Effect.Effect<void, DatabaseError>;
    readonly getCommentsForSite: (siteId: string) => Effect.Effect<any[], DatabaseError>;
  }
>() {}
