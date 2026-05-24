import { Layer, Effect } from "effect";
import { INewsletterRepository } from "./newsletter.repository";
import { IDrizzleClient } from "@/infra/db/drizzle.client";
import { newsletterSubscriptions } from "@/db/schema";
import { DatabaseError } from "@/shared/errors/infrastructure.errors";

export const NewsletterRepositoryLive = Layer.effect(
  INewsletterRepository,
  Effect.gen(function* () {
    const { db } = yield* IDrizzleClient;

    return {
      subscribeEmail: (email) => Effect.tryPromise({
        try: async () => {
          await db.insert(newsletterSubscriptions).values({ email }).onConflictDoNothing();
        },
        catch: (e) => new DatabaseError({ cause: e, message: "DB Error subscribe email" })
      })
    };
  })
);
