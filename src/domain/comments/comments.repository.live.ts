import { Layer, Effect } from "effect";
import { eq, desc } from "drizzle-orm";
import { ICommentsRepository } from "./comments.repository";
import { IDrizzleClient } from "@/infra/db/drizzle.client";
import { comments, reports, profiles } from "@/db/schema";
import { DatabaseError } from "@/shared/errors/infrastructure.errors";

export const CommentsRepositoryLive = Layer.effect(
  ICommentsRepository,
  Effect.gen(function* () {
    const { db } = yield* IDrizzleClient;

    return {
      fetchComment: (commentId) => Effect.tryPromise({
        try: async () => {
          const [existingComment] = await db
            .select()
            .from(comments)
            .where(eq(comments.id, commentId))
            .limit(1);
          return existingComment || null;
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error fetch comment" })
      }),
      reportComment: (commentId, reporterId, reason) => Effect.tryPromise({
        try: async () => {
          await db.insert(reports).values({
            comment_id: commentId,
            reporter_id: reporterId,
            reason: reason.trim(),
            status: 'pending',
          });
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error report comment" })
      }),
      getCommentsForSite: (siteId) => Effect.tryPromise({
        try: async () => {
          return await db
            .select({
              id: comments.id,
              content: comments.content,
              user_id: comments.user_id,
              created_at: comments.created_at,
              profiles: {
                username: profiles.username,
                full_name: profiles.full_name,
                avatar_url: profiles.avatar_url,
                role: profiles.role,
              },
            })
            .from(comments)
            .leftJoin(profiles, eq(comments.user_id, profiles.id))
            .where(eq(comments.site_id, siteId))
            .orderBy(desc(comments.created_at));
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error fetch comments for site" })
      })
    };
  })
);
